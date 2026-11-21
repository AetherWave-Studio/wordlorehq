/**
 * Is the word pool able to make a week?
 *
 * Step 2 of the routine used to ask one question - does `available` hold at
 * least 8 entries - and step 3 then asks for something else entirely: four
 * words from four DIFFERENT language families, including at least one Tier 1.
 * Count and composition are not the same property, so a pool can pass the
 * count check and still be unable to assemble a single legal batch.
 *
 * That is not hypothetical. It has happened three times:
 *
 *   2026-10-10  every Tier 1 candidate used; week 2026-10-12 had nothing to
 *               satisfy the Tier 1 rule
 *   2026-10-27  7 entries, six Latin and one Arabic, no Tier 1: at most two
 *               qualifying picks
 *   2026-11-21  6 entries, four Latin / one French / one Persian, no Tier 1:
 *               ZERO qualifying weeks
 *
 * Each time a human or a run noticed and refilled for spread, wrote a note
 * saying spread is the binding rule, and the next run read the stated rule
 * instead and refilled for count again. Weeks 2026-11-02 and 2026-11-09
 * shipped three words and two words on the way down.
 *
 * So the check is mechanical now, the way the render bookkeeping became
 * mechanical in #27 for the same reason.
 *
 *   node scripts/check-pool.mjs
 *
 * Exit 0: the pool can make at least MIN_RUNWAY legal weeks.
 * Exit 1: refill before selecting. The output says what is short.
 */
import { readFileSync } from "node:fs";

const POOL_PATH = "src/lib/wordlore-content/word-pipeline.json";

/** A week needs this many words, all from different families, >=1 Tier 1. */
const WEEK_SIZE = 4;
/** Below this many assemblable weeks, refill. One week is cutting it fine. */
const MIN_RUNWAY = 2;
/** Refilling should aim here, so the next run is not back at the threshold. */
const TARGET_RUNWAY = 3;
/** The original count floor, kept as a secondary signal. */
const MIN_ENTRIES = 8;

/**
 * Assemble one legal week, spending the deepest families first so that
 * single-word families stay available to satisfy future weeks' spread.
 * Returns null when no legal batch exists.
 */
function pickWeek(pool) {
  const byFamily = new Map();
  for (const w of pool) {
    if (!byFamily.has(w.language)) byFamily.set(w.language, []);
    byFamily.get(w.language).push(w);
  }
  if (byFamily.size < WEEK_SIZE) return null;

  const depth = (lang) => byFamily.get(lang).length;
  const tier1 = pool.filter((w) => w.tier === 1).sort((a, b) => depth(b.language) - depth(a.language));
  if (tier1.length === 0) return null;

  const chosen = [tier1[0]];
  const spent = new Set([tier1[0].language]);
  const families = [...byFamily.entries()].sort((a, b) => b[1].length - a[1].length);

  for (const [family, words] of families) {
    if (chosen.length === WEEK_SIZE) break;
    if (spent.has(family)) continue;
    // Prefer a non-Tier-1 filler so Tier 1 words last across weeks.
    chosen.push(words.find((w) => w.tier !== 1) ?? words[0]);
    spent.add(family);
  }
  return chosen.length === WEEK_SIZE ? chosen : null;
}

const pipeline = JSON.parse(readFileSync(POOL_PATH, "utf8"));
const available = pipeline.available ?? [];

const families = [...new Set(available.map((w) => w.language))];
const tier1Count = available.filter((w) => w.tier === 1).length;

let remaining = available.map((w) => ({ ...w }));
const weeks = [];
for (;;) {
  const pick = pickWeek(remaining);
  if (!pick) break;
  weeks.push(pick);
  const taken = new Set(pick.map((w) => w.word));
  remaining = remaining.filter((w) => !taken.has(w.word));
}

console.log(`pool:     ${available.length} entries, ${families.length} families, ${tier1Count} Tier 1`);
console.log(`families: ${families.join(", ") || "(none)"}`);
for (const [i, week] of weeks.entries()) {
  console.log(`week ${i + 1}:   ` + week.map((w) => `${w.word} (${w.language}, T${w.tier})`).join("  "));
}
console.log(`runway:   ${weeks.length} legal week${weeks.length === 1 ? "" : "s"}`);

const shortfalls = [];
if (weeks.length < MIN_RUNWAY) shortfalls.push(`runway is ${weeks.length}, want at least ${MIN_RUNWAY}`);
if (available.length < MIN_ENTRIES) shortfalls.push(`${available.length} entries, want at least ${MIN_ENTRIES}`);
if (families.length < WEEK_SIZE) shortfalls.push(`${families.length} families, a week needs ${WEEK_SIZE} distinct`);
if (tier1Count === 0) shortfalls.push("no Tier 1 word, and every week needs one");

if (shortfalls.length > 0) {
  console.log("");
  console.log("!! REFILL REQUIRED before selecting:");
  for (const s of shortfalls) console.log(`   - ${s}`);
  console.log("");
  console.log(`   Refill for SPREAD, not count: add words from families the pool`);
  console.log(`   does not already hold, and Tier 1 words, until this prints a`);
  console.log(`   runway of ${TARGET_RUNWAY}. Adding more Latin Tier 4 words can raise the`);
  console.log(`   entry count without moving the runway at all.`);
  process.exit(1);
}

console.log("");
console.log(`pool: OK, ${weeks.length} legal weeks available`);
