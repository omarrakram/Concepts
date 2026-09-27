import { useEffect, useRef, useState } from 'react';

import { gsap } from '../lib/gsap';
import { linkProps, navigate, usePath } from '../lib/router';
import { useStore } from '../lib/store';
import { Logo } from './Logo';
import { BagIcon, Close, Heart, SearchIcon } from './Objects';

export const NAV = [
  { label: 'Shop', to: '/shop/all' },
  { label: 'New', to: '/shop/new' },
  { label: 'Pjoys', to: '/shop/pjoys' },
  { label: 'Outwear', to: '/shop/outwear' },
  { label: 'Women', to: '/shop/women' },
  { label: 'Kids', to: '/shop/kids' },
  { label: 'Accessories', to: '/shop/accessories' },
  { label: 'Stores', to: '/#stores' },
];

export function TopBar() {
  const { bagCount, wish, setBagOpen, setSearchOpen, drops } = useStore();
  const path = usePath();
  const [menu, setMenu] = useState(false);
  const bagRef = useRef<HTMLButtonElement>(null);

  // the bag "catches" each drop
  useEffect(() => {
    if (!drops || !bagRef.current) return;
    gsap.fromTo(bagRef.current, { y: -2, rotate: -8, scale: 1.18 }, { y: 0, rotate: 0, scale: 1, duration: 0.7, delay: 0.6, ease: 'elastic.out(1, 0.45)' });
  }, [drops]);

  return (
    <>
      <header className="topbar">
        <button type="button" className="topbar__menu" aria-label="Open menu" aria-expanded={menu} onClick={() => setMenu(true)}>
          <span />
          <span />
        </button>
        <a className="topbar__logo" {...linkProps('/')} aria-label="IN YOUR SHOE — home">
          <Logo />
        </a>
        <nav className="topbar__nav" aria-label="Primary">
          {NAV.map((n) => (
            <a key={n.to} {...linkProps(n.to)} aria-current={path === n.to ? 'page' : undefined}>
              {n.label}
            </a>
          ))}
        </nav>
        <div className="topbar__tools">
          <button type="button" className="tool" onClick={() => setSearchOpen(true)} aria-label="Search">
            <SearchIcon />
          </button>
          <a className="tool tool--wish" {...linkProps('/shop/wishlist')} aria-label={`Wishlist, ${wish.length} saved`}>
            <Heart filled={wish.length > 0} />
            {wish.length > 0 && <span className="tool__count mono">{wish.length}</span>}
          </a>
          <button ref={bagRef} type="button" className="tool tool--bag" data-bag-target onClick={() => setBagOpen(true)} aria-label={`Bag, ${bagCount} items`}>
            <BagIcon count={bagCount} />
            <span className="tool__label mono">Bag</span>
          </button>
        </div>
      </header>
      {menu && <ClosetMenu onClose={() => setMenu(false)} />}
    </>
  );
}

/** Mobile menu — the closet door swings open onto the nav, hung like tags. */
function ClosetMenu({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const { setSearchOpen } = useStore();

  useEffect(() => {
    const el = ref.current!;
    const tl = gsap.timeline();
    tl.fromTo(el.querySelector('.closet-menu__door'), { rotateY: 0 }, { rotateY: -104, duration: 0.7, ease: 'power3.inOut' });
    tl.fromTo(el.querySelectorAll('.closet-menu__item'), { y: -24, rotate: -6, opacity: 0 }, { y: 0, rotate: 0, opacity: 1, stagger: 0.04, duration: 0.6, ease: 'elastic.out(1, 0.6)' }, 0.25);
    el.querySelector<HTMLElement>('.closet-menu__item a')?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      tl.kill();
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const go = (to: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    onClose();
    navigate(to);
  };

  return (
    <div className="closet-menu" ref={ref} role="dialog" aria-modal="true" aria-label="Menu">
      <div className="closet-menu__inside">
        <div className="closet-menu__rail" aria-hidden="true" />
        <ul>
          {NAV.map((n, i) => (
            <li className="closet-menu__item" key={n.to} style={{ '--i': i } as React.CSSProperties}>
              <a href={n.to} onClick={go(n.to)}>
                <span className="closet-menu__no mono">{String(i + 1).padStart(2, '0')}</span>
                {n.label}
              </a>
            </li>
          ))}
          <li className="closet-menu__item">
            <button
              type="button"
              onClick={() => {
                onClose();
                setSearchOpen(true);
              }}
            >
              <span className="closet-menu__no mono">⌕</span>Search
            </button>
          </li>
        </ul>
        <button type="button" className="closet-menu__close" onClick={onClose} aria-label="Close menu">
          <Close />
        </button>
      </div>
      <div className="closet-menu__door" aria-hidden="true">
        <span className="closet-menu__knob" />
      </div>
    </div>
  );
}
