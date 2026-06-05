/**
 * render-video.ts — vendored into the wordlorehq repo from the local Wordlore skill.
 *
 * End-to-end orchestrator. Given a Wordlore episode JSON:
 *   1. Generates per-beat narration (calls generate-narration)
 *   2. Augments the input with `beatDurationsSec` and `hasAudio: true`
 *   3. Runs Remotion render with the augmented props
 *   4. Writes the YouTube Shorts metadata file alongside the MP4
 *
 * Usage:
 *   npx tsx scripts/render-video.ts <word>                 (look up draft by word)
 *   npx tsx scripts/render-video.ts <path/to/episode.json> (legacy: pass full path)
 *   npx tsx scripts/render-video.ts --trailer              (channel trailer)
 *
 * Word-lookup mode (cloud routine):
 *   The script reads src/lib/wordlore-content/state.json to find the
 *   currentWeek, then loads
 *   src/lib/wordlore-content/drafts/<currentWeek>/<word>.json.
 *
 * Output:
 *   <OUT_DIR>/episodes/<word>-<YYYY-MM-DD>.mp4
 *   <OUT_DIR>/episodes/<word>-<YYYY-MM-DD>-metadata.txt
 *
 * Where OUT_DIR is:
 *   - process.env.WORDLORE_OUT_DIR if set (matches local-skill convention —
 *     keeps renders out of the repo tree on Andrew's workstation)
 *   - otherwise <REPO_ROOT>/public, so the cloud routine's renders land
 *     directly at public/episodes/<word>-<date>.mp4 ready to commit.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { generateNarration, generateTrailerNarration } from './generate-narration';
import type { WordloreInput } from '../remotion/Composition';
import type { TrailerInput } from '../remotion/Trailer';
import { beatBounds } from '../remotion/tokens/timing';

/**
 * Tail-pad each measured TTS beat then clamp to the soft bounds in
 * remotion/tokens/timing.ts. Without this, a fast TTS narration produces beats
 * that end abruptly (Beat 6 payoff at 2.6s when the brief target is 12-16s)
 * and the whole video reads as rushed. The padding adds breathing room after
 * VO; the clamp enforces the brand's pacing floor.
 */
const PER_BEAT_TAIL_PAD_SEC = 0.5;
function applyBeatBounds(measured: number[]): number[] {
  const orderedBounds = [
    beatBounds.beat1Hook,
    beatBounds.beat2WordReveal,
    beatBounds.beat3ModernAnchor,
    beatBounds.beat4OriginSetup,
    beatBounds.beat5Journey,
    beatBounds.beat6Payoff,
    beatBounds.beat7Outro,
  ];
  return measured.map((sec, i) => {
    const { min, max } = orderedBounds[i];
    const padded = sec + PER_BEAT_TAIL_PAD_SEC;
    return Math.max(min, Math.min(max, padded));
  });
}

const REPO_ROOT = path.resolve(__dirname, '..');
const REMOTION_DIR = path.join(REPO_ROOT, 'remotion');
const ASSETS_DIR = path.join(REMOTION_DIR, 'assets', 'audio');
const CONTENT_ROOT = path.join(REPO_ROOT, 'src', 'lib', 'wordlore-content');

// Output destinations. When WORDLORE_OUT_DIR env var is set, rendered videos
// land in dedicated subdirs (episodes/ and trailers/) underneath it — keeps
// rendered MP4 deliverables out of the repo tree on local renders.
// When the env var is unset, both write to public/episodes/ and
// public/trailers/ so the cloud routine's `git add public/episodes/...`
// step picks them up directly.
//
// Typical local setup: WORDLORE_OUT_DIR=E:\Wordlore  →  E:\Wordlore\episodes\*.mp4
//                                                  and  E:\Wordlore\trailers\*.mp4
// Cloud routine (env var unset): repo/public/episodes/*.mp4
const OUT_BASE = process.env.WORDLORE_OUT_DIR ?? path.join(REPO_ROOT, 'public');
const EPISODES_DIR = path.join(OUT_BASE, 'episodes');
const TRAILERS_DIR = path.join(OUT_BASE, 'trailers');

interface StateFile {
  currentWeek: string;
  weeks: Record<string, { words: string[] }>;
}

/**
 * Resolve an input argument to a path to the episode JSON.
 * - If the arg ends in `.json` and exists on disk, use it directly.
 * - Otherwise treat it as a bare word: look up state.json to find the current
 *   week, then read src/lib/wordlore-content/drafts/<week>/<word>.json.
 */
function resolveInputPath(arg: string): string {
  // Legacy: passed a JSON path directly
  if (arg.toLowerCase().endsWith('.json')) {
    const asAbs = path.isAbsolute(arg) ? arg : path.resolve(process.cwd(), arg);
    if (fs.existsSync(asAbs)) return asAbs;
    throw new Error(`Episode JSON not found at ${asAbs}`);
  }

  // Word-lookup mode
  const stateRaw = fs.readFileSync(path.join(CONTENT_ROOT, 'state.json'), 'utf-8');
  const state: StateFile = JSON.parse(stateRaw);
  const week = state.currentWeek;
  const wordLower = arg.toLowerCase();
  const wordPath = path.join(CONTENT_ROOT, 'drafts', week, `${wordLower}.json`);
  if (!fs.existsSync(wordPath)) {
    throw new Error(
      `Episode JSON not found at ${wordPath}\n` +
        `  state.json currentWeek = ${week}\n` +
        `  state.json weeks[${week}].words = ${JSON.stringify(
          state.weeks[week]?.words ?? [],
        )}`,
    );
  }
  return wordPath;
}

function buildMetadata(input: WordloreInput): string {
  const wordLower = input.word.toLowerCase();
  const revealLower = input.payoff.revelation.toLowerCase();
  return [
    `TITLE`,
    `Why "${wordLower}" actually means "${revealLower}"`,
    ``,
    `DESCRIPTION`,
    `${input.hook} The word ${wordLower} ${input.payoff.connector} ${revealLower}. Every word has a story.`,
    ``,
    `TAGS`,
    `#etymology  #wordorigins  #wordlore`,
    ``,
    `END SCREEN`,
    input.outro?.nextWord
      ? `Tomorrow: ${input.outro.nextWord}`
      : `Drop a word in the comments.`,
  ].join('\n');
}

async function renderVideo(inputArg: string): Promise<void> {
  const inputPath = resolveInputPath(inputArg);
  const input: WordloreInput = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
  const wordSlug = input.word.toLowerCase().replace(/\s+/g, '-');
  const date = new Date().toISOString().slice(0, 10);
  const musicVariant = input.musicVariant ?? 'dark';

  console.log(`\n=== Rendering Wordlore: ${input.word} ===\n`);
  console.log(`  input:  ${inputPath}`);
  console.log(`  output: ${EPISODES_DIR}`);

  // 1. Narration
  console.log('\n[1/4] Generating narration via OpenAI TTS HD (voice: fable, speed 0.85)');
  const { beatDurationsSec: rawDurations } = await generateNarration(inputPath, ASSETS_DIR);
  const beatDurationsSec = applyBeatBounds(rawDurations);
  const fmt = (a: number[]) => a.map((x) => x.toFixed(2)).join(', ');
  console.log(`  raw TTS:  [${fmt(rawDurations)}] = ${rawDurations.reduce((a, b) => a + b, 0).toFixed(1)}s`);
  console.log(`  bounded:  [${fmt(beatDurationsSec)}] = ${beatDurationsSec.reduce((a, b) => a + b, 0).toFixed(1)}s`);

  // 2. Probe disk for the other audio assets. The Composition will only
  //    mount Audio components for files this orchestrator confirmed exist —
  //    avoiding 404 render crashes on missing media.
  console.log('\n[2/4] Checking audio asset availability');
  const audioAssets = {
    voiceover: fs.existsSync(path.join(ASSETS_DIR, 'voiceover.mp3')),
    musicBed: fs.existsSync(path.join(ASSETS_DIR, `music-bed-${musicVariant}.mp3`)),
    soundLogo: fs.existsSync(path.join(ASSETS_DIR, 'sound-logo.wav')),
    chime: fs.existsSync(path.join(ASSETS_DIR, 'sfx', 'chime.wav')),
  };
  for (const [name, present] of Object.entries(audioAssets)) {
    console.log(`  ${present ? '+' : '.'} ${name}${present ? '' : ' (missing - will skip)'}`);
  }

  // 3. Prepare augmented props for Remotion
  console.log('\n[3/4] Preparing render props');
  const renderProps: WordloreInput = {
    ...input,
    beatDurationsSec,
    hasAudio: true,
    audioAssets,
  };
  fs.mkdirSync(EPISODES_DIR, { recursive: true });
  const propsPath = path.join(EPISODES_DIR, `${wordSlug}-render-props.json`);
  fs.writeFileSync(propsPath, JSON.stringify(renderProps, null, 2));

  // 4. Remotion render
  // Note: --public-dir is set explicitly so the Composition's staticFile()
  // calls resolve to remotion/assets/ regardless of where remotion.config.ts
  // gets loaded from. Without this, Remotion can latch onto a sibling
  // public/ directory (e.g. the Next.js public/episodes/) and try to serve
  // staticFile('audio/voiceover/beat-1.wav') from there.
  console.log('\n[4/4] Rendering video with Remotion');
  const outputMp4 = path.join(EPISODES_DIR, `${wordSlug}-${date}.mp4`);
  const publicDir = path.join(REMOTION_DIR, 'assets');
  execSync(
    `npx remotion render index.ts WordloreVideo "${outputMp4}" --props="${propsPath}" --public-dir="${publicDir}"`,
    { stdio: 'inherit', cwd: REMOTION_DIR }
  );

  // 4b. Final loudnorm pass on the muxed MP4 — push the full mix to
  // -14 LUFS for social platforms (TikTok/IG/YouTube Shorts target). The
  // per-beat VO normalization in generate-narration.ts gets the dialog to
  // -16 LUFS; this pass lifts the whole composition (VO + music + SFX) to
  // social-platform levels without re-balancing the internal mix coefs.
  console.log('\n[4b] Final loudnorm pass to -14 LUFS for social');
  const tmpNormalized = outputMp4 + '.norm.mp4';
  execSync(
    `ffmpeg -y -hide_banner -loglevel error -i "${outputMp4}" ` +
      `-af "loudnorm=I=-14:TP=-1.5:LRA=11" ` +
      `-c:v copy -c:a aac -b:a 192k "${tmpNormalized}"`
  );
  fs.renameSync(tmpNormalized, outputMp4);

  // 5. Metadata
  const metadataPath = path.join(EPISODES_DIR, `${wordSlug}-${date}-metadata.txt`);
  fs.writeFileSync(metadataPath, buildMetadata(input));

  console.log(`\n+ Render complete`);
  console.log(`  Video:    ${outputMp4}`);
  console.log(`  Metadata: ${metadataPath}`);
}

// ─── Trailer pipeline ────────────────────────────────────────────────────────

/**
 * Render the channel trailer (remotion/Trailer.tsx).
 *
 *   1. Generate per-line TTS narration → assets/audio/trailer-voiceover/beat-{1..7}.wav
 *      + concatenated trailer-voiceover.mp3 (debug artifact; Trailer.tsx mounts
 *      the per-beat WAVs directly so visual cadence stays locked even if any
 *      one line runs short).
 *   2. Probe disk for music bed + sound logo (reuses the regular video assets;
 *      no new assets needed for the trailer).
 *   3. Render WordloreTrailer composition.
 *   4. Final -14 LUFS loudnorm pass (same as the main pipeline).
 */
async function renderTrailer(): Promise<void> {
  const date = new Date().toISOString().slice(0, 10);
  console.log(`\n=== Rendering Wordlore Channel Trailer ===\n`);

  // 1. Narration
  console.log('[1/4] Generating trailer narration via OpenAI TTS HD (voice: fable, speed 0.85)');
  await generateTrailerNarration(ASSETS_DIR);

  // 2. Audio asset probe — trailer reuses music-bed-dark.mp3 + sound-logo.wav
  console.log('\n[2/4] Checking audio asset availability');
  const trailerVoiceoverDir = path.join(ASSETS_DIR, 'trailer-voiceover');
  const audioAssets = {
    // All 7 per-beat WAVs must exist for voiceover to register as available.
    voiceover: [1, 2, 3, 4, 5, 6, 7].every((n) =>
      fs.existsSync(path.join(trailerVoiceoverDir, `beat-${n}.wav`)),
    ),
    musicBed: fs.existsSync(path.join(ASSETS_DIR, 'music-bed-dark.mp3')),
    soundLogo: fs.existsSync(path.join(ASSETS_DIR, 'sound-logo.wav')),
  };
  for (const [name, present] of Object.entries(audioAssets)) {
    console.log(`  ${present ? '+' : '.'} ${name}${present ? '' : ' (missing - will skip)'}`);
  }

  // 3. Prepare props + render
  console.log('\n[3/4] Preparing render props');
  const renderProps: TrailerInput = { hasAudio: true, audioAssets };
  fs.mkdirSync(TRAILERS_DIR, { recursive: true });
  const propsPath = path.join(TRAILERS_DIR, `trailer-render-props.json`);
  fs.writeFileSync(propsPath, JSON.stringify(renderProps, null, 2));

  console.log('\n[4/4] Rendering trailer with Remotion');
  const outputMp4 = path.join(TRAILERS_DIR, `trailer-${date}.mp4`);
  const publicDir = path.join(REMOTION_DIR, 'assets');
  execSync(
    `npx remotion render index.ts WordloreTrailer "${outputMp4}" --props="${propsPath}" --public-dir="${publicDir}"`,
    { stdio: 'inherit', cwd: REMOTION_DIR },
  );

  // 4b. Final loudnorm pass — same -14 LUFS target as the main pipeline so
  // the trailer matches the channel videos on social platforms.
  console.log('\n[4b] Final loudnorm pass to -14 LUFS for social');
  const tmpNormalized = outputMp4 + '.norm.mp4';
  execSync(
    `ffmpeg -y -hide_banner -loglevel error -i "${outputMp4}" ` +
      `-af "loudnorm=I=-14:TP=-1.5:LRA=11" ` +
      `-c:v copy -c:a aac -b:a 192k "${tmpNormalized}"`,
  );
  fs.renameSync(tmpNormalized, outputMp4);

  console.log(`\n+ Trailer render complete`);
  console.log(`  Video: ${outputMp4}`);
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const trailerMode = args.includes('--trailer');

  if (!process.env.OPENAI_API_KEY) {
    console.error('Error: OPENAI_API_KEY environment variable not set.');
    process.exit(1);
  }

  if (trailerMode) {
    renderTrailer().catch((err) => {
      console.error('Error during trailer render:', err);
      process.exit(1);
    });
  } else {
    const inputArg = args.find((a) => !a.startsWith('--'));
    if (!inputArg) {
      console.error('Usage:');
      console.error('  tsx scripts/render-video.ts <word>            (look up draft by word)');
      console.error('  tsx scripts/render-video.ts <input.json>      (legacy: pass JSON path)');
      console.error('  tsx scripts/render-video.ts --trailer         (channel trailer)');
      process.exit(1);
    }
    renderVideo(inputArg).catch((err) => {
      console.error('Error during render:', err);
      process.exit(1);
    });
  }
}
