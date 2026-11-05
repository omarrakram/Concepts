"""Compare a newly delivered MP4 with an earlier delivery over its unchanged opening: decoded frames (exact equality and
PSNR) and decoded sound.

  python scripts/compare_delivery.py OLD.mp4 NEW.mp4 WIDTH HEIGHT FIRST_CHANGED_FRAME
"""
import subprocess, sys
import numpy as np
old, new, W, H, cut = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), int(sys.argv[5])

def frames(f):
    vf = 'scale=in_color_matrix=bt709:in_range=tv:out_range=pc:flags=accurate_rnd+full_chroma_int'
    p = subprocess.Popen(['ffmpeg', '-v', 'error', '-i', f, '-vf', vf, '-vsync', '0', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'],
                         stdout=subprocess.PIPE)
    n = W * H * 3
    while True:
        b = p.stdout.read(n)
        if len(b) < n:
            break
        yield np.frombuffer(b, np.uint8).reshape(H, W, 3)
    p.wait()

def audio(f):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', f, '-vn', '-ac', '2', '-ar', '48000', '-f', 'f32le', '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2)

same, psnr, maxdiff = [], [], []
for i, (a, b) in enumerate(zip(frames(old), frames(new))):
    if i >= cut:
        break
    d = np.abs(a.astype(np.int16) - b.astype(np.int16))
    same.append(bool(d.max() == 0))
    mse = float((d.astype(np.float32) ** 2).mean())
    psnr.append(99.0 if mse == 0 else 10 * np.log10(255 ** 2 / mse))
    maxdiff.append(int(d.max()))
n_same = sum(same)
first_diff = same.index(False) if False in same else None
print(f'frames 0-{cut - 1}: {n_same}/{len(same)} bit-identical after decoding; first differing frame {first_diff}; '
      f'min PSNR {min(psnr):.1f} dB (frame {int(np.argmin(psnr))}); max code-value difference {max(maxdiff)}')
if first_diff is not None:
    diffs = [i for i, s in enumerate(same) if not s]
    print('differing frames:', diffs[:5], '...', diffs[-5:], f'({len(diffs)})',
          'PSNR there: %.1f-%.1f dB' % (min(psnr[i] for i in diffs), max(psnr[i] for i in diffs)))
xa, xb = audio(old), audio(new)
c = int(cut / 30 * 48000)
dd = np.where(np.any(xa[:c] != xb[:c], axis=1))[0]
print(f'sound 0-{c / 48000:.3f} s ({c} samples): ' + ('sample-identical' if len(dd) == 0 else
      f'first differing sample {dd[0]} ({dd[0] / 48000:.4f} s), {len(dd)} differ, max |diff| {np.abs(xa[:c] - xb[:c]).max():.2e}'))
if len(dd):
    print(f'identical up to {dd[0] / 48000:.4f} s; the change starts at {c / 48000:.4f} s')
