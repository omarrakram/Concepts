"""Hash every composed frame (the exact 8-bit RGB the encoder receives) that one checkout of this folder renders, to prove
two versions render the same pictures:

  python scripts/frame_hashes.py ROOT FORMAT FIRST LAST OUT.json     (ROOT: a checkout of this folder, with build/content
                                                                  and plate/ in place)
"""
import hashlib, json, os, sys
root, fmt, first, last, out = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), sys.argv[5]
sys.path.insert(0, os.path.join(root, 'comp'))
os.chdir(root)
import film as F
film = F.Film(fmt)
h = {}
for f in range(first, last + 1):
    sig, seg = film.signal(f)
    img = film.compose(f, sig)
    h[f] = hashlib.sha256(img.tobytes()).hexdigest()
json.dump(h, open(out, 'w'), indent=0)
print(fmt, root, 'hashed', len(h), 'frames')
