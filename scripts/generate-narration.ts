/**
 * generate-narration.ts — vendored into the wordlorehq repo from the local skill.
 *
 * Reads a Wordlore input JSON, stitches per-beat narration scripts per the
 * formulas in the Wordlore brand spec, calls OpenAI TTS HD with voice "fable",
 * writes per-beat WAVs, measures their durations, concatenates them into a
 * single `remotion/assets/audio/voiceover.mp3`, and returns the duration array
 * for the render step to use as `beatDurationsSec`.
 *
 * Usage:
 *   OPENAI_API_KEY=sk-... npx tsx scripts/generate-narration.ts examples/nightmare.json
 *
 * Requires:
 *   - OPENAI_API_KEY in env
 *   - ffmpeg + ffprobe on PATH
 *   - npm install openai
 */

import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import type { WordloreInput } from '../remotion/Composition';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ---- Per-beat script stitching (formulas from the Wordlore brand spec) ----

interface BeatScript {
  beat: number;
  text: string;
}

export const buildScripts = (input: WordloreInput): BeatScript[] => {
  const useTease = !input.outro || input.outro.type === 'tease';
  const outroLine =
    useTease && input.outro?.nextWord
      ? `Every word has a story. Tomorrow: ${input.outro.nextWord}.`
      : `Every word has a story. Drop a word in the comments. I'll dig it up.`;

  return [
    { beat: 1, text: input.hook },
    {
      beat: 2,
      text: `${input.word}. ${input.partOfSpeech}. ${input.definition}.`,
    },
    { beat: 3, text: input.modernAnchor },
    {
      beat: 4,
      text: `From ${input.origin.language}, around ${input.origin.era}, the word was ${input.origin.originalWord} - ${input.origin.originalMeaning}.`,
    },
    {
      beat: 5,
      // journey may be a single string OR an array of chunks. The visual
      // layer time-slices the array across the beat; the TTS layer reads
      // them back-to-back as one continuous narration so the audio doesn't
      // have gaps the viewer wouldn't expect from a single voice take.
      text: Array.isArray(input.journey)
        ? input.journey.map((s) => s.trim()).join(' ')
        : input.journey,
    },
    {
      beat: 6,
      text: `Your ${input.payoff.setupWord} ${input.payoff.connector} ${input.payoff.revelation}.`,
    },
    { beat: 7, text: outroLine },
  ];
};

// ---- OpenAI TTS HD call (voice: fable) ----

async function generateBeatAudio(text: string, outputPath: string): Promise<void> {
  const response = await client.audio.speech.create({
    model: 'tts-1-hd',
    voice: 'fable',
    input: text,
    response_format: 'wav',
    // Slow the fable voice ~15% under default. 1.0 reads "rushed/urgent" on
    // Wordlore's contemplative beats; 0.85 lands closer to documentary
    // narrator cadence while staying natural.
    speed: 0.85,
  });
  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(outputPath, buffer);
}

// ---- Audio measurement and concatenation via ffmpeg ----

function measureWavDuration(wavPath: string): number {
  const out = execSync(
    `ffprobe -v error -show_entries format=duration -of csv=p=0 "${wavPath}"`,
    { encoding: 'utf-8' }
  );
  return parseFloat(out.trim());
}

/**
 * Apply EBU R128 loudness normalization to a WAV in-place. Run after TTS
 * generation so each per-beat WAV (mounted individually by Composition.tsx
 * at its visual start frame) plays at consistent -16 LUFS, clearly above
 * the music bed (~0.22 gain) and the SFX stack (~0.4–0.6 gain).
 */
function loudnormInPlace(wavPath: string): void {
  const tmp = wavPath + '.norm.wav';
  execSync(
    `ffmpeg -y -hide_banner -loglevel error -i "${wavPath}" ` +
      `-af "loudnorm=I=-16:LRA=11:TP=-1.5" ` +
      `-ar 24000 -ac 1 "${tmp}"`
  );
  fs.renameSync(tmp, wavPath);
}

function concatenateWavsToMp3(wavPaths: string[], outputMp3: string): void {
  const listFile = path.join(path.dirname(outputMp3), '.concat-list.txt');
  const listBody = wavPaths.map((p) => `file '${path.resolve(p)}'`).join('\n');
  fs.writeFileSync(listFile, listBody);
  // Concat WAVs then apply EBU R128 loudness normalization on the way out.
  // -16 LUFS integrated + -1.5 dBTP gets the voiceover up to a level that
  // sits clearly above the music bed (0.25 gain) and on top of the SFX
  // (0.5-0.7 gain) without further per-track gain changes. OpenAI TTS
  // tends to deliver around -23 LUFS which feels quiet next to the SFX.
  execSync(
    `ffmpeg -y -hide_banner -loglevel error -f concat -safe 0 -i "${listFile}" ` +
      `-af "loudnorm=I=-16:LRA=11:TP=-1.5" ` +
      `-c:a libmp3lame -b:a 192k "${outputMp3}"`
  );
  fs.unlinkSync(listFile);
}

// ---- Main pipeline ----

export interface NarrationResult {
  voiceoverPath: string;
  beatDurationsSec: number[];
  beatWavPaths: string[];
}

export async function generateNarration(
  inputPath: string,
  audioDir: string
): Promise<NarrationResult> {
  const input: WordloreInput = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
  const scripts = buildScripts(input);

  const voiceoverDir = path.join(audioDir, 'voiceover');
  fs.mkdirSync(voiceoverDir, { recursive: true });

  const beatWavPaths: string[] = [];
  for (const { beat, text } of scripts) {
    const wavPath = path.join(voiceoverDir, `beat-${beat}.wav`);
    const preview = text.length > 64 ? `${text.slice(0, 60)}...` : text;
    console.log(`  beat ${beat}: ${preview}`);
    await generateBeatAudio(text, wavPath);
    // Normalize per-beat WAV in-place. Composition.tsx mounts each WAV at
    // its visual start frame independently, so per-file LUFS is what the
    // viewer hears — not whatever the post-concat mix would have been.
    loudnormInPlace(wavPath);
    beatWavPaths.push(wavPath);
  }

  const beatDurationsSec = beatWavPaths.map(measureWavDuration);
  const voiceoverPath = path.join(audioDir, 'voiceover.mp3');
  concatenateWavsToMp3(beatWavPaths, voiceoverPath);

  const totalSec = beatDurationsSec.reduce((a, b) => a + b, 0);
  console.log(`  total VO: ${totalSec.toFixed(2)}s`);

  return { voiceoverPath, beatDurationsSec, beatWavPaths };
}

// ─── Trailer narration ───────────────────────────────────────────────────────

/**
 * Hardcoded narration lines for the channel trailer (remotion/Trailer.tsx).
 * One line per visual beat 1-7; Beat 8 is silent (audio fades). Exposed as
 * a constant so the trailer.tsx composition can stay in sync if either
 * side changes.
 */
export const TRAILER_NARRATION_LINES: readonly string[] = [
  'Every word you say has a buried history.',
  'NIGHTMARE used to mean demon attack.',
  'GOODBYE was once a prayer.',
  'DISASTER literally means bad star.',
  'The English you speak is haunted.',
  'Wordlore. Every word has a story.',
  'New stories every Monday, Tuesday, Thursday, Friday.',
];

export interface TrailerNarrationResult {
  voiceoverPath: string;
  beatWavPaths: string[];
  beatDurationsSec: number[];
}

/**
 * Generate the 7 trailer beat WAVs + a concatenated trailer-voiceover.mp3.
 * Uses the same OpenAI TTS HD / fable / 0.85 speed settings as the main
 * narrator, so the trailer voice matches the regular videos. Output paths:
 *
 *   audioDir/trailer-voiceover/beat-{1..7}.wav     (per-beat, mounted by Trailer.tsx)
 *   audioDir/trailer-voiceover.mp3                  (concat artifact, debug/review)
 */
export async function generateTrailerNarration(
  audioDir: string,
): Promise<TrailerNarrationResult> {
  const voiceoverDir = path.join(audioDir, 'trailer-voiceover');
  fs.mkdirSync(voiceoverDir, { recursive: true });

  const beatWavPaths: string[] = [];
  for (let i = 0; i < TRAILER_NARRATION_LINES.length; i++) {
    const beat = i + 1;
    const text = TRAILER_NARRATION_LINES[i];
    const wavPath = path.join(voiceoverDir, `beat-${beat}.wav`);
    console.log(`  trailer beat ${beat}: ${text}`);
    await generateBeatAudio(text, wavPath);
    loudnormInPlace(wavPath);
    beatWavPaths.push(wavPath);
  }

  const beatDurationsSec = beatWavPaths.map(measureWavDuration);
  const voiceoverPath = path.join(audioDir, 'trailer-voiceover.mp3');
  concatenateWavsToMp3(beatWavPaths, voiceoverPath);

  const total = beatDurationsSec.reduce((a, b) => a + b, 0);
  console.log(`  total trailer VO: ${total.toFixed(2)}s`);
  return { voiceoverPath, beatWavPaths, beatDurationsSec };
}

// ---- CLI entry ----

if (require.main === module) {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error('Usage: tsx scripts/generate-narration.ts <input.json>');
    process.exit(1);
  }
  if (!process.env.OPENAI_API_KEY) {
    console.error('Error: OPENAI_API_KEY environment variable not set.');
    process.exit(1);
  }
  const audioDir = path.resolve(__dirname, '..', 'remotion', 'assets', 'audio');
  console.log(`Generating narration from ${inputPath}\n`);
  generateNarration(inputPath, audioDir)
    .then((result) => {
      console.log(`\n+ Narration complete`);
      console.log(`  voiceover.mp3 -> ${result.voiceoverPath}`);
      const durationsJson = path.join(audioDir, 'beat-durations.json');
      fs.writeFileSync(
        durationsJson,
        JSON.stringify(result.beatDurationsSec, null, 2)
      );
      console.log(`  beat durations -> ${durationsJson}`);
    })
    .catch((err) => {
      console.error('Error during narration generation:', err);
      process.exit(1);
    });
}
