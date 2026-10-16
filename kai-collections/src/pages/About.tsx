import { useEffect } from 'react';
import { Link } from 'react-router';
import { Icon, Kicker } from '../components/ui';
import { FACTS, SOURCES } from '../data/brand';
import { PRODUCTS, SNAPSHOT } from '../data/catalog';
import { useIdleValue } from '../lib/hooks';
import { LIGHTS, seaStill } from '../gl/sea';

const TIMELINE: { y: string; t: string; d: string; src: keyof typeof SOURCES }[] = [
  { y: '2018', t: 'KAI is founded', d: 'Karim Safadi starts KAI in Cairo as a premium men’s swimwear label, made locally.', src: 'egyptianStreets' },
  { y: '2018', t: 'A name with three meanings', d: 'The Hawaiian word for ocean, a shortening of Cairo, and the K of its founder’s first name.', src: 'flair' },
  { y: 'Since', t: 'From swim to wardrobe', d: 'Swimwear for men, women and children, then linen sets, knitwear and seasonal winterwear.', src: 'about' },
  { y: 'Today', t: 'Egypt and the UAE', d: 'Flagships in Cairo’s malls, seasonal stores on the North Coast, and a UAE storefront.', src: 'about' },
  { y: 'SS26', t: 'This summer', d: 'KAI’s SS26 men’s swimwear collection is live on kaicollections.com.', src: 'home' },
];

export function About() {
  useEffect(() => {
    document.title = 'About KAI — KAI concept';
  }, []);
  const still = useIdleValue(() => seaStill('about-hero', 1800, 1000, { light: LIGHTS.morning, time: 2.2, horizon: 0.36, calm: 0.7 }), []);
  return (
    <div className="about" data-testid="about">
      <header className="about-head" style={still ? { backgroundImage: `url(${still})` } : undefined}>
        <div className="wrap about-head__in">
          <Kicker>About KAI</Kicker>
          <h1 className="display about-head__t">
            Kai, <span className="italic">the ocean.</span>
          </h1>
          <p className="serif about-head__lede">{FACTS.meaning.text}</p>
        </div>
      </header>
      <section className="about-intro wrap">
        <p className="display about-big">
          A premium swimwear and resort wear brand, founded in 2018 and designed and produced locally in Cairo — for men, women and children.
        </p>
        <div className="about-cols">
          <div>
            <div className="label-sm muted">Values</div>
            <p className="serif">{FACTS.values.text}</p>
          </div>
          <div>
            <div className="label-sm muted">Range</div>
            <p className="serif">{FACTS.range.text}</p>
          </div>
          <div>
            <div className="label-sm muted">Presence</div>
            <p className="serif">{FACTS.presence.text}</p>
          </div>
        </div>
      </section>
      <section className="timeline wrap" aria-labelledby="tl">
        <h2 id="tl" className="label">
          A short history
        </h2>
        <ol>
          {TIMELINE.map((t) => (
            <li key={t.t}>
              <span className="display timeline__y">{t.y}</span>
              <div>
                <div className="serif timeline__t">{t.t}</div>
                <p className="muted">{t.d}</p>
                <a href={SOURCES[t.src]} target="_blank" rel="noopener noreferrer" className="label-sm link-u muted">
                  Source <Icon.out />
                </a>
              </div>
            </li>
          ))}
        </ol>
      </section>
      <section className="about-concept wrap" aria-labelledby="ac">
        <h2 id="ac" className="display about-h2">
          About <span className="italic">this concept</span>
        </h2>
        <div className="about-concept__grid">
          <div>
            <h3 className="label">What it is</h3>
            <p>
              <strong>KAI — The Art of Escape</strong> is an unofficial, speculative redesign by Omar Akram. It is not affiliated with KAI Collections and sells nothing:
              the bag is local to your browser and every purchase link opens the piece on kaicollections.com.
            </p>
          </div>
          <div>
            <h3 className="label">What is real</h3>
            <p>
              All {PRODUCTS.length} products of KAI’s SS26 collections — names, prices, sizes, availability, composition and photographs — read directly from KAI’s
              storefront on {SNAPSHOT.checkedAt}. Campaign photographs and the logo are KAI’s own, shown from KAI’s servers. Brand facts are quoted from KAI’s About Us
              page and 2018 press; stores come from KAI’s store list.
            </p>
          </div>
          <div>
            <h3 className="label">What is not</h3>
            <p>
              “The art of escape”, chapter names and journal text are concept copy. Seascapes are rendered light studies. Sets are grouped from KAI’s own Matching Sets
              collections and shared print names. The garment sketches behind the “Sketch” toggle are concept drawings, labelled as such.
            </p>
          </div>
          <div>
            <h3 className="label">Rights</h3>
            <p>
              KAI’s photographs and logo are not stored in this concept’s repository; the browser loads them from kaicollections.com’s CDN. Publishing this concept
              publicly needs KAI’s permission — a build with <code>VITE_KAI_MEDIA=off</code> leaves every KAI-hosted image out.
            </p>
          </div>
        </div>
        <div className="about-src">
          <div className="label-sm muted">Sources</div>
          <ul>
            {Object.entries(SOURCES).map(([k, v]) => (
              <li key={k}>
                <a href={v} target="_blank" rel="noopener noreferrer" className="link-u">
                  {v.replace('https://', '')}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <Link to="/shop" className="btn">
          Explore the collection <Icon.arrow />
        </Link>
      </section>
    </div>
  );
}
