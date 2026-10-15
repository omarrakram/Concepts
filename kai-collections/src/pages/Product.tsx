import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import { ProductCard, SaveButton } from '../components/ProductCard';
import { gallerySlides } from '../components/ProductMedia';
import { SizePicker } from '../components/SizePicker';
import { Icon, Price, StockNote } from '../components/ui';
import {
  BY_SLUG,
  COLOURS,
  DEPARTMENT_LABEL,
  getProduct,
  KIND_LABEL,
  officialUrl,
  relatedTo,
  SETS,
  SNAPSHOT,
  type Product,
} from '../data/catalog';
import { shop, ui } from '../state/store';
import { NotFound } from './NotFound';

function Gallery({ p }: { p: Product }) {
  const slides = gallerySlides(p);
  const [i, setI] = useState(0);
  const track = useRef<HTMLDivElement>(null);
  useEffect(() => setI(0), [p.slug]);
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const on = () => {
      const k = Math.round(el.scrollLeft / el.clientWidth);
      setI((cur) => (cur !== k ? k : cur));
    };
    el.addEventListener('scroll', on, { passive: true });
    return () => el.removeEventListener('scroll', on);
  }, []);
  const go = (k: number) => {
    const n = (k + slides.length) % slides.length;
    setI(n);
    const el = track.current;
    if (el && el.scrollWidth > el.clientWidth + 4) el.scrollTo({ left: n * el.clientWidth, behavior: 'smooth' });
  };
  return (
    <div className="gallery" data-testid="gallery" aria-roledescription="carousel" aria-label={`${p.name} images`}>
      <div className="gallery__thumbs" role="tablist" aria-label="Choose image">
        {slides.map((s, k) => (
          <button
            key={s.id}
            role="tab"
            aria-selected={k === i}
            aria-label={s.label}
            className={`gallery__thumb ${k === i ? 'is-on' : ''}`}
            onClick={() => go(k)}
            data-testid="gallery-thumb"
          >
            {s.render()}
          </button>
        ))}
      </div>
      <div className="gallery__main">
        <div className="gallery__track" ref={track} data-active={i}>
          {slides.map((s, k) => (
            <div key={s.id} className={`gallery__slide ${k === i ? 'is-on' : ''}`} aria-hidden={k !== i} data-testid="gallery-slide" data-slide={s.id}>
              {s.render()}
            </div>
          ))}
        </div>
        <div className="gallery__nav">
          <button className="icon-btn" aria-label="Previous image" onClick={() => go(i - 1)} data-testid="gallery-prev">
            ‹
          </button>
          <span className="label-sm num" aria-live="polite">
            {i + 1} / {slides.length} · {slides[i]?.label}
          </span>
          <button className="icon-btn" aria-label="Next image" onClick={() => go(i + 1)} data-testid="gallery-next">
            ›
          </button>
        </div>
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
  const c = COLOURS[p.colour];
  const related = relatedTo(p, 4);
  const sets = SETS.filter((s) => s.items.includes(p.slug));
  const deptView = p.department === 'unisex' ? 'shop' : `shop/${p.department}`;
  const add = () => {
    if (p.sizes.length && !size) {
      setErr(true);
      document.querySelector('.pdp .sizes')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }
    shop.add(p.slug, size);
    setAdded(true);
    ui.open('bag');
  };
  return (
    <article className="pdp" data-testid="pdp" data-slug={p.slug}>
      <nav className="crumbs wrap label-sm" aria-label="Breadcrumb">
        <Link to="/shop">Shop</Link>
        <span aria-hidden="true">/</span>
        <Link to={`/${deptView}`}>{DEPARTMENT_LABEL[p.department]}</Link>
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
              {DEPARTMENT_LABEL[p.department]} · {KIND_LABEL[p.kind]}
            </div>
            <h1 className="display pdp__name">{p.name}</h1>
            <div className="pdp__price">
              <Price p={p} size="lg" />
              <StockNote p={p} />
            </div>
            <p className="label-sm muted pdp__dated">Price as captured {SNAPSHOT.checkedAt} · confirm on KAI</p>
            <div className="pdp__colour">
              <span className="pdp__chip" style={{ background: c.hex }} />
              <span>
                <span className="label-sm muted">{p.print ? 'Print' : 'Colour'}</span> {p.print ?? c.label}
              </span>
            </div>
            <SizePicker p={p} value={size} onChange={(s) => (setSize(s), setErr(false))} error={err} />
            <div className="pdp__acts">
              <button className="btn pdp__add" onClick={add} data-testid="add-to-bag">
                {added ? 'Added — view bag' : p.sizes.length && !size ? 'Select a size' : 'Add to bag'}
              </button>
              <SaveButton p={p} className="save--box" />
            </div>
            <a href={officialUrl(p)} target="_blank" rel="noopener noreferrer" className="pdp__official" data-testid="official-link">
              <span>
                <span className="label">Buy on kaicollections.com</span>
                <span className="label-sm muted">{p.handle ? 'Opens this piece on KAI’s store' : 'Opens KAI’s own search for this piece'}</span>
              </span>
              <Icon.out />
            </a>
            <div className="pdp__accs">
              <Acc title="Details" id="details" open>
                <ul>
                  {p.material && (
                    <li>
                      <strong>Material:</strong> {p.material}
                    </li>
                  )}
                  {p.details.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                  {!p.material && !p.details.length && <li className="muted">KAI’s full description wasn’t captured in the snapshot — see the official page.</li>}
                </ul>
              </Acc>
              <Acc title="Fit & sizing" id="fit">
                {p.fit && <p>{p.fit}</p>}
                {p.sizes.length ? (
                  <p>
                    Sizes: {p.sizes.join(' · ')}. {p.sizesNote}
                  </p>
                ) : (
                  <p className="muted">Sizes weren’t captured for this piece. KAI lists them on its product page.</p>
                )}
              </Acc>
              <Acc title="Care" id="care">
                <p>{p.care ?? 'Care instructions weren’t captured for this piece — check the label or KAI’s product page.'}</p>
              </Acc>
              <Acc title="Source & verification" id="source">
                <p>
                  Read from {p.verification === 'storefront' ? 'KAI’s storefront' : 'search-engine snapshots of KAI’s own pages'} on {SNAPSHOT.checkedAt}. The drawing is an
                  illustrative flat{p.print ? ' and does not show the print' : ''}; it is not KAI photography.
                </p>
                {p.notes && <p className="muted">{p.notes}</p>}
                <ul className="pdp__src">
                  {p.sources.map((s) => (
                    <li key={s}>
                      <a href={s} target="_blank" rel="noopener noreferrer" className="link-u">
                        {s.replace('https://', '')}
                      </a>
                    </li>
                  ))}
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
        <button className="btn" onClick={add} data-testid="add-to-bag-mobile">
          {p.sizes.length && !size ? 'Choose size' : 'Add to bag'}
        </button>
      </div>
    </article>
  );
}
