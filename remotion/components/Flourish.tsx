/**
 * Flourish components — small reusable decorative elements.
 *
 * - `BottomFlourish` is the line-dot-line at the bottom of every beat.
 * - `DiamondOrnament` is the line-diamond-line used between sections
 *   (Beat 4 inside the parchment card, Beat 7 between brand mark and tease).
 *
 * The color shifts per beat: gold by default, sage on Beat 4's bottom flourish.
 */

import React from 'react';
import { colors } from '../tokens/colors';

interface FlourishProps {
  /** Color override. Defaults to gold. Beat 4 uses sage. */
  color?: string;
  opacity?: number;
}

export const BottomFlourish: React.FC<FlourishProps> = ({
  color = colors.gold,
  opacity = 0.7,
}) => {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 200,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 32,
        opacity,
      }}
    >
      <div style={{ width: 116, height: 2, backgroundColor: color }} />
      <div
        style={{
          width: 12,
          height: 12,
          backgroundColor: color,
          borderRadius: '50%',
        }}
      />
      <div style={{ width: 116, height: 2, backgroundColor: color }} />
    </div>
  );
};

export const DiamondOrnament: React.FC<FlourishProps> = ({
  color = colors.gold,
  opacity = 1,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 28,
        opacity,
      }}
    >
      <div style={{ width: 90, height: 2, backgroundColor: color }} />
      <div
        style={{
          width: 22,
          height: 22,
          backgroundColor: color,
          transform: 'rotate(45deg)',
        }}
      />
      <div style={{ width: 90, height: 2, backgroundColor: color }} />
    </div>
  );
};
