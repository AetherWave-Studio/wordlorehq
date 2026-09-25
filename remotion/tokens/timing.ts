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
/**
 * The instant to hand a platform that picks its cover by TIMESTAMP instead of
 * accepting an image. TikTok is the only one: YouTube and Instagram take the
 * rendered thumbnail, Facebook and Threads accept nothing at all.
 *
 * This is the midpoint of Beat 2 - the word card - computed from THIS
 * episode's measured durations. It HAS to be per-episode, and that is not a
 * preference:
 *
 *   Beat 2 opens at beat1, which applyBeatBounds clamps to [2, 5].
 *   Beat 2 closes at beat1 + beat2, clamped to [5, 11].
 *
 * So the earliest an episode's card can close (5.0s) is exactly the latest
 * another's can open (5.0s). Two legal episodes' windows can share a single
 * instant, and at that instant both are mid-fade. There is therefore NO fixed
 * timestamp that is correct for every episode - not a lucky constant waiting
 * to be found.
 *
 * Learned the expensive way: a hardcoded 8000ms rode three weeks of episodes
 * whose cards happened to still be up at 8s, then missed on `cretin`, whose
 * card closed at 6.8s. TikTok served the next beat instead - body copy on a
 * bare background, no word, no definition.
 *
 * The midpoint rather than the start, so a slow fade-in on one side and the
 * beat change on the other both stay clear of the grabbed frame.
 */
export const coverTimestampMsFrom = (beatDurationsSec: number[]): number => {
  const beat1 = beatDurationsSec[0] ?? 0;
  const beat2 = beatDurationsSec[1] ?? 0;
  return Math.round((beat1 + beat2 / 2) * 1000);
};

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
