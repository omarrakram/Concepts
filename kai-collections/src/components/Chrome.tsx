import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import { PRODUCTS, SHOP_VIEWS, SNAPSHOT } from '../data/catalog';
import { SOURCES } from '../data/brand';
import { ui, usePanel, useShop } from '../state/store';
import { useFocusTrap, useLockScroll, useEscape } from '../lib/hooks';
import { campaign, MEDIA_ON } from '../data/media';
import { Photo } from './Photo';
import { Icon, Logo } from './ui';

const count = (id: string) => PRODUCTS.filter(SHOP_VIEWS.find((v) => v.id === id)!.test).length;

const MEGA = [
  {
    title: 'Departments',
    links: [
      ['Men', '/shop/men'],
      ['Women', '/shop/women'],
      ['Kids', '/shop/kids'],
    ],
  },
  {
    title: 'Categories',
    links: [
      ['Swim', '/shop/swimwear'],
      ['Linen', '/shop/linen'],
      ['Resort', '/shop/resort'],
      ['Knit & Jersey', '/shop/everyday'],
      ['Matching sets', '/shop/sets'],
    ],
  },
  {
    title: 'Edits',
    links: [
      ['New arrivals', '/shop/new-arrivals'],
      ['Sale', '/shop/sale'],
      ['Everything', '/shop'],
    ],
  },
] as const;

export function Nav() {
  const { bag, saved } = useShop();
  const loc = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mega, setMega] = useState(false);
  const home = loc.pathname === '/';
  const timer = useRef<number>(0);
  const hoverOpenedAt = useRef(0);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  useEffect(() => setMega(false), [loc.pathname]);
  useEscape(() => setMega(false), mega);
  const qty = bag.reduce((a, l) => a + l.qty, 0);
  const open = () => {
    window.clearTimeout(timer.current);
    setMega((m) => {
      if (!m) hoverOpenedAt.current = Date.now();
      return true;
    });
  };
  const close = () => {
    timer.current = window.setTimeout(() => setMega(false), 160);
  };
  return (
    <header className={`nav ${scrolled || !home || mega ? 'nav--solid' : ''}`} data-testid="nav">
      <a className="skip label-sm" href="#main">
        Skip to content
      </a>
      <div className="nav__bar wrap">
        <button className="icon-btn nav__burger" aria-label="Open menu" onClick={() => ui.open('menu')} data-testid="menu-button">
          <Icon.menu />
        </button>
        <nav className="nav__left" aria-label="Primary">
          <div className="nav__shop" onMouseEnter={open} onMouseLeave={close}>
            <button
              className="nav__link label"
              aria-expanded={mega}
              aria-controls="mega"
              // a click straight after hover-open keeps the menu open instead of toggling it shut
              onClick={() => setMega((m) => (m && Date.now() - hoverOpenedAt.current < 600 ? true : !m))}
              data-testid="shop-menu"
            >
              Shop
            </button>
          </div>
          <NavLink className="nav__link label" to="/shop/men">
            Men
          </NavLink>
          <NavLink className="nav__link label" to="/shop/women">
            Women
          </NavLink>
          <NavLink className="nav__link label" to="/shop/kids">
            Kids
          </NavLink>
          <NavLink className="nav__link label" to="/lookbook">
            Journal
          </NavLink>
        </nav>
        <Link to="/" className="nav__brand" aria-label="KAI Collections — home">
          <Logo height={38} />
        </Link>
        <div className="nav__right">
          <NavLink className="nav__link label nav__hide-m" to="/about">
            About
          </NavLink>
          <NavLink className="nav__link label nav__hide-m" to="/stores">
            Stores
          </NavLink>
          <button className="icon-btn" aria-label="Search" onClick={() => ui.open('search')} data-testid="search-button">
            <Icon.search />
          </button>
          <button className="icon-btn nav__hide-s" aria-label={`Saved items (${saved.length})`} onClick={() => ui.open('saved')} data-testid="saved-button">
            <Icon.heart />
            {saved.length > 0 && <span className="badge num">{saved.length}</span>}
          </button>
          <button className="icon-btn" aria-label={`Bag (${qty})`} onClick={() => ui.open('bag')} data-testid="bag-button">
            <Icon.bag />
            {qty > 0 && (
              <span className="badge num" data-testid="bag-count">
                {qty}
              </span>
            )}
          </button>
        </div>
      </div>
      <div id="mega" className={`mega ${mega ? 'is-open' : ''}`} onMouseEnter={open} onMouseLeave={close} hidden={!mega}>
        <div className="mega__inner wrap">
          {MEGA.map((col) => (
            <div key={col.title} className="mega__col">
              <div className="label-sm muted">{col.title}</div>
              <ul>
                {col.links.map(([l, to]) => (
                  <li key={to}>
                    <Link to={to} className="mega__link serif">
                      {l}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <Link to="/shop/new-arrivals" className="mega__feature">
            <div className="mega__img" aria-hidden="true">
              {MEDIA_ON && <Photo src={campaign('women-sets').src} w={campaign('women-sets').w} h={campaign('women-sets').h} alt="" decorative sizes="220px" max={540} />}
            </div>
            <div>
              <div className="label-sm muted">SS26</div>
              <div className="serif mega__ft">New arrivals</div>
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}

export function MobileMenu() {
  const panel = usePanel();
  const open = panel === 'menu';
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, open);
  useLockScroll(open);
  useEscape(ui.close, open);
  const loc = useLocation();
  useEffect(() => {
    if (open) ui.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loc.pathname]);
  const big: [string, string, number][] = [
    ['Men', '/shop/men', count('men')],
    ['Women', '/shop/women', count('women')],
    ['Kids', '/shop/kids', count('kids')],
    ['Swim', '/shop/swimwear', count('swimwear')],
    ['Linen', '/shop/linen', count('linen')],
    ['Resort', '/shop/resort', count('resort')],
    ['Matching sets', '/shop/sets', 0],
    ['New arrivals', '/shop/new-arrivals', count('new-arrivals')],
    ['Sale', '/shop/sale', count('sale')],
  ];
  return (
    <div className={`sheet ${open ? 'is-open' : ''}`} aria-hidden={!open} inert={!open}>
      <div className="sheet__panel" role="dialog" aria-modal="true" aria-label="Menu" ref={ref} data-testid="mobile-menu">
        <div className="sheet__top wrap">
          <Logo height={34} />
          <button className="icon-btn" onClick={ui.close} aria-label="Close menu" data-autofocus>
            <Icon.close />
          </button>
        </div>
        <nav className="sheet__nav wrap" aria-label="Mobile">
          {big.map(([l, to, n], i) => (
            <Link key={to} to={to} className="sheet__link" style={{ transitionDelay: `${0.05 + i * 0.04}s` }}>
              <span className="display">{l}</span>
              {n > 0 && <span className="label-sm muted num">{n}</span>}
            </Link>
          ))}
        </nav>
        <div className="sheet__foot wrap">
          {[
            ['Journal', '/lookbook'],
            ['About', '/about'],
            ['Stores', '/stores'],
            ['Saved', '#saved'],
            ['The film', '/showcase'],
          ].map(([l, to]) =>
            to === '#saved' ? (
              <button key={l} className="label" onClick={() => ui.open('saved')}>
                {l}
              </button>
            ) : (
              <Link key={l} to={to} className="label">
                {l}
              </Link>
            ),
          )}
        </div>
      </div>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="footer on-dark" data-testid="footer">
      <div className="footer__top wrap">
        <div className="footer__brand">
          <Logo height={84} tone="light" />
          <p className="serif footer__line">The art of escape.</p>
          <p className="label-sm footer__concept">Concept line — not a KAI slogan</p>
        </div>
        <div className="footer__cols">
          <div>
            <div className="label-sm footer__h">Shop</div>
            <Link to="/shop/men">Men</Link>
            <Link to="/shop/women">Women</Link>
            <Link to="/shop/kids">Kids</Link>
            <Link to="/shop/swimwear">Swim</Link>
            <Link to="/shop/linen">Linen</Link>
            <Link to="/shop/resort">Resort</Link>
            <Link to="/shop/sets">Matching sets</Link>
            <Link to="/shop/sale">Sale</Link>
          </div>
          <div>
            <div className="label-sm footer__h">KAI</div>
            <Link to="/about">About</Link>
            <Link to="/stores">Stores</Link>
            <Link to="/lookbook">Journal</Link>
            <Link to="/showcase">The film</Link>
          </div>
          <div>
            <div className="label-sm footer__h">Official KAI</div>
            <a href={SOURCES.home} target="_blank" rel="noopener noreferrer">
              kaicollections.com <Icon.out />
            </a>
            <a href={SOURCES.instagram} target="_blank" rel="noopener noreferrer">
              Instagram <Icon.out />
            </a>
            <a href={SOURCES.stores} target="_blank" rel="noopener noreferrer">
              Store list <Icon.out />
            </a>
            <a href={SOURCES.contact} target="_blank" rel="noopener noreferrer">
              Contact <Icon.out />
            </a>
          </div>
        </div>
      </div>
      <div className="footer__base wrap">
        <p>
          <strong>Unofficial speculative concept</strong> by Omar Akram, 2026. Not affiliated with, endorsed by or connected to KAI Collections. Nothing
          is sold here: every purchase link opens the piece on KAI’s own store.
        </p>
        <p className="muted-l">
          Catalog: KAI’s {PRODUCTS.length} SS26 products, read directly from kaicollections.com on {SNAPSHOT.checkedAt}. Prices in EGP and availability are
          from that day, not live. {MEDIA_ON ? 'Logo and photographs © KAI Collections, shown from KAI’s own servers for this proposal; ' : ''}seascapes are
          rendered light studies{MEDIA_ON ? '' : '; the wordmark is a typeset stand-in, not KAI’s logo'}.
        </p>
      </div>
    </footer>
  );
}
