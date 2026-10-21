import type { CSSProperties, ReactElement } from 'react';

/**
 * Every icon is an original SVG drawing in the 2005–07 Messenger / XP idiom
 * (glossy, outlined, slightly chunky). No Microsoft artwork is used.
 */
type P = { size?: number; style?: CSSProperties };

export type Presence = 'online' | 'away' | 'busy' | 'offline' | 'blocked';

/** The little buddy figure in front of every contact (16 px). */
export function Buddy({ status = 'online', size = 16, style }: P & { status?: Presence }) {
  const body = status === 'offline' ? ['#f0a36a', '#c4581f'] : status === 'blocked' ? ['#b9c9b5', '#6f8a6b'] : ['#7fe07a', '#1e9a2b'];
  const head = status === 'offline' ? ['#f7c39a', '#c86a2c'] : status === 'blocked' ? ['#d5e0d2', '#7d977a'] : ['#a8f0a2', '#2aa636'];
  const id = `b${status}`;
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" style={style}>
      <defs>
        <radialGradient id={`${id}h`} cx="0.38" cy="0.32" r="0.75">
          <stop offset="0" stopColor="#fff" stopOpacity="0.95" />
          <stop offset="0.35" stopColor={head[0]} />
          <stop offset="1" stopColor={head[1]} />
        </radialGradient>
        <linearGradient id={`${id}b`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={body[0]} />
          <stop offset="1" stopColor={body[1]} />
        </linearGradient>
      </defs>
      <path d="M2.2 15.2c.2-3.6 2.6-6 5.8-6s5.6 2.4 5.8 6z" fill={`url(#${id}b)`} stroke="#14571a" strokeOpacity={status === 'offline' ? 0 : 0.55} strokeWidth=".6" />
      <circle cx="8" cy="5" r="3.6" fill={`url(#${id}h)`} stroke={status === 'offline' ? '#a24a15' : '#1c6e24'} strokeOpacity=".6" strokeWidth=".6" />
      {status === 'away' && (
        <g>
          <circle cx="12" cy="11.6" r="3.6" fill="#fff6c8" stroke="#c68a00" strokeWidth=".8" />
          <path d="M12 9.6v2.2l1.4.9" fill="none" stroke="#7a4f00" strokeWidth=".9" strokeLinecap="round" />
        </g>
      )}
      {status === 'busy' && (
        <g>
          <circle cx="12" cy="11.6" r="3.6" fill="#e8423a" stroke="#8d1410" strokeWidth=".7" />
          <path d="M9.9 11.6h4.2" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" />
        </g>
      )}
      {status === 'blocked' && (
        <g>
          <circle cx="12" cy="11.6" r="3.4" fill="#fff" stroke="#cf2b22" strokeWidth="1.1" />
          <path d="M9.8 13.8l4.4-4.4" stroke="#cf2b22" strokeWidth="1.1" />
        </g>
      )}
    </svg>
  );
}

/** A four-winged butterfly in the old Messenger colours (an original drawing, not the trademark artwork). */
export function Butterfly({ size = 18, style }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={style}>
      <path d="M11.6 11.6C8.8 6.6 5.2 3.6 2.6 4.8c-1.6 2.4.6 6 9 6.8z" fill="#f47b20" />
      <path d="M12.4 11.4c1.8-5.6 4.6-9.2 7.6-8.6 2.2 2-.2 6.2-7.6 8.6z" fill="#00a4ef" />
      <path d="M11.6 12.6c-6.4.2-9.6 2.6-8.8 5 1.8 1.4 5.6-.2 8.8-5z" fill="#ffb900" />
      <path d="M12.4 12.6c4.6.8 7.4 3.4 6.4 5.4-1.8 1.2-4.8-.6-6.4-5.4z" fill="#7fba00" />
    </svg>
  );
}

/** The "msn" wordmark + butterfly, drawn as live text. */
export function MsnMark({ size = 14, color = '#0b3c9e' }: { size?: number; color?: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'flex-start', fontFamily: 'Arimo, Arial, sans-serif', fontWeight: 700, fontStyle: 'italic', fontSize: size, color, letterSpacing: -0.6, lineHeight: 1 }}>
      msn
      <Butterfly size={size * 0.95} style={{ marginLeft: -1, marginTop: -size * 0.35 }} />
    </span>
  );
}

const glossyFace = (id: string, from = '#fff8b0', to = '#f6b400') => (
  <radialGradient id={id} cx="0.35" cy="0.3" r="0.8">
    <stop offset="0" stopColor={from} />
    <stop offset="0.55" stopColor="#ffd83a" />
    <stop offset="1" stopColor={to} />
  </radialGradient>
);

/** Emoticons (19 px), the glossy yellow kind. */
export function Emoticon({ kind, size = 19, style }: P & { kind: 'smile' | 'sad' | 'wink' | 'shocked' | 'heart' | 'gift' | 'nudge' }) {
  const id = `e${kind}`;
  if (kind === 'heart')
    return (
      <svg width={size} height={size} viewBox="0 0 20 20" style={style}>
        <defs>
          <radialGradient id={id} cx="0.35" cy="0.3" r="0.8">
            <stop offset="0" stopColor="#ffb3b3" />
            <stop offset="0.5" stopColor="#ff2a2a" />
            <stop offset="1" stopColor="#a80000" />
          </radialGradient>
        </defs>
        <path d="M10 17.5S2 12.4 2 7.2C2 4.6 4 2.8 6.2 2.8c1.6 0 3 .9 3.8 2.3.8-1.4 2.2-2.3 3.8-2.3C16 2.8 18 4.6 18 7.2c0 5.2-8 10.3-8 10.3z" fill={`url(#${id})`} stroke="#7a0000" strokeWidth=".8" />
        <ellipse cx="6.4" cy="6.2" rx="2.1" ry="1.3" fill="#fff" opacity=".7" transform="rotate(-30 6.4 6.2)" />
      </svg>
    );
  if (kind === 'gift')
    return (
      <svg width={size} height={size} viewBox="0 0 20 20" style={style}>
        <rect x="2.5" y="8" width="15" height="9.5" rx="1" fill="#e0457b" stroke="#8e1243" strokeWidth=".8" />
        <rect x="1.8" y="5.4" width="16.4" height="3.4" rx="1" fill="#f06a9a" stroke="#8e1243" strokeWidth=".8" />
        <rect x="8.6" y="5.4" width="2.8" height="12" fill="#ffe14d" stroke="#b58a00" strokeWidth=".5" />
        <path d="M10 5.4C8.6 2.4 5.4 2.2 5.6 4c.2 1.2 2.8 1.4 4.4 1.4zm0 0c1.4-3 4.6-3.2 4.4-1.4-.2 1.2-2.8 1.4-4.4 1.4z" fill="#ffe14d" stroke="#b58a00" strokeWidth=".6" />
      </svg>
    );
  if (kind === 'nudge')
    return (
      <svg width={size} height={size} viewBox="0 0 20 20" style={style}>
        <defs>{glossyFace(id)}</defs>
        <path d="M1.2 7.5l1.6 1-1.6 1.2 1.6 1.1M18.8 7.5l-1.6 1 1.6 1.2-1.6 1.1" fill="none" stroke="#2b5fc7" strokeWidth="1.1" />
        <circle cx="10" cy="10" r="6.6" fill={`url(#${id})`} stroke="#9a6a00" strokeWidth=".8" />
        <circle cx="7.6" cy="8.6" r="1.1" fill="#3a2600" />
        <circle cx="12.4" cy="8.6" r="1.1" fill="#3a2600" />
        <ellipse cx="10" cy="12.8" rx="2" ry="1.5" fill="#3a2600" />
      </svg>
    );
  const mouth =
    kind === 'sad' ? <path d="M6.4 14.4c1.8-2.2 5.4-2.2 7.2 0" fill="none" stroke="#3a2600" strokeWidth="1.2" strokeLinecap="round" /> :
    kind === 'shocked' ? <ellipse cx="10" cy="13.2" rx="1.8" ry="2.1" fill="#3a2600" /> :
    <path d="M6 11.8c1.6 2.8 6.4 2.8 8 0" fill="none" stroke="#3a2600" strokeWidth="1.2" strokeLinecap="round" />;
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" style={style}>
      <defs>{glossyFace(id)}</defs>
      <circle cx="10" cy="10" r="8.6" fill={`url(#${id})`} stroke="#9a6a00" strokeWidth=".8" />
      {kind === 'wink' ? <path d="M6.2 8h2.6" stroke="#3a2600" strokeWidth="1.3" strokeLinecap="round" /> : <ellipse cx="7.4" cy="7.8" rx="1.1" ry="1.5" fill="#3a2600" />}
      <ellipse cx="12.6" cy="7.8" rx="1.1" ry="1.5" fill="#3a2600" />
      {kind === 'sad' && <path d="M5.8 6.2l2.4-.8M14.2 6.2l-2.4-.8" stroke="#3a2600" strokeWidth=".9" strokeLinecap="round" />}
      {mouth}
      <ellipse cx="7" cy="4.6" rx="3" ry="1.5" fill="#fff" opacity=".55" />
    </svg>
  );
}

/** The small music note shown before "listening to" text. */
export function MusicNote({ size = 13, style }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" style={style}>
      <path d="M5 2.2l7-1.4v8.2" fill="none" stroke="#3b61c4" strokeWidth="1.3" />
      <path d="M5 2.2v8.6" stroke="#3b61c4" strokeWidth="1.3" />
      <ellipse cx="3.4" cy="11" rx="2.2" ry="1.6" fill="#4b73d8" />
      <ellipse cx="10.4" cy="9.4" rx="2.2" ry="1.6" fill="#4b73d8" />
    </svg>
  );
}

/** Conversation toolbar icons (32 px): Invite, Send Files, Video, Voice, Activities, Games. */
export function ToolIcon({ kind, size = 32 }: { kind: 'invite' | 'files' | 'video' | 'voice' | 'activities' | 'games'; size?: number }) {
  const person = (x: number, y: number, s: number, c1 = '#58c35a', c2 = '#1f8a2c') => (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M2 22c.4-6 4-10 9-10s8.6 4 9 10z" fill={c1} stroke={c2} strokeWidth="1" />
      <circle cx="11" cy="7" r="5.4" fill={c1} stroke={c2} strokeWidth="1" />
      <circle cx="9" cy="5.2" r="1.8" fill="#fff" opacity=".6" />
    </g>
  );
  const shapes: Record<string, ReactElement> = {
    invite: (
      <g>
        {person(1, 7, 1)}
        <path d="M19 3h10a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-6l-3 3v-3h-1a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" fill="#fff" stroke="#5a7bc4" strokeWidth="1.1" />
        <path d="M21 7h7M21 9.5h5" stroke="#9bb0dc" strokeWidth="1.1" />
      </g>
    ),
    files: (
      <g>
        <rect x="3" y="9" width="22" height="18" rx="2" fill="#5ba0e6" stroke="#2b5d9e" strokeWidth="1" transform="rotate(-8 14 18)" />
        <rect x="7" y="6" width="22" height="18" rx="2" fill="#f8fbff" stroke="#6b8fc8" strokeWidth="1" />
        <rect x="9.5" y="8.5" width="17" height="11" fill="#8ed16b" />
        <path d="M9.5 19.5l5-6 4 4 3-3 5 5z" fill="#3f8f3a" />
        <circle cx="22.5" cy="11.5" r="1.8" fill="#ffe35a" />
      </g>
    ),
    video: (
      <g>
        <rect x="3" y="4" width="24" height="18" rx="2" fill="#dfe9f8" stroke="#5470a8" strokeWidth="1.1" />
        <rect x="5.5" y="6.5" width="19" height="13" fill="#6fa0e0" />
        {person(9.6, 8.4, 0.5, '#f4c38f', '#b07440')}
        <path d="M11 22h8l2 5H9z" fill="#b9c6dd" stroke="#5470a8" strokeWidth="1" />
        <circle cx="25" cy="7" r="4.2" fill="#fff" stroke="#5470a8" strokeWidth="1" />
        <circle cx="25" cy="7" r="2" fill="#2c3e66" />
      </g>
    ),
    voice: (
      <g>
        {person(4, 8, 1, '#7d97b7', '#3f5a80')}
        <path d="M7 13a8 8 0 0 1 16 0" fill="none" stroke="#2a2f3a" strokeWidth="2.2" />
        <rect x="4.8" y="12" width="4" height="6" rx="1.6" fill="#3b4456" />
        <rect x="21.2" y="12" width="4" height="6" rx="1.6" fill="#3b4456" />
        <path d="M23 18c0 3-3 4-6 4" fill="none" stroke="#2a2f3a" strokeWidth="1.4" />
      </g>
    ),
    activities: (
      <g>
        <rect x="3" y="12" width="11" height="15" rx="2" fill="#3fa4f0" stroke="#1b5f9e" strokeWidth="1" transform="rotate(-14 8 19)" />
        <rect x="11" y="6" width="11" height="17" rx="2" fill="#9a5cd8" stroke="#5a2a92" strokeWidth="1" />
        <rect x="18" y="10" width="11" height="16" rx="2" fill="#ef6db0" stroke="#9a2565" strokeWidth="1" transform="rotate(12 23 18)" />
        <circle cx="16.5" cy="12" r="2.4" fill="#fff" opacity=".75" />
      </g>
    ),
    games: (
      <g>
        <rect x="12" y="3" width="15" height="21" rx="2" fill="#fff" stroke="#7a7a7a" strokeWidth="1" transform="rotate(14 19 13)" />
        <path d="M19.8 8.6c2.4 2.4 3.4 4 1.6 5.6-1 .8-2.2.4-2.4-.6l.4 2.6h-2l.8-2.6c-.6 1-2 1.2-2.8.2-1.2-1.6.4-3.2 4.4-5.2z" fill="#222" transform="rotate(14 19 13)" />
        {person(1, 8, 0.95, '#5ab0e8', '#1f6aa8')}
        <path d="M3 14l4-6 3 5z" fill="#f4c542" stroke="#a37a00" strokeWidth=".8" />
      </g>
    ),
  };
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      {shapes[kind]}
    </svg>
  );
}

/** The input toolbar's font "A". */
export function FontA({ size = 20 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20">
      <text x="3" y="17" fontFamily="Georgia, serif" fontSize="18" fontWeight="700" fill="#1a2f6e">
        A
      </text>
    </svg>
  );
}

/** Small toolbar glyphs: voice clip speaker, picture (backgrounds), down-arrow. */
export function Glyph({ kind, size = 16 }: { kind: 'speaker' | 'picture' | 'down' | 'mail' | 'block' | 'brush' | 'pen'; size?: number }) {
  const s: Record<string, ReactElement> = {
    speaker: (
      <g>
        <circle cx="8" cy="8" r="7" fill="#fff" stroke="#55627a" strokeWidth="1" />
        <path d="M4 6.4h2l3-2.4v8L6 9.6H4z" fill="#2c3340" />
        <path d="M10.6 5.4c1.4 1.4 1.4 3.8 0 5.2" fill="none" stroke="#2c3340" strokeWidth="1" />
      </g>
    ),
    picture: (
      <g>
        <rect x="1.5" y="2.5" width="13" height="11" fill="#fff" stroke="#57708f" strokeWidth="1" />
        <path d="M3 12l3.4-4.4 2.6 3 2-2 2 3.4z" fill="#3f7d3a" />
        <rect x="3" y="4" width="10" height="4" fill="#9cc7f0" opacity=".7" />
      </g>
    ),
    down: <path d="M4 6h8l-4 4.6z" fill="#333" />,
    mail: (
      <g>
        <rect x="1.5" y="3.5" width="13" height="9" rx="1" fill="#f4f7fd" stroke="#6d84ad" strokeWidth="1" />
        <path d="M1.8 4l6.2 5 6.2-5" fill="none" stroke="#6d84ad" strokeWidth="1" />
      </g>
    ),
    block: (
      <g>
        <circle cx="8" cy="8" r="7" fill="#f3e6e6" stroke="#9a5a5a" strokeWidth="1" />
        <circle cx="8" cy="8" r="4.2" fill="none" stroke="#c0392b" strokeWidth="1.6" />
        <path d="M5 11l6-6" stroke="#c0392b" strokeWidth="1.6" />
      </g>
    ),
    brush: (
      <g>
        <circle cx="8" cy="8" r="7" fill="#eef3fb" stroke="#6d84ad" strokeWidth="1" />
        <path d="M11.6 3.6L7 9.2l1 1 5-4.8z" fill="#9db4dd" stroke="#4e6aa0" strokeWidth=".6" />
        <path d="M7 9.2c-1.6.2-2.4 1.4-2.6 3 1.6 0 2.8-.6 3.6-2z" fill="#3e5da8" />
      </g>
    ),
    pen: <path d="M3 13l1-3.6 6.6-6.6 2.6 2.6-6.6 6.6zM10.2 3.6l2.6 2.6" fill="#fdf3c4" stroke="#4b4b4b" strokeWidth=".9" />,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 16 16">
      {s[kind]}
    </svg>
  );
}

/** Desktop icons (36 px): original drawings in the XP manner. */
export function DesktopIcon({ kind, size = 36 }: { kind: 'computer' | 'documents' | 'recycle' | 'internet' | 'messenger' | 'music'; size?: number }) {
  const d: Record<string, ReactElement> = {
    computer: (
      <g>
        <rect x="5" y="4" width="26" height="20" rx="2" fill="#e8e6dc" stroke="#6c6a60" strokeWidth="1" />
        <rect x="8" y="7" width="20" height="14" fill="#2e6fd8" />
        <path d="M8 7h20v5c-6 2-14 2-20 0z" fill="#5f9cf0" />
        <path d="M13 24h10l2 5H11z" fill="#d6d3c6" stroke="#6c6a60" strokeWidth="1" />
        <rect x="6" y="29" width="24" height="4" rx="1" fill="#e8e6dc" stroke="#6c6a60" strokeWidth="1" />
      </g>
    ),
    documents: (
      <g>
        <path d="M3 9h12l2 3h16v19H3z" fill="#f3d36a" stroke="#a37c16" strokeWidth="1" />
        <rect x="9" y="5" width="18" height="16" fill="#fff" stroke="#8a8a8a" strokeWidth=".8" transform="rotate(6 18 13)" />
        <path d="M3 15h30v16H3z" fill="#f8de7c" stroke="#a37c16" strokeWidth="1" />
      </g>
    ),
    recycle: (
      <g>
        <path d="M8 9h20l-2 23H10z" fill="#dfe8f2" stroke="#5f7184" strokeWidth="1" />
        <ellipse cx="18" cy="9" rx="10.5" ry="2.6" fill="#c9d6e4" stroke="#5f7184" strokeWidth="1" />
        <path d="M13 14l1 15M18 14v15M23 14l-1 15" stroke="#9fb0c2" strokeWidth="1.2" />
        <path d="M14 21l3-4 3 4" fill="none" stroke="#2f9a41" strokeWidth="1.6" />
      </g>
    ),
    internet: (
      <g>
        <circle cx="18" cy="18" r="12" fill="#3f8fe0" stroke="#1d4f99" strokeWidth="1" />
        <path d="M9 14c4-2 6 2 9 1s3-5 7-3c1 3-2 5-4 6s-1 6-5 7-3-4-6-5-4-3-1-6z" fill="#5cbf4a" />
        <ellipse cx="14" cy="11" rx="5" ry="2.4" fill="#fff" opacity=".35" />
        <path d="M4 22c8-10 20-12 30-6" fill="none" stroke="#ffd34d" strokeWidth="2.2" />
      </g>
    ),
    messenger: (
      <g>
        <path d="M5 33c.6-8 5-12.6 11-12.6S26.4 25 27 33z" fill="#55c35b" stroke="#1d8a2a" strokeWidth="1" />
        <circle cx="16" cy="12.6" r="7" fill="#7fd876" stroke="#1d8a2a" strokeWidth="1" />
        <path d="M22 24c2-6 6-9 9-7-1 4-4 6-9 7z" fill="#f47b20" />
        <path d="M23 26c4-1 7 0 8 3-2 1-6 0-8-3z" fill="#00a4ef" />
      </g>
    ),
    music: (
      <g>
        <rect x="4" y="4" width="28" height="28" rx="3" fill="#e6effa" stroke="#57709b" strokeWidth="1" />
        <path d="M14 9l12-2.4v14" fill="none" stroke="#3456b8" strokeWidth="2" />
        <path d="M14 9v15" stroke="#3456b8" strokeWidth="2" />
        <ellipse cx="11.4" cy="24.4" rx="3.4" ry="2.6" fill="#3456b8" />
        <ellipse cx="23.4" cy="21" rx="3.4" ry="2.6" fill="#3456b8" />
      </g>
    ),
  };
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" style={{ filter: 'drop-shadow(1px 1px 1px rgba(0,0,0,.45))' }}>
      {d[kind]}
    </svg>
  );
}

/** A four-colour waving flag for the Start button (an original drawing). */
export function StartFlag({ size = 18 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20">
      <path d="M2.5 4.2c2.4-1.2 4.4-1 6.6.2L8 9.4c-2.2-1.2-4.2-1.4-6.6-.2z" fill="#f65314" />
      <path d="M10 4.8c2.2 1.2 4.4 1.2 6.8 0l-1.2 5c-2.4 1.2-4.6 1.2-6.8 0z" fill="#7cbb00" />
      <path d="M1.2 10.2c2.4-1.2 4.4-1 6.6.2l-1.2 5c-2.2-1.2-4.2-1.4-6.6-.2z" fill="#00a1f1" />
      <path d="M8.6 10.8c2.2 1.2 4.4 1.2 6.8 0l-1.2 5c-2.4 1.2-4.6 1.2-6.8 0z" fill="#ffbb00" />
    </svg>
  );
}

/** The arrow mouse pointer. */
export function Pointer({ size = 20 }: P) {
  return (
    <svg width={size} height={size * 1.5} viewBox="0 0 12 18" style={{ filter: 'drop-shadow(1px 1.5px 0.6px rgba(0,0,0,.4))' }}>
      <path d="M.6.6v14.8l3.6-3.4 2.4 5.2 2.2-1-2.4-5.1h4.8z" fill="#fff" stroke="#000" strokeWidth=".9" strokeLinejoin="round" />
    </svg>
  );
}
