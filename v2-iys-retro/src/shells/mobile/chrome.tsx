import { useEffect, useId, useRef, useState } from 'react';
import { create } from 'zustand';

/** A screen can claim the centre soft key (e.g. product → ADD). */
export interface SoftAction {
  label: string;
  run: () => void;
  disabled?: boolean;
}
interface CenterState {
  stack: { id: string; action: SoftAction }[];
  action: SoftAction | null;
  put: (id: string, a: SoftAction | null) => void;
}
/** Claims stack: the most recently mounted screen/overlay owns the key. */
export const useCenterKey = create<CenterState>()((set) => ({
  stack: [],
  action: null,
  put: (id, a) =>
    set((st) => {
      const rest = st.stack.filter((x) => x.id !== id);
      const idx = st.stack.findIndex((x) => x.id === id);
      const stack = a ? (idx >= 0 ? st.stack.map((x) => (x.id === id ? { id, action: a } : x)) : [...rest, { id, action: a }]) : rest;
      return { stack, action: stack[stack.length - 1]?.action ?? null };
    }),
}));

export function useClaimCenter(action: SoftAction | null) {
  const id = useId();
  const put = useCenterKey((s) => s.put);
  const run = useRef(action?.run);
  run.current = action?.run;
  const has = Boolean(action);
  const label = action?.label ?? '';
  const disabled = action?.disabled ?? false;
  useEffect(() => {
    put(id, has ? { label, disabled, run: () => run.current?.() } : null);
  }, [id, has, label, disabled, put]);
  useEffect(() => () => put(id, null), [id, put]);
}

function Signal() {
  return (
    <svg width="22" height="14" viewBox="0 0 22 14" aria-hidden="true" shapeRendering="crispEdges">
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x={i * 4.5} y={12 - (i + 1) * 2.4} width="3" height={(i + 1) * 2.4} fill="#fff" />
      ))}
    </svg>
  );
}
function Battery() {
  return (
    <svg width="26" height="13" viewBox="0 0 26 13" aria-hidden="true" shapeRendering="crispEdges">
      <rect x="0.5" y="0.5" width="22" height="12" fill="none" stroke="#fff" />
      <rect x="23" y="4" width="2.5" height="5" fill="#fff" />
      <rect x="2.5" y="2.5" width="5" height="8" fill="#7dff9a" />
      <rect x="8.5" y="2.5" width="5" height="8" fill="#7dff9a" />
      <rect x="14.5" y="2.5" width="5" height="8" fill="#7dff9a" />
    </svg>
  );
}

export function StatusBar() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 20_000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="m-status" role="presentation">
      <span className="m-status__left">
        <Signal /> <b>IYS</b>
      </span>
      <span className="m-status__time" aria-label={`Time ${now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`}>
        {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
      <span className="m-status__right">
        <span className="m-status__target">2006</span>
        <Battery />
      </span>
    </div>
  );
}
