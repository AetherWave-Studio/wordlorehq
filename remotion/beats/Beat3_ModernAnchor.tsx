/**
 * Beat 3 — Modern Anchor
 *
 * Grounds the viewer in modern usage before the etymology journey starts.
 * Same dark/gold language as Beat 2 but with smaller, sans-styled text.
 * One sentence centered on screen, brand mark consistent at top.
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

export interface Beat3Props {
  /** The modernAnchor field — one relatable modern usage sentence. */
  modernAnchor: string;
}

export const Beat3_ModernAnchor: React.FC<Beat3Props> = ({ modernAnchor }) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [0, 14], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const yShift = interpolate(frame, [0, 22], [16, 0], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ backgroundColor: colors.background }}>
      <BrandMark />

      <AbsoluteFill
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: `0 ${FRAME.padding + 60}px`,
        }}
      >
        {/* Small leading mark to signal "this is current usage" */}
        <div
          style={{
            fontFamily: fonts.displayItalic,
            fontStyle: 'italic',
            fontSize: 36,
            color: colors.accent,
            letterSpacing: 8,
            opacity: opacity * 0.7,
            marginBottom: 48,
          }}
        >
          TODAY
        </div>

        <div
          style={{
            fontFamily: fonts.body,
            fontSize: 60,
            color: colors.surface,
            lineHeight: 1.35,
            textAlign: 'center',
            opacity,
            transform: `translateY(${yShift}px)`,
            maxWidth: 860,
            fontWeight: 400,
          }}
        >
          {modernAnchor}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
