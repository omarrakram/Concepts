import { Link, useNavigate } from 'react-router';
import { Icon } from '../../../components/os/Icon';
import { PageLoading } from '../../../components/shop/PageLoading';
import { Price, SaleBadge } from '../../../components/shop/Price';
import { RemoteImage } from '../../../components/shop/RemoteImage';
import { assets, brand, campaign, curation, localImage, pick } from '../../../data/assets';
import { concept, official, OFFICIAL_VERIFIED_ON } from '../../../data/copy';
import { BUDDIES, MENU } from '../../../data/taxonomy';
import storesData from '../../../data/stores.generated.json';
import { collectionProducts } from '../../../lib/catalogue/hydrate';
import { formatCount } from '../../../lib/catalogue/format';
import { useCatalogue } from '../../../lib/catalogue/load';
import type { Product } from '../../../lib/catalogue/types';
import { usePage } from '../../../lib/usePage';
import { collectionPath, productPath } from '../../../lib/useBrowse';
import { useOS } from '../../../state/os';

function Img({ p, local = true, size = 240 }: { p: Product; local?: boolean; size?: number }) {
  const li = local ? localImage(p.handle) : null;
  return li ? (
    <img src={li.src} alt="" width={li.width} height={li.height} loading="lazy" decoding="async" />
  ) : (
    <RemoteImage src={p.image} alt="" title={p.title} width={p.imageWidth} height={p.imageHeight} base={size} sizes={`${size / 2}px`} />
  );
}

export function WebBadge({ label, sub, tone = 'blue' }: { label: string; sub?: string; tone?: 'blue' | 'coral' | 'green' | 'ink' }) {
  return (
    <span className={`badge88 badge88--${tone}`}>
      <b>{label}</b>
      {sub && <small>{sub}</small>}
    </span>
  );
}

export default function Home() {
  const cat = useCatalogue();
  const navigate = useNavigate();
  usePage('IN YOUR SHOE | The Coolest Apparel In Town!', cat ? `${formatCount(cat.products.length)} products found.` : 'Opening page...');
  if (!cat) return <PageLoading label="Connecting to www.inyourshoe.com..." />;

  const top8 = pick(cat, curation.top8);
  const newest = collectionProducts(cat, 'newest').slice(0, 6);
  const pjoys = collectionProducts(cat, 'pjoys');
  const cairo = pick(cat, curation.cairo).slice(0, 4);
  const fw = campaign('fw27-2');
  const zed = campaign('zed-1');
  const openChat = (id: string, name: string) => {
    useOS.getState().open('messenger');
    useOS.getState().open('chat', { id: `chat-${id}`, title: `${name} - Conversation`, props: { buddy: id } });
  };

  return (
    <div className="page portal">
      <header className="portal__head">
        <img className="portal__logo" src={brand.wordmark} alt="In Your Shoe" width={346} height={114} />
        <div className="portal__tag">
          <p className="portal__official" title={`Official IYS line, verified on inyourshoe.com ${OFFICIAL_VERIFIED_ON}`}>
            {official.coolDecision}
          </p>
          <p className="portal__sub">{official.coolestApparel}</p>
        </div>
      </header>
      <div className="portal__announce" title={`Announcement bar on inyourshoe.com, ${OFFICIAL_VERIFIED_ON}. Offers change — check the real site.`}>
        <span>{official.sameDay}</span>
        <span>{official.freeShipping} EGP</span>
        <span className="portal__announce-note">as announced on inyourshoe.com · {OFFICIAL_VERIFIED_ON}</span>
      </div>
      <div className="marquee">
        <p className="sr-only">New stuff, Pjoys, Fluffy Pjoys, hoodies, socks, Cairo, IYS × ZED, women, kids.</p>
        <div className="marquee__track" aria-hidden="true">
          {[0, 1].map((k) => (
            <span key={k}>NEW STUFF ★ PJOYS ★ FLUFFY PJOYS ★ HOODIES ★ SOCKS ★ CAIRO ★ IYS × ZED ★ WOMEN ★ KIDS ★&nbsp;</span>
          ))}
        </div>
      </div>

      <div className="portal__cols">
        <aside className="portal__left">
          <section className="box">
            <h2 className="box__title">SHOP BY CATEGORY</h2>
            <ul className="box__list">
              {MENU.map((m) => {
                const n = m.collection ? cat.collections.get(m.collection)?.count : cat.products.length;
                if (!n) return null;
                return (
                  <li key={m.label}>
                    <Link to={m.to ?? collectionPath(m.collection)}>{m.label}</Link> <small>({formatCount(n)})</small>
                  </li>
                );
              })}
            </ul>
          </section>
          <section className="box">
            <h2 className="box__title">IYS CAMERA</h2>
            <button type="button" className="camteaser" onClick={() => useOS.getState().open('camera')} aria-label="Open the IYS Camera DCIM folder">
              <img src={assets.camera[0]?.src} alt="" loading="lazy" />
              <span>DCIM · {assets.camera.length + assets.campaign.length + assets.stores.length} photos</span>
            </button>
          </section>
          <section className="box">
            <h2 className="box__title">GUESTBOOK</h2>
            <p className="box__text muted">{concept.guestbook}</p>
          </section>
        </aside>

        <div className="portal__main">
          <section className="portal__cta" aria-labelledby="portal-cta-title">
            <p className="portal__cta-kicker" id="portal-cta-title">
              {concept.y2k.heroKicker}
            </p>
            <div className="portal__cta-row">
              <button type="button" className="btn btn--go portal__cta-main" onClick={() => navigate('/collections/newest')}>
                {concept.y2k.primary} › <small>{formatCount(cat.collections.get('newest')?.count ?? 0)} new</small>
              </button>
              <button type="button" className="btn btn--sky" onClick={() => navigate('/collections/pjoys')}>
                {concept.y2k.secondary}
              </button>
            </div>
          </section>
          {fw && (
            <figure className="hero">
              <button type="button" className="hero__img" onClick={() => navigate('/collections/newest')} aria-label="Open New Stuff (FW27)">
                <img src={fw.src} alt="In Your Shoe FW27 campaign: two models in brown hoodies beside old computers" width={fw.width} height={fw.height} />
              </button>
              <figcaption>
                <b>FW27</b> — the current IYS campaign (2026), loaded into a 2006 browser.
              </figcaption>
            </figure>
          )}

          <section className="box">
            <h2 className="box__title box__title--coral">
              TOP 8 COOL DECISIONS <small>real products · real prices · too cute 2 skip xo</small>
            </h2>
            <ol className="top8">
              {top8.map((p, i) => (
                <li key={p.handle}>
                  <Link to={productPath(p.handle)} className="top8__card">
                    <span className="top8__n">{i + 1}</span>
                    <span className="top8__img">
                      <Img p={p} />
                      {p.onSale && <SaleBadge />}
                    </span>
                    <span className="top8__name">{p.title}</span>
                    <Price price={p.price} compareAt={p.compareAtPrice} />
                  </Link>
                </li>
              ))}
            </ol>
          </section>

          <section className="box">
            <h2 className="box__title">
              NEW STUFF <span className="new-flag">NEW!</span> <small>from IYS’s own Newest collection</small>
            </h2>
            <ul className="strip">
              {newest.map((p) => (
                <li key={p.handle}>
                  <Link to={productPath(p.handle)}>
                    <Img p={p} local={false} size={240} />
                    <span>{p.title}</span>
                  </Link>
                  <Price price={p.price} compareAt={p.compareAtPrice} />
                </li>
              ))}
            </ul>
            <p className="box__more">
              <Link to="/collections/newest">omg see all {formatCount(cat.collections.get('newest')?.count ?? 0)} new drops :) ›</Link>
            </p>
          </section>

          <section className="box box--pjoys">
            <h2 className="box__title">
              <Icon name="pjoys" size={24} /> {formatCount(pjoys.length)} PJOYS ONLINE
            </h2>
            <p className="box__text">
              <q>{official.pjoys}</q> <small className="muted">— IYS product description</small>
            </p>
            <ul className="strip strip--tight">
              {pjoys.slice(0, 6).map((p) => (
                <li key={p.handle}>
                  <Link to={productPath(p.handle)}>
                    <Img p={p} size={240} />
                    <span>{p.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="box__more">
              <Link to="/collections/pjoys">{concept.y2k.secondary} ›</Link> · <Link to="/collections/fluffy-pjoys">Fluffy Pjoys ({formatCount(cat.collections.get('fluffy-pjoys')?.count ?? 0)}) ›</Link>
            </p>
          </section>

          <section className="box box--cairo">
            <h2 className="box__title">
              C:\IYS\CAIRO\ <span lang="ar" dir="rtl" className="arabic">القاهرة</span>
            </h2>
            <ul className="strip strip--tight">
              {cairo.map((p) => (
                <li key={p.handle}>
                  <Link to={productPath(p.handle)}>
                    <Img p={p} size={240} />
                    <span>{p.title}</span>
                  </Link>
                  <Price price={p.price} compareAt={p.compareAtPrice} />
                </li>
              ))}
            </ul>
            <p className="box__more">
              <Link to="/collections/cairo">Open the whole Cairo folder ({formatCount(cat.collections.get('cairo')?.count ?? 0)}) ›</Link>
            </p>
          </section>

          {zed && (
            <figure className="hero hero--small">
              <button type="button" className="hero__img" onClick={() => navigate('/collections/inyourshoexzed')} aria-label="Open IYS × ZED collection">
                <img src={zed.src} alt="IYS × ZED campaign: green lockers with stickers" width={zed.width} height={zed.height} loading="lazy" />
              </button>
              <figcaption>
                <b>IYS × ZED</b> — current collaboration on inyourshoe.com. <Link to="/collections/inyourshoexzed">{formatCount(cat.collections.get('inyourshoexzed')?.count ?? 0)} items ›</Link>
              </figcaption>
            </figure>
          )}
        </div>

        <aside className="portal__right">
          <section className="box">
            <h2 className="box__title">CURRENTLY ONLINE</h2>
            <ul className="buddies-mini">
              {BUDDIES.filter((b) => (cat.collections.get(b.collection)?.count ?? 0) > 0).map((b) => (
                <li key={b.id}>
                  <button type="button" onClick={() => openChat(b.id, b.name)}>
                    <span className={`orb orb--${b.status}`} aria-hidden="true" />
                    <b>{b.name}</b> <small>({b.status})</small>
                  </button>
                </li>
              ))}
            </ul>
            <p className="box__text muted">Status is concept UI, not stock data.</p>
          </section>
          <section className="box">
            <h2 className="box__title">STORES</h2>
            <p className="box__text">
              <b>{storesData.storeCount}</b> IYS stores in Egypt.
            </p>
            <p className="box__more">
              <Link to="/stores">{concept.y2k.stores} ›</Link>
            </p>
          </section>
          <section className="box">
            <h2 className="box__title">IYS MAIL</h2>
            <p className="box__text">
              <b>{concept.y2k.newsletterTitle}</b>
            </p>
            <p className="box__text">{official.coolList}</p>
            <button type="button" className="btn btn--go btn--small" onClick={() => useOS.getState().open('mail')}>
              <Icon name="mail" size={16} /> {concept.y2k.newsletterCta}
            </button>
          </section>
          <section className="box">
            <h2 className="box__title">{concept.counterLabel}</h2>
            <p className="counter" aria-label="Fictional counter: 002006">
              {'002006'.split('').map((d, i) => (
                <span key={i}>{d}</span>
              ))}
            </p>
            <p className="box__text muted">{concept.counterNote}</p>
          </section>
          <div className="badges">
            <WebBadge label="IYS ONLINE" sub="since you got here" />
            <WebBadge label="PJOYS" sub="super joyful" tone="coral" />
            <WebBadge label="CAIRO" sub="is a mindset" tone="ink" />
            <WebBadge label="COOL" sub="DECISION" tone="green" />
          </div>
        </aside>
      </div>

      <footer className="portal__foot">
        <p>
          <b>{concept.disclaimer[0]}</b> {concept.disclaimer[1]} {concept.disclaimer[2]}
        </p>
        <p>{concept.disclaimer[3]}</p>
        <p className="muted">
          Catalogue snapshot: {formatCount(cat.products.length)} public products, EGP, {cat.generatedAt.slice(0, 10)}. Best viewed in IYS INTERNET at 1024×768 or higher.
        </p>
      </footer>
    </div>
  );
}
