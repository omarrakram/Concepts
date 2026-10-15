import { Link } from 'react-router';
import { FACTS, SOURCES } from '../data/brand';
import { Icon, Kicker } from '../components/ui';
import { LIGHTS, mixLight, seaStill } from '../gl/sea';
import { useIdleValue, useReveal } from '../lib/hooks';

/** 01 — The KAI philosophy: the name, the ocean, Cairo. Every statement is sourced. */
export function Philosophy() {
  const [ref, inView] = useReveal<HTMLElement>();
  const still = useIdleValue(() => seaStill('philo', 720, 960, { light: mixLight(LIGHTS.morning, LIGHTS.noon, 0.25), time: 12.4, horizon: 0.46, calm: 0.7 }), [], inView);
  return (
    <section id="philosophy" ref={ref} className={`philo wrap ${inView ? 'is-in' : ''}`} data-testid="philosophy">
      <Kicker n="01">The KAI philosophy</Kicker>
      <div className="philo__grid">
        <div className="philo__main">
          <h2 className="display philo__h">
            <span className="mask-up">
              <span>Kai is the Hawaiian</span>
            </span>{' '}
            <span className="mask-up">
              <span>
                word for <span className="italic philo__ocean">ocean.</span>
              </span>
            </span>
          </h2>
          <p className="philo__lede serif rv d1">
            A premium swimwear and resort wear brand, founded in 2018 — designed and produced locally in Cairo, for men, women and children.
          </p>
          <div className="philo__facts">
            {[
              ['2018', 'Founded', 'Started by Karim Safadi as a locally made alternative to imported men’s swimwear.'],
              ['Cairo', 'Made locally', 'Designed and produced in Cairo, built on quality, integrity and local empowerment.'],
              ['Three', 'Wardrobes', 'Swimwear, linen sets, knitwear and seasonal winterwear — for men, women and children.'],
            ].map(([n, t, d], i) => (
              <div key={t} className={`philo__fact rv d${i + 2}`}>
                <div className="display philo__n">{n}</div>
                <div className="label-sm">{t}</div>
                <p className="muted">{d}</p>
              </div>
            ))}
          </div>
          <figure className="philo__quote rv d3">
            <blockquote className="serif italic">“{FACTS.homeLine.text.replace(/\.$/, '')}.”</blockquote>
            <figcaption className="label-sm muted">
              KAI, on its own homepage ·{' '}
              <a href={SOURCES.home} target="_blank" rel="noopener noreferrer" className="link-u">
                source
              </a>
            </figcaption>
          </figure>
        </div>
        <aside className="philo__side rv d2">
          <div className="philo__def">
            <div className="philo__word">
              <span className="display">kai</span>
              <span className="serif italic muted">/kaɪ/</span>
            </div>
            <div className="label-sm muted">Hawaiian · noun</div>
            <p className="serif">The sea; the ocean.</p>
            <Icon.wave />
            <p className="philo__name muted">{FACTS.name.text}</p>
          </div>
          <figure className="philo__still">
            {still ? <img src={still} alt="Rendered light study: calm morning sea under a high horizon" /> : <div className="philo__ph" />}
            <figcaption className="label-sm">Light study · morning · rendered</figcaption>
          </figure>
        </aside>
      </div>
      <p className="philo__src label-sm muted">
        Sources: KAI About Us · CairoScene (2018) · Flair Magazine (2018). See{' '}
        <Link className="link-u" to="/about">
          About
        </Link>{' '}
        for links.
      </p>
    </section>
  );
}
