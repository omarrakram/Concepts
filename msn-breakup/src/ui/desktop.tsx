import type { CSSProperties } from 'react';
import { TASKBAR_H, VH, VW } from '../constants';
import { UI } from '../fonts';
import { Buddy, DesktopIcon, PlayerMark, StartFlag } from './icons';

/** His display picture: a moody, slightly over-saturated sunset (the 2007 "deep" DP). */
export function HisDP({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="hsky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a1b5e" />
          <stop offset="0.45" stopColor="#c4466a" />
          <stop offset="0.72" stopColor="#ff9a3c" />
          <stop offset="1" stopColor="#ffd27a" />
        </linearGradient>
        <linearGradient id="hsea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5a3a6e" />
          <stop offset="1" stopColor="#1c1638" />
        </linearGradient>
      </defs>
      <rect width="96" height="62" fill="url(#hsky)" />
      <circle cx="56" cy="60" r="14" fill="#ffe7a1" opacity=".95" />
      <rect y="60" width="96" height="36" fill="url(#hsea)" />
      {[64, 69, 75, 82].map((y, i) => (
        <path key={y} d={`M${40 - i * 4} ${y}h${32 + i * 8}`} stroke="#ffc874" strokeWidth={1.4 - i * 0.25} opacity={0.75 - i * 0.15} />
      ))}
      <path d="M14 96c2-20 3-34 8-46" stroke="#140c22" strokeWidth="3" fill="none" />
      <path d="M22 50c-8-4-16-2-20 4 7-3 13-3 20-4zm0 0c-4-8-12-11-18-9 6 1 12 4 18 9zm0 0c4-7 11-9 17-6-6 0-12 2-17 6zm0 0c7-2 14 1 17 7-6-4-11-6-17-7z" fill="#140c22" />
    </svg>
  );
}

/** Her display picture: a glossy pink heart, sparkles and "xoxo". */
export function HerDP({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" style={{ display: 'block' }}>
      <defs>
        <radialGradient id="pbg" cx="0.5" cy="0.4" r="0.8">
          <stop offset="0" stopColor="#ffd6ef" />
          <stop offset="1" stopColor="#f25bb2" />
        </radialGradient>
        <radialGradient id="pheart" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#fff" />
          <stop offset="0.25" stopColor="#ff7ac4" />
          <stop offset="1" stopColor="#c2006b" />
        </radialGradient>
      </defs>
      <rect width="96" height="96" fill="url(#pbg)" />
      {[[14, 16, 3], [80, 20, 2.4], [74, 74, 3.2], [18, 78, 2], [50, 10, 1.6], [86, 50, 1.8]].map(([x, y, r], i) => (
        <path key={i} d={`M${x} ${y - r * 2}L${x + r * 0.5} ${y - r * 0.5}L${x + r * 2} ${y}L${x + r * 0.5} ${y + r * 0.5}L${x} ${y + r * 2}L${x - r * 0.5} ${y + r * 0.5}L${x - r * 2} ${y}L${x - r * 0.5} ${y - r * 0.5}z`} fill="#fff" opacity=".9" />
      ))}
      <path d="M48 80S16 60 16 38c0-10 7.6-17 16.4-17 6.6 0 12 3.8 15.6 9.4C51.6 24.8 57 21 63.6 21 72.4 21 80 28 80 38c0 22-32 42-32 42z" fill="url(#pheart)" stroke="#8c004c" strokeWidth="1.6" />
      <ellipse cx="33" cy="36" rx="8" ry="5" fill="#fff" opacity=".6" transform="rotate(-30 33 36)" />
      <text x="48" y="92" textAnchor="middle" fontFamily='"Comic Neue", cursive' fontWeight="700" fontSize="13" fill="#fff" stroke="#c2006b" strokeWidth=".6">
        xoxo
      </text>
    </svg>
  );
}

/** Rolling-hills wallpaper in the Bliss spirit, drawn from scratch (sky, clouds, two hills). */
export function Wallpaper() {
  const cloud = (x: number, y: number, s: number, o = 0.85) => (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o} filter="url(#soft)">
      <ellipse cx="0" cy="0" rx="60" ry="18" fill="#fff" />
      <ellipse cx="-26" cy="-10" rx="30" ry="18" fill="#fff" />
      <ellipse cx="18" cy="-14" rx="34" ry="22" fill="#fff" />
      <ellipse cx="44" cy="-4" rx="26" ry="14" fill="#fff" />
    </g>
  );
  return (
    <svg width={VW} height={VH} viewBox={`0 0 ${VW} ${VH}`} style={{ position: 'absolute', inset: 0 }}>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1f5fd0" />
          <stop offset="0.35" stopColor="#3f86e8" />
          <stop offset="0.6" stopColor="#7db6f4" />
          <stop offset="0.72" stopColor="#b9dcfb" />
        </linearGradient>
        <linearGradient id="hill1" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor="#7cc244" />
          <stop offset="0.35" stopColor="#4f9e26" />
          <stop offset="1" stopColor="#2a6e12" />
        </linearGradient>
        <linearGradient id="hill2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5aa732" />
          <stop offset="1" stopColor="#1f5c0c" />
        </linearGradient>
        <filter id="soft">
          <feGaussianBlur stdDeviation="3.5" />
        </filter>
        <filter id="grass">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" />
          <feColorMatrix values="0 0 0 0 0.12  0 0 0 0 0.35  0 0 0 0 0.05  0 0 0 0.55 0" />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
      </defs>
      <rect width={VW} height={VH} fill="url(#sky)" />
      {cloud(120, 140, 1.5, 0.9)}
      {cloud(420, 90, 1.1, 0.75)}
      {cloud(330, 260, 1.7, 0.85)}
      {cloud(60, 360, 0.9, 0.7)}
      {cloud(480, 420, 1.2, 0.65)}
      <path d={`M0 640 C 120 560, 300 540, 420 600 S ${VW} 620 ${VW} 640 V ${VH} H 0 Z`} fill="url(#hill2)" />
      <path d={`M0 700 C 140 600, 260 590, 380 640 S 520 700 ${VW} 690 V ${VH} H 0 Z`} fill="url(#hill1)" />
      <path d={`M0 700 C 140 600, 260 590, 380 640 S 520 700 ${VW} 690 V ${VH} H 0 Z`} fill="#000" filter="url(#grass)" opacity=".5" />
      <path d={`M0 700 C 140 600, 260 590, 380 640`} fill="none" stroke="#a5dd6a" strokeWidth="6" opacity=".35" filter="url(#soft)" />
    </svg>
  );
}

const iconLabel: CSSProperties = { fontFamily: UI, fontSize: 11, color: '#fff', textShadow: '1px 1px 1px #000, 0 0 2px #000', textAlign: 'center', lineHeight: '13px', marginTop: 3, width: 74 };

export function DesktopIcons() {
  const icons: { kind: Parameters<typeof DesktopIcon>[0]['kind']; label: string; x: number; y: number }[] = [
    { kind: 'documents', label: 'My Documents', x: 8, y: 10 },
    { kind: 'computer', label: 'My Computer', x: 8, y: 82 },
    { kind: 'internet', label: 'Internet', x: 8, y: 154 },
    { kind: 'messenger', label: 'MSN Messenger 7.5', x: 8, y: 226 },
    { kind: 'music', label: 'my music (DONT DELETE)', x: 8, y: 300 },
    { kind: 'recycle', label: 'Recycle Bin', x: 8, y: 830 },
  ];
  return (
    <>
      {icons.map((i) => (
        <div key={i.label} style={{ position: 'absolute', left: i.x, top: i.y, display: 'flex', flexDirection: 'column', alignItems: 'center', width: 74 }}>
          <DesktopIcon kind={i.kind} />
          <div style={iconLabel}>{i.label}</div>
        </div>
      ))}
    </>
  );
}

const TASKBAR = 'linear-gradient(180deg,#3168d5 0%,#4993e6 6%,#2b71e0 14%,#2663da 22%,#2157d6 50%,#245ddb 80%,#2562df 88%,#1d4ec0 96%,#1941a5 100%)';

/**
 * The XP taskbar: Start, quick launch, one button per window, the tray with Messenger + clock.
 * A task shows the buddy (Messenger windows) unless it says `icon` ('internet', 'player').
 * `startPressed`: the Start menu is open.
 */
export function Taskbar({ tasks, clock, trayAlert, startPressed }: { tasks: { label: string; active?: boolean; flash?: boolean; icon?: 'messenger' | 'chat' | 'internet' | 'player' }[]; clock: string; trayAlert?: boolean; startPressed?: boolean }) {
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: TASKBAR_H, background: TASKBAR, display: 'flex', alignItems: 'stretch', fontFamily: UI, fontSize: 11, color: '#fff' }}>
      <div
        style={{
          width: 92,
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          paddingLeft: 9,
          borderTopRightRadius: 10,
          borderBottomRightRadius: 10,
          background: startPressed ? 'radial-gradient(circle at 30% 30%, #3f9a3f 0%, #2b7d2b 45%, #1f611f 100%)' : 'radial-gradient(circle at 30% 30%, #5fb85f 0%, #379a37 45%, #2b7d2b 100%)',
          boxShadow: startPressed ? 'inset 2px 2px 4px rgba(0,0,0,.45)' : 'inset -2px 0 3px rgba(0,0,0,.35), inset 0 1px 1px rgba(255,255,255,.4)',
          fontFamily: 'Arimo, Arial, sans-serif',
          fontWeight: 700,
          fontStyle: 'italic',
          fontSize: 17,
          textShadow: '1px 1px 1px #1a4d1a',
        }}
      >
        <StartFlag size={18} />
        start
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0 8px', borderRight: '1px solid #1a49b8', boxShadow: '1px 0 0 #5b8ff0' }}>
        <DesktopIcon kind="internet" size={18} />
        <DesktopIcon kind="messenger" size={18} />
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 3, padding: '0 4px', minWidth: 0 }}>
        {tasks.map((t) => (
          <div
            key={t.label}
            style={{
              flex: '0 1 150px',
              minWidth: 0,
              height: 23,
              borderRadius: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '0 7px',
              background: t.flash ? 'linear-gradient(180deg,#ffbd5e,#f39a1e)' : t.active ? 'linear-gradient(180deg,#1e52b7,#1948a8)' : 'linear-gradient(180deg,#5c9df5,#3c81f3)',
              boxShadow: t.active ? 'inset 1px 1px 2px rgba(0,0,0,.45)' : 'inset -1px -1px 1px rgba(0,0,0,.25), inset 1px 1px 1px rgba(255,255,255,.35)',
              color: t.flash ? '#3b2400' : '#fff',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}
          >
            {t.icon === 'internet' ? <DesktopIcon kind="internet" size={15} /> : t.icon === 'player' ? <PlayerMark size={15} /> : <Buddy size={14} status="online" />}
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.label}</span>
          </div>
        ))}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          padding: '0 10px 0 12px',
          background: 'linear-gradient(180deg,#0c59b9,#139ee9 8%,#18b5f2 15%,#139beb 30%,#1290e8 70%,#0d8dea 90%,#0d6bc8)',
          borderLeft: '1px solid #1042af',
          boxShadow: 'inset 1px 0 1px #18bbff',
        }}
      >
        <div style={{ position: 'relative', display: 'flex' }}>
          <Buddy size={15} status="online" />
          {trayAlert && <div style={{ position: 'absolute', right: -2, top: -2, width: 6, height: 6, borderRadius: 3, background: '#ffb000', boxShadow: '0 0 2px #fff' }} />}
        </div>
        <svg width="14" height="14" viewBox="0 0 14 14">
          <path d="M2 5h2.6l3.2-2.8v9.6L4.6 9H2z" fill="#fff" />
          <path d="M9.4 4.4c1.2 1.4 1.2 3.8 0 5.2M10.8 3c2 2.2 2 5.8 0 8" fill="none" stroke="#fff" strokeWidth="1" />
        </svg>
        <span style={{ fontSize: 11, color: '#fff' }}>{clock}</span>
      </div>
    </div>
  );
}
