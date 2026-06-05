/**
 * Beat 1 — Hook
 *
 * The cold-open curiosity-gap sentence. No throat-clearing, no question marks.
 * One declarative line in cream serif, centered. Brand mark sits at top
 * (consistent across all beats). Fades in fast, holds, then exits via cut.
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

export interface Beat1Props {
  /** The one-sentence curiosity-gap hook from the input JSON. */
  hook: string;
}

export const Beat1_Hook: React.FC<Beat1Props> = ({ hook }) => {
  const frame = useCurrentFrame();

  // Fast fade-in for the hook line
  const hookOpacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // Subtle upward drift for cinematic feel (8px over the entrance)
  const hookY = interpolate(frame, [0, 18], [12, 0], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ backgroundColor: colors.midnight }}>
      <BrandMark opacity={0.4} />

      <AbsoluteFill
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: `0 ${FRAME.padding + 40}px`,
        }}
      >
        <div
          style={{
            fontFamily: fonts.serif,
            fontWeight: 700,
            fontSize: 72,
            color: colors.parchment,
            lineHeight: 1.2,
            textAlign: 'center',
            opacity: hookOpacity,
            transform: `translateY(${hookY}px)`,
            maxWidth: 900,
          }}
        >
          {hook}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
