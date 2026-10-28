import type { ReactNode } from 'react';
import { AbsoluteFill } from 'remotion';
import { SCALE, VH, VW } from './constants';
import { CLOCK, HER, HIM } from './story/cast';
import { stateAt } from './story/state';
import type { Story } from './story/types';
import { SPOT } from './story/stories';
import { ContactList } from './ui/ContactList';
import { Conversation } from './ui/Conversation';
import { DesktopIcons, Taskbar, Wallpaper } from './ui/desktop';
import { Pointer } from './ui/icons';
import { Toast } from './ui/Toast';

/**
 * One frame of her 2007 screen: the virtual 540 × 960 XP desktop (wallpaper,
 * icons, Messenger, the conversation, toasts, taskbar, pointer), framed by
 * the story's camera, then a light layer of old-screen softness and grain.
 * `view` is the visible part of the virtual screen (540 × 960 for the reel,
 * 540 × 675 for the 4:5 stills).
 */
export function Scene({ story, t, view = { w: VW, h: VH }, frameSeed = 0 }: { story: Story; t: number; view?: { w: number; h: number }; frameSeed?: number }) {
  const s = stateAt(story, t, view);
  const convo = s.convoAge !== null;
  const nudgePressed = s.cursor.pressed && Math.hypot(s.cursor.x - SPOT.nudge.x, s.cursor.y - SPOT.nudge.y) < 14;
  const tasks = [{ label: `${HER.name} - MSN Messenger`, active: !convo }, ...(convo ? [{ label: `${HIM.name} - Conversation`, active: true }] : [])];
  return (
    <Screen camera={s.camera} view={view} frameSeed={frameSeed}>
      <Wallpaper />
      <DesktopIcons />
      <ContactList inactive={convo} listening={s.listening} />
      {convo && (
        <div style={{ opacity: Math.min(1, (s.convoAge ?? 0) / 0.08) }}>
          <Conversation s={s} nudgePressed={nudgePressed} />
        </div>
      )}
      {s.toasts.map((toast, i) => (
        <Toast key={`${toast.kind}${i}`} toast={toast} />
      ))}
      <Taskbar tasks={tasks} clock={CLOCK} trayAlert={s.toasts.length > 0} />
      <div style={{ position: 'absolute', left: s.cursor.x - 1, top: s.cursor.y - 1, transform: s.cursor.pressed ? 'scale(.94)' : undefined, transformOrigin: '0 0' }}>
        <Pointer size={15} />
      </div>
    </Screen>
  );
}

/**
 * The monitor every video is filmed on: `children` are laid out on the
 * virtual 540 × 960 screen, the camera frames `view` of it at 2x, then the
 * old-screen layer goes on top. Each video only decides what is on screen.
 */
export function Screen({ camera: { x, y, z }, view, frameSeed, children }: { camera: { x: number; y: number; z: number }; view: { w: number; h: number }; frameSeed: number; children: ReactNode }) {
  return (
    <AbsoluteFill style={{ background: '#000', overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: VW,
          height: VH,
          transformOrigin: '0 0',
          transform: `translate(${(view.w / 2 - x * z) * SCALE}px, ${(view.h / 2 - y * z) * SCALE}px) scale(${z * SCALE})`,
          overflow: 'hidden',
          filter: 'saturate(1.06) contrast(1.02) blur(0.18px)',
        }}
      >
        {children}
      </div>
      <OldScreen seed={frameSeed} />
    </AbsoluteFill>
  );
}

/** Very light grain + vignette: the "screen recording of an old monitor" feel, never at the expense of the text. */
function OldScreen({ seed }: { seed: number }) {
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, mixBlendMode: 'overlay', opacity: 0.11 }}>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={seed % 97} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 45%, transparent 62%, rgba(0,0,0,.22) 100%)' }} />
    </AbsoluteFill>
  );
}
