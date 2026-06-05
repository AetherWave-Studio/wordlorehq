/**
 * WordloreVideo — Master Composition
 *
 * Sequences all seven beats with their target durations and wires up the
 * audio stack: voiceover per beat, music bed throughout, sound logo at the
 * start of Beat 2, SFX at the Beat 3→4 transition and Beat 6 reveal moment.
 *
 * Beat durations here use the "target" values from tokens/timing.ts. In a
 * production pipeline, the script that calls Remotion should override these
 * with actual TTS audio durations measured per render. See SKILL.md.
 *
 * Missing audio assets log a warning and are silently skipped — never blocks
 * a render.
 */

import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  Audio,
  staticFile,
} from 'remotion';

import { beatBounds, sec, animation } from './tokens/timing';

import { Beat1_Hook } from './beats/Beat1_Hook';
import { Beat2_WordReveal } from './beats/Beat2_WordReveal';
import { Beat3_ModernAnchor } from './beats/Beat3_ModernAnchor';
import { Beat4_OriginSetup } from './beats/Beat4_OriginSetup';
import { Beat5_Journey } from './beats/Beat5_Journey';
import { Beat6_Payoff } from './beats/Beat6_Payoff';
import { Beat7_Outro } from './beats/Beat7_Outro';

export interface WordloreInput {
  word: string;
  pronunciation: string;
  partOfSpeech: string;
  definition: string;
  hook: string;
  modernAnchor: string;
  origin: {
    language: string;
    era: string;
    originalWord: string;
    originalMeaning: string;
  };
  /** Beat 5 narration. Array form triggers progressive reveal with crossfades. */
  journey: string | string[];
  payoff: {
    setupWord: string;
    connector: string;
    revelation: string;
  };
  outro?: {
    type?: 'tease' | 'cta';
    nextWord?: string;
  };
  musicVariant?: 'light' | 'dark';
  /** Optional override of per-beat durations (in seconds) when audio lengths are known. */
  beatDurationsSec?: number[];
  /** Master switch — when false, no audio mounts regardless of audioAssets flags. */
  hasAudio?: boolean;
  /**
   * Per-asset existence flags populated by the orchestrator script using
   * fs.existsSync. The Composition only mounts Audio components for assets
   * the orchestrator confirmed are on disk — preventing 404 crashes at
   * render time for missing media.
   */
  audioAssets?: {
    voiceover?: boolean;
    musicBed?: boolean;
    soundLogo?: boolean;
    chime?: boolean;
  };
}

const tryStaticFile = (path: string): string | null => {
  try {
    return staticFile(path);
  } catch {
    return null;
  }
};

export const WordloreVideo: React.FC<WordloreInput> = (input) => {
  const {
    beatDurationsSec,
    hasAudio = false,
    audioAssets,
    musicVariant = 'dark',
  } = input;

  // Derive beat durations in frames — either from explicit override or from targets
  const beatSeconds = beatDurationsSec ?? [
    beatBounds.beat1Hook.target,
    beatBounds.beat2WordReveal.target,
    beatBounds.beat3ModernAnchor.target,
    beatBounds.beat4OriginSetup.target,
    beatBounds.beat5Journey.target,
    beatBounds.beat6Payoff.target,
    beatBounds.beat7Outro.target,
  ];

  const beatFrames = beatSeconds.map(sec);
  const beatStarts = beatFrames.reduce<number[]>((acc, _, i) => {
    acc.push(i === 0 ? 0 : acc[i - 1] + beatFrames[i - 1]);
    return acc;
  }, []);

  // Audio asset URLs — only resolved if hasAudio AND the orchestrator
  // confirmed the file exists via audioAssets flags. Mounting an Audio
  // component for a missing file causes a 404 crash at render time, which
  // is why we trust the flags rather than calling tryStaticFile speculatively.
  const audioOn = hasAudio && audioAssets;
  const musicBed = audioOn && audioAssets.musicBed
    ? staticFile(`audio/music-bed-${musicVariant}.mp3`)
    : null;
  const soundLogo = audioOn && audioAssets.soundLogo
    ? staticFile('audio/sound-logo.wav')
    : null;
  const chimeSfx = audioOn && audioAssets.chime
    ? staticFile('audio/sfx/chime.wav')
    : null;
  const voiceoverFile = audioOn && audioAssets.voiceover
    ? staticFile('audio/voiceover.mp3')
    : null;

  return (
    <AbsoluteFill style={{ backgroundColor: '#0F1A2E' }}>
      {/* Beat 1 */}
      <Sequence from={beatStarts[0]} durationInFrames={beatFrames[0]}>
        <Beat1_Hook hook={input.hook} />
      </Sequence>

      {/* Beat 2 */}
      <Sequence from={beatStarts[1]} durationInFrames={beatFrames[1]}>
        <Beat2_WordReveal
          word={input.word}
          pronunciation={input.pronunciation}
          partOfSpeech={input.partOfSpeech}
          definition={input.definition}
        />
      </Sequence>

      {/* Beat 3 */}
      <Sequence from={beatStarts[2]} durationInFrames={beatFrames[2]}>
        <Beat3_ModernAnchor modernAnchor={input.modernAnchor} />
      </Sequence>

      {/* Beat 4 */}
      <Sequence from={beatStarts[3]} durationInFrames={beatFrames[3]}>
        <Beat4_OriginSetup origin={input.origin} />
      </Sequence>

      {/* Beat 5 */}
      <Sequence from={beatStarts[4]} durationInFrames={beatFrames[4]}>
        <Beat5_Journey journey={input.journey} durationInFrames={beatFrames[4]} />
      </Sequence>

      {/* Beat 6 */}
      <Sequence from={beatStarts[5]} durationInFrames={beatFrames[5]}>
        <Beat6_Payoff payoff={input.payoff} />
      </Sequence>

      {/* Beat 7 */}
      <Sequence from={beatStarts[6]} durationInFrames={beatFrames[6]}>
        <Beat7_Outro outro={input.outro} />
      </Sequence>

      {/* Audio stack — only mounted if assets resolved.
          Volume balance (adjusted 2026-05-21 after first prod render): VO was
          getting buried under SFX even at v=1.0 because OpenAI TTS delivers
          ~ -23 LUFS while ElevenLabs SFX ride hotter. Two fixes work in
          tandem: generate-narration.ts loudnorms the VO mix to -16 LUFS, and
          the SFX gains here drop to leave clear headroom. */}
      {musicBed && <Audio src={musicBed} volume={0.22} />}

      {/* Per-beat voiceover — one <Audio> per beat, anchored at that beat's
          visual start frame. The single concatenated voiceover.mp3 desyncs
          when visual beat durations exceed the narration audio (the norm
          for Wordlore since the bounds floor visuals at brand pacing). With
          per-beat mounting, silence naturally fills any visual tail past the
          narration end, and the next beat's VO kicks in exactly when the
          next visual section starts. The per-beat WAVs live at
          assets/audio/voiceover/beat-N.wav and the orchestrator guarantees
          all 7 exist together when audioAssets.voiceover is true. */}
      {audioOn && audioAssets.voiceover && [1, 2, 3, 4, 5, 6, 7].map((n, i) => (
        <Sequence key={`vo-${n}`} from={beatStarts[i]}>
          <Audio src={staticFile(`audio/voiceover/beat-${n}.wav`)} volume={1} />
        </Sequence>
      ))}
      {soundLogo && (
        <Sequence from={beatStarts[1]} durationInFrames={sec(1)}>
          <Audio src={soundLogo} volume={0.6} />
        </Sequence>
      )}
      {chimeSfx && (
        <Sequence
          from={beatStarts[5] + animation.payoffRevealDelay}
          durationInFrames={sec(2)}
        >
          <Audio src={chimeSfx} volume={0.55} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};

/** Total composition duration in frames given input beat seconds. */
export const computeTotalFrames = (beatDurationsSec?: number[]): number => {
  const seconds = beatDurationsSec ?? [
    beatBounds.beat1Hook.target,
    beatBounds.beat2WordReveal.target,
    beatBounds.beat3ModernAnchor.target,
    beatBounds.beat4OriginSetup.target,
    beatBounds.beat5Journey.target,
    beatBounds.beat6Payoff.target,
    beatBounds.beat7Outro.target,
  ];
  return seconds.reduce((acc, s) => acc + sec(s), 0);
};
