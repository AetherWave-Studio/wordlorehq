/**
 * Wordlore Timing — durations and frame math.
 *
 * Beat durations are dynamic: they're set from the actual TTS audio length
 * per render, within the soft min/max bounds defined here. The composition's
 * total duration is the sum of all beat durations after audio is generated.
 */

export const FPS = 30;

/** Convert seconds to frames at the locked 30fps rate. */
export const sec = (s: number): number => Math.round(s * FPS);

/**
 * Per-beat soft duration bounds in seconds.
 * The actual visual duration of each beat is set from its narration audio
 * length, clamped to these bounds.
 */
export const beatBounds = {
  beat1Hook:          { min: 2,  target: 3,  max: 5  },
  beat2WordReveal:    { min: 3,  target: 5,  max: 6  },
  beat3ModernAnchor:  { min: 5,  target: 7,  max: 9  },
  beat4OriginSetup:   { min: 10, target: 15, max: 18 },
  beat5Journey:       { min: 15, target: 25, max: 30 },
  beat6Payoff:        { min: 10, target: 15, max: 18 },
  beat7Outro:         { min: 6,  target: 10, max: 12 },
} as const;

/**
 * Compute the total duration in frames based on per-beat seconds.
 * Used by Composition.tsx after audio durations are measured.
 */
export const totalFramesFromSeconds = (perBeatSeconds: number[]): number => {
  return perBeatSeconds.reduce((acc, s) => acc + sec(s), 0);
};

/**
 * Animation timing primitives (in frames).
 * These are fixed regardless of beat duration.
 */
export const animation = {
  /** Ink-bloom entrance for word reveals. */
  inkBloomFrames: 15, // 0.5s

  /** Fade-in for supporting text after the hero. */
  supportingFadeStart: 18,
  supportingFadeEnd: 30,

  /** Page-turn transition between beats 3 and 4. */
  pageTurnFrames: 18, // 0.6s

  /** Beat 6 oxblood reveal — held slightly before chime. */
  payoffRevealDelay: 24, // 0.8s

  /** Outro brand mark settle. */
  outroSettle: 20,
} as const;
