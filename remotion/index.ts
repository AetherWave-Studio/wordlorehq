import { registerRoot } from 'remotion';
import { loadFont as loadPlayfair } from '@remotion/google-fonts/PlayfairDisplay';
import { loadFont as loadCormorant } from '@remotion/google-fonts/CormorantGaramond';
import { loadFont as loadInter } from '@remotion/google-fonts/Inter';
import { Root } from './Root';

// Load the three locked Wordlore typefaces. Required for production rendering.
loadPlayfair();
loadCormorant();
loadInter();

registerRoot(Root);
