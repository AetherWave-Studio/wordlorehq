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
 * The payload itself is built by `@/lib/schedule-payload`, shared with
 * `scripts/schedule-week.ts` - the Monday routine posts the same bytes this
 * button does, rather than a second implementation that can drift from it.
 *
 * Environment:
 *   AETHERWAVE_API_KEY   an agent key for the account whose Blotato is connected
 *   AETHERWAVE_API_BASE  defaults to https://aetherwavestudio.com
 */

import { NextResponse } from "next/server";
import { buildWeekPayload, ScheduleError } from "@/lib/schedule-payload";

export const dynamic = "force-dynamic";

const API_BASE = process.env.AETHERWAVE_API_BASE || "https://aetherwavestudio.com";

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

  let payload;
  try {
    payload = await buildWeekPayload(week, { dryRun });
  } catch (e: unknown) {
    if (e instanceof ScheduleError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }

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
