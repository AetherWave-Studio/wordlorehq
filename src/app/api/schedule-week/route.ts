/**
 * Schedule a week's episodes to the social platforms, via AetherWave.
 *
 * The only manual step left in this pipeline was uploading four videos to five
 * platforms by hand every week. AetherWave already has a live Blotato
 * integration that posts and schedules to all five, so this hands it the batch
 * rather than reimplementing distribution here.
 *
 * This route runs server-side so the API key never reaches the browser. The
 * admin pages are already behind basic auth (middleware.ts), which is what
 * gates who can call it.
 *
 * Environment:
 *   AETHERWAVE_API_KEY   an agent key for the account whose Blotato is connected
 *   AETHERWAVE_API_BASE  defaults to https://aetherwavestudio.com
 */

import { NextResponse } from "next/server";
import {
  readState,
  readDraft,
  episodeTitle,
  episodeVideoFile,
  platformCaption,
  type CaptionPlatform,
} from "@/lib/wordlore-content";
import { channel } from "@/lib/channel";

export const dynamic = "force-dynamic";

const API_BASE = process.env.AETHERWAVE_API_BASE || "https://aetherwavestudio.com";

/**
 * Platforms this channel posts to, and which caption each one uses.
 * Threads takes the Instagram copy - same length budget, same tone.
 */
const PLATFORM_CAPTION: Record<string, CaptionPlatform> = {
  youtube: "youtube",
  tiktok: "tiktok",
  instagram: "instagram",
  facebook: "facebook",
  threads: "instagram",
};

/**
 * The handle a social URL points at: the last path segment, minus any '@'.
 *
 *   https://www.youtube.com/@wordlorehq  -> wordlorehq
 *   https://www.instagram.com/wordlorehq -> wordlorehq
 *
 * This is what pins the schedule to THIS channel's accounts. One Blotato
 * workspace can hold several brands, and without a named handle the platform
 * picks whichever account it lists first - which is how one channel's episodes
 * end up on another channel's feed.
 */
function handleFromUrl(url: string | null): string | undefined {
  if (!url) return undefined;
  try {
    const last = new URL(url).pathname.split("/").filter(Boolean).pop();
    return last ? last.replace(/^@/, "") : undefined;
  } catch {
    return undefined;
  }
}

export async function POST(request: Request) {
  const apiKey = process.env.AETHERWAVE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AETHERWAVE_API_KEY is not set on this deployment." },
      { status: 503 },
    );
  }

  let body: { week?: string; dryRun?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body must be JSON" }, { status: 400 });
  }

  const week = body.week;
  const dryRun = body.dryRun !== false; // default to a dry run, deliberately
  if (!week) return NextResponse.json({ error: "week is required" }, { status: 400 });

  const state = await readState();
  const weekState = state.weeks[week];
  if (!weekState) {
    return NextResponse.json({ error: `No batch for week ${week}` }, { status: 404 });
  }

  // Only schedule what actually exists. `readState` has already reconciled the
  // recorded flags against the files on disk, so a word still marked done here
  // has an MP4 behind it.
  const notRendered = weekState.words.filter((w) => weekState.renders[w] !== "done");
  if (notRendered.length) {
    return NextResponse.json(
      { error: `Not every episode is rendered: ${notRendered.join(", ")}` },
      { status: 409 },
    );
  }

  // Only the platforms this channel actually has an account for.
  const platforms = Object.keys(PLATFORM_CAPTION).filter(
    (p) => channel.socials[p as keyof typeof channel.socials],
  );
  if (!platforms.length) {
    return NextResponse.json(
      { error: "channel.config.json lists no social accounts to post to" },
      { status: 400 },
    );
  }

  const episodes = await Promise.all(
    weekState.words.map(async (word) => {
      const draft = await readDraft(week, word);
      const file = episodeVideoFile(word, weekState.renderDate);
      const captions: Record<string, string> = {};
      for (const p of platforms) {
        captions[p] = platformCaption(draft, PLATFORM_CAPTION[p]);
      }
      return {
        episode: word,
        title: episodeTitle(draft),
        mediaUrl: `${channel.site.url}/episodes/${file}`,
        captions,
      };
    }),
  );

  /* Name the account per platform.
   *
   * `channel.blotato.accounts` wins, because Blotato reports display names
   * that no URL can imply: this channel's YouTube is "Andrew Froehlich
   * (Wordlore)", sitting next to "Andrew Froehlich (AetherWave Studio)" in the
   * same workspace. The URL-derived handle is the fallback, and it does match
   * for tiktok, instagram and threads.
   *
   * Either way the platform refuses to guess, so a name that is wrong fails
   * the dry run instead of posting to the wrong brand. */
  const configured = channel.blotato?.accounts ?? {};
  const accountHandles: Record<string, string> = {};
  for (const p of platforms) {
    const key = p as keyof typeof channel.socials;
    const name = configured[key] || handleFromUrl(channel.socials[key]);
    if (name) accountHandles[p] = name;
  }

  const payload = {
    channel: channel.id,
    week,
    episodes,
    platforms,
    accountHandles,
    facebookPage: channel.blotato?.facebookPage ?? undefined,
    days: channel.cadence.publishDaysShort,
    postTime: "09:00",
    timeZone: "America/Denver",
    dryRun,
  };

  try {
    const res = await fetch(`${API_BASE}/api/channel/schedule-week`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-AW-Key": apiKey },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({ error: "Non-JSON response from AetherWave" }));
    return NextResponse.json(data, { status: res.status });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: `Could not reach AetherWave: ${message}` }, { status: 502 });
  }
}
