import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createSea, cssFallback, wordmarkCanvas, type Light, type SeaRenderer } from '../gl/sea';
import { usePrefersReducedMotion } from '../lib/hooks';

export interface SeascapeProps {
  light: Light;
  horizon?: number;
  sand?: number;
  calm?: number;
  /** Controlled clock (seconds). When set, the scene renders only when props change. */
  time?: number;
  /** Text standing on the horizon and reflected in the water. */
  text?: string;
  textSize?: number;
  textOn?: number;
  textLift?: number;
  /** Generate the wordmark for this horizon and follow the live horizon by offset (no texture rebuilds). */
  textHorizon?: number;
  interactive?: boolean;
  sunShift?: number;
  glow?: number;
  grain?: number;
  maxDpr?: number;
  className?: string;
  label?: string;
}

/** Live WebGL sea. Pauses off-screen, renders a single still frame under reduced motion. */
export function Seascape({
  light,
  horizon = 0.42,
  sand = 0,
  calm = 1,
  time,
  text,
  textSize = 0.42,
  textOn = 1,
  textLift = 0,
  textHorizon,
  interactive = false,
  sunShift = 0,
  glow = 1,
  grain = 0.022,
  maxDpr = 1.5,
  className,
  label = 'Rendered light study: sea and horizon',
}: SeascapeProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const sea = useRef<SeaRenderer | null>(null);
  const [failed, setFailed] = useState(false);
  const [size, setSize] = useState<[number, number]>([0, 0]);
  const reduced = usePrefersReducedMotion();
  const visible = useRef(true);
  const pointer = useRef<[number, number]>([0, 0]);
  const target = useRef<[number, number]>([0, 0]);
  const props = useRef({ light, horizon, sand, calm, time, textOn, textLift, sunShift, glow, grain });
  props.current = { light, horizon, sand, calm, time, textOn, textLift, sunShift, glow, grain };
  const t0 = useRef(performance.now());
  const draw = useRef<() => void>(() => {});

  // create context
  useEffect(() => {
    const c = ref.current!;
    try {
      sea.current = createSea(c);
      if (!sea.current) setFailed(true);
    } catch {
      setFailed(true);
    }
    const ro = new ResizeObserver(([e]) => {
      const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
      const w = Math.max(2, Math.round(e.contentRect.width * dpr));
      const h = Math.max(2, Math.round(e.contentRect.height * dpr));
      setSize([w, h]);
    });
    ro.observe(c);
    const io = new IntersectionObserver(([e]) => (visible.current = e.isIntersecting), { rootMargin: '120px' });
    io.observe(c);
    return () => {
      ro.disconnect();
      io.disconnect();
      sea.current?.dispose();
      sea.current = null;
    };
  }, [maxDpr]);

  draw.current = () => {
    const s = sea.current;
    if (!s || !size[0]) return;
    const P = props.current;
    const now = P.time ?? (reduced ? 4.2 : (performance.now() - t0.current) / 1000);
    s.render({
      light: P.light,
      time: now,
      horizon: P.horizon,
      sand: P.sand,
      calm: P.calm,
      pointer: pointer.current,
      textOn: text ? P.textOn : 0,
      textLift: P.textLift + (textHorizon !== undefined ? textHorizon - P.horizon : 0),
      sunShift: P.sunShift,
      glow: P.glow,
      grain: P.grain,
    });
    ref.current!.dataset.ready = '1';
  };

  // size + wordmark texture
  useEffect(() => {
    const s = sea.current;
    if (!s || !size[0]) return;
    s.resize(size[0], size[1]);
    let cancelled = false;
    if (text) {
      const make = () => {
        if (cancelled) return;
        s.setText(wordmarkCanvas(size[0], size[1], textHorizon ?? props.current.horizon, text, textSize));
        draw.current();
      };
      if (document.fonts?.load) document.fonts.load(`300 64px "Fraunces Variable"`).then(make, make);
      else make();
    } else s.setText(null);
    draw.current();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, text, textSize, textHorizon === undefined ? horizon : textHorizon]);

  // controlled (film) or reduced motion: draw synchronously on every change
  useLayoutEffect(() => {
    if (time !== undefined || reduced) draw.current();
  });

  // live loop
  useEffect(() => {
    if (time !== undefined || reduced) return;
    let raf = 0;
    const tick = () => {
      if (visible.current && !document.hidden) {
        const tp = target.current;
        const p = pointer.current;
        p[0] += (tp[0] - p[0]) * 0.05;
        p[1] += (tp[1] - p[1]) * 0.05;
        draw.current();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [time, reduced]);

  // pointer
  useEffect(() => {
    if (!interactive) return;
    const onMove = (e: PointerEvent) => {
      target.current = [(e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1];
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [interactive]);

  return (
    <div className={`seascape ${className ?? ''}`} style={failed ? { background: cssFallback(light, horizon) } : undefined}>
      <canvas ref={ref} role="img" aria-label={label} style={failed ? { opacity: 0 } : undefined} />
    </div>
  );
}
