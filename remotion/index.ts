import { registerRoot } from 'remotion';
import { loadFont as loadPlayfairDisplay } from '@remotion/google-fonts/PlayfairDisplay';
import { loadFont as loadCormorantGaramond } from '@remotion/google-fonts/CormorantGaramond';
import { loadFont as loadInter } from '@remotion/google-fonts/Inter';
import { loadFont as loadLora } from '@remotion/google-fonts/Lora';
import { loadFont as loadEBGaramond } from '@remotion/google-fonts/EBGaramond';
import { loadFont as loadLibreBaskerville } from '@remotion/google-fonts/LibreBaskerville';
import { loadFont as loadMerriweather } from '@remotion/google-fonts/Merriweather';
import { loadFont as loadSourceSerif4 } from '@remotion/google-fonts/SourceSerif4';
import { loadFont as loadMontserrat } from '@remotion/google-fonts/Montserrat';
import { loadFont as loadOswald } from '@remotion/google-fonts/Oswald';
import { loadFont as loadBebasNeue } from '@remotion/google-fonts/BebasNeue';
import { loadFont as loadRoboto } from '@remotion/google-fonts/Roboto';
import { channel } from '../src/lib/channel';
import { Root } from './Root';

/**
 * Typefaces this repo can render with.
 *
 * A channel names three families in channel.config.json and they are loaded
 * here by name. To use a family that is not listed, add one import and one
 * entry - every Google font ships with @remotion/google-fonts, so nothing
 * needs installing.
 *
 * Loading must happen at module scope, before any composition renders. An
 * unknown family throws rather than silently falling back to Times.
 */
const FONT_LOADERS: Record<string, () => unknown> = {
  'Playfair Display': loadPlayfairDisplay,
  'Cormorant Garamond': loadCormorantGaramond,
  'EB Garamond': loadEBGaramond,
  'Libre Baskerville': loadLibreBaskerville,
  Lora: loadLora,
  Merriweather: loadMerriweather,
  'Source Serif 4': loadSourceSerif4,
  Inter: loadInter,
  Montserrat: loadMontserrat,
  Oswald: loadOswald,
  'Bebas Neue': loadBebasNeue,
  Roboto: loadRoboto,
};

for (const family of new Set(Object.values(channel.fonts))) {
  const load = FONT_LOADERS[family];
  if (!load) {
    throw new Error(
      `channel.config.json asks for the typeface "${family}", which remotion/index.ts ` +
        `does not load. Add it to FONT_LOADERS (one import, one entry). Available: ` +
        `${Object.keys(FONT_LOADERS).join(', ')}.`,
    );
  }
  load();
}

registerRoot(Root);
