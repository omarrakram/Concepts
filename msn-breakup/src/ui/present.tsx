import type { CSSProperties, ReactNode } from 'react';
import { MODERN } from '../fonts';
import { INTRO_TEXT } from '../story/intro';
import { Pointer } from './icons';

/**
 * The present-day computer that opens the carousel: a clean Windows desktop of
 * 2026, drawn in code in the 4:5 view's own units (540 × 675, rendered at 2x).
 * The wallpaper, the icons and the window chrome are original drawings in
 * today's Windows style (rounded windows, the centred taskbar, the tray clock),
 * with no Microsoft logo or artwork. Text in Inter (stands in for Segoe UI).
 */
export const PRESENT = {
  w: 540,
  h: 675,
  taskbar: 44,
  /** the browser window, open on a new tab */
  win: { x: 92, y: 34, w: 432, h: 430 },
  /** its tab strip and toolbar heights */
  tabs: 32,
  bar: 36,
  /** the new tab's search box (view px) */
  search: { x: 148, y: 196, w: 320, h: 34 },
};
const W = PRESENT.win;
const TXT = INTRO_TEXT;
const ink = '#1b1b1f';
const muted = '#5d6168';
const text = (size: number, weight: 400 | 600, color: string): CSSProperties => ({ fontFamily: MODERN, fontSize: size, fontWeight: weight, color, whiteSpace: 'nowrap' });

export function PresentDesktop({ pointer, hover }: { pointer: { x: number; y: number }; hover: boolean }) {
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: PRESENT.w, height: PRESENT.h, overflow: 'hidden' }}>
      <Wallpaper />
      <Icons />
      <Browser hover={hover} />
      <Taskbar />
      <div style={{ position: 'absolute', left: pointer.x - 1, top: pointer.y - 1 }}>
        <Pointer size={15} />
      </div>
    </div>
  );
}

/** An abstract wallpaper: deep blue to light, and a soft bloom of translucent petals (an original drawing). */
function Wallpaper() {
  const petals = [
    { x: 330, y: 470, w: 430, h: 150, r: -38, c: 'rgba(120,186,255,.85)', o: 0.75 },
    { x: 360, y: 500, w: 420, h: 140, r: -8, c: 'rgba(160,210,255,.9)', o: 0.7 },
    { x: 390, y: 520, w: 400, h: 130, r: 22, c: 'rgba(98,150,255,.85)', o: 0.65 },
    { x: 410, y: 548, w: 360, h: 120, r: 52, c: 'rgba(196,226,255,.9)', o: 0.55 },
    { x: 300, y: 430, w: 300, h: 100, r: -64, c: 'rgba(130,120,255,.8)', o: 0.45 },
  ];
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(165deg, #061536 0%, #0a2b6e 36%, #1552bd 66%, #3f86ea 86%, #8ab9f7 100%)' }}>
      <div style={{ position: 'absolute', left: 120, top: 330, width: 520, height: 380, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(110,170,255,.45), rgba(110,170,255,0))' }} />
      {petals.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: p.x - p.w / 2,
            top: p.y - p.h / 2,
            width: p.w,
            height: p.h,
            borderRadius: '50%',
            transform: `rotate(${p.r}deg)`,
            background: `radial-gradient(ellipse 50% 50% at 50% 42%, ${p.c} 0%, rgba(255,255,255,0) 100%)`,
            opacity: p.o,
            mixBlendMode: 'screen',
          }}
        />
      ))}
    </div>
  );
}

/** Two desktop icons in the left column, as today's Windows lays them out. */
function Icons() {
  const label: CSSProperties = { ...text(8.5, 400, '#fff'), marginTop: 3, textShadow: '0 1px 2px rgba(0,0,0,.7)', textAlign: 'center' };
  return (
    <>
      {TXT.icons.map((name, i) => (
        <div key={name} style={{ position: 'absolute', left: 8, top: 10 + i * 64, width: 70, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {i === 0 ? <BinIcon /> : <FolderIcon size={30} />}
          <div style={label}>{name}</div>
        </div>
      ))}
    </>
  );
}

/** The browser, on a new tab: one tab, the address bar, a search box and six shortcuts. Original chrome, no browser's logo. */
function Browser({ hover }: { hover: boolean }) {
  const s = PRESENT.search;
  const page = PRESENT.tabs + PRESENT.bar;
  const tile = 46;
  const tiles = TXT.shortcuts.length * tile + (TXT.shortcuts.length - 1) * 8;
  return (
    <div style={{ position: 'absolute', left: W.x, top: W.y, width: W.w, height: W.h, borderRadius: 8, overflow: 'hidden', background: '#f7f8fa', boxShadow: '0 12px 32px rgba(0,0,0,.42), 0 0 0 1px rgba(0,0,0,.18)' }}>
      {/* the tab strip, with the window's controls */}
      <div style={{ position: 'absolute', left: 0, top: 0, width: W.w, height: PRESENT.tabs, background: '#dfe3ea' }}>
        <div style={{ position: 'absolute', left: 8, top: 6, width: 152, height: PRESENT.tabs - 6, borderRadius: '8px 8px 0 0', background: '#fff', display: 'flex', alignItems: 'center', gap: 6, padding: '0 8px', boxSizing: 'border-box' }}>
          <TabMark />
          <div style={{ ...text(9, 400, ink), flex: 1 }}>{TXT.tab}</div>
          <Glyph d="M2 2l6 6M8 2L2 8" size={10} stroke={muted} />
        </div>
        <div style={{ position: 'absolute', left: 168, top: 9, width: 20, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Glyph d="M5 1v8M1 5h8" size={10} stroke={muted} />
        </div>
        {['M1 5h8', 'M1.5 1.5h7v7h-7z', 'M1.5 1.5l7 7M8.5 1.5l-7 7'].map((d, i) => (
          <div key={d} style={{ position: 'absolute', top: 0, left: W.w - 108 + i * 36, width: 36, height: PRESENT.tabs - 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Glyph d={d} size={10} stroke={i === 2 ? '#3c3c40' : '#4a4a4f'} />
          </div>
        ))}
      </div>
      {/* the toolbar: back, forward, reload, the address bar, the profile and the menu */}
      <div style={{ position: 'absolute', left: 0, top: PRESENT.tabs, width: W.w, height: PRESENT.bar, background: '#fff', borderBottom: '1px solid #e3e5ea', display: 'flex', alignItems: 'center', gap: 4, padding: '0 8px', boxSizing: 'border-box' }}>
        <Glyph d="M8 2L3 6l5 4M3 6h9" size={12} stroke="#3c3c40" box={14} />
        <Glyph d="M6 2l5 4-5 4M11 6H2" size={12} stroke="#b5b8be" box={14} />
        <Glyph d="M10.5 6a4.5 4.5 0 1 1-1.4-3.3M9.6 0.8v2.5H7" size={12} stroke="#3c3c40" box={14} />
        <div style={{ flex: 1, height: 24, margin: '0 6px', borderRadius: 12, background: '#eff1f5', display: 'flex', alignItems: 'center', gap: 6, padding: '0 10px', boxSizing: 'border-box' }}>
          <Magnifier size={10} color={muted} />
          <div style={text(9, 400, muted)}>{TXT.address}</div>
        </div>
        <div style={{ width: 16, height: 16, borderRadius: 8, background: 'linear-gradient(135deg,#7c6cf0,#3d8ef0)' }} />
        <Glyph d="M2 6h.01M6 6h.01M10 6h.01" size={12} stroke="#3c3c40" box={18} width={2.2} />
      </div>
      {/* the new tab */}
      <div style={{ position: 'absolute', left: 0, top: page, width: W.w, height: W.h - page, background: 'linear-gradient(180deg,#f7f9fc 0%,#eef2f8 100%)' }}>
        <div
          style={{
            position: 'absolute',
            left: s.x - W.x,
            top: s.y - W.y - page,
            width: s.w,
            height: s.h,
            boxSizing: 'border-box',
            borderRadius: s.h / 2,
            background: '#fff',
            border: hover ? '1px solid #b9c6dc' : '1px solid #dde2ea',
            boxShadow: hover ? '0 3px 10px rgba(30,60,120,.18)' : '0 2px 6px rgba(30,60,120,.1)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '0 14px',
          }}
        >
          <Magnifier size={12} color={muted} />
          <div style={text(10, 400, '#80858d')}>{TXT.searchBox}</div>
        </div>
        <div style={{ position: 'absolute', left: (W.w - tiles) / 2, top: s.y - W.y - page + s.h + 26, display: 'flex', gap: 8 }}>
          {TXT.shortcuts.map((name, i) => (
            <div key={name} style={{ width: tile, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: '#fff', boxShadow: '0 1px 4px rgba(30,60,120,.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 16, height: 16, borderRadius: i % 2 ? 4 : 8, background: SHORTCUT_COLORS[i] }} />
              </div>
              <div style={text(8, 400, '#3c4048')}>{name}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
const SHORTCUT_COLORS = ['linear-gradient(135deg,#4c8df6,#2563d9)', 'linear-gradient(135deg,#3cc48a,#1f9d6a)', 'linear-gradient(135deg,#ff6b8b,#e2365d)', 'linear-gradient(135deg,#ffb547,#f08a1c)', 'linear-gradient(135deg,#5ab0ff,#3279e6)', 'linear-gradient(135deg,#8fd3ff,#4fa8f0)'];

/** Today's taskbar: the weather on the left, the centred buttons (start, search, files, the browser in use, mail), the tray and the clock. */
function Taskbar() {
  const h = PRESENT.taskbar;
  const cell = (child: ReactNode, key: string, active = false) => (
    <div key={key} style={{ position: 'relative', width: 34, height: 34, borderRadius: 5, background: active ? 'rgba(255,255,255,.1)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {child}
      {active && <div style={{ position: 'absolute', bottom: 2, left: 12, width: 10, height: 3, borderRadius: 2, background: '#62c3ff' }} />}
    </div>
  );
  return (
    <div style={{ position: 'absolute', left: 0, top: PRESENT.h - h, width: PRESENT.w, height: h, background: 'rgba(24,28,38,.9)', borderTop: '1px solid rgba(255,255,255,.1)' }}>
      <div style={{ position: 'absolute', left: 10, top: 0, height: h, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Moon />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <div style={text(9, 600, '#fff')}>{TXT.temperature}</div>
          <div style={text(8, 400, '#c4c9d4')}>{TXT.weather}</div>
        </div>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: h, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
        {cell(<StartMark />, 'start')}
        <div style={{ width: 92, height: 30, borderRadius: 15, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.08)', boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 6, padding: '0 10px' }}>
          <Magnifier size={11} color="#e8ebf2" />
          <div style={text(9, 400, '#d5d9e2')}>{TXT.search}</div>
        </div>
        {cell(<FolderIcon size={20} />, 'files')}
        {cell(<BrowserMark />, 'browser', true)}
        {cell(<MailMark />, 'mail')}
      </div>
      <div style={{ position: 'absolute', right: 10, top: 0, height: h, display: 'flex', alignItems: 'center', gap: 9 }}>
        <Glyph d="M2 7l4-4 4 4" size={10} stroke="#e8ebf2" />
        <Wifi />
        <Speaker />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
          <div style={text(9, 400, '#fff')}>{TXT.time}</div>
          <div style={text(9, 400, '#fff')}>{TXT.date}</div>
        </div>
      </div>
    </div>
  );
}

function Glyph({ d, size, stroke, box, width = 1.2 }: { d: string; size: number; stroke: string; box?: number; width?: number }) {
  const b = box ?? size;
  return (
    <div style={{ width: b, height: b, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size > 10 ? 12 : 10} ${size > 10 ? 12 : 10}`} style={{ display: 'block' }}>
        <path d={d} fill="none" stroke={stroke} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
function Magnifier({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" style={{ display: 'block', flex: 'none' }}>
      <circle cx="5" cy="5" r="3.6" fill="none" stroke={color} strokeWidth="1.3" />
      <path d="M7.7 7.7L11 11" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
/** Start: four rounded panes in light blue (an original drawing). */
function StartMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="pd-start" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7fd0ff" />
          <stop offset="1" stopColor="#1f8be6" />
        </linearGradient>
      </defs>
      {[0, 9.6].map((x) => [0, 9.6].map((y) => <rect key={`${x}${y}`} x={x + 0.4} y={y + 0.4} width="7.6" height="7.6" rx="1.4" fill="url(#pd-start)" />))}
    </svg>
  );
}
function FolderIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'block' }}>
      <path d="M2 6.2C2 5 3 4 4.2 4h5l2 2.2h8.6C21 6.2 22 7.2 22 8.4v9.4c0 1.2-1 2.2-2.2 2.2H4.2C3 20 2 19 2 17.8z" fill="#e8a91f" />
      <path d="M2 9.6c0-1.2 1-2.2 2.2-2.2h15.6c1.2 0 2.2 1 2.2 2.2v8.2c0 1.2-1 2.2-2.2 2.2H4.2C3 20 2 19 2 17.8z" fill="#ffd25e" />
    </svg>
  );
}
function BinIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" style={{ display: 'block' }}>
      <path d="M5.5 7h13l-1.2 13.2c-.1.9-.8 1.6-1.7 1.6H8.4c-.9 0-1.6-.7-1.7-1.6z" fill="rgba(220,236,255,.55)" stroke="rgba(255,255,255,.9)" strokeWidth=".8" />
      <path d="M4.5 5.2h15" stroke="rgba(255,255,255,.95)" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M9.5 10v8.5M12 10v8.5M14.5 10v8.5" stroke="rgba(120,160,215,.9)" strokeWidth=".9" />
    </svg>
  );
}
/** The browser's taskbar button: a blue globe (an original drawing, no browser's logo). */
function BrowserMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="pd-globe" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4fc3f7" />
          <stop offset="1" stopColor="#1565d8" />
        </linearGradient>
      </defs>
      <circle cx="10" cy="10" r="8.6" fill="url(#pd-globe)" />
      <path d="M1.6 10h16.8M10 1.4c-2.6 2.4-2.6 14.8 0 17.2M10 1.4c2.6 2.4 2.6 14.8 0 17.2M3 5.6h14M3 14.4h14" fill="none" stroke="rgba(255,255,255,.75)" strokeWidth=".9" />
    </svg>
  );
}
function TabMark() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" style={{ display: 'block', flex: 'none' }}>
      <rect x=".5" y=".5" width="11" height="11" rx="3" fill="#3d8ef0" />
      <path d="M3.5 6h5M6 3.5v5" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
function MailMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" style={{ display: 'block' }}>
      <rect x="2" y="4.5" width="16" height="11.5" rx="2" fill="#2f7fe8" />
      <path d="M2.8 5.6L10 11l7.2-5.4" fill="none" stroke="#cfe6ff" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}
function Moon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" style={{ display: 'block' }}>
      <path d="M12.6 12.8A6.4 6.4 0 0 1 7 3.2a6.4 6.4 0 1 0 7.9 8.4 6.3 6.3 0 0 1-2.3 1.2z" fill="#ffe08a" />
    </svg>
  );
}
function Wifi() {
  return (
    <svg width="13" height="11" viewBox="0 0 13 11" style={{ display: 'block' }}>
      <path d="M1 4.2a8 8 0 0 1 11 0M2.9 6.3a5.2 5.2 0 0 1 7.2 0M4.8 8.3a2.5 2.5 0 0 1 3.4 0" fill="none" stroke="#e8ebf2" strokeWidth="1.1" strokeLinecap="round" />
      <circle cx="6.5" cy="9.9" r=".8" fill="#e8ebf2" />
    </svg>
  );
}
function Speaker() {
  return (
    <svg width="13" height="11" viewBox="0 0 13 11" style={{ display: 'block' }}>
      <path d="M1 4h2.2L6.4 1.4v8.2L3.2 7H1z" fill="#e8ebf2" />
      <path d="M8.3 3.4a3 3 0 0 1 0 4.2M10 1.8a5.2 5.2 0 0 1 0 7.4" fill="none" stroke="#e8ebf2" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}
