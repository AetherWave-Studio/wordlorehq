/**
 * BrandMark — the small italic small-caps wordmark with an accent underline
 * that appears at the top of every beat (Beats 1-6). The word itself and the
 * tagline come from channel.config.json.
 *
 * Beat 7 (Outro) uses an enlarged variant — see `BrandMarkLarge` below.
 */

import React from 'react';
import { channel } from '../../src/lib/channel';
import { colors } from '../tokens/colors';
import { fonts, sizes } from '../tokens/typography';

interface BrandMarkProps {
  /** Opacity from 0-1. Lets beats fade the mark in if needed. Default 0.55. */
  opacity?: number;
}

export const BrandMark: React.FC<BrandMarkProps> = ({ opacity = 0.55 }) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: 140,
        left: 0,
        right: 0,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontFamily: fonts.displayItalic,
          fontStyle: 'italic',
          fontSize: sizes.brandMark,
          color: colors.surface,
          opacity,
          letterSpacing: 22,
        }}
      >
        {channel.wordmark}
      </div>
      <div
        style={{
          height: 2,
          width: 132,
          backgroundColor: colors.accent,
          margin: '36px auto 0',
        }}
      />
    </div>
  );
};

/**
 * The Beat 7 enlarged variant. Includes the tagline below the underline.
 */
export const BrandMarkLarge: React.FC<{ opacity?: number }> = ({ opacity = 0.9 }) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: 240,
        left: 0,
        right: 0,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontFamily: fonts.displayItalic,
          fontStyle: 'italic',
          fontSize: sizes.brandMarkOutro,
          color: colors.surface,
          opacity,
          letterSpacing: 32,
        }}
      >
        {channel.wordmark}
      </div>
      <div
        style={{
          height: 2,
          width: 200,
          backgroundColor: colors.accent,
          margin: '48px auto',
        }}
      />
      <div
        style={{
          fontFamily: fonts.displayItalic,
          fontStyle: 'italic',
          fontSize: sizes.tagline,
          color: colors.surface,
          opacity: 0.6,
          letterSpacing: 4,
        }}
      >
        {channel.tagline}
      </div>
    </div>
  );
};
