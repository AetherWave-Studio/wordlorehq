/**
 * Schedule a week to the social platforms, unattended.
 *
 *   npx tsx scripts/schedule-week.ts                 # dry run, this Monday
 *   npx tsx scripts/schedule-week.ts --commit        # actually book it
 *   npx tsx scripts/schedule-week.ts --week 2026-09-14 --commit
 *
 * Until now the render was automated and the publish was not: the Saturday
 * routine produced a week and told a human to go press a button. Every week
 * depended on someone noticing. This is what the Monday routine runs instead.
 *
 * The payload comes from `src/lib/schedule-payload.ts`, the same builder the
 * admin button uses, so this cannot drift from what a human click would send.
 *
 * Booking is idempotent - the platform holds a unique index on
 * (user, channel, week, episode, platform) - so a second run reports slots as
 * `skipped` rather than double-posting.
 *
 * Environment:
 *   AETHERWAVE_API_KEY   an agent key for the account whose Blotato is connected
 *   AETHERWAVE_API_BASE  defaults to https://aetherwavestudio.com
 */
import { buildWeekPayload, ScheduleError } from "../src/lib/schedule-payload";
import { mondayOf } from "../src/lib/wordlore-content";

const API_BASE = process.env.AETHERWAVE_API_BASE || "https://aetherwavestudio.com";
const API_KEY = process.env.AETHERWAVE_API_KEY;

const argv = process.argv.slice(2);
const COMMIT = argv.includes("--commit");
const weekArg = argv.find((a) => a.startsWith("--week="))?.split("=")[1]
  ?? (argv.includes("--week") ? argv[argv.indexOf("--week") + 1] : undefined);

function fail(message: string): never {
  console.error(`\n✗ ${message}`);
  process.exit(1);
}

async function main() {
  if (!API_KEY) {
    fail(
      "AETHERWAVE_API_KEY is not set. Nothing was scheduled.\n" +
        "  Set it on this environment - without it the platform cannot be reached at all.",
    );
  }

  // Default to the Monday of the current week. Publishing is Mon/Tue/Thu/Fri,
  // so a run on any weekday is asking about the week it is already inside.
  const week = weekArg ?? mondayOf(new Date());
  if (!/^\d{4}-\d{2}-\d{2}$/.test(week)) fail(`--week must be YYYY-MM-DD, got ${week}`);

  console.log(`Week ${week} -> ${API_BASE}  (${COMMIT ? "COMMIT" : "dry run"})`);

  const post = async (dryRun: boolean) => {
    let payload;
    try {
      payload = await buildWeekPayload(week, { dryRun });
    } catch (e) {
      if (e instanceof ScheduleError) fail(e.message);
      throw e;
    }
    const res = await fetch(`${API_BASE}/api/channel/schedule-week`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-AW-Key": API_KEY! },
      body: JSON.stringify(payload),
    });
    const body: any = await res.json().catch(() => ({ error: "non-JSON response" }));
    if (!res.ok) {
      /* The platform returns a `problems` array naming each unresolved
       * platform and what IS connected. Printing only `error` throws that
       * away, which is the difference between "cannot resolve an account"
       * and "the Wordlore accounts are no longer connected to Blotato, here
       * are the four that vanished". The routine's report is the only thing
       * anyone sees, so it has to carry the actionable half. */
      for (const p of body.problems ?? []) console.error(`  - ${p}`);
      if (body.connected?.length) {
        console.error(`\n  Connected to this Blotato:`);
        for (const c of body.connected) console.error(`    ${c}`);
      }
      fail(`${res.status}: ${body.error || JSON.stringify(body)}`);
    }
    return body;
  };

  // ALWAYS dry-run first, even when committing. Resolving every account and
  // computing every send time without calling Blotato is the difference
  // between checking a schedule and posting twenty videos to the wrong week.
  const preview = await post(true);

  console.log("\nPosting as:");
  for (const [platform, account] of Object.entries<any>(preview.postingAs ?? {})) {
    console.log(`  ${platform.padEnd(10)} ${account.username ?? account.name ?? account.id}`);
  }

  const covers = new Map<string, string>();
  for (const r of preview.results ?? []) covers.set(r.platform, r.cover);
  console.log("\nCovers:");
  for (const [p, c] of covers) console.log(`  ${p.padEnd(10)} ${c}`);

  const slots = preview.results?.length ?? 0;
  const pending = (preview.results ?? []).filter((r: any) => r.status === "dry-run").length;
  const already = (preview.results ?? []).filter((r: any) => r.status === "skipped").length;
  console.log(`\n${slots} slots: ${pending} to book, ${already} already scheduled`);

  if (!COMMIT) {
    console.log("\nDry run only. Re-run with --commit to book it.");
    return;
  }
  if (pending === 0) {
    console.log("\nNothing left to book - this week is already scheduled. No-op.");
    return;
  }

  const done = await post(false);
  console.log("\nCommitted:", JSON.stringify(done.counts));

  const failed = (done.results ?? []).filter((r: any) => r.status === "failed");
  for (const f of failed) console.error(`  FAILED ${f.episode} ${f.platform}: ${f.error}`);
  if (failed.length) {
    fail(`${failed.length} slot(s) failed. The rest were booked; re-run to retry the failures.`);
  }
  console.log("\n✓ Week scheduled.");
}

main().catch((e) => fail(e?.message || String(e)));
