import { colourOf, type Product } from '../data/catalog';
import { GarmentFlat, flatVariant } from './GarmentFlat';
import { fitStage } from '../data/media';
import { Photo } from './Photo';

/** Concept sketch on a studio backdrop — an optional view, always labelled as not KAI photography. */
export function SketchStage({ p, caption = true, className }: { p: Product; caption?: boolean; className?: string }) {
  const hex = colourOf(p).hex;
  const n = parseInt(hex.slice(1), 16);
  const pale = (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255 > 0.62;
  return (
    <div className={`stage stage--sketch ${pale ? 'is-pale' : ''} ${className ?? ''}`} data-testid="sketch">
      <div className="stage__flat">
        <GarmentFlat kind={p.kind} hex={hex} title={p.name} variant={flatVariant(p.slug, p.department)} />
      </div>
      {caption && <span className="stage__cap label-sm">Concept sketch · not KAI photography{p.colour ? '' : ' · print not drawn'}</span>}
    </div>
  );
}

/** Card media: KAI's lead photograph, with its second photograph revealed on hover. */
export function ProductMedia({
  p,
  priority = false,
  sizes = '(max-width: 760px) 50vw, (max-width: 1100px) 33vw, 25vw',
  hover = true,
}: {
  p: Product;
  priority?: boolean;
  sizes?: string;
  hover?: boolean;
}) {
  const [a, b] = p.images;
  if (!a) return <SketchStage p={p} />;
  const fit = fitStage(a);
  return (
    <div className={`stage stage--photo ${fit.className}`} style={fit.style}>
      <Photo src={a.src} w={a.w} h={a.h} alt={a.alt} sizes={sizes} priority={priority} max={1280} fallback={<SketchStage p={p} />} />
      {hover && b && <Photo className="stage__alt" src={b.src} w={b.w} h={b.h} alt="" decorative sizes={sizes} max={1280} />}
    </div>
  );
}

/** Small square-ish thumbnail (bag, search, saved). */
export function ProductThumb({ p }: { p: Product }) {
  const a = p.images[0];
  if (!a) return <SketchStage p={p} caption={false} />;
  return (
    <div className="stage stage--photo">
      <Photo src={a.src} w={a.w} h={a.h} alt="" decorative sizes="96px" max={360} fallback={<SketchStage p={p} caption={false} />} />
    </div>
  );
}
