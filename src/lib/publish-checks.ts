/**
 * The Monday publish checks, as code.
 *
 * These used to be a checklist in .wordlore-context/publish-prompt.md step 2
 * that the routine READ and then judged. Three Mondays in a row the run
 * stopped somewhere between the dry run and the commit and reported nothing;
 * a human booked the week by hand each time. A check that lives in prose
 * depends on the reader; a check in code either passes or names what failed.
 *
 * Pure (no I/O, no imports beyond types) so tests can call it directly.
 */

export interface PreviewRow {
  episode: string;
  platform: string;
  status: string; // "dry-run" (would book) | "skipped" (already booked) | "failed" | "scheduled"
  cover?: string;
}
export interface PreviewAccount {
  name?: string;
  username?: string;
  id?: string;
}
export interface Preview {
  postingAs?: Record<string, PreviewAccount>;
  results?: PreviewRow[];
}

export interface CheckContext {
  /** The week being booked (YYYY-MM-DD, a Monday). */
  week: string;
  /** mondayOf(now): the week the run is actually inside. */
  currentWeek: string;
  /** True when --week was passed AND --any-week was given to allow a different week on purpose. */
  allowOtherWeek: boolean;
  /** channel.blotato.accounts: the display name each platform must post as. */
  expectedAccounts: Record<string, string>;
  /** Episodes in this run (the week's words, or the catch-up subset). */
  words: string[];
  /** Platforms this channel posts to. */
  platforms: string[];
  /** channel.cadence.episodesPerWeek, required for a full-week run. */
  episodesPerWeek: number;
  /** A catch-up (--episode/--at) books a subset on purpose. */
  catchUp: boolean;
}

/**
 * Every reason this preview must NOT be committed, each one line. Empty = go.
 */
export function previewProblems(preview: Preview, ctx: CheckContext): string[] {
  const problems: string[] = [];

  // 1. The week is the one we are in. Booking a wrong week is not recoverable
  //    by deleting (Blotato has no delete for visuals).
  if (ctx.week !== ctx.currentWeek && !ctx.allowOtherWeek) {
    problems.push(
      `week ${ctx.week} is not the current week (${ctx.currentWeek}); pass --any-week with --week to book another week on purpose`,
    );
  }

  // 2. Every platform posts as THIS channel's account. One Blotato workspace
  //    holds several brands; YouTube resolving to "Andrew Froehlich
  //    (AetherWave Studio)" would post Wordlore onto AetherWave's feed.
  const postingAs = preview.postingAs ?? {};
  for (const platform of ctx.platforms) {
    const expected = ctx.expectedAccounts[platform];
    const acct = postingAs[platform];
    const shown = acct?.name ?? acct?.username ?? acct?.id ?? "(none)";
    if (!acct) {
      problems.push(`${platform}: no account resolved (expected "${expected ?? "?"}")`);
      continue;
    }
    if (expected && acct.name !== expected && acct.username !== expected) {
      problems.push(`${platform}: posting as "${shown}", expected "${expected}"`);
    }
    if (/aetherwave/i.test(`${acct.name ?? ""} ${acct.username ?? ""}`)) {
      problems.push(`${platform}: posting as "${shown}", which is an AetherWave account, not Wordlore`);
    }
  }

  // 3. A full week is the whole week.
  if (!ctx.catchUp && ctx.words.length !== ctx.episodesPerWeek) {
    problems.push(`week has ${ctx.words.length} episode(s), expected ${ctx.episodesPerWeek}`);
  }

  // 4. Every episode x platform has a slot (20 for a full week).
  const expectedSlots = ctx.words.length * ctx.platforms.length;
  const rows = preview.results ?? [];
  if (rows.length !== expectedSlots) {
    problems.push(`preview has ${rows.length} slot(s), expected ${expectedSlots} (${ctx.words.length} episodes x ${ctx.platforms.length} platforms)`);
  }
  const failedInPreview = rows.filter((r) => r.status === "failed");
  if (failedInPreview.length) {
    problems.push(`preview already reports ${failedInPreview.length} failed slot(s): ${failedInPreview.map((r) => `${r.episode}/${r.platform}`).join(", ")}`);
  }

  return problems;
}

/** Counts from a preview or a commit response. */
export function slotCounts(results: PreviewRow[] | undefined) {
  const rows = results ?? [];
  return {
    total: rows.length,
    toBook: rows.filter((r) => r.status === "dry-run").length,
    already: rows.filter((r) => r.status === "skipped").length,
    booked: rows.filter((r) => r.status !== "failed" && r.status !== "dry-run").length,
    failed: rows.filter((r) => r.status === "failed"),
  };
}
