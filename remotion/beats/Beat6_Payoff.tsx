/**
 * Beat 6 — The Payoff
 *
 * The revelation moment. The brand's only oxblood beat. The setupWord
 * (familiar, gold, smaller) sits above the revelation (oxblood, larger),
 * separated by connective italic text. Size hierarchy is the drama:
 * what you came in knowing shrinks, what you didn't grows.
 *
 * If the revelation has a space (e.g. "DEMON ATTACK"), it stacks on two lines.
 * Single-word revelations stay on one line at the standard payoff size.
 */

import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
} from 'remotion';

import { colors } from '../tokens/colors';
import { fonts, sizes, FRAME } from '../tokens/typography';
import { animation } from '../tokens/timing';
import { BrandMark } from '../components/BrandMark';
import { BottomFlourish } from '../components/Flourish';

export interface Beat6Props {
  payoff: {
    setupWord: string;
    connector: string;
    revelation: string;
  };
}

const splitRevelation = (revelation: string): string[] => {
  if (revelation.length <= 8 || !revelation.includes(' ')) {
    return [revelation];
  }
  const spaceIdx = revelation.indexOf(' ');
  return [revelation.slice(0, spaceIdx), revelation.slice(spaceIdx + 1)];
};

export const Beat6_Payoff: React.FC<Beat6Props> = ({ payoff }) => {
  const frame = useCurrentFrame();

  // Setup word fades in first
  const setupOpacity = interpolate(frame, [0, 14], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // Connector fades in after setup
  const connectorOpacity = interpolate(frame, [12, 22], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // Revelation arrives last, with slight scale-in for impact
  const revealStart = animation.payoffRevealDelay;
  const revelationOpacity = interpolate(
    frame,
    [revealStart, revealStart + 12],
    [0, 1],
    { extrapolateRight: 'clamp' }
  );
  const revelationScale = interpolate(
    frame,
    [revealStart, revealStart + 18],
    [0.94, 1],
    { extrapolateRight: 'clamp' }
  );

  const revelationLines = splitRevelation(payoff.revelation);

  return (
    <AbsoluteFill style={{ backgroundColor: colors.midnight }}>
      <BrandMark />

      <AbsoluteFill
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          padding: `0 ${FRAME.padding}px`,
        }}
      >
        {/* "your" small connector */}
        <div
          style={{
            fontFamily: fonts.sans,
            fontSize: sizes.connectorText,
            color: colors.parchment,
            opacity: setupOpacity * 0.65,
            letterSpacing: 4,
            marginBottom: 24,
          }}
        >
          your
        </div>

        {/* Setup word — gold, smaller than Beat 2 (deliberate size demotion) */}
        <div
          style={{
            fontFamily: fonts.serif,
            fontWeight: 700,
            fontSize: sizes.payoffSetup,
            color: colors.gold,
            letterSpacing: 4,
            lineHeight: 1,
            opacity: setupOpacity,
            textAlign: 'center',
          }}
        >
          {payoff.setupWord}
        </div>

        {/* Italic connector */}
        <div
          style={{
            fontFamily: fonts.serifItalic,
            fontStyle: 'italic',
            fontSize: sizes.connectorText,
            color: colors.parchment,
            opacity: connectorOpacity * 0.65,
            letterSpacing: 2,
            margin: '48px 0 40px',
          }}
        >
          {payoff.connector}
        </div>

        {/* Revelation in oxblood — larger than the setup, stacked if multi-word */}
        <div
          style={{
            textAlign: 'center',
            opacity: revelationOpacity,
            transform: `scale(${revelationScale})`,
          }}
        >
          {revelationLines.map((line, i) => (
            <div
              key={i}
              style={{
                fontFamily: fonts.serif,
                fontWeight: 700,
                fontSize: sizes.payoffRevelation,
                color: colors.oxblood,
                letterSpacing: 6,
                lineHeight: 1.05,
                marginTop: i === 0 ? 0 : 8,
              }}
            >
              {line}
            </div>
          ))}
        </div>
      </AbsoluteFill>

      <BottomFlourish opacity={revelationOpacity * 0.7} />
    </AbsoluteFill>
  );
};
