/**
 * Wordlore Brand Colors — LOCKED
 *
 * These five colors are the brand. Do not add new colors, do not shift these
 * values, and do not mix oxblood outside of Beat6_Payoff.tsx.
 */

export const colors = {
  /** Background of every beat. */
  midnight: '#0F1A2E',

  /** Cream text on dark backgrounds; card fill in Beat 4 (color inversion). */
  parchment: '#F4E8D0',

  /** Hero word, brand mark, flourishes. The "modern" accent. */
  gold: '#C9A961',

  /**
   * Beat 6 ONLY. The payoff revelation color.
   * Importing this in any other beat breaks the brand.
   */
  oxblood: '#8B2635',

  /** Beat 4 origin labels and section decorations. The "ancient" accent. */
  sage: '#7A8B6F',
} as const;

export type ColorToken = keyof typeof colors;
