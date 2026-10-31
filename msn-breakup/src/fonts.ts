import { loadFont } from '@remotion/fonts';
import { staticFile } from 'remotion';

/**
 * Fonts, all bundled in public/fonts with their licences:
 *  - XPTahoma: Wine's Tahoma (LGPL-2.1+), metric-compatible with the XP / MSN UI font.
 *  - Comic Neue (OFL): her chat font (2007's Comic Sans energy).
 *  - Arimo (OFL, Arial metrics): his plain default chat font.
 *  - Fira Sans (OFL): XP title bars (stands in for Trebuchet MS); its bold italic set an earlier opening's XP "welcome" screen.
 *  - Gelasio (OFL, Georgia metrics): the Georgia headings of 2007 Tumblr.
 *  - Archivo Black (OFL): stands in for Arial Black, her Tumblr theme's title face.
 *  - Inter (OFL): the present-day desktop at the start of the carousel (stands in for today's Windows UI face).
 * loadFont blocks rendering until each face is ready, so no frame renders in a fallback font.
 */
export const UI = '"XPTahoma", Tahoma, Verdana, sans-serif';
export const TITLE = '"Fira Sans", "Trebuchet MS", sans-serif';
export const HER_FONT = '"Comic Neue", "Comic Sans MS", cursive';
export const HIS_FONT = 'Arimo, Arial, sans-serif';
export const SERIF = 'Gelasio, Georgia, serif';
export const BLACK = '"Archivo Black", "Arial Black", sans-serif';
export const MODERN = 'Inter, "Segoe UI", sans-serif';

const faces: [string, string, string, ('normal' | 'italic')?][] = [
  ['XPTahoma', 'fonts/wine-tahoma.ttf', '400'],
  ['XPTahoma', 'fonts/wine-tahoma-bold.ttf', '700'],
  ['Comic Neue', 'fonts/comic-neue-400.woff2', '400'],
  ['Comic Neue', 'fonts/comic-neue-700.woff2', '700'],
  ['Arimo', 'fonts/arimo-400.woff2', '400'],
  ['Arimo', 'fonts/arimo-700.woff2', '700'],
  ['Fira Sans', 'fonts/fira-sans-600.woff2', '600'],
  ['Fira Sans', 'fonts/fira-sans-700.woff2', '700'],
  ['Fira Sans', 'fonts/fira-sans-700-italic.woff2', '700', 'italic'],
  ['Gelasio', 'fonts/gelasio-400.woff2', '400'],
  ['Gelasio', 'fonts/gelasio-400-italic.woff2', '400', 'italic'],
  ['Gelasio', 'fonts/gelasio-700.woff2', '700'],
  ['Archivo Black', 'fonts/archivo-black-400.woff2', '400'],
  ['Inter', 'fonts/inter-400.woff2', '400'],
  ['Inter', 'fonts/inter-600.woff2', '600'],
];
for (const [family, file, weight, style = 'normal'] of faces) void loadFont({ family, url: staticFile(file), weight, style });
