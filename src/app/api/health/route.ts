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
 * Deliberately OUTSIDE the middleware matcher, which gates every route that can
 * ACT. This one cannot: no writes, no outbound calls, nothing an anonymous
 * caller can set in motion. Knowing that a key is configured does not help
 * anyone who does not have the admin password.
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

  return NextResponse.json({
    channel: channel.id,
    configured,
    ready: Object.values(configured).every(Boolean),
    media: {
      /* Empty means episodes are served out of this deployment - see docs/NEW-CHANNEL.md. */
      host: channel.media?.baseUrl ?? null,
    },
    content: { weeks, renders },
  });
}
