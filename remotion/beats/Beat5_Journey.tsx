/**
 * Beat 5 — Journey
 *
 * The historical story. Longest beat (~22-25s).
 *
 * Input forms:
 *  - `journey` as a single string → renders as one block, fades in once and
 *    holds (the original "wall of text" behavior).
 *  - `journey` as an array of strings → time-slices the beat into N segments
 *    that crossfade between chunks, giving progressive reveal pacing. The TTS
 *    layer joins the same chunks back into one continuous read, so the audio
 *    runs unbroken while the on-screen text advances.
 */

import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
} from 'remotion';

import { colors } from '../tokens/colors';
import { fonts, FRAME } from '../tokens/typography';
import { BrandMark } from '../components/BrandMark';

export interface Beat5Props {
  /** Journey narration — single string OR an array of 2-6 chunks. */
  journey: string | string[];
  /** Total Beat 5 duration in frames — required when journey is an array. */
  durationInFrames: number;
}

const CROSSFADE_FRAMES = 12; // 0.4s overlap between chunks
const SLOW_DRIFT_RANGE = 20; // px of vertical drift per chunk

const textStyle: React.CSSProperties = {
  fontFamily: fonts.body,
  fontSize: 46,
  color: colors.surface,
  lineHeight: 1.55,
  textAlign: 'center',
  maxWidth: 920,
  fontWeight: 400,
};

const containerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: `0 ${FRAME.padding + 60}px`,
};

export const Beat5_Journey: React.FC<Beat5Props> = ({ journey, durationInFrames }) => {
  const frame = useCurrentFrame();
  const chunks = Array.isArray(journey) ? journey : [journey];

  // Single-string path keeps the legacy behavior: fade in once, gentle drift.
  if (chunks.length === 1) {
    const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
    const yShift = interpolate(frame, [0, 600], [20, -20]);
    return (
      <AbsoluteFill style={{ backgroundColor: colors.background }}>
        <BrandMark />
        <AbsoluteFill style={containerStyle}>
          <div style={{ ...textStyle, opacity, transform: `translateY(${yShift}px)` }}>
            {chunks[0]}
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }

  // Multi-chunk path — split the beat into equal slots, crossfade between
  // them, drift each chunk gently to avoid static-card feel.
  const slot = durationInFrames / chunks.length;

  return (
    <AbsoluteFill style={{ backgroundColor: colors.background }}>
      <BrandMark />
      <AbsoluteFill style={containerStyle}>
        {chunks.map((chunk, i) => {
          const start = i * slot;
          const end = start + slot;
          // Trapezoidal opacity: fade in over CROSSFADE_FRAMES, hold, fade
          // out over CROSSFADE_FRAMES. First chunk has no fade-in (already
          // visible at beat start); last chunk has no fade-out (audio drives
          // the transition to Beat 6). Build the interpolate input array
          // conditionally — Remotion's `interpolate` rejects equal
          // consecutive frame stops, so we can't just collapse fadeIn=0 to
          // [start, start, ...]. Construct only the segments we need.
          const fadeIn = i === 0 ? 0 : CROSSFADE_FRAMES;
          const fadeOut = i === chunks.length - 1 ? 0 : CROSSFADE_FRAMES;
          const inputs: number[] = [];
          const outputs: number[] = [];
          if (fadeIn > 0) {
            inputs.push(start, start + fadeIn);
            outputs.push(0, 1);
          } else {
            inputs.push(start);
            outputs.push(1);
          }
          if (fadeOut > 0) {
            inputs.push(end - fadeOut, end);
            outputs.push(1, 0);
          } else {
            inputs.push(end);
            outputs.push(1);
          }
          const opacity = interpolate(frame, inputs, outputs, {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          // Slight upward drift across this chunk's slot for cinematic motion
          const yShift = interpolate(
            frame,
            [start, end],
            [SLOW_DRIFT_RANGE, -SLOW_DRIFT_RANGE],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
          );
          // Each chunk gets its own AbsoluteFill so flex centering applies
          // per-chunk; using position:absolute on a flex child would yank it
          // out of the parent's centering layout.
          return (
            <AbsoluteFill key={i} style={{ ...containerStyle, opacity }}>
              <div
                style={{
                  ...textStyle,
                  transform: `translateY(${yShift}px)`,
                }}
              >
                {chunk}
              </div>
            </AbsoluteFill>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
