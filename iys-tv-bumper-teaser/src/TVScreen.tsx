import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { Cartoon, CARTOON } from './Cartoon';
import { frameFile, type RenderSet, T } from './timeline';

/**
 * What the TV in the room shows (4:3, 640 × 480): the cartoon, then the channel
 * bumper cutting in with a quick blue swoosh wipe, then the bumper itself: the
 * centre 4:3 band of the full-frame bumper render, so that when the camera goes
 * into the screen the picture continues exactly into the 9:16 bumper.
 * Rendered to PNGs and mapped onto the CRT in blender/room.py.
 */
export function TVScreen({ set }: { set: RenderSet }) {
  const f = useCurrentFrame();
  const t = interpolate(f, [T.interrupt, T.wipeEnd], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  // the wipe front: a curved swoosh crossing from left to right, a little ahead at the top
  const front = -0.25 + 1.6 * t * t * (3 - 2 * t);
  const W = CARTOON.w;
  const H = CARTOON.h;
  const curve = (dx: number) => `M${(front + dx) * W - 120},${-10} Q${(front + dx) * W + 60},${H * 0.5} ${(front + dx) * W - 160},${H + 10}`;
  const reveal = `${curve(0)} L-200,${H + 10} L-200,-10 Z`;
  const showBumper = f >= T.interrupt;
  const bumperH = (W * 1280) / 720;
  return (
    <AbsoluteFill style={{ background: '#000', overflow: 'hidden' }}>
      {f < T.wipeEnd && <Cartoon />}
      {showBumper && (
        <AbsoluteFill style={{ clipPath: f < T.wipeEnd ? `path('${reveal}')` : undefined }}>
          <Img src={staticFile(frameFile(set, 'bumper', Math.max(T.interrupt, f)))} style={{ position: 'absolute', left: 0, top: (H - bumperH) / 2, width: W, height: bumperH }} />
        </AbsoluteFill>
      )}
      {f >= T.interrupt && f < T.wipeEnd + 2 && (
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          {/* the swoosh: a deep-blue band with a bright leading edge */}
          <path d={curve(0)} fill="none" stroke="#0b2a7a" strokeWidth={90} strokeLinecap="round" opacity={0.9 * (1 - interpolate(f, [T.wipeEnd - 1, T.wipeEnd + 2], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }))} />
          <path d={curve(0.05)} fill="none" stroke="#9fe0ff" strokeWidth={14} strokeLinecap="round" opacity={0.95 * (1 - t)} />
          <path d={curve(0.075)} fill="none" stroke="#ffffff" strokeWidth={5} strokeLinecap="round" opacity={1 - t} />
        </svg>
      )}
      {/* the cut itself: one bright frame, as an old channel ident hit */}
      {f === T.interrupt && <AbsoluteFill style={{ background: 'rgba(220,240,255,0.55)' }} />}
    </AbsoluteFill>
  );
}
