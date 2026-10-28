import type { CSSProperties, ReactNode } from 'react';
import { UI } from '../fonts';
import { DesktopIcon, StartFlag } from './icons';
import { IE_BARS, ieLayout } from './ie-geometry';
import { MenuBar, Scrollbar, XPWindow } from './xp';

/**
 * Internet Explorer 6 on XP (the default browser on her PC in 2007), drawn
 * from scratch in the same way as the Messenger windows: the menu bar with
 * the flag "throbber", the Standard Buttons toolbar, the Address bar, the
 * page with IE's always-visible scrollbar, and the status bar ("Opening
 * page …" with a progress bar while loading, then "Done"). The bar heights
 * live in ie-geometry.ts, so a story can place things on the page.
 */

const sunken: CSSProperties = { boxSizing: 'border-box', borderTop: '1px solid #aca899', borderLeft: '1px solid #aca899', borderBottom: '1px solid #fff', borderRight: '1px solid #fff' };

export function IEWindow({
  win,
  title,
  url,
  loading,
  progress,
  status,
  canGoBack,
  frame,
  inactive,
  children,
}: {
  win: { x: number; y: number; w: number; h: number };
  /** The page's title (the window adds " - Microsoft Internet Explorer"). */
  title: string;
  url: string;
  loading: boolean;
  /** 0..1 while loading. */
  progress: number;
  status: string;
  canGoBack: boolean;
  frame: number;
  /** another window has the focus */
  inactive?: boolean;
  children: ReactNode;
}) {
  const page = ieLayout(win);
  return (
    <XPWindow
      title={`${title} - Microsoft Internet Explorer`}
      icon={<DesktopIcon kind="internet" size={16} />}
      inactive={inactive}
      style={{ left: win.x, top: win.y, width: win.w, height: win.h }}
      bodyStyle={{ background: '#ece9d8' }}
    >
      <div style={{ height: IE_BARS.menu, boxSizing: 'border-box', display: 'flex', alignItems: 'stretch', borderBottom: '1px solid #d6d2c2' }}>
        <MenuBar items={['File', 'Edit', 'View', 'Favorites', 'Tools', 'Help']} style={{ flex: 1, height: IE_BARS.menu - 1, borderBottom: 'none' }} />
        <Throbber spinning={loading} frame={frame} />
      </div>
      <Toolbar canGoBack={canGoBack} />
      <AddressBar url={url} />
      <div style={{ height: page.h, display: 'flex', background: '#fff' }}>
        <div style={{ width: page.w, height: page.h, position: 'relative', overflow: 'hidden' }}>{children}</div>
        {/* IE 6 always drew the vertical scrollbar, even when the page fitted */}
        <Scrollbar height={page.h} />
      </div>
      <div style={{ height: IE_BARS.status, boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 2, padding: '2px 2px 1px', borderTop: '1px solid #fff', background: '#ece9d8', fontFamily: UI, fontSize: 11 }}>
        <div style={{ ...sunken, flex: 1, minWidth: 0, height: '100%', display: 'flex', alignItems: 'center', gap: 4, padding: '0 4px', whiteSpace: 'nowrap', overflow: 'hidden' }}>
          {loading ? <DesktopIcon kind="internet" size={13} /> : <PageGlyph size={13} />}
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{status}</span>
        </div>
        <div style={{ ...sunken, width: 96, height: '100%', padding: 2 }}>{loading && <Progress value={progress} />}</div>
        <div style={{ ...sunken, width: 20, height: '100%' }} />
        <div style={{ ...sunken, width: 20, height: '100%' }} />
        <div style={{ ...sunken, width: 104, height: '100%', display: 'flex', alignItems: 'center', gap: 5, padding: '0 6px' }}>
          <DesktopIcon kind="internet" size={13} />
          Internet
        </div>
      </div>
    </XPWindow>
  );
}

/** The flag in the menu-bar corner; it waves while a page loads. */
function Throbber({ spinning, frame }: { spinning: boolean; frame: number }) {
  const skew = spinning ? Math.sin(frame * 0.9) * 9 : 0;
  return (
    <div style={{ width: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', borderLeft: '1px solid #d6d2c2' }}>
      <div style={{ transform: `skewY(${skew}deg) scale(${spinning ? 0.96 + 0.04 * Math.cos(frame * 0.9) : 1})`, lineHeight: 0 }}>
        <StartFlag size={18} />
      </div>
    </div>
  );
}

function Toolbar({ canGoBack }: { canGoBack: boolean }) {
  const label: CSSProperties = { fontFamily: UI, fontSize: 11, color: '#000', whiteSpace: 'nowrap' };
  const drop = (
    <svg width="7" height="4" viewBox="0 0 7 4" style={{ marginLeft: 3 }}>
      <path d="M0 0h7L3.5 4z" fill="#000" />
    </svg>
  );
  const sep = <div style={{ width: 1, alignSelf: 'stretch', margin: '6px 4px', background: '#aca899', boxShadow: '1px 0 0 #fff' }} />;
  return (
    <div style={{ height: IE_BARS.tools, boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 2, padding: '0 4px', borderBottom: '1px solid #d6d2c2', background: 'linear-gradient(180deg,#f6f5ef,#ece9d8 70%,#e3dfcd)' }}>
      <ToolButton>
        <Glyph kind="back" disabled={!canGoBack} />
        <span style={{ ...label, marginLeft: 3, color: canGoBack ? '#000' : '#a7a69c' }}>Back</span>
        {drop}
      </ToolButton>
      <ToolButton>
        <Glyph kind="forward" disabled />
        {drop}
      </ToolButton>
      <ToolButton>
        <Glyph kind="stop" />
      </ToolButton>
      <ToolButton>
        <Glyph kind="refresh" />
      </ToolButton>
      <ToolButton>
        <Glyph kind="home" />
      </ToolButton>
      {sep}
      <ToolButton>
        <Glyph kind="search" />
        <span style={{ ...label, marginLeft: 3 }}>Search</span>
      </ToolButton>
      <ToolButton>
        <Glyph kind="favorites" />
        <span style={{ ...label, marginLeft: 3 }}>Favorites</span>
      </ToolButton>
      {sep}
      <ToolButton>
        <Glyph kind="mail" />
        {drop}
      </ToolButton>
      <ToolButton>
        <Glyph kind="print" />
      </ToolButton>
    </div>
  );
}

function ToolButton({ children }: { children: ReactNode }) {
  return <div style={{ height: 30, display: 'flex', alignItems: 'center', padding: '0 3px' }}>{children}</div>;
}

function AddressBar({ url }: { url: string }) {
  return (
    <div style={{ height: IE_BARS.address, boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 4, padding: '0 3px 0 6px', borderBottom: '1px solid #919b9c', fontFamily: UI, fontSize: 11, color: '#000' }}>
      <span style={{ color: '#5c5c5c' }}>
        A<span style={{ textDecoration: 'underline' }}>d</span>dress
      </span>
      <div style={{ flex: 1, minWidth: 0, height: 19, boxSizing: 'border-box', border: '1px solid #7f9db9', background: '#fff', display: 'flex', alignItems: 'center', gap: 3, paddingLeft: 2 }}>
        <PageGlyph size={14} />
        <span style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden' }}>{url}</span>
        <div style={{ width: 15, height: 17, boxSizing: 'border-box', border: '1px solid #b5c7f0', borderRadius: 2, background: 'linear-gradient(90deg,#c6d6fc,#b1c8fb 50%,#a7bdf7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="7" height="4" viewBox="0 0 7 4">
            <path d="M0 0h7L3.5 4z" fill="#4d6185" />
          </svg>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        <Glyph kind="go" size={17} />
        Go
      </div>
      <span style={{ color: '#5c5c5c', marginLeft: 4 }}>Links »</span>
    </div>
  );
}

/** XP's green, segmented progress bar. */
function Progress({ value }: { value: number }) {
  const n = Math.round(Math.max(0, Math.min(1, value)) * 11);
  return (
    <div style={{ display: 'flex', gap: 1, height: '100%' }}>
      {Array.from({ length: n }, (_, i) => (
        <div key={i} style={{ width: 7, height: '100%', background: 'linear-gradient(180deg,#9ef08d,#2fbb2f 45%,#1f9a1f)' }} />
      ))}
    </div>
  );
}

/** The little "web page" icon (address bar, status bar). */
function PageGlyph({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" style={{ flex: 'none' }}>
      <path d="M3 1.5h7l3 3v10H3z" fill="#fff" stroke="#7b8ea8" />
      <path d="M10 1.5v3h3" fill="#dfe7f2" stroke="#7b8ea8" />
      <circle cx="8" cy="10" r="3.2" fill="#3f8fe0" />
      <path d="M5.4 9.2c1.2-.6 2 .5 2.9.2s.8-1.4 1.9-.8" fill="none" stroke="#5cbf4a" strokeWidth="1.1" />
    </svg>
  );
}

/** The Standard Buttons, 24 px (original drawings in the XP manner). */
function Glyph({ kind, disabled, size = 24 }: { kind: 'back' | 'forward' | 'stop' | 'refresh' | 'home' | 'search' | 'favorites' | 'mail' | 'print' | 'go'; disabled?: boolean; size?: number }) {
  const round = (dir: 1 | -1) => (
    <g>
      <defs>
        <radialGradient id={`ie-arrow-${dir}-${disabled ? 'off' : 'on'}`} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor={disabled ? '#f1f0ea' : '#b8f08e'} />
          <stop offset="0.55" stopColor={disabled ? '#d3d1c6' : '#45b52a'} />
          <stop offset="1" stopColor={disabled ? '#b9b6a8' : '#1f7d12'} />
        </radialGradient>
      </defs>
      <circle cx="12" cy="12" r="10.4" fill={`url(#ie-arrow-${dir}-${disabled ? 'off' : 'on'})`} stroke={disabled ? '#a5a294' : '#1a6a10'} />
      <path d={dir < 0 ? 'M16.8 12H8.2M11.6 8.2L7.6 12l4 3.8' : 'M7.2 12h8.6M12.4 8.2l4 3.8-4 3.8'} fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
  const page = (
    <g>
      <path d="M4.5 3.5h10l4 4v13h-14z" fill="#fff" stroke="#6b7a8f" />
      <path d="M14.5 3.5v4h4" fill="#e4eaf3" stroke="#6b7a8f" />
    </g>
  );
  const shapes: Record<string, ReactNode> = {
    back: round(-1),
    forward: round(1),
    stop: (
      <g>
        {page}
        <circle cx="15.5" cy="16" r="5.6" fill="#e2351f" stroke="#9d1a0b" />
        <path d="M13.3 13.8l4.4 4.4M17.7 13.8l-4.4 4.4" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" />
      </g>
    ),
    refresh: (
      <g>
        {page}
        <path d="M11.2 13.1a4 4 0 0 1 6.8-1.6M18.8 17.4a4 4 0 0 1-6.8 1.6" fill="none" stroke="#2f9a20" strokeWidth="1.9" strokeLinecap="round" />
        <path d="M18.6 9.4v2.9h-2.9zM11.4 21.2v-2.9h2.9z" fill="#2f9a20" />
      </g>
    ),
    home: (
      <g>
        <path d="M5.5 12.2v8.3h13v-8.3" fill="#f5edd6" stroke="#8b7a55" />
        <path d="M3.4 12.6L12 4.4l8.6 8.2" fill="none" stroke="#b83c1c" strokeWidth="2.2" strokeLinejoin="round" />
        <rect x="10.2" y="14.6" width="3.6" height="5.9" fill="#7d5a2c" />
      </g>
    ),
    search: (
      <g>
        <circle cx="10" cy="10" r="5.6" fill="#d9ecff" stroke="#4a6a92" strokeWidth="1.6" />
        <ellipse cx="8.4" cy="8.2" rx="2.2" ry="1.3" fill="#fff" opacity=".8" />
        <path d="M14.2 14.2l5.6 5.6" stroke="#6b4a1e" strokeWidth="3" strokeLinecap="round" />
      </g>
    ),
    favorites: <path d="M12 3.2l2.6 5.6 6.1.7-4.5 4.2 1.2 6.1L12 16.8l-5.4 3 1.2-6.1-4.5-4.2 6.1-.7z" fill="#ffd23a" stroke="#c07a00" strokeLinejoin="round" />,
    mail: (
      <g>
        <rect x="3.5" y="6.5" width="17" height="11.5" fill="#fffbe9" stroke="#8b7a55" />
        <path d="M3.8 6.8L12 13l8.2-6.2" fill="none" stroke="#8b7a55" />
      </g>
    ),
    print: (
      <g>
        <rect x="7" y="3.5" width="10" height="6" fill="#fff" stroke="#6b7a8f" />
        <rect x="3.5" y="9" width="17" height="8" rx="1.5" fill="#cfd3d9" stroke="#5d6470" />
        <rect x="7" y="14.5" width="10" height="6" fill="#fff" stroke="#6b7a8f" />
      </g>
    ),
    go: (
      <g>
        <rect x="2.5" y="2.5" width="19" height="19" rx="3" fill="#3cae2b" stroke="#1a6a10" />
        <path d="M7 12h9M12.6 8l4 4-4 4" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    ),
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ flex: 'none', display: 'block' }}>
      {shapes[kind]}
    </svg>
  );
}
