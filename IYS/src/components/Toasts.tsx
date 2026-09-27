import { useStore } from '../lib/store';

/** Little notes that get stuck to the corner of the screen. */
export function Toasts() {
  const { toasts } = useStore();
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((t, i) => (
        <p key={t.id} className="toast hand" style={{ '--r': `${i % 2 ? 2.5 : -3}deg` } as React.CSSProperties}>
          {t.text}
        </p>
      ))}
    </div>
  );
}
