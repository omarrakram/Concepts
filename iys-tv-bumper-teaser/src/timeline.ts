/**
 * The master timeline (30 fps, 450 frames = 15 s). The Blender scenes use the
 * same frame numbers (blender/bumper.py, blender/room.py).
 */
export const FPS = 30;
export const TOTAL = 450;

export const T = {
  /** the bumper cuts into the cartoon on the TV (a channel wipe) */
  interrupt: 96,
  wipeEnd: 104,
  /** the room camera pushes into the screen (blender/room.py) */
  intoScreen: 104,
  /** inside the screen: the room dissolves into the full-frame bumper */
  dissolve: [136, 142] as const,
  /** last frame of the room render */
  roomEnd: 142,
  /** the bumper is rendered at 1080 × 1920 from here on (the reveal), blended in */
  hd: [330, 336] as const,
  /** the line, then the IYS bug in the corner */
  title: [392, 404] as const,
  bug: [404, 414] as const,
};

/** Where the renders live (public/renders/<set>/...): the animatic is the same edit at low resolution. */
export type RenderSet = 'animatic' | 'final';
export const frameFile = (set: RenderSet, shot: 'room' | 'bumper' | 'bumper-hd' | 'tv', f: number) => `renders/${set}/${shot}/${String(f).padStart(4, '0')}.png`;
