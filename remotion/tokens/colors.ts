/**
 * Channel palette - five roles, sourced from channel.config.json.
 *
 * The roles are fixed; the values are the channel's. Do not add a sixth role,
 * do not inline a hex anywhere in a beat, and do not use `payoff` outside
 * Beat6_Payoff.tsx - its scarcity is what gives the revelation its weight.
 */

import { channel } from '../../src/lib/channel';

export const colors = channel.palette;

export type ColorToken = keyof typeof colors;
