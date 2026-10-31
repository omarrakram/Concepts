"""Finish one format: picture + sound -> the delivered MP4, and its stills and contact sheet.

  python scripts/finish.py 9x16      -> out/IYS-NICKELODEON-COUNTDOWN-TEASER-1080x1920.mp4, out/stills/..., out/...
  python scripts/finish.py 4x5       -> out/IYS-NICKELODEON-COUNTDOWN-TEASER-1080x1350.mp4, ...
"""
import json
import os
import shutil
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'comp'))
from common import load_json  # noqa: E402

NAMES = {'9x16': 'IYS-NICKELODEON-COUNTDOWN-TEASER-1080x1920', '4x5': 'IYS-NICKELODEON-COUNTDOWN-TEASER-1080x1350'}
# the frames kept as stills (film frames): the cover is the set already hijacked, the room still around it
STILLS = {'first-frame': 0, 'cover': 345, 'wish': 150, 'ident-interruption': 321}


def run(cmd):
    subprocess.run(cmd, check=True)


def main(fmt):
    tl = load_json('config', 'timeline.json')
    last = tl['frames'] - 1
    out = os.path.join(ROOT, 'out')
    os.makedirs(os.path.join(out, 'stills'), exist_ok=True)
    name = NAMES[fmt]
    film = os.path.join(ROOT, 'build', f'film-{fmt}.mp4')
    mix = os.path.join(ROOT, 'build', 'audio', 'mix.wav')
    mp4 = os.path.join(out, f'{name}.mp4')
    # the sound: the -14 LUFS mix, its few peaks held under -1 dBTP; AAC-LC stereo 48 kHz
    run(['ffmpeg', '-v', 'error', '-y', '-i', film, '-i', mix, '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy',
         '-af', 'alimiter=limit=0.84:attack=3:release=60:level=false:asc=true',
         '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-ac', '2', '-movflags', '+faststart',
         '-metadata', 'title=IYS Nickelodeon countdown teaser (internal concept)',
         '-metadata', 'comment=Internal creative concept using third-party footage; not cleared for publication.', mp4])
    # stills, taken from the encoded film itself
    sdir = os.path.join(out, 'stills', fmt)
    os.makedirs(sdir, exist_ok=True)
    frames = dict(STILLS, **{'final-countdown-frame': last})
    for label, f in frames.items():
        run(['ffmpeg', '-v', 'error', '-y', '-i', mp4, '-vf', f'select=eq(n\\,{f})', '-frames:v', '1',
             os.path.join(sdir, f'{label}-f{f:03d}.png')])
    # glitch keyframes: every frame of the glitch, and the countdown's first lock and first tick
    g0, gn = tl['glitch']['first'], tl['glitch']['frames']
    gsel = '+'.join(f'eq(n\\,{f})' for f in range(g0 - 1, g0 + gn + 1))
    run(['ffmpeg', '-v', 'error', '-y', '-i', mp4, '-vf', f"select='{gsel}',scale=270:-2,tile=5x4:padding=4:color=black",
         '-frames:v', '1', os.path.join(sdir, 'glitch-keyframes.png')])
    # contact sheet: a frame every half second, with its time
    font = '/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf'
    run(['ffmpeg', '-v', 'error', '-y', '-i', mp4, '-vf',
         "select='not(mod(n\\,15))',scale=216:-2,"
         f"drawtext=fontfile={font}:text='%{{pts\\:hms}}  f%{{eif\\:t*30+0.5\\:d}}':x=6:y=h-22:fontsize=13:fontcolor=white:box=1:boxcolor=black@0.6,"
         "tile=6x6:padding=4:color=black", '-frames:v', '1', '-vsync', 'vfr', os.path.join(out, f'contact-sheet-{fmt}.png')])
    shutil.copy(os.path.join(ROOT, 'build', f'film-{fmt}.json'), os.path.join(out, f'frame-log-{fmt}.json'))
    print('finished', mp4)


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else '9x16')
