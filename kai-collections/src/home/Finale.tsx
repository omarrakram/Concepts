import { Link } from 'react-router';
import { Seascape } from '../components/Seascape';
import { ConceptTag, Icon, Logo } from '../components/ui';
import { LIGHTS, mixLight } from '../gl/sea';
import { useIsMobile, useReveal } from '../lib/hooks';

/** 10 — The Final Horizon: the day closes; the line returns, standing on the water. */
export function Finale() {
  const [ref, inView] = useReveal<HTMLElement>(0.2);
  const mobile = useIsMobile();
  return (
    <section ref={ref} className={`finale on-dark ${inView ? 'is-in' : ''}`} data-testid="finale" aria-labelledby="finale-title">
      <Seascape
        className="finale__sea"
        light={mixLight(LIGHTS.dusk, LIGHTS.night, 0.18)}
        horizon={mobile ? 0.42 : 0.36}
        text={mobile ? 'ESCAPE' : 'THE ART OF ESCAPE'}
        textSize={mobile ? 0.2 : 0.085}
        maxDpr={1.25}
        label="THE ART OF ESCAPE set on a rendered horizon at dusk, reflected in the sea"
      />
      <div className="finale__copy wrap">
        <h2 id="finale-title" className="sr-only">
          The art of escape
        </h2>
        <div className="finale__lock rv">
          <Logo height={mobile ? 64 : 92} tone="light" className="finale__logo" />
          <span className="label-sm finale__meta">Cairo · since 2018 · swim · linen · resort</span>
          <ConceptTag>“The art of escape” is concept copy</ConceptTag>
        </div>
        <div className="finale__ctas rv d2">
          <Link to="/shop" className="btn btn--light">
            Shop the collection <Icon.arrow />
          </Link>
          <Link to="/stores" className="btn btn--ghost">
            Find a store
          </Link>
        </div>
      </div>
    </section>
  );
}
