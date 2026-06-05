/**
 * WordloreTrailer — channel trailer (30s).
 *
 * Sibling composition to WordloreVideo. Renders a fixed 30-second channel
 * trailer at 1080×1920 / 30fps using the same brand tokens (colors, fonts,
 * BrandMark, Flourish) but with its own snappy beat sequence — none of the
 * 7-beat WordloreInput structure.
 *
 * Beat structure (frames at 30fps):
 *   Beat 1 — Hook (3s)            — "Every word you say has a buried history."
 *   Beat 2 — NIGHTMARE reveal (3s) — used to mean / NIGHTMARE / DEMON ATTACK
 *   Beat 3 — GOODBYE reveal (3s)   — was once / GOODBYE / A PRAYER
 *   Beat 4 — DISASTER reveal (3s)  — literally means / DISASTER / BAD STAR
 *   Beat 5 — Brand statement (3s)  — "The English you speak is haunted."
 *   Beat 6 — Brand identity (6s)   — WORDLORE wordmark + diamond + tagline
 *   Beat 7 — Cadence (5s)          — "New stories every Mon · Tue · Thu · Fri"
 *   Beat 8 — Hold (4s)             — final state, audio fades
 *
 * Adjacent beats overlap by ~300ms (CROSSFADE_FRAMES) and each beat applies
 * its own trapezoidal opacity, so the boundaries dissolve cinematically
 * instead of cutting.
 *
 * Audio is the same staticFile-from-assets pattern as the main composition:
 *  - per-beat VO mounted at each beat's start (assets/audio/trailer-voiceover/beat-N.wav)
 *  - music-bed-dark.mp3 reused (ducked + fades in last 2s)
 *  - sound-logo.wav fires once at the start of Beat 6 (WORDLORE reveal)
 */

import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Sequence,
  staticFile,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from 'remotion';

import { colors } from './tokens/colors';
import { fonts, FRAME } from './tokens/typography';
import { sec, FPS } from './tokens/timing';
import { BrandMark } from './components/BrandMark';
import { DiamondOrnament } from './components/Flourish';

// ─── Trailer timing constants ────────────────────────────────────────────────

const TRAILER_BEAT_SECONDS = [3, 3, 3, 3, 3, 6, 5, 4] as const; // sum = 30s
const TRAILER_BEAT_FRAMES = TRAILER_BEAT_SECONDS.map((s) => s * FPS);
const TRAILER_BEAT_STARTS: number[] = (() => {
  const out: number[] = [];
  let acc = 0;
  for (const f of TRAILER_BEAT_FRAMES) {
    out.push(acc);
    acc += f;
  }
  return out;
})();
export const TRAILER_TOTAL_FRAMES =
  TRAILER_BEAT_FRAMES.reduce((a, b) => a + b, 0); // 900 frames @ 30fps

const CROSSFADE_FRAMES = 9; // 300ms — boundary dissolve between beats

// ─── Props ───────────────────────────────────────────────────────────────────

export interface TrailerInput {
  hasAudio?: boolean;
  audioAssets?: {
    voiceover?: boolean;
    musicBed?: boolean;
    soundLogo?: boolean;
  };
}

// ─── Shared utilities ────────────────────────────────────────────────────────

/**
 * Build a trapezoidal opacity curve for a beat that fades in over its first
 * CROSSFADE_FRAMES and fades out over its last CROSSFADE_FRAMES — so adjacent
 * (overlapping) beat Sequences crossfade at the boundaries. Pass
 * `fadeOut=false` for the final beat (Beat 8) — its visual stays on screen
 * to the end of the composition.
 */
const beatOpacity = (frame: number, totalFrames: number, fadeOut = true) => {
  if (fadeOut) {
    return interpolate(
      frame,
      [0, CROSSFADE_FRAMES, totalFrames - CROSSFADE_FRAMES, totalFrames],
      [0, 1, 1, 0],
      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
    );
  }
  return interpolate(frame, [0, CROSSFADE_FRAMES], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
};

const fullCenter: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'column',
  padding: `0 ${FRAME.padding + 40}px`,
  textAlign: 'center',
};

// ─── Beat 1 — Hook ───────────────────────────────────────────────────────────

const Beat1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const total = TRAILER_BEAT_FRAMES[0] + CROSSFADE_FRAMES;
  const opacity = beatOpacity(frame, total);
  return (
    <AbsoluteFill style={{ backgroundColor: colors.midnight, opacity }}>
      <BrandMark />
      <AbsoluteFill style={fullCenter}>
        <div
          style={{
            fontFamily: fonts.serifItalic,
            fontStyle: 'italic',
            fontSize: 64,
            color: colors.parchment,
            lineHeight: 1.35,
            maxWidth: 900,
            fontWeight: 400,
          }}
        >
          Every word you say has a buried history.
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── Beat 2-4 — Word reveals (shared component) ──────────────────────────────

interface WordRevealProps {
  lead: string;     // small italic line above
  word: string;     // big gold word
  payoff: string;   // small oxblood line below
}

const TrailerWordReveal: React.FC<WordRevealProps> = ({ lead, word, payoff }) => {
  const frame = useCurrentFrame();
  const total = TRAILER_BEAT_FRAMES[1] + CROSSFADE_FRAMES; // beats 2-4 all 3s
  const opacity = beatOpacity(frame, total);

  // Reveal sequence inside the beat — snappy, ~600ms total:
  //   0-6   lead fades up
  //   4-10  word scales 0.98 → 1.00
  //   8-14  payoff fades up
  const leadOpacity = interpolate(frame, [0, 6], [0, 1], { extrapolateRight: 'clamp' });
  const wordOpacity = interpolate(frame, [4, 10], [0, 1], { extrapolateRight: 'clamp' });
  const wordScale = interpolate(frame, [4, 10], [0.98, 1], { extrapolateRight: 'clamp' });
  const payoffOpacity = interpolate(frame, [8, 14], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: colors.midnight, opacity }}>
      <BrandMark />
      <AbsoluteFill style={fullCenter}>
        <div
          style={{
            fontFamily: fonts.serifItalic,
            fontStyle: 'italic',
            fontSize: 36,
            color: colors.parchment,
            opacity: leadOpacity,
            marginBottom: 24,
            letterSpacing: '0.02em',
          }}
        >
          {lead}
        </div>
        <div
          style={{
            fontFamily: fonts.serif,
            fontWeight: 700,
            fontSize: 168,
            color: colors.gold,
            opacity: wordOpacity,
            transform: `scale(${wordScale})`,
            letterSpacing: '0.01em',
            lineHeight: 1,
          }}
        >
          {word}
        </div>
        <div
          style={{
            fontFamily: fonts.sans,
            fontWeight: 700,
            fontSize: 42,
            color: colors.oxblood,
            opacity: payoffOpacity,
            marginTop: 28,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          {payoff}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── Beat 5 — Brand statement ────────────────────────────────────────────────

const Beat5BrandStatement: React.FC = () => {
  const frame = useCurrentFrame();
  const total = TRAILER_BEAT_FRAMES[4] + CROSSFADE_FRAMES;
  const opacity = beatOpacity(frame, total);
  return (
    <AbsoluteFill style={{ backgroundColor: colors.midnight, opacity }}>
      <BrandMark />
      <AbsoluteFill style={fullCenter}>
        <div
          style={{
            fontFamily: fonts.serifItalic,
            fontStyle: 'italic',
            fontSize: 76,
            color: colors.parchment,
            lineHeight: 1.3,
            maxWidth: 900,
            fontWeight: 400,
          }}
        >
          The English you speak is haunted.
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── Beat 6 — Brand identity (WORDLORE wordmark + flourish + tagline) ────────

const Beat6BrandIdentity: React.FC = () => {
  const frame = useCurrentFrame();
  const total = TRAILER_BEAT_FRAMES[5] + CROSSFADE_FRAMES;
  const opacity = beatOpacity(frame, total);
  const { fps } = useVideoConfig();

  // WORDLORE wordmark springs in over ~600ms
  const wordSpring = spring({ frame, fps, config: { damping: 18, stiffness: 90 }, durationInFrames: 18 });
  const wordOpacity = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: 'clamp' });
  const flourishOpacity = interpolate(frame, [22, 36], [0, 1], { extrapolateRight: 'clamp' });
  const taglineOpacity = interpolate(frame, [30, 48], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: colors.midnight, opacity }}>
      <BrandMark />
      <AbsoluteFill style={fullCenter}>
        <div
          style={{
            fontFamily: fonts.serif,
            fontWeight: 700,
            fontSize: 160,
            color: colors.gold,
            letterSpacing: '0.02em',
            lineHeight: 1,
            opacity: wordOpacity,
            transform: `scale(${interpolate(wordSpring, [0, 1], [0.92, 1])})`,
          }}
        >
          WORDLORE
        </div>
        <div style={{ marginTop: 40, opacity: flourishOpacity }}>
          <DiamondOrnament />
        </div>
        <div
          style={{
            fontFamily: fonts.serifItalic,
            fontStyle: 'italic',
            fontSize: 44,
            color: colors.parchment,
            marginTop: 32,
            opacity: taglineOpacity,
            letterSpacing: '0.02em',
          }}
        >
          Every word has a story.
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── Beat 7 — Cadence line ───────────────────────────────────────────────────

const Beat7Cadence: React.FC = () => {
  const frame = useCurrentFrame();
  const total = TRAILER_BEAT_FRAMES[6] + CROSSFADE_FRAMES;
  const opacity = beatOpacity(frame, total);
  const lineOpacity = interpolate(frame, [0, 14], [0, 1], { extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ backgroundColor: colors.midnight, opacity }}>
      <BrandMark />
      <AbsoluteFill style={fullCenter}>
        <div
          style={{
            fontFamily: fonts.serif,
            fontWeight: 700,
            fontSize: 64,
            color: colors.gold,
            letterSpacing: '0.02em',
            lineHeight: 1,
            marginBottom: 28,
            opacity: lineOpacity,
          }}
        >
          WORDLORE
        </div>
        <div
          style={{
            fontFamily: fonts.sans,
            fontSize: 44,
            color: colors.parchment,
            fontWeight: 500,
            letterSpacing: '0.05em',
            opacity: lineOpacity,
            lineHeight: 1.3,
          }}
        >
          New stories every<br />
          Mon · Tue · Thu · Fri
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── Beat 8 — Hold (no fade-out; composition ends here) ──────────────────────

const Beat8Hold: React.FC = () => {
  const frame = useCurrentFrame();
  const total = TRAILER_BEAT_FRAMES[7];
  // Don't fade out — composition ends on this frame anyway.
  const opacity = beatOpacity(frame, total, /* fadeOut */ false);
  return (
    <AbsoluteFill style={{ backgroundColor: colors.midnight, opacity }}>
      <BrandMark />
      <AbsoluteFill style={fullCenter}>
        <div
          style={{
            fontFamily: fonts.serif,
            fontWeight: 700,
            fontSize: 64,
            color: colors.gold,
            letterSpacing: '0.02em',
            lineHeight: 1,
            marginBottom: 28,
          }}
        >
          WORDLORE
        </div>
        <div
          style={{
            fontFamily: fonts.sans,
            fontSize: 44,
            color: colors.parchment,
            fontWeight: 500,
            letterSpacing: '0.05em',
            lineHeight: 1.3,
          }}
        >
          New stories every<br />
          Mon · Tue · Thu · Fri
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── Master composition ──────────────────────────────────────────────────────

export const WordloreTrailer: React.FC<TrailerInput> = (input) => {
  const { hasAudio = false, audioAssets } = input;
  const audioOn = hasAudio && audioAssets;

  const musicBed =
    audioOn && audioAssets.musicBed ? staticFile('audio/music-bed-dark.mp3') : null;
  const soundLogo =
    audioOn && audioAssets.soundLogo ? staticFile('audio/sound-logo.wav') : null;

  // Music volume function — held at 0.20 for most of the trailer, fades to 0
  // over the last 2 seconds of Beat 8 (matches the "Audio fades" spec).
  const musicFadeStart = TRAILER_TOTAL_FRAMES - sec(2);
  const musicVolume = (f: number) => {
    if (f < musicFadeStart) return 0.2;
    return Math.max(
      0,
      interpolate(f, [musicFadeStart, TRAILER_TOTAL_FRAMES], [0.2, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      }),
    );
  };

  return (
    <AbsoluteFill style={{ backgroundColor: colors.midnight }}>
      {/* Beat sequences — each overlaps the next by CROSSFADE_FRAMES (except
          the last) so adjacent beat opacity curves crossfade smoothly. */}
      <Sequence from={TRAILER_BEAT_STARTS[0]} durationInFrames={TRAILER_BEAT_FRAMES[0] + CROSSFADE_FRAMES}>
        <Beat1Hook />
      </Sequence>
      <Sequence from={TRAILER_BEAT_STARTS[1]} durationInFrames={TRAILER_BEAT_FRAMES[1] + CROSSFADE_FRAMES}>
        <TrailerWordReveal lead="used to mean" word="NIGHTMARE" payoff="DEMON ATTACK" />
      </Sequence>
      <Sequence from={TRAILER_BEAT_STARTS[2]} durationInFrames={TRAILER_BEAT_FRAMES[2] + CROSSFADE_FRAMES}>
        <TrailerWordReveal lead="was once" word="GOODBYE" payoff="A PRAYER" />
      </Sequence>
      <Sequence from={TRAILER_BEAT_STARTS[3]} durationInFrames={TRAILER_BEAT_FRAMES[3] + CROSSFADE_FRAMES}>
        <TrailerWordReveal lead="literally means" word="DISASTER" payoff="BAD STAR" />
      </Sequence>
      <Sequence from={TRAILER_BEAT_STARTS[4]} durationInFrames={TRAILER_BEAT_FRAMES[4] + CROSSFADE_FRAMES}>
        <Beat5BrandStatement />
      </Sequence>
      <Sequence from={TRAILER_BEAT_STARTS[5]} durationInFrames={TRAILER_BEAT_FRAMES[5] + CROSSFADE_FRAMES}>
        <Beat6BrandIdentity />
      </Sequence>
      <Sequence from={TRAILER_BEAT_STARTS[6]} durationInFrames={TRAILER_BEAT_FRAMES[6] + CROSSFADE_FRAMES}>
        <Beat7Cadence />
      </Sequence>
      <Sequence from={TRAILER_BEAT_STARTS[7]} durationInFrames={TRAILER_BEAT_FRAMES[7]}>
        <Beat8Hold />
      </Sequence>

      {/* Audio stack */}
      {musicBed && <Audio src={musicBed} volume={musicVolume} />}
      {audioOn && audioAssets.voiceover &&
        [1, 2, 3, 4, 5, 6, 7].map((n, i) => (
          <Sequence key={`vo-${n}`} from={TRAILER_BEAT_STARTS[i]}>
            <Audio src={staticFile(`audio/trailer-voiceover/beat-${n}.wav`)} volume={1.0} />
          </Sequence>
        ))}
      {soundLogo && (
        <Sequence from={TRAILER_BEAT_STARTS[5]} durationInFrames={sec(1)}>
          <Audio src={soundLogo} volume={0.9} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};
