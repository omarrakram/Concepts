import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Seascape } from '../components/Seascape';
import { ConceptTag, Icon } from '../components/ui';
import { LIGHTS, mixLight } from '../gl/sea';
import { useIsMobile, usePrefersReducedMotion } from '../lib/hooks';

/** 00 — The Arrival. The wordmark stands on the horizon and is reflected in a moving sea. */
export function Hero() {
  const mobile = useIsMobile();
  const reduced = usePrefersReducedMotion();
  const [k, setK] = useState(reduced ? 1 : 0);
  useEffect(() => {
    if (reduced) return setK(1);
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const x = Math.min(1, (now - t0) / 1900);
      setK(1 - Math.pow(1 - x, 3));
      if (x < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);
  const horizon = mobile ? 0.4 : 0.34;
  const base = mixLight(LIGHTS.morning, LIGHTS.golden, 0.18);
  // desktop: the sun rises inside the K; phone: it sits just above the A
  const light = { ...base, sunX: mobile ? 0.5 : 0.285, sunY: mobile ? 0.255 : base.sunY };
  return (
    <section className="hero is-in" data-testid="hero" aria-labelledby="hero-title">
      <Seascape
        className="hero__sea"
        light={light}
        horizon={horizon}
        text="KAI"
        textSize={mobile ? 0.6 : 0.44}
        textOn={Math.min(1, k * 1.6)}
        textLift={(1 - k) * 0.32}
        glow={mobile ? 0.55 : 0.85}
        interactive
        maxDpr={mobile ? 1.25 : 1.5}
        label="KAI wordmark standing on a rendered horizon, reflected in moving water"
      />
      <div className="hero__meta wrap label-sm">
        <span>Cairo · since 2018</span>
        <span className="hero__def">
          <em className="serif">kai</em> — Hawaiian for ocean
        </span>
      </div>
      <div className="hero__copy wrap" style={{ ['--hz' as string]: `${horizon * 100}%` }}>
        <h1 id="hero-title" className="hero__title">
          <span className="sr-only">KAI Collections — </span>
          <span className="label hero__kick">
            Swim · Linen · Resort <ConceptTag />
          </span>
          <span className="display hero__line">
            <span className="mask-up">
              <span>The art</span>
            </span>{' '}
            <span className="mask-up">
              <span className="italic">of escape.</span>
            </span>
          </span>
        </h1>
        <div className="hero__ctas rv d2">
          <Link to="/shop" className="btn btn--light" data-testid="hero-cta">
            Explore the collection <Icon.arrow />
          </Link>
          <Link to="/about" className="btn btn--ghost hero__ghost">
            Discover KAI
          </Link>
        </div>
      </div>
      <a href="#philosophy" className="hero__scroll label-sm" aria-label="Scroll to the KAI philosophy">
        <span className="hero__scroll-line" aria-hidden="true" />
        Scroll
      </a>
    </section>
  );
}
