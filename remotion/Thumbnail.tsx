/**
 * Episode thumbnail — the still every platform shows before playback.
 *
 * This is Beat 2 held at rest. Beat 2 is the brand-recognition moment (its own
 * note: "This frame defines the channel's identity") - the word in gold with
 * its definition underneath, which is the frame that used to get picked by hand
 * when episodes were uploaded one at a time.
 *
 * It is a composition rather than a frame grab from the video, for two reasons.
 * The video's first frame is deliberately blank - Beat 1's hook fades in over
 * 12 frames - so an automatic first-frame thumbnail is the background and
 * nothing else, which is what shipped this week. And beat durations vary per
 * episode with narration length, so "the frame where the word is up" is not at
 * a fixed timestamp; grabbing one would drift episode to episode.
 *
 * Rendered at a frame past every entrance animation, so nothing is mid-fade:
 * the ink bloom finishes at animation.inkBloomFrames and the supporting text at
 * animation.supportingFadeEnd. THUMBNAIL_FRAME sits after both.
 */

import React from 'react';
import { AbsoluteFill } from 'remotion';

import { Beat2_WordReveal, type Beat2Props } from './beats/Beat2_WordReveal';
import { animation } from './tokens/timing';
import { colors } from './tokens/colors';

/** Far enough in that every Beat 2 entrance has settled. */
export const THUMBNAIL_FRAME = animation.supportingFadeEnd + 15;

export const WordloreThumbnail: React.FC<Beat2Props> = (props) => (
  <AbsoluteFill style={{ backgroundColor: colors.background }}>
    <Beat2_WordReveal {...props} />
  </AbsoluteFill>
);
