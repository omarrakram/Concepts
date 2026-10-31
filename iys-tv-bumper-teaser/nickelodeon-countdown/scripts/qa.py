"""Validate the delivered films (the encoded MP4s, not the render): python scripts/qa.py [--asr-python PATH]

Writes out/validation.json and out/validation-report.md. Exits non-zero if any check fails.
"""
import argparse
import hashlib
import json
import os
import re
import subprocess
import sys

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'comp'))
from common import load_json  # noqa: E402
from countdown import Countdown  # noqa: E402

FILMS = {'9x16': ('IYS-NICKELODEON-COUNTDOWN-TEASER-1080x1920.mp4', 1080, 1920),
         '4x5': ('IYS-NICKELODEON-COUNTDOWN-TEASER-1080x1350.mp4', 1080, 1350)}
WISH = 'i wish i had clothes like the popular kids'
results = []


def check(name, ok, detail=''):
    results.append({'check': name, 'ok': bool(ok), 'detail': detail})
    print(('PASS ' if ok else 'FAIL ') + name + (f'  [{detail}]' if detail else ''), flush=True)
    return ok


def probe(f):
    out = subprocess.run(['ffprobe', '-v', 'error', '-count_frames', '-show_streams', '-show_format', '-of', 'json', f],
                         capture_output=True, text=True, check=True).stdout
    return json.loads(out)


def frames_rgb(f, w, h, select=None):
    vf = [f'select={select}'] if select else []
    vf.append('scale=in_color_matrix=bt709:in_range=tv:out_range=pc:flags=accurate_rnd+full_chroma_int')
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', f, '-vf', ','.join(vf), '-vsync', '0', '-f', 'rawvideo',
                          '-pix_fmt', 'rgb24', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, h, w, 3)


def audio(f, sr=48000):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', f, '-vn', '-ac', '2', '-ar', str(sr), '-f', 'f32le', '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2)


def rel_lum(rgb8):
    c = rgb8.astype(np.float32) / 255
    lin = np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
    return lin @ np.array([0.2126, 0.7152, 0.0722], np.float32)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--asr-python', default='')
    a = ap.parse_args()
    tl = load_json('config', 'timeline.json')
    fps, n = tl['fps'], tl['frames']
    cd = Countdown()
    report = {'films': {}, 'countdown': {}, 'audio': {}}

    # --- D. the countdown, every frame -------------------------------------------------------------------------
    origin = tl['countdown']['clockOriginFrame']
    vals = [(f, cd.text(f)) for f in range(tl['countdown']['visibleFrom'], n)]
    pat = re.compile(r'^\d\d:\d\d:\d\d:\d\d$')
    check('countdown: four two-digit groups separated by colons, nothing else, on every frame',
          all(pat.match(t) for _, t in vals), f'{len(vals)} frames')
    secs = [cd.seconds(f) for f, _ in vals]
    check('countdown: never increases, never negative', all(b <= a_ for a_, b in zip(secs, secs[1:])) and min(secs) >= 0)
    ok = all(0 <= int(t[3:5]) < 24 and 0 <= int(t[6:8]) < 60 and 0 <= int(t[9:11]) < 60 for _, t in vals)
    check('countdown: valid hours (<24), minutes (<60), seconds (<60)', ok)
    changes = [(f, cd.text(f - 1), cd.text(f)) for f in range(origin, n) if cd.text(f) != cd.text(f - 1)]
    check('countdown: starts at 03:00:00:00 when its clock starts', cd.text(origin) == '03:00:00:00', f'frame {origin}')
    check('countdown: first tick rolls over to 02:23:59:59, one second later',
          changes and changes[0] == (origin + fps, '03:00:00:00', '02:23:59:59'), str(changes[:1]))
    check('countdown: ticks exactly once a second, one second at a time',
          all(f2 - f1 == fps for (f1, _, _), (f2, _, _) in zip(changes, changes[1:])) and
          all(cd.seconds(f - 1) - cd.seconds(f) == 1 for f, _, _ in changes), ', '.join(f'{f}:{b}' for f, _, b in changes))
    report['countdown'] = {'start': load_json('config', 'countdown.json')['start'], 'target': load_json('config', 'countdown.json')['target'],
                           'timezone': 'Africa/Cairo', 'utc': cd.utc, 'totalSeconds': cd.total, 'clockOriginFrame': origin,
                           'ticks': [{'frame': f, 'from': a_, 'to': b} for f, a_, b in changes], 'finalValue': cd.text(n - 1)}

    for fmt, (name, W, H) in FILMS.items():
        f = os.path.join(ROOT, 'out', name)
        if not check(f'{fmt}: delivered file exists', os.path.exists(f), name):
            continue
        p = probe(f)
        v = next(s for s in p['streams'] if s['codec_type'] == 'video')
        au = next(s for s in p['streams'] if s['codec_type'] == 'audio')
        dur = float(p['format']['duration'])
        info = {'file': name, 'bytes': os.path.getsize(f), 'sha256': hashlib.sha256(open(f, 'rb').read()).hexdigest(),
                'width': v['width'], 'height': v['height'], 'sar': v.get('sample_aspect_ratio'), 'dar': v.get('display_aspect_ratio'),
                'codec': v['codec_name'], 'profile': v.get('profile'), 'pix_fmt': v['pix_fmt'], 'fps': v['r_frame_rate'],
                'frames': int(v['nb_read_frames']), 'duration': dur, 'video_duration': float(v['duration']),
                'audio': {'codec': au['codec_name'], 'profile': au.get('profile'), 'sample_rate': int(au['sample_rate']),
                          'channels': au['channels'], 'duration': float(au['duration']), 'bit_rate': au.get('bit_rate')},
                'color': {k: v.get(k) for k in ('color_range', 'color_space', 'color_transfer', 'color_primaries')}}
        report['films'][fmt] = info
        check(f'{fmt}: {W}x{H}, square pixels', (v['width'], v['height']) == (W, H) and v.get('sample_aspect_ratio') in (None, '1:1'),
              f"{v['width']}x{v['height']} SAR {v.get('sample_aspect_ratio')} DAR {v.get('display_aspect_ratio')}")
        check(f'{fmt}: H.264, yuv420p, 30 fps', v['codec_name'] == 'h264' and v['pix_fmt'] == 'yuv420p' and v['r_frame_rate'] == '30/1',
              f"{v['codec_name']} {v.get('profile')} {v['pix_fmt']} {v['r_frame_rate']}")
        check(f'{fmt}: {n} frames, {n / fps:.3f} s', int(v['nb_read_frames']) == n and abs(float(v['duration']) - n / fps) < 0.002,
              f"{v['nb_read_frames']} frames, video {float(v['duration']):.3f} s, file {dur:.3f} s")
        check(f'{fmt}: AAC stereo 48 kHz, as long as the picture', au['codec_name'] == 'aac' and au['channels'] == 2 and
              int(au['sample_rate']) == 48000 and abs(float(au['duration']) - n / fps) < 0.03, f"{au['codec_name']} {au['channels']} ch {au['sample_rate']} Hz {float(au['duration']):.3f} s")
        dec = subprocess.run(['ffmpeg', '-v', 'error', '-i', f, '-f', 'null', '-'], capture_output=True, text=True)
        check(f'{fmt}: decodes end to end without an error', dec.returncode == 0 and not dec.stderr.strip(), dec.stderr.strip()[:200])

        # E. the final encoded frame shows the countdown: bright digit strokes across the middle of the glass
        rgb = frames_rgb(f, W, H)
        check(f'{fmt}: every frame decoded', len(rgb) == n, str(len(rgb)))
        last = rgb[-1]
        lum = rel_lum(last)
        band = lum[int(H * 0.40):int(H * 0.60)]
        bright = float((band > 0.6).mean())
        cols = (band > 0.6).any(axis=0)
        span = (np.where(cols)[0].max() - np.where(cols)[0].min()) / W if cols.any() else 0
        check(f'{fmt}: final encoded frame is not black and shows the countdown (bright strokes spanning the frame)',
              lum.mean() > 0.02 and bright > 0.02 and span > 0.75, f'mean luminance {lum.mean():.3f}, lit {bright:.1%} of the middle band, spanning {span:.0%} of the width')
        info['finalFrame'] = {'countdown': cd.text(n - 1), 'meanLuminance': round(float(lum.mean()), 4), 'digitSpan': round(float(span), 3)}
        # the countdown is still moving at the cut: the last tick was less than a second before the last frame
        lt = cd.last_tick(n - 1)
        check(f'{fmt}: the countdown is still running at the cut', lt is not None and (n - 1) - lt[0] < fps,
              f'last tick at frame {lt[0] if lt else None}, cut at frame {n - 1}')
        # flashes (WCAG 2.3.1): opposing luminance swings of 10%+ over the frame or its middle, at most 3 in any second
        regions = {'frame': (slice(None), slice(None)), 'middle': (slice(int(H * .25), int(H * .75)), slice(int(W * .1), int(W * .9)))}
        flash = {}
        for rn, (ys, xs) in regions.items():
            m = np.array([rel_lum(fr[ys, xs][::4, ::4]).mean() for fr in rgb])
            # a transition: a swing of 0.1+ in relative luminance (the darker side under 0.8) against the last swing's
            # direction; a flash is a pair of opposing transitions
            trans_frames = []
            last_val, last_dir = m[0], 0
            for i, x in enumerate(m[1:], 1):
                d = x - last_val
                if abs(d) >= 0.1 and min(x, last_val) < 0.8:
                    direc = 1 if d > 0 else -1
                    if direc != last_dir:
                        trans_frames.append(i)
                        last_dir = direc
                    last_val = x
                elif (d > 0) == (last_dir > 0) and last_dir != 0:
                    last_val = x
            worst = max((sum(1 for t in trans_frames if s0 <= t < s0 + fps) for s0 in range(len(m))), default=0)
            flash[rn] = {'transitions': trans_frames, 'maxTransitionsPerSecond': worst, 'flashesPerSecond': worst // 2}
        info['flash'] = flash
        check(f'{fmt}: no more than three flashes in any second (frame and middle)',
              all(v_['flashesPerSecond'] <= 3 for v_ in flash.values()), json.dumps({k: v_['flashesPerSecond'] for k, v_ in flash.items()}))

        # G. sound: loudness, true peak, ticks on their frames
        st = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', f, '-vn', '-af', 'ebur128=peak=true', '-f', 'null', '-'],
                            capture_output=True, text=True).stderr
        summ = st[st.rfind('Summary'):]
        I = float(re.search(r'I:\s+(-?[\d.]+) LUFS', summ).group(1))
        tp = float(re.search(r'Peak:\s+(-?[\d.]+) dBFS', summ).group(1))
        info['audio'].update({'integratedLUFS': I, 'truePeakdBTP': tp})
        check(f'{fmt}: loudness about -14 LUFS, true peak under -1 dBTP', abs(I + 14) < 1.0 and tp <= -0.9, f'{I} LUFS, {tp} dBTP')
        x = audio(f)
        sr = 48000
        hpf = np.diff(x.mean(axis=1), prepend=0)                 # crude high-pass: the ticks' clicks stand out
        env = np.convolve(np.abs(hpf), np.ones(48) / 48, mode='same')
        offs = []
        for fr, _, _ in changes:
            t = fr / fps
            s0, s1 = int((t - 0.05) * sr), int((t + 0.05) * sr)
            seg = env[s0:s1]
            on = np.argmax(seg > seg.max() * 0.5)
            offs.append(round(float((s0 + on) / sr - t), 4))
        info['audio']['tickOnsetOffsets_s'] = offs
        check(f'{fmt}: each tick sounds on the frame its digits change (within 10 ms)', all(abs(o) <= 0.010 for o in offs), str(offs))

        # A. the full wish is in the delivered sound (speech recognition on the film's own audio)
        if a.asr_python and fmt == '9x16':
            wav = os.path.join(ROOT, 'build', 'qa-cartoon-16k.wav')
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', f, '-t', '7.6', '-vn', '-ac', '1', '-ar', '16000', wav], check=True)
            code = ("import sys, json, wave, numpy as np\n"
                    "from faster_whisper import WhisperModel\n"
                    "w = wave.open(sys.argv[1]); a = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768\n"
                    "m = WhisperModel('small.en', device='cpu', compute_type='int8')\n"
                    "segs, _ = m.transcribe(a, language='en', word_timestamps=True, beam_size=5, condition_on_previous_text=False)\n"
                    "print(json.dumps([[wd.word, round(wd.start, 2), round(wd.end, 2)] for s in segs for wd in s.words]))\n")
            r = subprocess.run([a.asr_python, '-c', code, wav], capture_output=True, text=True)
            try:
                words = json.loads(r.stdout.strip().splitlines()[-1])
            except Exception:
                words = []
            text = ' '.join(re.sub(r'[^a-z ]', '', w[0].lower()).strip() for w in words)
            report['audio']['transcript'] = text
            report['audio']['words'] = words
            check('9x16: the whole wish is heard in the delivered film ("I wish I had clothes like the popular kids")',
                  WISH in re.sub(r'\s+', ' ', text), text)

    report['checks'] = results
    report['passed'] = all(r['ok'] for r in results)
    with open(os.path.join(ROOT, 'out', 'validation.json'), 'w') as fh:
        json.dump(report, fh, indent=1)
    lines = ['# Validation report', '', 'Generated by `scripts/qa.py` from the delivered MP4s.', '',
             '| | Check | Detail |', '|---|---|---|']
    for r in results:
        lines.append(f"| {'PASS' if r['ok'] else 'FAIL'} | {r['check']} | {r['detail'].replace('|', '/')} |")
    lines += ['', '## Files', '']
    for fmt, i in report['films'].items():
        lines.append(f"- **{i['file']}**: {i['width']}x{i['height']}, {i['frames']} frames at {i['fps']}, {i['video_duration']:.3f} s, "
                     f"{i['codec']} {i['profile']} {i['pix_fmt']}, AAC {i['audio']['channels']} ch {i['audio']['sample_rate']} Hz, "
                     f"{i['bytes']:,} bytes, sha256 `{i['sha256']}`")
    with open(os.path.join(ROOT, 'out', 'validation-report.md'), 'w') as fh:
        fh.write('\n'.join(lines) + '\n')
    print('ALL PASSED' if report['passed'] else 'SOME CHECKS FAILED')
    sys.exit(0 if report['passed'] else 1)


if __name__ == '__main__':
    main()
