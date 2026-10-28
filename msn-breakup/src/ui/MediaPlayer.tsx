import type { CSSProperties, ReactNode } from 'react';
import { UI } from '../fonts';
import { PLAYER_TEXT, TRACK, WMP, WMP_WIN } from '../story/player';
import { PlayerMark } from './icons';

/**
 * Windows Media Player 11 (2006–07, on XP), drawn from scratch and kept to
 * one generation of its look: the black glass frame with the Now Playing /
 * Library / Rip / Burn / Sync tabs, Library ▸ Songs (navigation pane, the
 * song list grouped by album with the generic no-art tile), the Now Playing
 * visualisation with its list pane, and the glossy transport bar with the
 * big round Play button (Pause while playing), seek bar, time and volume.
 * No Microsoft artwork and no album cover are used.
 */
export interface MediaPlayerProps {
  view: 'library' | 'nowPlaying';
  selected: boolean;
  rowHover: boolean;
  playing: boolean;
  elapsed: number;
  playHover: boolean;
  playPressed: boolean;
  tabHover: boolean;
  /** 0..1 per bar (Now Playing), from the song itself */
  bars: number[];
  peaks: number[];
}

const W = WMP_WIN.w;
const H = WMP_WIN.h;
const BODY_TOP = WMP.title + WMP.tabs;
const BODY_H = H - BODY_TOP - WMP.controls;
const GLASS = 'linear-gradient(180deg,#3b4b63 0%,#1b2432 9%,#0b0f17 45%,#05070b 100%)';
const ink = '#1a1a1a';

const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export function MediaPlayer(p: MediaPlayerProps) {
  return (
    <div
      style={{
        position: 'absolute',
        left: WMP_WIN.x,
        top: WMP_WIN.y,
        width: W,
        height: H,
        borderTopLeftRadius: 7,
        borderTopRightRadius: 7,
        overflow: 'hidden',
        background: '#000',
        boxShadow: '2px 3px 7px rgba(0,0,0,.5)',
        fontFamily: UI,
        fontSize: 11,
      }}
    >
      <Top view={p.view} tabHover={p.tabHover} />
      <div style={{ position: 'absolute', left: 0, top: BODY_TOP, width: W, height: BODY_H }}>{p.view === 'library' ? <Library {...p} /> : <NowPlaying {...p} />}</div>
      <Transport {...p} />
      {/* the frame, drawn over the content so everything inside keeps the window's own coordinates */}
      <div style={{ position: 'absolute', inset: 0, boxSizing: 'border-box', border: '1px solid #000', borderTopLeftRadius: 7, borderTopRightRadius: 7 }} />
    </div>
  );
}

/** The title strip and the tab row, one piece of black glass. */
function Top({ view, tabHover }: { view: MediaPlayerProps['view']; tabHover: boolean }) {
  const T = PLAYER_TEXT;
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, right: 0, height: BODY_TOP, background: GLASS, borderBottom: '1px solid #4d6383' }}>
      <div style={{ position: 'absolute', left: 6, top: 3, display: 'flex', alignItems: 'center', gap: 4, color: '#c9d6ea' }}>
        <PlayerMark size={13} />
        {T.window}
      </div>
      <div style={{ position: 'absolute', right: 4, top: 2, display: 'flex', gap: 2 }}>
        {(['min', 'max', 'close'] as const).map((k) => (
          <div key={k} style={{ width: 22, height: 15, borderRadius: 3, border: '1px solid #56657d', background: 'linear-gradient(180deg,#56657d,#1d2533 55%,#121822)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="9" height="9" viewBox="0 0 9 9">
              {k === 'min' && <path d="M1.5 7h6" stroke="#fff" strokeWidth="1.6" />}
              {k === 'max' && <rect x="1.5" y="1.5" width="6" height="6" fill="none" stroke="#fff" strokeWidth="1.3" />}
              {k === 'close' && <path d="M1.5 1.5l6 6M7.5 1.5l-6 6" stroke="#fff" strokeWidth="1.5" />}
            </svg>
          </div>
        ))}
      </div>
      {/* back / forward */}
      {[16, 40].map((cx, i) => (
        <div key={cx} style={{ position: 'absolute', left: cx - 10, top: WMP.title + 9, width: 20, height: 20, borderRadius: 10, background: 'radial-gradient(circle at 40% 30%,#6d7f9b,#1c2534 60%,#0a0d13)', border: '1px solid #67799a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="10" height="10" viewBox="0 0 10 10">
            <path d={i ? 'M2 5h6M5.4 2L8.4 5 5.4 8' : 'M8 5H2M4.6 2L1.6 5l3 3'} fill="none" stroke={i ? '#7d8aa1' : '#fff'} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      ))}
      {T.tabs.map((label, i) => {
        const on = (view === 'nowPlaying' ? 0 : 1) === i;
        const hot = i === 0 && tabHover && !on;
        return (
          <div
            key={label}
            style={{
              position: 'absolute',
              left: WMP.tab[i],
              top: WMP.title + 2,
              width: WMP.tab[i + 1]! - WMP.tab[i]! - 2,
              height: WMP.tabs - 4,
              borderRadius: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              color: on ? '#fff' : '#d8e2f0',
              fontSize: 12,
              fontWeight: on ? 700 : 400,
              background: on ? 'radial-gradient(ellipse at 50% 100%, rgba(120,200,255,.55), rgba(40,90,160,.35) 55%, rgba(0,0,0,0) 80%)' : hot ? 'radial-gradient(ellipse at 50% 100%, rgba(120,200,255,.3), rgba(0,0,0,0) 75%)' : 'none',
              boxShadow: on ? 'inset 0 1px 0 rgba(255,255,255,.25)' : 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {label}
            <svg width="7" height="4" viewBox="0 0 7 4">
              <path d="M0 0h7L3.5 4z" fill={on ? '#cfe9ff' : '#8696ad'} />
            </svg>
          </div>
        );
      })}
    </div>
  );
}

function Library(p: MediaPlayerProps) {
  const T = PLAYER_TEXT;
  const listW = W - WMP.nav;
  const top = WMP.header - BODY_TOP;
  const rowTop = WMP.row - BODY_TOP;
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#fff' }}>
      {/* toolbar: breadcrumb + search */}
      <div style={{ position: 'absolute', left: 0, top: 0, right: 0, height: WMP.toolbar, boxSizing: 'border-box', display: 'flex', alignItems: 'center', padding: '0 8px', background: 'linear-gradient(180deg,#f9fbfd,#e3eaf3)', borderBottom: '1px solid #c3cfdd', color: '#1e395b' }}>
        {T.breadcrumb.map((c, i) => (
          <span key={c} style={{ display: 'flex', alignItems: 'center' }}>
            {i > 0 && <span style={{ color: '#7d8ca0', margin: '0 6px' }}>▸</span>}
            {c}
          </span>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ width: 120, height: 18, boxSizing: 'border-box', border: '1px solid #9fb2c9', borderRadius: 3, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px', color: '#8b97a6', fontStyle: 'italic' }}>
          {T.search}
          <svg width="11" height="11" viewBox="0 0 11 11">
            <circle cx="4.6" cy="4.6" r="3.3" fill="none" stroke="#5b6f8a" strokeWidth="1.4" />
            <path d="M7 7l3 3" stroke="#5b6f8a" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </div>
      </div>
      {/* navigation pane */}
      <div style={{ position: 'absolute', left: 0, top: WMP.toolbar, width: WMP.nav, bottom: 0, boxSizing: 'border-box', borderRight: '1px solid #cdd7e3', background: 'linear-gradient(90deg,#fff,#f3f7fb)', paddingTop: 6, color: ink }}>
        <NavRow bold glyph="list">
          {T.playlists}
        </NavRow>
        <NavRow indent glyph="plus">
          {T.createPlaylist}
        </NavRow>
        <div style={{ height: 6 }} />
        <NavRow bold glyph="note">
          {T.library}
        </NavRow>
        {T.libraryViews.map((v) => (
          <NavRow key={v} indent glyph="dot" on={v === 'Songs'}>
            {v}
          </NavRow>
        ))}
      </div>
      {/* the song list */}
      <div style={{ position: 'absolute', left: WMP.nav, top, width: listW, bottom: 0, color: ink }}>
        <div style={{ height: 22, boxSizing: 'border-box', display: 'flex', alignItems: 'center', background: 'linear-gradient(180deg,#fff,#edf2f8)', borderBottom: '1px solid #d5dde8', color: '#33475f' }}>
          {T.columns.map((c, i) => (
            <div key={c} style={{ width: [WMP.col.num, WMP.col.title - WMP.col.num, WMP.col.length - WMP.col.title, WMP.col.rating - WMP.col.length, listW - WMP.col.rating][i], boxSizing: 'border-box', padding: '0 5px', borderRight: '1px solid #dde4ee', whiteSpace: 'nowrap' }}>
              {c}
            </div>
          ))}
        </div>
        <div style={{ position: 'absolute', left: 6, right: 8, top: WMP.group - WMP.header, height: 18, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
          {TRACK.artist}
          <div style={{ flex: 1, height: 1, background: '#d0d7e0' }} />
        </div>
        <div style={{ position: 'absolute', left: 8, top: rowTop - top }}>
          <NoArt size={90} />
          <div style={{ width: 92, marginTop: 4, lineHeight: '13px' }}>
            <div>{TRACK.album}</div>
            <div style={{ color: '#6c7787' }}>{TRACK.artist}</div>
            <div style={{ color: '#6c7787' }}>{TRACK.year}</div>
          </div>
        </div>
        <SongRow {...p} top={rowTop - top} width={listW - WMP.col.num} />
      </div>
    </div>
  );
}

function SongRow({ top, width, selected, rowHover, playing }: MediaPlayerProps & { top: number; width: number }) {
  const bg = selected ? 'linear-gradient(180deg,#dcebfc,#c1dcfc)' : rowHover ? 'linear-gradient(180deg,#f2f8ff,#e3effd)' : 'transparent';
  return (
    <div
      style={{
        position: 'absolute',
        left: WMP.col.num,
        top,
        width,
        height: WMP.rowH,
        boxSizing: 'border-box',
        border: selected ? '1px solid #7da2ce' : rowHover ? '1px solid #b8d6fb' : '1px solid transparent',
        borderRadius: 2,
        background: bg,
        display: 'flex',
        alignItems: 'center',
        color: playing ? '#1e5fbf' : ink,
        fontWeight: playing ? 700 : 400,
        whiteSpace: 'nowrap',
      }}
    >
      <div style={{ width: WMP.col.title - WMP.col.num, paddingLeft: 5, boxSizing: 'border-box' }}>{TRACK.number}</div>
      <div style={{ width: WMP.col.length - WMP.col.title, paddingLeft: 5, boxSizing: 'border-box', overflow: 'hidden' }}>{TRACK.title}</div>
      <div style={{ width: WMP.col.rating - WMP.col.length, paddingLeft: 5, boxSizing: 'border-box' }}>{TRACK.length}</div>
      <Stars />
    </div>
  );
}

/** Unrated: five empty stars. */
function Stars() {
  return (
    <div style={{ display: 'flex', gap: 1, paddingLeft: 5 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <svg key={i} width="10" height="10" viewBox="0 0 10 10">
          <path d="M5 .8l1.2 2.7 2.9.3-2.2 2 .6 2.9L5 7.2 2.5 8.7l.6-2.9-2.2-2 2.9-.3z" fill="#e6e9ee" stroke="#b9c2ce" strokeWidth=".7" />
        </svg>
      ))}
    </div>
  );
}

function NavRow({ children, bold, indent, glyph, on }: { children: ReactNode; bold?: boolean; indent?: boolean; glyph: 'list' | 'plus' | 'note' | 'dot'; on?: boolean }) {
  const g: Record<string, ReactNode> = {
    list: <path d="M2 3h8M2 6h8M2 9h8" stroke="#3a6fb5" strokeWidth="1.4" />,
    plus: <path d="M6 2v8M2 6h8" stroke="#3a9b2b" strokeWidth="1.8" />,
    note: <path d="M4.5 9.5V2.5l5-1v6.5M4.5 9.5a1.6 1.2 0 1 1-1.6-1.2M9.5 8a1.6 1.2 0 1 1-1.6-1.2" fill="none" stroke="#3a6fb5" strokeWidth="1.2" />,
    dot: <circle cx="6" cy="6" r="2" fill="#8aa1bf" />,
  };
  return (
    <div
      style={{
        height: 19,
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        margin: '0 4px',
        paddingLeft: indent ? 16 : 4,
        fontWeight: bold ? 700 : 400,
        borderRadius: 2,
        border: on ? '1px solid #84acdd' : '1px solid transparent',
        background: on ? 'linear-gradient(180deg,#e4f0fe,#cde3fc)' : 'none',
        whiteSpace: 'nowrap',
      }}
    >
      <svg width="12" height="12" viewBox="0 0 12 12">
        {g[glyph]}
      </svg>
      {children}
    </div>
  );
}

/** The player's own picture when a song has no album art: a grey tile with a note. */
function NoArt({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 90 90" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="noart" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#eef2f7" />
          <stop offset="1" stopColor="#cfd8e3" />
        </linearGradient>
      </defs>
      <rect x=".5" y=".5" width="89" height="89" fill="url(#noart)" stroke="#aab6c5" />
      <path d="M36 62V28l26-6v32" fill="none" stroke="#9aaabe" strokeWidth="5" strokeLinejoin="round" />
      <ellipse cx="29" cy="62" rx="8" ry="6" fill="#9aaabe" />
      <ellipse cx="55" cy="55" rx="8" ry="6" fill="#9aaabe" />
    </svg>
  );
}

function NowPlaying({ bars, peaks, playing }: MediaPlayerProps) {
  const vizW = WMP.listPane;
  const n = bars.length;
  const gap = 3;
  const bw = (vizW - 30 - gap * (n - 1)) / n;
  const base = BODY_H - 34;
  const maxH = BODY_H - 70;
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#000' }}>
      {/* the visualisation: bars, with peaks that fall back slowly */}
      <svg width={vizW} height={BODY_H} style={{ position: 'absolute', left: 0, top: 0 }}>
        <defs>
          <linearGradient id="bar" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#0b3f9c" />
            <stop offset="0.55" stopColor="#2f9bff" />
            <stop offset="1" stopColor="#c6f3ff" />
          </linearGradient>
        </defs>
        {bars.map((v, i) => {
          const h = Math.max(2, v * maxH);
          const x = 15 + i * (bw + gap);
          return (
            <g key={i}>
              <rect x={x} y={base - h} width={bw} height={h} fill="url(#bar)" />
              {playing && <rect x={x} y={base - Math.max(2, peaks[i]! * maxH) - 5} width={bw} height={2} fill="#e8f7ff" />}
            </g>
          );
        })}
        <rect x="15" y={base + 3} width={vizW - 30} height="1" fill="#1d2a3d" />
      </svg>
      {/* list pane */}
      <div style={{ position: 'absolute', left: vizW, top: 0, width: W - vizW, height: BODY_H, boxSizing: 'border-box', borderLeft: '1px solid #26344a', background: 'linear-gradient(180deg,#121a27,#05070b)', padding: '14px 12px 0', color: '#dfe8f5' }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <NoArt size={96} />
        </div>
        <div style={{ marginTop: 8, textAlign: 'center', lineHeight: '14px' }}>
          <div style={{ fontWeight: 700 }}>{TRACK.album}</div>
          <div style={{ color: '#9fb0c8' }}>{TRACK.artist}</div>
        </div>
        <div style={{ marginTop: 12, height: 20, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 6px', background: 'linear-gradient(180deg,#2d5b97,#1c3f73)', border: '1px solid #4f80c0', color: '#fff', fontWeight: 700, whiteSpace: 'nowrap' }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{TRACK.title}</span>
          <span style={{ fontWeight: 400, marginLeft: 6 }}>{TRACK.length}</span>
        </div>
      </div>
    </div>
  );
}

/** The transport: seek bar, time, and the buttons around the big round Play. */
function Transport({ playing, elapsed, playHover, playPressed }: MediaPlayerProps) {
  const T = PLAYER_TEXT;
  const top = H - WMP.controls;
  const frac = Math.min(1, elapsed / TRACK.seconds);
  const cy = WMP.play.y - top;
  const small = (cx: number, r: number, glyph: ReactNode, dim?: boolean): ReactNode => (
    <div
      key={cx}
      style={{
        position: 'absolute',
        left: cx - r,
        top: cy - r,
        width: 2 * r,
        height: 2 * r,
        boxSizing: 'border-box',
        borderRadius: r,
        border: '1px solid #5a6a85',
        background: 'radial-gradient(circle at 40% 30%,#6b7c98,#1c2534 60%,#07090d)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: dim ? 0.75 : 1,
      }}
    >
      {glyph}
    </div>
  );
  const r = WMP.play.r;
  const labelStyle: CSSProperties = { position: 'absolute', left: 9, width: 106, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };
  return (
    <div style={{ position: 'absolute', left: 0, top, width: W, height: WMP.controls, background: 'linear-gradient(180deg,#2c3646 0%,#141a24 18%,#07090d 60%,#000 100%)', borderTop: '1px solid #4d6383' }}>
      {/* seek bar */}
      <div style={{ position: 'absolute', left: 8, right: 8, top: 5, height: 4, borderRadius: 2, background: '#1a2534', boxShadow: 'inset 0 1px 1px #000' }}>
        <div style={{ width: `${frac * 100}%`, height: '100%', borderRadius: 2, background: 'linear-gradient(180deg,#a6e6ff,#2d8fe0)' }} />
        {playing && <div style={{ position: 'absolute', left: `calc(${frac * 100}% - 4px)`, top: -2, width: 8, height: 8, borderRadius: 4, background: 'radial-gradient(circle at 40% 35%,#fff,#7cc8ff 60%,#2a6fc2)' }} />}
      </div>
      {/* status + time (blank until something plays) */}
      {playing && (
        <>
          <div style={{ ...labelStyle, top: 18, color: '#9fc4ec' }}>{T.playing}</div>
          <div style={{ ...labelStyle, top: 31, color: '#fff' }}>{TRACK.title}</div>
          <div style={{ ...labelStyle, top: 46, color: '#cfe3f8', fontSize: 12 }}>{mmss(elapsed)}</div>
        </>
      )}
      {small(128, 10, <Shuffle />, true)}
      {small(154, 10, <Repeat />, true)}
      {small(194, 11, <svg width="9" height="9" viewBox="0 0 9 9"><rect x="1" y="1" width="7" height="7" fill="#fff" /></svg>)}
      {small(224, 12, <svg width="12" height="10" viewBox="0 0 12 10"><path d="M1 1v8M11 1L4.5 5 11 9z" stroke="#fff" fill="#fff" strokeWidth="1.4" /></svg>)}
      {small(292, 12, <svg width="12" height="10" viewBox="0 0 12 10"><path d="M11 1v8M1 1l6.5 4L1 9z" stroke="#fff" fill="#fff" strokeWidth="1.4" /></svg>)}
      {/* Play / Pause */}
      <div
        style={{
          position: 'absolute',
          left: WMP.play.x - r,
          top: cy - r,
          width: 2 * r,
          height: 2 * r,
          boxSizing: 'border-box',
          borderRadius: r,
          border: `1px solid ${playHover ? '#9fd6ff' : '#5f7aa0'}`,
          background: playPressed
            ? 'radial-gradient(circle at 50% 60%,#1d4f96,#0b1e3f 60%,#02060d)'
            : playHover
              ? 'radial-gradient(circle at 40% 28%,#d7f0ff,#4aa8ff 30%,#1550a8 62%,#04122a)'
              : 'radial-gradient(circle at 40% 28%,#b9dcff,#2f86e6 30%,#0f3f8a 62%,#030b1c)',
          boxShadow: playHover ? '0 0 8px rgba(120,200,255,.75)' : '0 0 3px rgba(0,0,0,.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 20 20">
          {playing ? (
            <g fill="#fff">
              <rect x="4.2" y="3.5" width="4" height="13" rx=".6" />
              <rect x="11.8" y="3.5" width="4" height="13" rx=".6" />
            </g>
          ) : (
            <path d="M5.5 2.8L17 10 5.5 17.2z" fill="#fff" />
          )}
        </svg>
      </div>
      {/* mute + volume */}
      <div style={{ position: 'absolute', left: 330, top: cy - 6 }}>
        <svg width="14" height="12" viewBox="0 0 14 12">
          <path d="M1 4h3l3.5-3v10L4 8H1z" fill="#cfd9e8" />
          <path d="M9.6 3.4c1.2 1.4 1.2 3.8 0 5.2M11.4 2c2 2.2 2 5.8 0 8" fill="none" stroke="#cfd9e8" strokeWidth="1" />
        </svg>
      </div>
      <div style={{ position: 'absolute', left: 350, top: cy - 2, width: 72, height: 4, borderRadius: 2, background: '#1a2534', boxShadow: 'inset 0 1px 1px #000' }}>
        <div style={{ width: '75%', height: '100%', borderRadius: 2, background: 'linear-gradient(180deg,#a6e6ff,#2d8fe0)' }} />
        <div style={{ position: 'absolute', left: 'calc(75% - 4px)', top: -3, width: 8, height: 10, borderRadius: 2, background: 'linear-gradient(180deg,#f2f6fb,#9fb3cc)', border: '1px solid #42546f', boxSizing: 'border-box' }} />
      </div>
      {/* switch to compact mode */}
      <div style={{ position: 'absolute', right: 10, top: cy - 7, width: 16, height: 14, borderRadius: 2, border: '1px solid #5a6a85', background: 'linear-gradient(180deg,#3d4b61,#141a24)' }}>
        <div style={{ position: 'absolute', left: 3, top: 3, width: 8, height: 6, border: '1px solid #cfd9e8', boxSizing: 'border-box' }} />
      </div>
    </div>
  );
}

const Shuffle = () => (
  <svg width="12" height="10" viewBox="0 0 12 10">
    <path d="M1 2h2.5l5 6H11M1 8h2.5l5-6H11" fill="none" stroke="#dfe7f2" strokeWidth="1.2" />
  </svg>
);
const Repeat = () => (
  <svg width="12" height="10" viewBox="0 0 12 10">
    <path d="M2 6V3.5h7.5M10 4v2.5H2.5" fill="none" stroke="#dfe7f2" strokeWidth="1.2" />
    <path d="M8.5 1.5l1.6 2-1.6 2zM3.5 8.5l-1.6-2 1.6-2z" fill="#dfe7f2" />
  </svg>
);
