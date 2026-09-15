/**
 * Build the payload that schedules one week to the social platforms.
 *
 * Extracted so there is exactly ONE definition of what a week's schedule
 * request looks like. There were briefly three: the API route, a throwaway
 * harness used to dry-run from a terminal, and the shape a prompt described in
 * prose. The harness drifted - it kept building `mediaUrl` the old way after
 * thumbnails were added, so a dry run reported no covers while the real route
 * sent them. A check that silently disagrees with the thing it is checking is
 * worse than no check.
 *
 * Callers: `src/app/api/schedule-week/route.ts` (the admin button) and
 * `scripts/schedule-week.ts` (the Monday routine).
 */

import {
  readState,
  readDraft,
  episodeTitle,
  episodeVideoFile,
  episodeThumbFile,
  platformCaption,
  type CaptionPlatform,
} from "@/lib/wordlore-content";
import { channel, episodeUrl } from "@/lib/channel";

/**
 * Platforms this channel posts to, and which caption each one uses.
 * Threads takes the Instagram copy - same length budget, same tone.
 */
export const PLATFORM_CAPTION: Record<string, CaptionPlatform> = {
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

export type WeekPayload = Record<string, unknown>;

export class ScheduleError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

/**
 * Build the request for one week, or throw ScheduleError explaining why not.
 *
 * Refuses a week that is not fully rendered. `readState` has already reconciled
 * recorded status against the episodes that actually exist, so a word still
 * marked `done` here has a file behind it - locally or on the media host.
 */
export async function buildWeekPayload(
  week: string,
  opts: { dryRun: boolean; postTime?: string; days?: string[] } = { dryRun: true },
): Promise<WeekPayload> {
  const state = await readState();
  const weekState = state.weeks[week];
  if (!weekState) throw new ScheduleError(`No batch for week ${week}`, 404);

  const notRendered = weekState.words.filter((w) => weekState.renders[w] !== "done");
  if (notRendered.length) {
    throw new ScheduleError(
      `Not every episode is rendered: ${notRendered.join(", ")}`,
      409,
    );
  }

  const platforms = Object.keys(PLATFORM_CAPTION).filter(
    (p) => channel.socials[p as keyof typeof channel.socials],
  );
  if (!platforms.length) {
    throw new ScheduleError("channel.config.json lists no social accounts to post to", 400);
  }

  const episodes = await Promise.all(
    weekState.words.map(async (word) => {
      const draft = await readDraft(week, word);
      const file = episodeVideoFile(word, weekState.renderDate);
      const thumb = episodeThumbFile(word, weekState.renderDate);
      const captions: Record<string, string> = {};
      for (const p of platforms) {
        captions[p] = platformCaption(draft, PLATFORM_CAPTION[p]);
      }
      return {
        episode: word,
        title: episodeTitle(draft),
        mediaUrl: episodeUrl(file!),
        /* The still the platforms show before playback. Without it they take
           their own first frame, which for this format is the blank one Beat 1
           fades in from. Only some platforms accept it; the server decides. */
        thumbnailUrl: thumb ? episodeUrl(thumb) : undefined,
        /* TikTok takes a frame, not an image. */
        coverTimestampMs: channel.media?.coverTimestampMs,
        captions,
      };
    }),
  );

  /* Name the account per platform. `channel.blotato.accounts` wins, because
   * Blotato reports display names that no URL can imply. Either way the
   * platform refuses to guess, so a wrong name fails the dry run rather than
   * posting to the wrong brand. */
  const configured = channel.blotato?.accounts ?? {};
  const accountHandles: Record<string, string> = {};
  for (const p of platforms) {
    const key = p as keyof typeof channel.socials;
    const name = configured[key] || handleFromUrl(channel.socials[key]);
    if (name) accountHandles[p] = name;
  }

  return {
    channel: channel.id,
    week,
    episodes,
    platforms,
    accountHandles,
    facebookPage: channel.blotato?.facebookPage ?? undefined,
    days: opts.days ?? channel.cadence.publishDaysShort,
    postTime: opts.postTime ?? "09:00",
    timeZone: "America/Denver",
    dryRun: opts.dryRun,
  };
}
