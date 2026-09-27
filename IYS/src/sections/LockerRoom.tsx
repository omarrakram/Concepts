import { useLayoutEffect, useRef, useState } from 'react';

import { Hanger } from '../components/Objects';
import { Price } from '../components/Price';
import { QuickAdd } from '../components/QuickAdd';
import { asset } from '../data/assets';
import { concept, official } from '../data/copy';
import { products } from '../data/products';
import { gsap, reducedMotion } from '../lib/gsap';
import { useStore } from '../lib/store';
import './locker.css';

const zed = products.filter((p) => p.collab === 'zed');

/**
 * 05 — THE LOCKER ROOM · IYS × ZED. One chapter, not the whole house:
 * lockers with tape labels; open one to find the real piece hanging inside.
 */
export function LockerRoom() {
  const root = useRef<HTMLElement>(null);
  const [open, setOpen] = useState<Set<string>>(new Set());
  const { openProduct } = useStore();
  const campaign = asset('zed-lockers');
  const pitch = asset('zed-pitch');

  useLayoutEffect(() => {
    const el = root.current;
    if (!el || reducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.from('.locker', { y: 60, opacity: 0, stagger: 0.08, duration: 0.7, ease: 'back.out(1.4)', scrollTrigger: { trigger: '.lockers', start: 'top 80%', once: true } });
      gsap.from('.locker__tape', { scaleX: 0, transformOrigin: '0 50%', stagger: 0.08, duration: 0.35, delay: 0.4, ease: 'power2.out', scrollTrigger: { trigger: '.lockers', start: 'top 80%', once: true } });
    }, el);
    return () => ctx.revert();
  }, []);

  if (!zed.length) return null;

  const toggle = (id: string, door: HTMLElement) => {
    const next = new Set(open);
    const opening = !next.has(id);
    opening ? next.add(id) : next.delete(id);
    setOpen(next);
    if (reducedMotion()) return;
    gsap.to(door, { rotateY: opening ? -112 : 0, duration: opening ? 0.75 : 0.5, ease: opening ? 'back.out(1.2)' : 'power3.in' });
  };

  return (
    <section className="lockerroom" id="locker" ref={root} aria-labelledby="locker-title">
      <svg className="lockerroom__pitch" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <g fill="none" stroke="rgba(255,255,255,.16)" strokeWidth="3">
          <rect x="30" y="30" width="940" height="540" />
          <path d="M500 30 V570" />
          <circle cx="500" cy="300" r="90" />
          <rect x="30" y="170" width="120" height="260" />
          <rect x="850" y="170" width="120" height="260" />
        </g>
      </svg>

      <header className="lockerroom__head">
        <p className="kicker">
          <b>05</b> IYS × ZED
        </p>
        <h2 id="locker-title" className="display lockerroom__title">
          <span>{official.zedLine[0]}</span> <span>{official.zedLine[1]}</span>
        </h2>
        <p className="lockerroom__tape">{concept.locker.label}</p>
        <p className="lockerroom__licensed mono">
          {official.zedLicensed} — <a href="https://inyourshoe.com/pages/iysxzed" target="_blank" rel="noreferrer">inyourshoe.com/pages/iysxzed ↗</a>
        </p>
      </header>

      <div className="lockerroom__grid">
        <ul className="lockers">
          {zed.map((p, i) => {
            const isOpen = open.has(p.id);
            return (
              <li key={p.id} className={`locker ${isOpen ? 'is-open' : ''}`}>
                <div className="locker__inside">
                  <Hanger />
                  <button type="button" className="locker__item" onClick={() => openProduct(p.id)} tabIndex={isOpen ? 0 : -1} aria-label={`${p.name} — open`}>
                    <img src={p.image.src} alt={p.image.alt} loading="lazy" />
                  </button>
                  <div className="locker__buy" hidden={!isOpen}>
                    <p className="locker__name">{p.name}</p>
                    <Price p={p} />
                    <QuickAdd p={p} label="Add" />
                  </div>
                </div>
                <button
                  type="button"
                  className="locker__door"
                  aria-expanded={isOpen}
                  aria-label={`Locker ${String(i + 7).padStart(2, '0')} — ${p.name}. ${isOpen ? 'Close' : 'Open'} locker`}
                  onClick={(e) => toggle(p.id, e.currentTarget)}
                >
                  <span className="locker__vents" aria-hidden="true" />
                  <span className="locker__no mono" aria-hidden="true">
                    {String(i + 7).padStart(2, '0')}
                  </span>
                  <span className="locker__tape hand" aria-hidden="true">
                    {p.nick}
                  </span>
                  <span className="locker__handle" aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>

        <aside className="teamsheet" aria-label="Team sheet">
          <div className="teamsheet__photos">
            {campaign && <img className="teamsheet__photo" src={campaign.src} alt={campaign.alt} loading="lazy" />}
            {pitch && <img className="teamsheet__photo teamsheet__photo--2" src={pitch.src} alt={pitch.alt} loading="lazy" />}
          </div>
          <p className="mono teamsheet__h">Team sheet — IYS × ZED</p>
          <ol>
            {zed.map((p, i) => (
              <li key={p.id}>
                <span className="teamsheet__no">{String(i + 7).padStart(2, '0')}</span>
                <button type="button" onClick={() => openProduct(p.id)}>
                  {p.name}
                </button>
                <Price p={p} />
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </section>
  );
}
