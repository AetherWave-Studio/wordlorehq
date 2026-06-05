/**
 * Root — registers the WordloreVideo composition.
 *
 * Default duration is computed from target beat durations (~80s at 30fps).
 * When rendering with an actual JSON input, props can override beat durations
 * via the `beatDurationsSec` prop and a script recalculates the total via
 * `calculateMetadata`.
 *
 * Default props are NIGHTMARE (the first published episode) so Remotion Studio
 * has something to preview on launch. The render script passes per-render props
 * via --props=<file.json>, overriding these defaults.
 */

import React from 'react';
import { Composition } from 'remotion';
import { WordloreVideo, computeTotalFrames, type WordloreInput } from './Composition';
import { WordloreTrailer, TRAILER_TOTAL_FRAMES } from './Trailer';

const defaultProps: WordloreInput = {
  word: 'NIGHTMARE',
  pronunciation: '/ˈnaɪt.mɛər/',
  partOfSpeech: 'noun',
  definition: 'a frightening or unpleasant dream',
  hook: 'Your nightmares have nothing to do with horses.',
  modernAnchor: "You wake up sweating at 3am. That's a nightmare.",
  origin: {
    language: 'Old English',
    era: 'before 1300',
    originalWord: 'mære',
    originalMeaning: 'a malicious supernatural being',
  },
  journey: [
    'The mære was a demon believed to creep into your bedroom at night, sit on your chest while you slept, and suffocate you with bad dreams.',
    'People across medieval Europe believed it was real.',
    "Sleep paralysis was called 'being ridden by the mare.'",
    "The 'mare' meaning horse is a completely separate word that just happens to sound the same.",
  ],
  payoff: {
    setupWord: 'NIGHTMARE',
    connector: 'is, literally,',
    revelation: 'DEMON ATTACK',
  },
  outro: {
    type: 'tease',
    nextWord: 'GOODBYE',
  },
  musicVariant: 'dark',
};

const defaultDuration = computeTotalFrames();

// Remotion 4 expects components typed against Record<string, unknown>.
// Cast through unknown for our strongly-typed Wordlore inputs.
const WordloreVideoComp = WordloreVideo as unknown as React.FC<Record<string, unknown>>;
const WordloreTrailerComp = WordloreTrailer as unknown as React.FC<Record<string, unknown>>;

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="WordloreVideo"
        component={WordloreVideoComp}
        durationInFrames={defaultDuration}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={defaultProps as unknown as Record<string, unknown>}
        calculateMetadata={({ props }) => {
          const beatDurationsSec = (props as unknown as WordloreInput).beatDurationsSec;
          return { durationInFrames: computeTotalFrames(beatDurationsSec) };
        }}
      />
      {/* Channel trailer — fixed 30s, separate from the 7-beat WordloreVideo
          flow. Hardcoded script; only audioAssets flags come in as props. */}
      <Composition
        id="WordloreTrailer"
        component={WordloreTrailerComp}
        durationInFrames={TRAILER_TOTAL_FRAMES}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ hasAudio: false } as Record<string, unknown>}
      />
    </>
  );
};
