/**
 * Beat 2 — Word Reveal
 *
 * The brand-recognition moment. The modern English word appears in big gold
 * serif via an ink-bloom animation, with pronunciation, part of speech, and
 * definition fading in just after. This frame defines the channel's identity
 * and is treated as the visual logo of the entire video.
 *
 * Audio: The 1-second sound logo plays at the start of this beat. That
 * mixing happens at the Composition level, not in this component.
 *
 * Locked rules (do not modify without explicit user approval):
 * - Background must be colors.midnight
 * - Hero word must be colors.gold
 * - Hero word size is governed by getHeroWordSize tier table
 * - Brand mark sits in identical position to other beats
 */

import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from 'remotion';

import { colors } from '../tokens/colors';
import { fonts, sizes, getHeroWordSize, FRAME } from '../tokens/typography';
import { animation } from '../tokens/timing';
import { BrandMark } from '../components/BrandMark';
import { BottomFlourish } from '../components/Flourish';

export interface Beat2Props {
  /** The modern English word in uppercase. */
  word: string;
  /** IPA pronunciation in slashes, e.g. /ˈnaɪt.mɛər/ */
  pronunciation: string;
  /** noun | verb | adjective | etc. */
  partOfSpeech: string;
  /** Short modern definition. */
  definition: string;
}

export const Beat2_WordReveal: React.FC<Beat2Props> = ({
  word,
  pronunciation,
  partOfSpeech,
  definition,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ---- Animations ----

  // Ink-bloom entrance for the hero word: 0 -> animation.inkBloomFrames
  const wordOpacity = interpolate(
    frame,
    [0, animation.inkBloomFrames],
    [0, 1],
    { extrapolateRight: 'clamp' }
  );

  const wordScale = spring({
    frame,
    fps,
    from: 0.92,
    to: 1,
    config: { damping: 200, stiffness: 100 },
  });

  // Supporting text fades in slightly after the word lands
  const supportingOpacity = interpolate(
    frame,
    [animation.supportingFadeStart, animation.supportingFadeEnd],
    [0, 0.85],
    { extrapolateRight: 'clamp' }
  );

  // Bottom flourish fades in with supporting text
  const flourishOpacity = interpolate(
    frame,
    [animation.supportingFadeStart, animation.supportingFadeEnd],
    [0, 0.7],
    { extrapolateRight: 'clamp' }
  );

  // ---- Layout calcs ----

  const wordFontSize = getHeroWordSize(word);

  return (
    <AbsoluteFill style={{ backgroundColor: colors.midnight }}>
      <BrandMark />

      {/* Main word + supporting stack — vertically centered, shifted up slightly */}
      <AbsoluteFill
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          padding: `0 ${FRAME.padding}px`,
          transform: 'translateY(-60px)',
        }}
      >
        {/* The hero word — gold serif, ink-bloom entrance */}
        <div
          style={{
            fontFamily: fonts.serif,
            fontWeight: 700,
            fontSize: wordFontSize,
            color: colors.gold,
            letterSpacing: 4,
            lineHeight: 1,
            textAlign: 'center',
            opacity: wordOpacity,
            transform: `scale(${wordScale})`,
          }}
        >
          {word}
        </div>

        {/* Pronunciation + part of speech — italic parchment */}
        <div
          style={{
            fontFamily: fonts.serifItalic,
            fontStyle: 'italic',
            fontSize: sizes.pronunciation,
            color: colors.parchment,
            opacity: supportingOpacity,
            letterSpacing: 2,
            marginTop: 64,
            textAlign: 'center',
          }}
        >
          {pronunciation}  ·  {partOfSpeech}
        </div>

        {/* Definition — clean sans, parchment */}
        <div
          style={{
            fontFamily: fonts.sans,
            fontSize: sizes.definition,
            color: colors.parchment,
            opacity: supportingOpacity,
            lineHeight: 1.5,
            maxWidth: 880,
            textAlign: 'center',
            marginTop: 88,
          }}
        >
          {definition}
        </div>
      </AbsoluteFill>

      <BottomFlourish opacity={flourishOpacity} />
    </AbsoluteFill>
  );
};
