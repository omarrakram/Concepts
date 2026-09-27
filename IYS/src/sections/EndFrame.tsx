import { useRef, useState } from 'react';

import { Logo } from '../components/Logo';
import { concept, official } from '../data/copy';
import { gsap, reducedMotion } from '../lib/gsap';
import { linkProps } from '../lib/router';
import './end.css';

/** 09 — END FRAME: a note that folds itself up, the official line, the credits. */
export function EndFrame() {
  const [done, setDone] = useState(false);
  const note = useRef<HTMLFormElement>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const el = note.current!;
    if (!el.reportValidity()) return;
    if (reducedMotion()) return setDone(true);
    gsap
      .timeline({ onComplete: () => setDone(true) })
      .to(el, { scaleY: 0.5, transformOrigin: '50% 0%', duration: 0.25, ease: 'power2.in' })
      .to(el, { scaleX: 0.5, rotate: -8, duration: 0.2, ease: 'power2.in' })
      .to(el, { y: -30, opacity: 0, duration: 0.2 });
  };

  return (
    <footer className="end" id="end">
      <div className="end__note-wrap">
        {done ? (
          <p className="end__done hand" role="status">
            {concept.newsletter.done}
          </p>
        ) : (
          <form className="end__note" ref={note} onSubmit={submit}>
            <label htmlFor="nl" className="hand end__note-title">
              {concept.newsletter.title} ✎
            </label>
            <p className="end__note-sub">{concept.newsletter.sub}</p>
            <div className="end__field">
              <input id="nl" type="email" required placeholder={concept.newsletter.placeholder} autoComplete="email" />
              <button type="submit" className="btn btn--sm">
                Pin it
              </button>
            </div>
            <p className="mono end__note-fine">{concept.newsletter.disclaimer}</p>
          </form>
        )}
      </div>

      <div className="end__lockup">
        <Logo className="end__logo" invert />
        <p className="display end__line">{official.coolDecision}</p>
        <p className="mono end__official">
          Official IYS lines: “{official.coolDecision}” · “{official.coolestApparel}”
        </p>
      </div>

      <nav className="end__nav" aria-label="Footer">
        <a {...linkProps('/shop/all')}>Shop all</a>
        <a {...linkProps('/shop/pjoys')}>Pjoys</a>
        <a href="#stores">Stores</a>
        <a href="https://inyourshoe.com/" target="_blank" rel="noreferrer">
          The real store ↗
        </a>
        <a {...linkProps('/showcase')}>Showcase film</a>
      </nav>

      <div className="end__credits mono">
        {concept.disclaimer.map((l) => (
          <p key={l}>{l}</p>
        ))}
        <p>Product names, photography and the IN YOUR SHOE logo belong to In Your Shoe. Used here for a non-commercial portfolio concept.</p>
      </div>
    </footer>
  );
}
