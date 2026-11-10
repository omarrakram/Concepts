#!/usr/bin/env bash
# The whole film, from the supplied files to the validated MP4s.
#   1. put the supplied cartoon clip in sources/ and the TV photo in plate/ (see their READMEs; hashes are checked)
#   2. python3 -m venv .venv && .venv/bin/pip install -r comp/requirements.txt
#   3. PY=.venv/bin/python scripts/render.sh            (about 25 minutes on 4 CPU cores)
# Optional: ASR_PY=/path/to/python-with-faster-whisper to check the wish is audible in the delivered film.
set -euo pipefail
cd "$(dirname "$0")/.."
PY=${PY:-.venv/bin/python}
$PY comp/sources.py                       # the cartoon as the TV signal (4:3, 1440x1080)
$PY audio/mix.py                          # the sound, 48 kHz, -14 LUFS
for fmt in 9x16 4x5; do
  $PY comp/film.py --format "$fmt"        # the picture (H.264 High@4.1, CRF 17, peaks held to 40 Mb/s)
  $PY scripts/finish.py "$fmt"            # + sound -> out/*.mp4, stills, contact sheet
done
$PY scripts/qa.py ${ASR_PY:+--asr-python "$ASR_PY"}
