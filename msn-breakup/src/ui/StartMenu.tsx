import type { CSSProperties, ReactNode } from 'react';
import { HIS_FONT, UI } from '../fonts';
import { START_MENU, START_TEXT } from '../story/player';
import { HerDP } from './desktop';
import { DesktopIcon, PlayerMark } from './icons';

/**
 * The Windows XP Start menu (Luna), drawn from scratch: her picture and
 * account name on the blue header, pinned + recent programs on the white
 * left column, the folders and system places on the pale-blue right one,
 * "All Programs", and Log Off / Turn Off Computer at the bottom.
 * `hover` is the left-column program under the pointer (XP highlights it).
 */
export const START_ROWS = { header: 54, footer: 34, pinned: 36, recent: 30, left: 180 };

const hi = '#316ac5';

function Program({ icon, title, sub, hover, bold }: { icon: ReactNode; title: string; sub?: string; hover?: boolean; bold?: boolean }) {
  return (
    <div style={{ height: sub ? START_ROWS.pinned : START_ROWS.recent, display: 'flex', alignItems: 'center', gap: 6, padding: '0 6px', margin: '0 3px', background: hover ? hi : 'transparent', color: hover ? '#fff' : '#000' }}>
      <div style={{ width: 26, display: 'flex', justifyContent: 'center' }}>{icon}</div>
      <div style={{ lineHeight: '13px', whiteSpace: 'nowrap' }}>
        <div style={{ fontWeight: bold ? 700 : 400 }}>{title}</div>
        {sub && <div style={{ color: hover ? '#fff' : '#6d6d6d' }}>{sub}</div>}
      </div>
    </div>
  );
}

function Place({ icon, label, bold, arrow }: { icon: ReactNode; label: string; bold?: boolean; arrow?: boolean }) {
  return (
    <div style={{ height: 25, display: 'flex', alignItems: 'center', gap: 6, padding: '0 6px', color: '#0a246a', fontWeight: bold ? 700 : 400, whiteSpace: 'nowrap' }}>
      <div style={{ width: 22, display: 'flex', justifyContent: 'center' }}>{icon}</div>
      <span style={{ flex: 1 }}>{label}</span>
      {arrow && <Arrow color="#0a246a" />}
    </div>
  );
}

const Arrow = ({ color }: { color: string }) => (
  <svg width="5" height="8" viewBox="0 0 5 8">
    <path d="M0 0l5 4-5 4z" fill={color} />
  </svg>
);
const sepH: CSSProperties = { height: 1, margin: '4px 8px', background: 'linear-gradient(90deg,transparent,#c5c2b2 20%,#c5c2b2 80%,transparent)' };

export function StartMenu({ hover }: { hover: 'player' | null }) {
  const T = START_TEXT;
  return (
    <div
      style={{
        position: 'absolute',
        left: START_MENU.x,
        top: START_MENU.y,
        width: START_MENU.w,
        height: START_MENU.h,
        display: 'flex',
        flexDirection: 'column',
        borderTopLeftRadius: 7,
        borderTopRightRadius: 7,
        overflow: 'hidden',
        boxShadow: '3px 3px 6px rgba(0,0,0,.45)',
        border: '1px solid #0f3cb4',
        boxSizing: 'border-box',
        fontFamily: UI,
        fontSize: 11,
      }}
    >
      {/* header: her picture + account name */}
      <div style={{ height: START_ROWS.header, flex: 'none', display: 'flex', alignItems: 'center', gap: 9, padding: '0 8px', background: 'linear-gradient(180deg,#1868ce 0%,#0e60cb 12%,#0e60cb 50%,#1164cf 80%,#1f6dd7 100%)', borderBottom: '2px solid #e68b2c' }}>
        <div style={{ width: 42, height: 42, borderRadius: 4, border: '2px solid #dce6f8', overflow: 'hidden', lineHeight: 0, boxShadow: '1px 1px 2px rgba(0,0,0,.4)' }}>
          <HerDP size={38} />
        </div>
        <span style={{ fontFamily: HIS_FONT, fontWeight: 700, fontSize: 15, color: '#fff', textShadow: '1px 1px 1px #0b2a7a' }}>{T.account}</span>
      </div>
      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        {/* left: programs */}
        <div style={{ width: START_ROWS.left, background: '#fff', display: 'flex', flexDirection: 'column', paddingTop: 5 }}>
          <Program icon={<DesktopIcon kind="internet" size={24} />} title={T.pinned[0]![0]} sub={T.pinned[0]![1]} bold />
          <Program icon={<Envelope />} title={T.pinned[1]![0]} sub={T.pinned[1]![1]} bold />
          <div style={sepH} />
          <Program icon={<DesktopIcon kind="messenger" size={24} />} title={T.recent[0]} />
          <Program icon={<PlayerMark size={22} />} title={T.recent[1]} hover={hover === 'player'} />
          <div style={{ flex: 1 }} />
          <div style={sepH} />
          <div style={{ height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontWeight: 700 }}>
            {T.allPrograms}
            <svg width="17" height="17" viewBox="0 0 17 17">
              <circle cx="8.5" cy="8.5" r="7.6" fill="#3fab31" stroke="#237a19" />
              <path d="M6.6 4.8l4 3.7-4 3.7" fill="none" stroke="#fff" strokeWidth="2" />
            </svg>
          </div>
        </div>
        {/* right: places */}
        <div style={{ flex: 1, background: '#d3e5fa', borderLeft: '1px solid #95bdee', paddingTop: 5 }}>
          <Place icon={<DesktopIcon kind="documents" size={20} />} label={T.places[0]!} bold />
          <Place icon={<DesktopIcon kind="documents" size={20} />} label={T.places[1]!} bold arrow />
          <Place icon={<Folder tint="#79b14b" />} label={T.places[2]!} bold />
          <Place icon={<DesktopIcon kind="music" size={20} />} label={T.places[3]!} bold />
          <Place icon={<DesktopIcon kind="computer" size={20} />} label={T.places[4]!} bold />
          <div style={{ ...sepH, background: 'linear-gradient(90deg,transparent,#a7c4ea 20%,#a7c4ea 80%,transparent)' }} />
          <Place icon={<Panel />} label={T.places[5]!} />
          <Place icon={<Help />} label={T.places[6]!} />
          <Place icon={<Magnifier />} label={T.places[7]!} />
          <Place icon={<Run />} label={T.places[8]!} />
        </div>
      </div>
      {/* footer */}
      <div style={{ height: START_ROWS.footer, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 14, padding: '0 10px', background: 'linear-gradient(180deg,#4282d6,#3168c9 40%,#2a5fc4)', color: '#fff' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Key />
          {T.logOff}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Power />
          {T.turnOff}
        </span>
      </div>
    </div>
  );
}

/* little original glyphs for the menu */
const Envelope = () => (
  <svg width="24" height="24" viewBox="0 0 24 24">
    <rect x="2.5" y="6" width="19" height="13" rx="1.5" fill="#fff7d9" stroke="#8b7a55" />
    <path d="M3 6.6l9 7 9-7" fill="none" stroke="#8b7a55" />
    <circle cx="18" cy="17" r="4.2" fill="#2f7fe0" stroke="#174d9c" />
  </svg>
);
const Folder = ({ tint }: { tint: string }) => (
  <svg width="20" height="20" viewBox="0 0 20 20">
    <path d="M1.5 5h6l1.5 2h9.5v10h-17z" fill="#f3d36a" stroke="#a37c16" />
    <rect x="6" y="8.5" width="9" height="7" fill="#fff" stroke="#8a8a8a" strokeWidth=".6" />
    <path d="M6.5 15l3-3.4 2 2 1.6-1.4 1.4 2.8z" fill={tint} />
  </svg>
);
const Panel = () => (
  <svg width="20" height="20" viewBox="0 0 20 20">
    <rect x="2" y="3" width="16" height="12" rx="1.5" fill="#e8f0fb" stroke="#5f7aa8" />
    <rect x="4.5" y="5.5" width="4" height="3" fill="#59a14f" />
    <rect x="10.5" y="5.5" width="5" height="3" fill="#e08a2c" />
    <rect x="4.5" y="10" width="11" height="2.5" fill="#3f7fd6" />
    <path d="M7 15v2.5h6V15" fill="none" stroke="#5f7aa8" />
  </svg>
);
const Help = () => (
  <svg width="20" height="20" viewBox="0 0 20 20">
    <circle cx="10" cy="10" r="8" fill="#2f7fe0" stroke="#174d9c" />
    <path d="M7.4 7.6a2.6 2.6 0 1 1 3.6 2.4c-.8.4-1 .9-1 1.8" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="10" cy="14.6" r="1.1" fill="#fff" />
  </svg>
);
const Magnifier = () => (
  <svg width="20" height="20" viewBox="0 0 20 20">
    <circle cx="8.4" cy="8.4" r="5" fill="#d9ecff" stroke="#4a6a92" strokeWidth="1.5" />
    <path d="M12 12l5.4 5.4" stroke="#6b4a1e" strokeWidth="2.6" strokeLinecap="round" />
  </svg>
);
const Run = () => (
  <svg width="20" height="20" viewBox="0 0 20 20">
    <rect x="2" y="4" width="16" height="12" rx="1" fill="#fff" stroke="#5f6b7c" />
    <rect x="2" y="4" width="16" height="3" fill="#3168c9" />
    <path d="M5 11h7M10 9l2.4 2L10 13" fill="none" stroke="#2f9a20" strokeWidth="1.6" />
  </svg>
);
const Key = () => (
  <svg width="22" height="22" viewBox="0 0 22 22">
    <rect x="1" y="1" width="20" height="20" rx="3" fill="#f2b33d" stroke="#a7700f" />
    <circle cx="8" cy="11" r="3.2" fill="none" stroke="#fff" strokeWidth="1.8" />
    <path d="M11 11h7M15.5 11v3M17.5 11v2" stroke="#fff" strokeWidth="1.8" />
  </svg>
);
const Power = () => (
  <svg width="22" height="22" viewBox="0 0 22 22">
    <rect x="1" y="1" width="20" height="20" rx="3" fill="#e0532f" stroke="#9d2a10" />
    <path d="M7.4 6.8a5.6 5.6 0 1 0 7.2 0" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" />
    <path d="M11 4.4v6" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" />
  </svg>
);
