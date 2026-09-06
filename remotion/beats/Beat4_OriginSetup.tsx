/**
 * Beat 4 — Origin Setup
 *
 * The visual page-turn moment. Cream parchment card inset from the dark frame,
 * holding the origin word in italic serif (dark ink). Era/language label in
 * sage italic above; translation in dark sans below; gold diamond ornament
 * between word and translation. Bottom flourish shifts to sage on this beat.
 */

import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
} from 'remotion';

import { colors } from '../tokens/colors';
import { fonts, sizes, getOriginWordSize, FRAME } from '../tokens/typography';
import { BrandMark } from '../components/BrandMark';
import { BottomFlourish, DiamondOrnament } from '../components/Flourish';

export interface Beat4Props {
  origin: {
    language: string;
    era: string;
    originalWord: string;
    originalMeaning: string;
  };
}

export const Beat4_OriginSetup: React.FC<Beat4Props> = ({ origin }) => {
  const frame = useCurrentFrame();

  // Parchment card slides up from below + fades in
  const cardOpacity = interpolate(frame, [0, 18], [0, 1], {
    extrapolateRight: 'clamp',
  });
  const cardY = interpolate(frame, [0, 22], [40, 0], {
    extrapolateRight: 'clamp',
  });

  // Content inside the card stages in slightly later
  const contentOpacity = interpolate(frame, [10, 28], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // Section label appears just before the card
  const labelOpacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const originFontSize = getOriginWordSize(origin.originalWord);

  return (
    <AbsoluteFill style={{ backgroundColor: colors.background }}>
      <BrandMark />

      {/* "ORIGIN" section label below brand mark */}
      <div
        style={{
          position: 'absolute',
          top: 360,
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: labelOpacity,
        }}
      >
        <div
          style={{
            fontFamily: fonts.displayItalic,
            fontStyle: 'italic',
            fontSize: sizes.sectionLabel,
            color: colors.secondary,
            letterSpacing: 14,
          }}
        >
          ORIGIN
        </div>
      </div>

      {/* The parchment card */}
      <div
        style={{
          position: 'absolute',
          top: 520,
          left: FRAME.padding + 50,
          right: FRAME.padding + 50,
          bottom: 380,
          backgroundColor: colors.surface,
          borderRadius: 16,
          padding: '80px 60px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: cardOpacity,
          transform: `translateY(${cardY}px)`,
        }}
      >
        <div style={{ opacity: contentOpacity, textAlign: 'center', width: '100%' }}>
          {/* Era / language label */}
          <div
            style={{
              fontFamily: fonts.displayItalic,
              fontStyle: 'italic',
              fontSize: sizes.eraLabel,
              color: colors.secondary,
              letterSpacing: 8,
              marginBottom: 64,
            }}
          >
            {origin.language.toUpperCase()} · {origin.era.toUpperCase()}
          </div>

          {/* The origin word — italic serif, dark ink */}
          <div
            style={{
              fontFamily: fonts.displayItalic,
              fontStyle: 'italic',
              fontWeight: 400,
              fontSize: originFontSize,
              color: colors.background,
              letterSpacing: 2,
              lineHeight: 1,
              marginBottom: 56,
            }}
          >
            {origin.originalWord}
          </div>

          {/* Diamond ornament in gold */}
          <DiamondOrnament color={colors.accent} />

          {/* Translation in clean dark sans */}
          <div
            style={{
              fontFamily: fonts.body,
              fontSize: sizes.originTranslation,
              color: colors.background,
              opacity: 0.8,
              lineHeight: 1.4,
              marginTop: 56,
              maxWidth: 720,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            {origin.originalMeaning}
          </div>
        </div>
      </div>

      {/* Bottom flourish — sage instead of gold on this beat */}
      <BottomFlourish color={colors.secondary} opacity={contentOpacity * 0.7} />
    </AbsoluteFill>
  );
};
