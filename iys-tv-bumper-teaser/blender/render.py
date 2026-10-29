"""Build a scene and render frames.

  blender -b --factory-startup -noaudio --python blender/render.py -- \
      --scene bumper --frames 96-449 --res 720x1280 --samples 16 --out renders/bumper

  --frames  a range "a-b" (rendered as one animation, persistent data) or a list "120,156,230"
  --res     WxH            --samples N        --out DIR (frames are DIR/####.png)
  --no-blur                 motion blur off (quick previews)
  --resume                  skip frames that already exist in DIR (an interrupted render picks up where it stopped)
  --save FILE.blend         also save the built scene (for inspection in the Blender UI), texture paths relative
  --save-only               build and save (with --save), render nothing: --frames and --out are not needed
"""
import argparse
import os
import sys
import time

import bpy

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import lib  # noqa: E402

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
ap = argparse.ArgumentParser()
ap.add_argument('--scene', required=True, choices=['bumper', 'room'])
ap.add_argument('--frames')
ap.add_argument('--res', default='720x1280')
ap.add_argument('--samples', type=int, default=16)
ap.add_argument('--out')
ap.add_argument('--no-blur', action='store_true')
ap.add_argument('--resume', action='store_true')
ap.add_argument('--save')
ap.add_argument('--save-only', action='store_true')
a = ap.parse_args(argv)
if a.save_only and not a.save:
    ap.error('--save-only needs --save FILE.blend')
if not a.save_only and not (a.frames and a.out):
    ap.error('--frames and --out are required (unless --save-only)')

if a.scene == 'bumper':
    import bumper as module
else:
    import room as module

t0 = time.time()
sc = module.build()
w, h = (int(v) for v in a.res.lower().split('x'))
lib.setup_render(sc, w, h, a.samples, motion_blur=not a.no_blur)
sc.render.use_overwrite = not a.resume
sc.render.use_placeholder = False
print(f'BUILT {a.scene} in {time.time() - t0:.1f} s')
if a.save:
    os.makedirs(os.path.dirname(os.path.abspath(a.save)), exist_ok=True)
    bpy.context.preferences.filepaths.save_version = 0  # no .blend1 backups
    bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(a.save))
    bpy.ops.file.make_paths_relative()  # the brand files and the TV frames, found from wherever the project is
    bpy.ops.wm.save_mainfile()
    print(f'SAVED {a.save}')
if a.save_only:
    sys.exit(0)
os.makedirs(a.out, exist_ok=True)

if '-' in a.frames and ',' not in a.frames:
    f0, f1 = (int(v) for v in a.frames.split('-'))
    sc.frame_start, sc.frame_end = f0, f1
    sc.render.filepath = os.path.join(os.path.abspath(a.out), '####')
    stamps = {}
    bpy.app.handlers.render_pre.append(lambda s, *_: stamps.__setitem__(s.frame_current, time.time()))
    bpy.app.handlers.render_post.append(lambda s, *_: print(f'FRAME {s.frame_current} {time.time() - stamps[s.frame_current]:.1f} s', flush=True))
    bpy.ops.render.render(animation=True)
else:
    for f in (int(v) for v in a.frames.split(',')):
        sc.render.filepath = os.path.join(os.path.abspath(a.out), f'{f:04d}.png')
        if a.resume and os.path.exists(sc.render.filepath):
            continue
        sc.frame_set(f)
        t = time.time()
        bpy.ops.render.render(write_still=True)
        print(f'FRAME {f} {time.time() - t:.1f} s', flush=True)
print(f'DONE in {time.time() - t0:.1f} s')
