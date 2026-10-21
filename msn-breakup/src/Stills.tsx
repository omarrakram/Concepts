import { AbsoluteFill } from 'remotion';
import { SCALE, TASKBAR_H, VW } from './constants';
import { CLOCK } from './story/cast';
import { SLIDES } from './story/slides';
import { REEL } from './story/stories';
import { Scene } from './Scene';
import { DesktopIcons, Taskbar, Wallpaper } from './ui/desktop';
import { Pointer } from './ui/icons';
import { SignIn } from './ui/SignIn';

const VIEW = { w: 540, h: 675 };

export function CarouselStill({ slide }: { slide: number }) {
  const s = SLIDES[Math.max(0, Math.min(SLIDES.length - 1, slide))]!;
  const story = { ...REEL, camera: [{ t: 0, ...s.cam }] };
  return <Scene story={story} t={s.t} view={VIEW} frameSeed={slide * 13 + 5} />;
}

/** Bonus: the sign-in window on the desktop, a second before it all goes wrong. */
export function SignInStill() {
  const shift = 960 - VIEW.h;
  return (
    <AbsoluteFill style={{ background: '#000', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: VW, height: VIEW.h, transform: `scale(${SCALE})`, transformOrigin: '0 0', overflow: 'hidden', filter: 'saturate(1.06) contrast(1.02) blur(0.18px)' }}>
        <div style={{ position: 'absolute', left: 0, top: -shift * 0.55, width: VW, height: 960 }}>
          <Wallpaper />
        </div>
        <DesktopIcons />
        <SignIn x={150} y={56} />
        <div style={{ position: 'absolute', left: 328, top: 497 }}>
          <Pointer size={15} />
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, top: VIEW.h - TASKBAR_H, height: TASKBAR_H }}>
          <Taskbar tasks={[{ label: 'MSN Messenger', active: true }]} clock={CLOCK} />
        </div>
      </div>
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 45%, transparent 62%, rgba(0,0,0,.2) 100%)' }} />
    </AbsoluteFill>
  );
}
