/**
 * Is this channel actually wired up?
 *
 * Every piece of this pipeline lives somewhere else: the API key is on Vercel,
 * the episodes are in R2, the accounts are in Blotato. When one of them is
 * missing you find out at the worst moment - the 503 behind the admin gate on
 * the morning a week is due to go out - and from outside the gate there is no
 * way to tell a configured deployment from an unconfigured one.
 *
 * This says which of them are present. Booleans and counts only: it reports
 * THAT a secret is configured, never any part of its value, and every other
 * field here is already public (the site URL, the media host, the filenames the
 * manifest carries).
 *
 * It also reports WHICH BUILD is answering. A 200 from this route only proves
 * something is deployed, not that it is the commit you just merged, and more
 * than one "the fix is live" call here has actually been deploy lag read as
 * success. The commit sha turns that guess into a comparison against git.
 *
 * Deliberately OUTSIDE the middleware matcher, which gates every route that can
 * ACT. This one cannot: no writes, no outbound calls, nothing an anonymous
 * caller can set in motion. Knowing that a key is configured does not help
 * anyone who does not have the admin password. The commit sha is public the
 * moment the repo is - it names a build, it does not unlock one.
 */

import { NextResponse } from "next/server";
import { readState } from "@/lib/wordlore-content";
import { channel } from "@/lib/channel";

export const dynamic = "force-dynamic";

export async function GET() {
  const configured = {
    /* Lets /api/schedule-week reach AetherWave. Without it that route 503s. */
    aetherwaveApiKey: Boolean(process.env.AETHERWAVE_API_KEY),
    /* Both required, or middleware fails open-ish with a 503 on every admin route. */
    adminAuth: Boolean(process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD),
  };

  let renders: Record<string, number> = {};
  let weeks = 0;
  try {
    const state = await readState();
    weeks = Object.keys(state.weeks).length;
    for (const w of Object.values(state.weeks))
      for (const status of Object.values(w.renders))
        renders[status] = (renders[status] || 0) + 1;
  } catch {
    renders = {};
  }

  /* Vercel system env vars, present on every deployment; null when running
     outside Vercel (local dev), which is itself the honest answer. */
  const build = {
    commit: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    ref: process.env.VERCEL_GIT_COMMIT_REF ?? null,
    env: process.env.VERCEL_ENV ?? null,
  };

  return NextResponse.json({
    channel: channel.id,
    build,
    configured,
    ready: Object.values(configured).every(Boolean),
    media: {
      /* Empty means episodes are served out of this deployment - see docs/NEW-CHANNEL.md. */
      host: channel.media?.baseUrl ?? null,
    },
    content: { weeks, renders },
  });
}
