/**
 * CATCHY — original IYS mascot sticker, drawn from the attached reference:
 * teal cat head, darker teal inner ears, yellow eye-mask patches with black
 * pupils, white muzzle + cheeks, pink nose, open smile with a pink tongue,
 * thick black outline and a white sticker border. One SVG source feeds both
 * the DOM (<CatchySticker>) and every canvas game (catchyImage()).
 */
export const CATCHY = { teal: '#4aab9a', tealDark: '#2f7f73', yellow: '#f4c430', pink: '#ff8fb1', tongue: '#ff6f91', ink: '#111' } as const;

const HEAD = 'M22 44 L17 8 L47 27 Q60 23 73 27 L103 8 L98 44 Q108 62 99 81 Q86 101 60 101 Q34 101 21 81 Q12 62 22 44 Z';

export const CATCHY_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 112">
<path d="${HEAD}" fill="#fff" stroke="#fff" stroke-width="14" stroke-linejoin="round"/>
<path d="${HEAD}" fill="${CATCHY.teal}" stroke="${CATCHY.ink}" stroke-width="4" stroke-linejoin="round"/>
<path d="M26 36 L24 17 L41 29 Z M94 36 L96 17 L79 29 Z" fill="${CATCHY.tealDark}" stroke="${CATCHY.ink}" stroke-width="2.5" stroke-linejoin="round"/>
<ellipse cx="41" cy="52" rx="16" ry="12.5" transform="rotate(-12 41 52)" fill="${CATCHY.yellow}" stroke="${CATCHY.ink}" stroke-width="3"/>
<ellipse cx="79" cy="52" rx="16" ry="12.5" transform="rotate(12 79 52)" fill="${CATCHY.yellow}" stroke="${CATCHY.ink}" stroke-width="3"/>
<ellipse cx="43" cy="53" rx="5.5" ry="6.5" fill="${CATCHY.ink}"/><ellipse cx="77" cy="53" rx="5.5" ry="6.5" fill="${CATCHY.ink}"/>
<circle cx="45" cy="50.5" r="1.8" fill="#fff"/><circle cx="79" cy="50.5" r="1.8" fill="#fff"/>
<path d="M60 64 C52 64 38 66 37 77 C36 88 48 92 60 90 C72 92 84 88 83 77 C82 66 68 64 60 64 Z" fill="#fff" stroke="${CATCHY.ink}" stroke-width="3" stroke-linejoin="round"/>
<path d="M54 67 Q60 64 66 67 Q63 72 60 73 Q57 72 54 67 Z" fill="${CATCHY.pink}" stroke="${CATCHY.ink}" stroke-width="2" stroke-linejoin="round"/>
<path d="M47 77 Q60 82 73 77 Q71 92 60 93 Q49 92 47 77 Z" fill="#5a1020" stroke="${CATCHY.ink}" stroke-width="2.5" stroke-linejoin="round"/>
<ellipse cx="60" cy="88" rx="7" ry="4.5" fill="${CATCHY.tongue}"/>
</svg>`;

export const CATCHY_URI = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(CATCHY_SVG)}`;
/** Head width / height ratio of the sticker. */
export const CATCHY_RATIO = 120 / 112;

export function CatchySticker({ size = 48, alt = '', className }: { size?: number; alt?: string; className?: string }) {
  return <img src={CATCHY_URI} alt={alt} width={size} height={Math.round(size / CATCHY_RATIO)} className={className} draggable={false} />;
}

let img: HTMLImageElement | null = null;
/** Shared decoded Catchy image for canvas games (drawn once loaded; a teal head stands in for the first frame). */
export function catchyImage(): HTMLImageElement | null {
  if (typeof Image === 'undefined') return null;
  if (!img) {
    img = new Image();
    img.src = CATCHY_URI;
  }
  return img;
}

/** Draw Catchy centred at (x, y), `w` game units wide. */
export function drawCatchy(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, rot = 0) {
  const h = w / CATCHY_RATIO;
  const im = catchyImage();
  ctx.save();
  ctx.translate(x, y);
  if (rot) ctx.rotate(rot);
  if (im?.complete && im.naturalWidth) ctx.drawImage(im, -w / 2, -h / 2, w, h);
  else {
    ctx.fillStyle = CATCHY.teal;
    ctx.strokeStyle = CATCHY.ink;
    ctx.lineWidth = Math.max(1, w / 20);
    ctx.beginPath();
    ctx.arc(0, 0, w * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}
