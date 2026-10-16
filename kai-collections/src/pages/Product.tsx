import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import { ProductCard, SaveButton } from '../components/ProductCard';
import { SketchStage } from '../components/ProductMedia';
import { Photo } from '../components/Photo';
import { SizePicker } from '../components/SizePicker';
import { Icon, Price, StockNote } from '../components/ui';
import {
  BY_SLUG,
  DEPARTMENT_LABEL,
  colourOf,
  getProduct,
  needsSize,
  officialUrl,
  relatedTo,
  SETS,
  SNAPSHOT,
  typeLine,
  type Product,
} from '../data/catalog';
import { KAI_CARE } from '../data/brand';
import { fitStage, imgUrl } from '../data/media';
import { shop, ui } from '../state/store';
import { NotFound } from './NotFound';

/** KAI's photographs, in KAI's order. Tap/click to inspect at full resolution; "Sketch" swaps in the labelled concept drawing. */
function Gallery({ p }: { p: Product }) {
  const photos = p.images;
  const [i, setI] = useState(0);
  const [sketch, setSketch] = useState(!photos.length);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const track = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setI(0);
    setSketch(!p.images.length);
    setZoom(null);
    track.current?.scrollTo({ left: 0 });
  }, [p.slug, p.images.length]);
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const on = () => {
      const k = Math.round(el.scrollLeft / el.clientWidth);
      setI((cur) => (cur !== k ? k : cur));
    };
    el.addEventListener('scroll', on, { passive: true });
    return () => el.removeEventListener('scroll', on);
  }, [sketch]);
  const n = Math.max(1, photos.length);
  const go = (k: number) => {
    const m = (k + n) % n;
    setI(m);
    setZoom(null);
    const el = track.current;
    if (el && el.scrollWidth > el.clientWidth + 4) el.scrollTo({ left: m * el.clientWidth, behavior: 'smooth' });
  };
  const at = (e: React.PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)), y: Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)) };
  };
  const cur = photos[i];
  return (
    <div className="gallery" data-testid="gallery" aria-roledescription="carousel" aria-label={`${p.name} photographs`}>
      {photos.length > 1 && !sketch && (
        <div className="gallery__thumbs" role="tablist" aria-label="Choose photograph">
          {photos.map((im, k) => (
            <button
              key={im.src}
              role="tab"
              aria-selected={k === i}
              aria-label={`Photograph ${k + 1} of ${photos.length}`}
              className={`gallery__thumb ${k === i ? 'is-on' : ''}`}
              onClick={() => go(k)}
              data-testid="gallery-thumb"
            >
              <span className={`stage stage--photo ${fitStage(im).className}`} style={fitStage(im).style}>
                <Photo src={im.src} w={im.w} h={im.h} alt="" decorative sizes="88px" max={360} />
              </span>
            </button>
          ))}
        </div>
      )}
      <div className="gallery__main">
        {sketch ? (
          <div className="gallery__sketch" data-testid="gallery-sketch">
            <SketchStage p={p} />
          </div>
        ) : (
          <div className="gallery__track" ref={track} data-active={i}>
            {photos.map((im, k) => (
              <div key={im.src} className={`gallery__slide ${k === i ? 'is-on' : ''}`} aria-hidden={k !== i} data-testid="gallery-slide" data-slide={`photo-${k}`}>
                <div
                  className={`stage stage--photo stage--zoomable ${fitStage(im).className} ${zoom && k === i ? 'is-zoomed' : ''}`}
                  style={fitStage(im).style}
                  onClick={(e) => (zoom ? setZoom(null) : setZoom(at(e as unknown as React.PointerEvent<HTMLElement>)))}
                  onPointerMove={(e) => zoom && e.pointerType === 'mouse' && setZoom(at(e))}
                  onPointerLeave={(e) => e.pointerType === 'mouse' && setZoom(null)}
                  role="button"
                  tabIndex={k === i ? 0 : -1}
                  aria-label={zoom ? 'Close close-up' : `Inspect photograph ${k + 1} close up`}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setZoom(zoom ? null : { x: 0.5, y: 0.4 }))}
                >
                  <Photo src={im.src} w={im.w} h={im.h} alt={im.alt} sizes="(max-width: 900px) 100vw, 55vw" priority={k === 0} max={1800} fallback={<SketchStage p={p} />} />
                  {zoom && k === i && (
                    <span
                      className="gallery__zoom"
                      data-testid="gallery-zoom"
                      style={{
                        backgroundImage: `url(${imgUrl(im.src, Math.min(2400, im.w ?? 2400))})`,
                        backgroundPosition: `${zoom.x * 100}% ${zoom.y * 100}%`,
                      }}
                      aria-hidden="true"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="gallery__nav">
          {!sketch && photos.length > 1 ? (
            <>
              <button className="icon-btn" aria-label="Previous photograph" onClick={() => go(i - 1)} data-testid="gallery-prev">
                ‹
              </button>
              <span className="label-sm num" aria-live="polite">
                {i + 1} / {photos.length}
              </span>
              <button className="icon-btn" aria-label="Next photograph" onClick={() => go(i + 1)} data-testid="gallery-next">
                ›
              </button>
            </>
          ) : (
            <span className="label-sm muted">{sketch ? 'Concept sketch' : 'KAI photograph'}</span>
          )}
          {photos.length > 0 && (
            <button className="chip chip--sm gallery__mode" aria-pressed={sketch} onClick={() => (setSketch(!sketch), setZoom(null))} data-testid="sketch-toggle">
              {sketch ? 'Photographs' : 'Sketch'}
            </button>
          )}
        </div>
        {cur && !sketch && <p className="gallery__credit label-sm muted">Photograph: KAI Collections · shown from kaicollections.com</p>}
      </div>
    </div>
  );
}

function Acc({ title, children, open = false, id }: { title: string; children: React.ReactNode; open?: boolean; id: string }) {
  return (
    <details className="acc" open={open} data-testid={`acc-${id}`}>
      <summary>
        <span className="label">{title}</span>
        <Icon.plus />
      </summary>
      <div className="acc__body">{children}</div>
    </details>
  );
}

export function ProductPage() {
  const { slug } = useParams();
  const p = getProduct(slug);
  const [size, setSize] = useState<string | null>(null);
  const [err, setErr] = useState(false);
  const [added, setAdded] = useState(false);
  useEffect(() => {
    setSize(null);
    setErr(false);
    setAdded(false);
    if (p) document.title = `${p.name} — KAI concept`;
  }, [p]);
  if (!p) return <NotFound />;
  const c = colourOf(p);
  const related = relatedTo(p, 4);
  const sets = SETS.filter((s) => s.items.includes(p.slug)).slice(0, 2);
  const sold = p.stock === 'sold-out';
  const add = () => {
    if (sold) return;
    if (needsSize(p) && !size) {
      setErr(true);
      document.querySelector('.pdp .sizes')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }
    shop.add(p.slug, needsSize(p) ? size : null);
    setAdded(true);
    ui.open('bag');
  };
  const cta = sold ? 'Sold out' : added ? 'Added — view bag' : needsSize(p) && !size ? 'Select a size' : 'Add to bag';
  return (
    <article className="pdp" data-testid="pdp" data-slug={p.slug}>
      <nav className="crumbs wrap label-sm" aria-label="Breadcrumb">
        <Link to="/shop">Shop</Link>
        <span aria-hidden="true">/</span>
        <Link to={`/shop/${p.department}`}>{DEPARTMENT_LABEL[p.department]}</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page" className="muted">
          {p.name}
        </span>
      </nav>
      <div className="pdp__grid wrap">
        <Gallery p={p} />
        <div className="pdp__info">
          <div className="pdp__sticky">
            <div className="label-sm muted">
              {DEPARTMENT_LABEL[p.department]} · {typeLine(p)}
              {p.isNew && <span className="pdp__new"> · New</span>}
            </div>
            <h1 className="display pdp__name">{p.name}</h1>
            <div className="pdp__price">
              <Price p={p} size="lg" />
              <StockNote p={p} />
            </div>
            <p className="label-sm muted pdp__dated">Price and availability as listed on KAI on {SNAPSHOT.checkedAt}</p>
            <div className="pdp__colour">
              <span className="pdp__chip" style={{ background: c.hex }} aria-hidden="true" />
              <span>
                <span className="label-sm muted">{p.colour ? 'Colour' : 'Print'}</span> {p.colour ? c.label : p.family ?? p.name}
              </span>
            </div>
            <SizePicker p={p} value={size} onChange={(s) => (setSize(s), setErr(false))} error={err} />
            <div className="pdp__acts">
              <button className="btn pdp__add" onClick={add} data-testid="add-to-bag" disabled={sold} aria-disabled={sold}>
                {cta}
              </button>
              <SaveButton p={p} className="save--box" />
            </div>
            <a href={officialUrl(p)} target="_blank" rel="noopener noreferrer" className="pdp__official" data-testid="official-link">
              <span>
                <span className="label">Buy on kaicollections.com</span>
                <span className="label-sm muted">Opens this piece on KAI’s own store</span>
              </span>
              <Icon.out />
            </a>
            <div className="pdp__accs">
              <Acc title="Details" id="details" open>
                <ul>
                  {p.material ? (
                    <li>
                      <strong>Composition:</strong> {p.material}
                    </li>
                  ) : p.fabric ? (
                    <li>
                      <strong>Fabric:</strong> {p.fabric} <span className="muted">(from the product name — KAI’s page gives no composition)</span>
                    </li>
                  ) : null}
                  {p.details.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                  {!p.material && !p.fabric && !p.details.length && <li className="muted">KAI’s product page carries no written details for this piece.</li>}
                </ul>
              </Acc>
              <Acc title="Fit & sizing" id="fit">
                {p.fit && <p>{p.fit}.</p>}
                {p.model && <p>{p.model}.</p>}
                <p>
                  Sizes on KAI: {p.sizes.map((s) => `${s.label}${s.available ? '' : ' (sold out)'}`).join(' · ')}.
                </p>
              </Acc>
              <Acc title="Care" id="care">
                {p.care && <p data-testid="care-own">{p.care}</p>}
                <p className="label-sm muted">
                  {p.care ? 'KAI’s product pages also show this general care block:' : 'KAI gives no care note for this piece; its product pages show this general care block:'}
                </p>
                <ul data-testid="care-general">
                  {KAI_CARE.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </Acc>
              <Acc title="Source" id="source">
                <p>
                  Name, price, sizes, availability, composition and photographs read directly from KAI’s storefront on {SNAPSHOT.checkedAt}. Photographs are KAI’s
                  own, loaded from KAI’s CDN.
                </p>
                <ul className="pdp__src">
                  <li>
                    <a href={officialUrl(p)} target="_blank" rel="noopener noreferrer" className="link-u">
                      {officialUrl(p).replace('https://', '')}
                    </a>
                  </li>
                </ul>
              </Acc>
            </div>
          </div>
        </div>
      </div>
      {sets.length > 0 && (
        <section className="pdp__sets wrap" aria-labelledby="sets-t">
          <h2 id="sets-t" className="display pdp__h2">
            Complete <span className="italic">the set</span>
          </h2>
          {sets.map((s) => (
            <div key={s.id} className="pdp__set">
              <div>
                <div className="serif">{s.title}</div>
                <div className="label-sm muted">{s.basis}</div>
              </div>
              <div className="pdp__setitems">
                {s.items
                  .filter((x) => x !== p.slug)
                  .slice(0, 4)
                  .map((x) => BY_SLUG.get(x)!)
                  .map((q) => (
                    <ProductCard key={q.slug} p={q} size="sm" />
                  ))}
              </div>
            </div>
          ))}
        </section>
      )}
      <section className="pdp__related wrap" aria-labelledby="rel-t" data-testid="related">
        <h2 id="rel-t" className="display pdp__h2">
          You may <span className="italic">also like</span>
        </h2>
        <div className="grid grid--4">
          {related.map((r) => (
            <ProductCard key={r.slug} p={r} />
          ))}
        </div>
      </section>
      <div className="pdp__bar" aria-hidden="false">
        <div>
          <div className="pdp__bar-name">{p.name}</div>
          <Price p={p} size="sm" />
        </div>
        <button className="btn" onClick={add} data-testid="add-to-bag-mobile" disabled={sold}>
          {sold ? 'Sold out' : needsSize(p) && !size ? 'Choose size' : 'Add to bag'}
        </button>
      </div>
    </article>
  );
}
