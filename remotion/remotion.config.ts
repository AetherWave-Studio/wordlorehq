/**
 * Remotion config — points the public directory at the local /assets folder
 * (sibling of this config file) so that `staticFile('audio/voiceover.mp3')` in
 * Composition.tsx resolves to `remotion/assets/audio/voiceover.mp3`.
 *
 * Note: relative path './assets' rather than `path.resolve(__dirname, ...)`
 * because Remotion loads this config in a context where __dirname does NOT
 * point to this file's location (it resolves into @remotion/cli). The relative
 * path resolves relative to the directory containing this remotion.config.ts.
 */

import { Config } from '@remotion/cli/config';

Config.setPublicDir('./assets');
