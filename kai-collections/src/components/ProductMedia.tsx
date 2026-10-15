import { COLOURS, KIND_LABEL, type Product } from '../data/catalog';
import { materialFor, materialTexture } from '../gl/materials';
import { GarmentFlat, flatVariant } from './GarmentFlat';

const BACKDROP: Record<string, [string, string]> = {
  light: ['#EFE8DC', '#E3D9C9'],
  pale: ['#E2D8C8', '#D3C6B2'],
};

/** Studio backdrop with KAI's horizon line, and the flat standing on it. */
export function FlatStage({
  p,
  zoom = 1,
  focus = [0.5, 0.42],
  caption = true,
  className,
}: {
  p: Product;
  zoom?: number;
  focus?: [number, number];
  caption?: boolean;
  className?: string;
}) {
  const pale = ['white', 'ivory', 'cream', 'beige', 'sea'].includes(p.colour);
  const [top, floor] = BACKDROP[pale ? 'pale' : 'light'];
  return (
    <div className={`stage ${className ?? ''}`} style={{ ['--top' as string]: top, ['--floor' as string]: floor }}>
      <div
        className="stage__flat"
        style={zoom !== 1 ? { transform: `scale(${zoom})`, transformOrigin: `${focus[0] * 100}% ${focus[1] * 100}%` } : undefined}
      >
        <GarmentFlat kind={p.kind} colour={p.colour} title={p.name} variant={flatVariant(p.slug, p.department)} />
      </div>
      {caption && (
        <span className="stage__cap label-sm">
          Illustrative flat{p.print ? ` · print not shown` : ''}
        </span>
      )}
    </div>
  );
}

export function ProductMedia({ p, priority = false }: { p: Product; priority?: boolean }) {
  if (p.images.length) {
    const [a, b] = p.images;
    return (
      <div className="stage stage--photo">
        <img src={a.src} alt={a.alt || p.name} loading={priority ? 'eager' : 'lazy'} decoding="async" />
        {b && <img className="stage__alt" src={b.src} alt="" loading="lazy" decoding="async" aria-hidden="true" />}
      </div>
    );
  }
  return <FlatStage p={p} />;
}

export interface Slide {
  id: string;
  label: string;
  render: () => React.ReactNode;
}

export function gallerySlides(p: Product): Slide[] {
  const out: Slide[] = [];
  if (p.images.length) {
    p.images.forEach((im, i) =>
      out.push({
        id: `photo-${i}`,
        label: `Photograph ${i + 1}`,
        render: () => (
          <div className="stage stage--photo">
            <img src={im.src} alt={im.alt || `${p.name}, view ${i + 1}`} loading={i ? 'lazy' : 'eager'} />
          </div>
        ),
      }),
    );
  } else {
    out.push({ id: 'flat', label: 'Flat', render: () => <FlatStage p={p} /> });
    out.push({
      id: 'detail',
      label: 'Detail',
      render: () => <FlatStage p={p} zoom={2.3} focus={p.kind.includes('swim') || p.kind === 'pants' || p.kind === 'shorts' || p.kind === 'sweatpants' ? [0.5, 0.26] : [0.5, 0.3]} caption={false} />,
    });
  }
  if (p.material) {
    const key = materialFor(p.material, p.kind);
    out.push({
      id: 'material',
      label: 'Material',
      render: () => (
        <div className="stage stage--material" style={{ backgroundImage: `url(${materialTexture(key, COLOURS[p.colour].hex)})` }}>
          <span className="stage__cap stage__cap--light label-sm">Material study · {p.material} · rendered</span>
        </div>
      ),
    });
  }
  const c = COLOURS[p.colour];
  out.push({
    id: 'colour',
    label: 'Colour',
    render: () => (
      <div className="stage stage--swatch" style={{ background: c.hex, color: c.ink }}>
        <div className="swatch__body">
          <span className="label">{c.named ? 'Colour' : 'Print'}</span>
          <span className="display swatch__name">{p.print ?? c.label}</span>
          <span className="swatch__note">
            {p.print
              ? `KAI's ${p.print} print appears only in KAI's own photography. ${c.named ? `The flat uses the colour named in the title (${c.label.toLowerCase()}).` : 'Its colour is not named in the title, so the flat is undyed.'}`
              : `Colour taken from the product name. ${KIND_LABEL[p.kind]}.`}
          </span>
        </div>
      </div>
    ),
  });
  return out;
}
