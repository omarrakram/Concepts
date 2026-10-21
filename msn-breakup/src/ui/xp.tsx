import type { CSSProperties, ReactNode } from 'react';
import { TITLE, UI } from '../fonts';

/**
 * Windows XP "Luna" (blue) chrome, rebuilt in CSS: the title bar gradient,
 * the rounded top corners, the glossy minimise / maximise / close buttons,
 * the 3 px blue frame, the menu bar and the classic blue scrollbar.
 */
export const LUNA_TITLE =
  'linear-gradient(180deg, #0997ff 0%, #0053ee 8%, #0050ee 40%, #06f 88%, #06f 93%, #005bff 95%, #003dd7 96%, #003dd7 100%)';
export const LUNA_TITLE_INACTIVE = 'linear-gradient(180deg, #a7bcf6 0%, #7c9ae9 10%, #7a98e8 45%, #8aa6ee 90%, #6e8ad8 100%)';

function CaptionButton({ kind, inactive }: { kind: 'min' | 'max' | 'close'; inactive?: boolean }) {
  const close = kind === 'close';
  const bg = inactive
    ? 'linear-gradient(180deg,#c3d1f7,#9db2ec)'
    : close
      ? 'radial-gradient(circle at 70% 80%, #cc4600 0%, #dc6527 45%, #f39470 100%)'
      : 'radial-gradient(circle at 80% 85%, #0044e0 0%, #2868f5 45%, #74a4ff 100%)';
  return (
    <div
      style={{
        width: 21,
        height: 21,
        borderRadius: 3,
        border: '1px solid #fff',
        background: bg,
        boxShadow: close ? 'inset -1px -1px 1px #a72d00' : 'inset -1px -1px 1px #0a3cc0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: kind === 'min' ? 0 : 2,
      }}
    >
      <svg width="13" height="13" viewBox="0 0 13 13">
        {kind === 'min' && <rect x="2.5" y="9" width="6" height="2.4" fill="#fff" />}
        {kind === 'max' && (
          <g fill="none" stroke="#fff">
            <rect x="2.2" y="2.2" width="8.6" height="8.6" strokeWidth="1.2" />
            <path d="M2.2 3.4h8.6" strokeWidth="2.4" />
          </g>
        )}
        {kind === 'close' && <path d="M3 3l7 7M10 3l-7 7" stroke="#fff" strokeWidth="2" strokeLinecap="square" />}
      </svg>
    </div>
  );
}

export function TitleBar({ title, icon, inactive, height = 29 }: { title: string; icon?: ReactNode; inactive?: boolean; height?: number }) {
  return (
    <div
      style={{
        height,
        background: inactive ? LUNA_TITLE_INACTIVE : LUNA_TITLE,
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        display: 'flex',
        alignItems: 'center',
        padding: '0 5px 0 6px',
        gap: 4,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,.35)',
      }}
    >
      {icon && <div style={{ width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>}
      <div
        style={{
          flex: 1,
          fontFamily: TITLE,
          fontWeight: 700,
          fontSize: 13,
          color: '#fff',
          textShadow: inactive ? 'none' : '1px 1px #0f1089',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          letterSpacing: 0.1,
        }}
      >
        {title}
      </div>
      <CaptionButton kind="min" inactive={inactive} />
      <CaptionButton kind="max" inactive={inactive} />
      <CaptionButton kind="close" inactive={inactive} />
    </div>
  );
}

/** A Luna window: title bar + 3 px blue frame around `children`. */
export function XPWindow({
  title,
  icon,
  inactive,
  style,
  bodyStyle,
  children,
}: {
  title: string;
  icon?: ReactNode;
  inactive?: boolean;
  style?: CSSProperties;
  bodyStyle?: CSSProperties;
  children: ReactNode;
}) {
  const frame = inactive ? '#7d98e5' : '#0831d9';
  return (
    <div
      style={{
        position: 'absolute',
        display: 'flex',
        flexDirection: 'column',
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        boxShadow: '2px 3px 6px rgba(0,0,0,.35)',
        ...style,
      }}
    >
      <TitleBar title={title} icon={icon} inactive={inactive} />
      <div
        style={{
          flex: 1,
          minHeight: 0,
          borderLeft: `3px solid ${frame}`,
          borderRight: `3px solid ${frame}`,
          borderBottom: `3px solid ${frame}`,
          background: inactive ? '#7d98e5' : 'linear-gradient(90deg,#0b46d6,#1f62ef 30%,#1f62ef 70%,#0b46d6)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', fontFamily: UI, fontSize: 11, color: '#000', ...bodyStyle }}>{children}</div>
      </div>
    </div>
  );
}

export function MenuBar({ items, style }: { items: string[]; style?: CSSProperties }) {
  return (
    <div style={{ height: 20, display: 'flex', alignItems: 'center', gap: 2, padding: '0 3px', fontFamily: UI, fontSize: 11, background: '#ece9d8', borderBottom: '1px solid #d6d2c2', ...style }}>
      {items.map((m) => (
        <span key={m} style={{ padding: '2px 6px' }}>
          <span style={{ textDecoration: 'underline' }}>{m[0]}</span>
          {m.slice(1)}
        </span>
      ))}
    </div>
  );
}

/** The classic XP blue scrollbar (vertical). `pos` 0..1, `size` thumb fraction 0..1. */
export function Scrollbar({ height, pos = 0, size = 1 }: { height: number; pos?: number; size?: number }) {
  const W = 17;
  const arrow = (up: boolean) => (
    <div
      style={{
        width: W,
        height: W,
        boxSizing: 'border-box',
        border: '1px solid #b5c7f0',
        borderRadius: 3,
        background: 'linear-gradient(90deg,#c6d6fc,#b1c8fb 50%,#a7bdf7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg width="9" height="6" viewBox="0 0 9 6">
        <path d={up ? 'M1 5l3.5-3.5L8 5' : 'M1 1l3.5 3.5L8 1'} fill="none" stroke="#4d6185" strokeWidth="1.6" />
      </svg>
    </div>
  );
  const track = height - 2 * W;
  const thumbH = Math.max(18, track * Math.min(1, size));
  const top = (track - thumbH) * Math.max(0, Math.min(1, pos));
  return (
    <div style={{ width: W, height, background: '#f2f1ea', borderLeft: '1px solid #e2e0d6', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {arrow(true)}
      <div style={{ flex: 1, position: 'relative' }}>
        {size < 1 && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top,
              height: thumbH,
              boxSizing: 'border-box',
              border: '1px solid #b5c7f0',
              borderRadius: 3,
              background: 'linear-gradient(90deg,#cad9fd,#bcd0fc 50%,#adc3f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="8" height="8" viewBox="0 0 8 8">
              {[1, 3, 5, 7].map((y) => (
                <path key={y} d={`M0 ${y}h8`} stroke={y % 4 === 1 ? '#eef3ff' : '#8ca5e2'} strokeWidth="1" />
              ))}
            </svg>
          </div>
        )}
      </div>
      {arrow(false)}
    </div>
  );
}

/** An XP push button. */
export function XPButton({ children, width = 64, height = 26, pressed, disabled, style }: { children: ReactNode; width?: number; height?: number; pressed?: boolean; disabled?: boolean; style?: CSSProperties }) {
  return (
    <div
      style={{
        width,
        height,
        boxSizing: 'border-box',
        border: '1px solid #003c74',
        borderRadius: 3,
        background: pressed ? 'linear-gradient(180deg,#e3e3db,#f0f0ea)' : 'linear-gradient(180deg,#fff 0%,#f4f4f0 60%,#e3e2d8 100%)',
        boxShadow: pressed ? 'inset 1px 1px 2px rgba(0,0,0,.25)' : 'inset -1px -1px 0 #d6d0c5, inset 1px 1px 0 #fff',
        fontFamily: UI,
        fontSize: 11,
        color: disabled ? '#a7a69c' : '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
