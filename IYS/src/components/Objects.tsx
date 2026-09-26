/**
 * Physical props drawn in SVG — hangers, pegs, pins, tags, doodles.
 * Hand-built so every room shares the same object language.
 */

export function Hanger({ className = '' }: { className?: string }) {
  return (
    <svg className={`hanger ${className}`} viewBox="0 0 200 84" aria-hidden="true">
      <path d="M100 38 V25 C100 15 108 9 115 12 C122 15 121 24 113 26" fill="none" stroke="#8c9194" strokeWidth="4.5" strokeLinecap="round" />
      <path
        d="M100 38 L14 72 C7 75 8 81 15 81 H185 C192 81 193 75 186 72 Z"
        fill="none"
        stroke="var(--hanger, #b07a47)"
        strokeWidth="7"
        strokeLinejoin="round"
      />
      <circle cx="100" cy="38" r="5" fill="#8c9194" />
    </svg>
  );
}

/** Wooden clothes peg. `open` rotates the jaws apart. */
export function Peg({ open = false, className = '' }: { open?: boolean; className?: string }) {
  return (
    <svg className={`peg ${open ? 'is-open' : ''} ${className}`} viewBox="0 0 28 74" aria-hidden="true">
      <g className="peg__l">
        <rect x="4" y="2" width="9" height="70" rx="3.5" fill="#d9b27c" stroke="#9c7443" strokeWidth="1.2" />
      </g>
      <g className="peg__r">
        <rect x="15" y="2" width="9" height="70" rx="3.5" fill="#e3bf8b" stroke="#9c7443" strokeWidth="1.2" />
      </g>
      <circle cx="14" cy="30" r="6.5" fill="none" stroke="#7f8589" strokeWidth="2.4" />
    </svg>
  );
}

export function SafetyPin({ className = '' }: { className?: string }) {
  return (
    <svg className={`safety-pin ${className}`} viewBox="0 0 90 22" aria-hidden="true">
      <path
        d="M8 11 C8 5 14 4 17 7 L78 7 C84 7 86 11 86 11 C86 11 84 15 78 15 L20 15"
        fill="none"
        stroke="#9aa1a5"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle cx="11" cy="11" r="4.2" fill="none" stroke="#9aa1a5" strokeWidth="2.4" />
      <rect x="70" y="4" width="17" height="14" rx="4" fill="#c4cacd" stroke="#8a9195" strokeWidth="1.4" />
    </svg>
  );
}

/** Hand-drawn arrow in ballpoint. */
export function Arrow({ className = '', d = 'M6 30 C30 6 70 4 96 22' }: { className?: string; d?: string }) {
  return (
    <svg className={`doodle ${className}`} viewBox="0 0 110 44" aria-hidden="true">
      <path d={d} fill="none" stroke="var(--pen)" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M84 12 L97 23 L81 28" fill="none" stroke="var(--pen)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Scribbled circle — for "this one". */
export function Circle({ className = '' }: { className?: string }) {
  return (
    <svg className={`doodle ${className}`} viewBox="0 0 200 90" preserveAspectRatio="none" aria-hidden="true">
      <path
        d="M24 52 C18 22 90 6 150 14 C196 20 196 66 140 78 C92 88 26 80 14 56 C6 38 40 20 70 16"
        fill="none"
        stroke="var(--pen)"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Underline({ className = '' }: { className?: string }) {
  return (
    <svg className={`doodle ${className}`} viewBox="0 0 200 16" preserveAspectRatio="none" aria-hidden="true">
      <path d="M4 10 C50 4 120 4 196 8 M20 14 C80 10 140 11 180 12" fill="none" stroke="var(--pen)" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

export function Heart({ filled = false }: { filled?: boolean }) {
  return (
    <svg viewBox="0 0 32 30" aria-hidden="true" className="heart-ico">
      <path
        d="M16 27 C6 20 2 14 3.5 8.5 C5 3.5 11 2 16 7.5 C21 2 27 3.5 28.5 8.5 C30 14 26 20 16 27 Z"
        fill={filled ? 'var(--tomato)' : 'none'}
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" width="22" height="22">
      <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="2.2" />
      <path d="M15.5 15.5 L21 21" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

/** The IYS shopping bag, as an icon — the count is printed on it. */
export function BagIcon({ count }: { count: number }) {
  return (
    <svg viewBox="0 0 34 38" aria-hidden="true" width="30" height="34" className="bag-ico">
      <path d="M11 12 V9 C11 4 23 4 23 9 V12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M4 12 H30 L28 35 H6 Z" fill="var(--card)" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
      <text x="17" y="29" textAnchor="middle" fontFamily="var(--f-mono)" fontSize="11" fontWeight="500" fill="currentColor">
        {String(count).padStart(2, '0')}
      </text>
    </svg>
  );
}

export function Close() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path d="M5 5 L19 19 M19 5 L5 19" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}
