import { loadFont } from '@remotion/fonts';
import { staticFile } from 'remotion';

/**
 * Montserrat (SIL OFL, from @fontsource/montserrat) for the one line of copy.
 * Chosen to sit with the wordmark's heavy geometric capitals; it is not
 * presented as IN YOUR SHOE's brand typeface. The wordmark itself is never
 * typeset: it is the official image (assets/brand).
 */
export const LINE_FONT = '"Montserrat", sans-serif';
for (const weight of ['700', '800']) void loadFont({ family: 'Montserrat', url: staticFile(`fonts/montserrat-${weight}.woff2`), weight });
