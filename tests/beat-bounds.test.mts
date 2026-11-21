/**
 * A beat's scene must never be shorter than the narration it has to hold.
 * Run with: node node_modules/tsx/dist/cli.mjs tests/beat-bounds.test.mts
 *
 * Why this test exists. The voiceover Sequences in remotion/Composition.tsx
 * carry `from` but no `durationInFrames`, so each beat's audio plays its full
 * natural length no matter what the scene does. Clamping a scene below its own
 * narration therefore does not trim the narration - it slides the remainder on
 * top of the next beat and you get two voices at once.
 *
 * The numbers below are the REAL measured TTS durations of week 2026-11-16,
 * the week Andrew reported: "the last text scenes cut early and the final
 * voiceover bleeds into the end reveal voiceover". Under the old clamp, eight
 * beats across those four episodes outlived their scenes, the worst by 5.62s,
 * and every one of the four overran beat 5 onto beat 6 - the payoff, the one
 * line the episode exists to deliver.
 */
import { applyBeatBounds } from "../scripts/render-video";
import { beatBounds } from "../remotion/tokens/timing";

const MEASURED: Record<string, number[]> = {
  hearse:     [3.91, 4.22, 7.06, 5.96, 35.62, 3.24, 2.59],
  shibboleth: [4.65, 6.54, 8.32, 5.60, 35.16, 3.28, 2.91],
  algebra:    [5.91, 6.09, 6.59, 6.81, 34.82, 2.82, 2.84],
  sky:        [6.13, 4.79, 5.85, 4.60, 33.60, 2.03, 3.13],
};
const MINS = [
  beatBounds.beat1Hook, beatBounds.beat2WordReveal, beatBounds.beat3ModernAnchor,
  beatBounds.beat4OriginSetup, beatBounds.beat5Journey, beatBounds.beat6Payoff,
  beatBounds.beat7Outro,
].map((b) => b.min);

let pass = 0, fail = 0;
const ok = (name: string, cond: boolean, detail = "") => {
  if (cond) { pass++; console.log(`  PASS  ${name}`); }
  else { fail++; console.log(`  FAIL  ${name}${detail ? " -> " + detail : ""}`); }
};

console.log("\n1. no scene is shorter than its own narration (the reported bug)");
for (const [word, raw] of Object.entries(MEASURED)) {
  const out = applyBeatBounds(raw);
  const over = raw
    .map((s, i) => ({ beat: i + 1, by: +(s - out[i]).toFixed(2) }))
    .filter((o) => o.by > 0.05);
  ok(`${word}: zero beats overrun`, over.length === 0, JSON.stringify(over));
}

console.log("\n2. the pacing floor still applies to short narration");
const tiny = [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1];
applyBeatBounds(tiny).forEach((v, i) =>
  ok(`beat ${i + 1} padded up to its min (${MINS[i]}s)`, v >= MINS[i], `got ${v}`),
);

console.log("\n3. narration that fits is still paced to target, not stretched");
const fits = [2.0, 3.0, 5.0, 8.0, 20.0, 9.0, 5.0];
const paced = applyBeatBounds(fits);
ok("a 20s journey stays 20.5s, not 30s", Math.abs(paced[4] - 20.5) < 0.01, `got ${paced[4]}`);
ok("tail pad is applied", Math.abs(paced[2] - 5.5) < 0.01, `got ${paced[2]}`);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
