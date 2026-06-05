/**
 * Wordlore Typography — LOCKED
 *
 * Three typefaces, each with a specific role. Auto-fit tier tables determine
 * font sizes for words of varying length so the layout stays consistent.
 *
 * All sizes are calibrated for 1080×1920 output.
 */

export const fonts = {
  /** Display serif for hero words (Beat 2). Use bold weight. */
  serif: '"Playfair Display", Georgia, serif',

  /** Italic serif for origin words (Beat 4), brand mark, connective text. */
  serifItalic: '"Cormorant Garamond", Georgia, serif',

  /** Clean sans for definitions, captions, modern body text. */
  sans: '"Inter", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
} as const;

/**
 * Auto-fit tier table for the Beat 2 hero word.
 * Returns font size in pixels at 1080×1920 resolution.
 */
export const getHeroWordSize = (word: string): number => {
  const len = word.length;
  if (len <= 4)  return 220; // OK, FATE, ZERO
  if (len <= 6)  return 170; // SALARY, ROBOT
  if (len <= 9)  return 140; // NIGHTMARE, MORTGAGE
  if (len <= 12) return 115; // QUARANTINE
  return 95;  // longer than 12 chars
};

/**
 * Auto-fit tier table for the Beat 4 origin word.
 * Italic measures ~5% narrower than upright, so origin words can run slightly
 * larger at the same character count.
 */
export const getOriginWordSize = (word: string): number => {
  const len = word.length;
  if (len <= 4)  return 200; // mære, clew
  if (len <= 7)  return 160; // robota, salarium
  if (len <= 10) return 130; // candidus
  return 110;
};

/**
 * Fixed type sizes for non-hero elements.
 * At 1080×1920 these are the locked values.
 */
export const sizes = {
  brandMark: 38,           // Beats 1-6 small top mark
  brandMarkOutro: 60,      // Beat 7 enlarged brand mark
  tagline: 48,             // "Every word has a story." (Beat 7)
  sectionLabel: 48,        // "ORIGIN" label (Beat 4)
  pronunciation: 52,       // Beat 2
  definition: 52,          // Beat 2
  modernAnchorBody: 48,    // Beat 3
  eraLabel: 48,            // Beat 4 era/language label
  originTranslation: 48,   // Beat 4 translation
  connectorText: 52,       // Beat 6 "is, literally," / "your"
  payoffSetup: 120,        // Beat 6 the gold word (smaller than Beat 2)
  payoffRevelation: 156,   // Beat 6 the oxblood revelation
  outroTomorrow: 52,       // Beat 7 "tomorrow" lowercase
} as const;

/**
 * Safe area: hero word must never exceed this fraction of frame width.
 * Used to validate that auto-fit tier output won't overflow.
 */
export const SAFE_AREA_RATIO = 0.88;

/**
 * Frame dimensions (1080×1920 vertical). Reference for layout calcs.
 */
export const FRAME = {
  width: 1080,
  height: 1920,
  padding: 52, // ~12px scaled up for 1080
} as const;
