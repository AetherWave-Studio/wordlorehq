/**
 * Beat 7 — Outro / Loop
 *
 * The closing card. Two variants:
 *   - "tease":  Brand mark + tagline → diamond → "tomorrow" → nextWord
 *               (in identical gold serif treatment to Beat 2 — the loop)
 *   - "cta":    Brand mark + tagline → diamond → comment prompt
 *
 * The tease variant is the channel's growth engine. The next-word reveal
 * uses the exact same type treatment as Beat 2 — every video closes by
 * literally starting the next one.
 */

import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
} from 'remotion';

import { colors } from '../tokens/colors';
import { fonts, sizes, getHeroWordSize, FRAME } from '../tokens/typography';
import { BrandMarkLarge } from '../components/BrandMark';
import { DiamondOrnament, BottomFlourish } from '../components/Flourish';

export interface Beat7Props {
  outro?: {
    type?: 'tease' | 'cta';
    nextWord?: string;
  };
}

export const Beat7_Outro: React.FC<Beat7Props> = ({ outro }) => {
  const frame = useCurrentFrame();
  const type = outro?.type ?? 'tease';
  const nextWord = outro?.nextWord ?? '';

  const brandOpacity = interpolate(frame, [0, 18], [0, 1], {
    extrapolateRight: 'clamp',
  });
  const ornamentOpacity = interpolate(frame, [14, 28], [0, 1], {
    extrapolateRight: 'clamp',
  });
  const teaseOpacity = interpolate(frame, [24, 42], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const nextWordSize = nextWord ? getHeroWordSize(nextWord) : 140;

  return (
    <AbsoluteFill style={{ backgroundColor: colors.background }}>
      {/* Brand mark + tagline */}
      <BrandMarkLarge opacity={brandOpacity * 0.9} />

      {/* Diamond ornament centered below brand block */}
      <div
        style={{
          position: 'absolute',
          top: 880,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          opacity: ornamentOpacity,
        }}
      >
        <DiamondOrnament color={colors.accent} />
      </div>

      {/* Next word tease OR comment CTA */}
      <div
        style={{
          position: 'absolute',
          top: 1080,
          left: 0,
          right: 0,
          textAlign: 'center',
          padding: `0 ${FRAME.padding}px`,
          opacity: teaseOpacity,
        }}
      >
        {type === 'tease' && nextWord ? (
          <>
            <div
              style={{
                fontFamily: fonts.displayItalic,
                fontStyle: 'italic',
                fontSize: sizes.outroTomorrow,
                color: colors.surface,
                opacity: 0.65,
                letterSpacing: 6,
                marginBottom: 56,
              }}
            >
              tomorrow
            </div>
            <div
              style={{
                fontFamily: fonts.display,
                fontWeight: 700,
                fontSize: nextWordSize,
                color: colors.accent,
                letterSpacing: 4,
                lineHeight: 1,
              }}
            >
              {nextWord}
            </div>
          </>
        ) : (
          <div
            style={{
              fontFamily: fonts.body,
              fontSize: 56,
              color: colors.surface,
              lineHeight: 1.4,
              maxWidth: 800,
              margin: '0 auto',
            }}
          >
            Drop a word in the comments.
            <div
              style={{
                fontFamily: fonts.displayItalic,
                fontStyle: 'italic',
                fontSize: 42,
                opacity: 0.6,
                marginTop: 24,
              }}
            >
              I'll dig it up.
            </div>
          </div>
        )}
      </div>

      <BottomFlourish opacity={teaseOpacity * 0.7} />
    </AbsoluteFill>
  );
};
