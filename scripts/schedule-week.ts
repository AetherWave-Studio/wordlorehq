/**
 * Schedule a week to the social platforms, unattended.
 *
 *   npx tsx scripts/schedule-week.ts                 # check, then BOOK this Monday's week
 *   npx tsx scripts/schedule-week.ts --dry-run       # check only, book nothing, post nothing
 *   npx tsx scripts/schedule-week.ts --week 2026-09-14 --any-week   # book another week on purpose
 *
 * A catch-up - one episode that missed its day - names the episode and the
 * instant, and goes out through this same path rather than around it:
 *
 *   npx tsx scripts/schedule-week.ts --week 2026-09-14 --any-week \
 *     --episode money --at now
 *   npx tsx scripts/schedule-week.ts --episode museum --at 2026-09-24T15:00:00Z
 *
 * WHY IT BOOKS BY DEFAULT (2026-10-05). The Monday routine used to run a dry
 * run, READ a checklist in publish-prompt.md, judge it, and then pass
 * --commit. On 09-28 and 10-05 it stopped between the dry run and the commit
 * and reported nothing; a human booked both weeks by hand. The checklist is
 * now code (src/lib/publish-checks.ts): the run either passes every check and
 * books, or refuses with a one-line reason. `--commit` is still accepted (a
 * no-op) so older invocations keep working; `--dry-run` is the opt-out.
 *
 * EVERY ENDING IS REPORTED. Booked, already booked, refused, failed, crashed:
 * each posts one line to $DISCORD_WEBHOOK_URL before exiting, so a silent
 * stop cannot happen again. (Dry runs post nothing.)
 *
 * The payload comes from `src/lib/schedule-payload.ts`, the same builder the
 * admin button uses, so this cannot drift from what a human click would send.
 *
 * Booking is idempotent - the platform holds a unique index on
 * (user, channel, week, episode, platform) - so a re-run reports booked slots
 * as `skipped` and books only what is missing (tests/schedule-week.test.ts).
 *
 * Environment:
 *   AETHERWAVE_API_KEY   an agent key for the account whose Blotato is connected
 *   AETHERWAVE_API_BASE  defaults to https://aetherwavestudio.com
 *   DISCORD_WEBHOOK_URL  where the result line goes (warned about if unset)
 *   WORDLORE_NOW         ISO time to treat as "now" (tests only)
 */
import { buildWeekPayload, ScheduleError, PLATFORM_CAPTION } from "../src/lib/schedule-payload";
import { mondayOf } from "../src/lib/wordlore-content";
import { channel } from "../src/lib/channel";
import { previewProblems, slotCounts } from "../src/lib/publish-checks";

const API_BASE = process.env.AETHERWAVE_API_BASE || "https://aetherwavestudio.com";
const API_KEY = process.env.AETHERWAVE_API_KEY;
const WEBHOOK = process.env.DISCORD_WEBHOOK_URL;
const NOW = process.env.WORDLORE_NOW ? new Date(process.env.WORDLORE_NOW) : new Date();

const argv = process.argv.slice(2);
const DRY_RUN = argv.includes("--dry-run");
const ANY_WEEK = argv.includes("--any-week");

/** `--flag value` and `--flag=value` both, since both get typed. */
function flag(name: string): string | undefined {
  const inline = argv.find((a) => a.startsWith(`--${name}=`));
  if (inline) return inline.slice(name.length + 3);
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : undefined;
}
/** Repeatable, so a catch-up can carry more than one episode. */
function flags(name: string): string[] {
  const out: string[] = [];
  argv.forEach((a, i) => {
    if (a.startsWith(`--${name}=`)) out.push(a.slice(name.length + 3));
    else if (a === `--${name}` && argv[i + 1]) out.push(argv[i + 1]);
  });
  return out;
}

const weekArg = flag("week");
const episodeArgs = flags("episode");
const atArg = flag("at");
const week = weekArg ?? mondayOf(NOW);

/** Post the result line. Never throws: reporting must not turn a booking into a failure. */
async function report(line: string): Promise<void> {
  console.log(`\n${line}`);
  if (DRY_RUN) return;
  if (!WEBHOOK) {
    console.error("⚠ DISCORD_WEBHOOK_URL is not set - the line above was NOT posted anywhere.");
    return;
  }
  try {
    const r = await fetch(WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: line }),
    });
    if (!r.ok) console.error(`⚠ Discord webhook answered ${r.status}; the line was not posted.`);
  } catch (e: any) {
    console.error(`⚠ Discord webhook unreachable (${e?.message || e}); the line was not posted.`);
  }
}

/** Refuse: report the one-line reason, exit non-zero. Nothing was booked. */
async function refuse(reason: string): Promise<never> {
  await report(`Wordlore week ${week} NOT booked: ${reason}`);
  process.exit(1);
}

async function main() {
  if (!API_KEY) {
    await refuse("AETHERWAVE_API_KEY is not set on this environment, so the platform cannot be reached");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(week)) await refuse(`--week must be YYYY-MM-DD, got ${week}`);

  /* --episode and --at are the catch-up path and only make sense together.
   * Selecting episodes without an instant hands them the week's first cadence
   * day; naming an instant without selecting would move the whole week onto
   * it. Either alone is a typo with consequences, so neither is allowed. */
  if (episodeArgs.length && !atArg) {
    await refuse("--episode needs --at (an ISO timestamp, or `now`); without it the episode would take the week's first publish day");
  }
  if (atArg && !episodeArgs.length) {
    await refuse("--at needs --episode; on its own it would send every episode of the week at that one instant");
  }
  if (atArg && atArg !== "now" && Number.isNaN(new Date(atArg).getTime())) {
    await refuse(`--at must be an ISO 8601 timestamp or \`now\`, got ${atArg}`);
  }
  const catchUp = episodeArgs.length ? { only: episodeArgs, at: atArg! } : {};
  const what = episodeArgs.length ? `${episodeArgs.join(", ")} @ ${atArg}` : "full week";
  console.log(`Week ${week} (${what}) -> ${API_BASE}  (${DRY_RUN ? "dry run" : "check, then book"})`);

  let words: string[] = [];
  const post = async (dryRun: boolean) => {
    let payload: any;
    try {
      payload = await buildWeekPayload(week, { dryRun, ...catchUp });
    } catch (e) {
      // "No batch for week", "Not every episode is rendered: ...", unknown episode.
      if (e instanceof ScheduleError) await refuse(e.message);
      throw e;
    }
    words = (payload.episodes ?? []).map((e: any) => e.episode);
    const res = await fetch(`${API_BASE}/api/channel/schedule-week`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-AW-Key": API_KEY! },
      body: JSON.stringify(payload),
    });
    const body: any = await res.json().catch(() => ({ error: "non-JSON response" }));
    if (!res.ok) {
      /* The platform returns a `problems` array naming each unresolved
       * platform and what IS connected. That is the actionable half, so it
       * goes into the reported line, not just the console. */
      for (const p of body.problems ?? []) console.error(`  - ${p}`);
      if (body.connected?.length) {
        console.error(`\n  Connected to this Blotato:`);
        for (const c of body.connected) console.error(`    ${c}`);
      }
      const detail = (body.problems ?? []).slice(0, 3).join("; ");
      await refuse(`platform ${res.status}: ${body.error || "error"}${detail ? ` (${detail})` : ""}`);
    }
    return body;
  };

  // ALWAYS preview first: resolve every account and compute every send time
  // without calling Blotato.
  const preview = await post(true);

  console.log("\nPosting as:");
  for (const [platform, account] of Object.entries<any>(preview.postingAs ?? {})) {
    console.log(`  ${platform.padEnd(10)} ${account.username ?? account.name ?? account.id}`);
  }
  /* Covers, per platform and per episode where they differ (the TikTok frame
   * is computed per episode from its measured beats, so it legitimately
   * varies). Printed for humans; not a gate - a pinned value is exactly the
   * check that failed the 2026-09-28 Monday when the value was designed to move. */
  const byPlatform = new Map<string, Map<string, string>>();
  for (const r of preview.results ?? []) {
    if (!byPlatform.has(r.platform)) byPlatform.set(r.platform, new Map());
    byPlatform.get(r.platform)!.set(r.episode, r.cover);
  }
  console.log("\nCovers:");
  for (const [platform, perEpisode] of byPlatform) {
    const distinct = new Set(perEpisode.values());
    if (distinct.size === 1) console.log(`  ${platform.padEnd(10)} ${[...distinct][0]}`);
    else {
      console.log(`  ${platform.padEnd(10)} varies by episode:`);
      for (const [episode, cover] of perEpisode) console.log(`    ${episode.padEnd(13)} ${cover}`);
    }
  }

  const pre = slotCounts(preview.results);
  console.log(`\n${pre.total} slots: ${pre.toBook} to book, ${pre.already} already scheduled`);

  // THE CHECKS (formerly publish-prompt.md step 2, judged by the routine).
  const platforms = Object.keys(PLATFORM_CAPTION).filter(
    (p) => channel.socials[p as keyof typeof channel.socials],
  );
  const problems = previewProblems(preview, {
    week,
    currentWeek: mondayOf(NOW),
    allowOtherWeek: ANY_WEEK && !!weekArg,
    expectedAccounts: (channel.blotato?.accounts ?? {}) as Record<string, string>,
    words,
    platforms,
    episodesPerWeek: channel.cadence.episodesPerWeek,
    catchUp: episodeArgs.length > 0,
  });
  if (problems.length) {
    for (const p of problems) console.error(`  ✗ ${p}`);
    await refuse(problems.join("; "));
  }
  console.log("\nAll checks passed.");

  if (DRY_RUN) {
    console.log("Dry run only (--dry-run). Nothing booked, nothing posted.");
    return;
  }
  if (pre.toBook === 0) {
    await report(`Wordlore week ${week} already booked ${pre.already}/${pre.total} - nothing to do.`);
    return;
  }
  if (atArg === "now") console.log("\n`now` is resolved at send time, not at the preview above.");

  const done = await post(false);
  const after = slotCounts(done.results);
  console.log("\nCommitted:", JSON.stringify(done.counts));
  for (const f of after.failed) console.error(`  FAILED ${f.episode} ${f.platform}: ${(f as any).error}`);
  if (after.failed.length) {
    await report(
      `Wordlore week ${week} booked ${after.booked}/${after.total}; ${after.failed.length} FAILED (` +
        after.failed.map((f) => `${f.episode}/${f.platform}`).join(", ") +
        `). Re-run to retry: booking is idempotent.`,
    );
    process.exit(1);
  }
  await report(`Wordlore week ${week} booked ${after.booked}/${after.total}.`);
}

main().catch(async (e) => {
  await report(`Wordlore week ${week} NOT booked: the run crashed: ${e?.message || String(e)}`);
  process.exit(1);
});
