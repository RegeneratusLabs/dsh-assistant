#!/bin/bash
# sfx-cues.sh — Place SFX hits on a silent video from a cue table (distilled from the B00 staged b-roll work, 2026-07-17)
#
# Usage: bash sfx-cues.sh <silent-video.mp4> <cue-table.tsv> <output.mp4> [--dur=seconds]
#
# Cue table format (TSV, lines starting with # are comments):
#   seconds<TAB>sfx-relative-path (relative to assets/sfx/)<TAB>volume dB
#   e.g. 63.0	impact/brand-stamp.mp3	-13
#
# Volume baseline (light SFX under voiceover): whoosh -16 / tick -15 / impact -12; a pure-animation
# deliverable can go +4dB overall. For cue density see the audio-design-rules.md recipe (b-roll bed
# ≈1 per 9s, only hit structural nodes)

set -e
SFX_DIR="$(cd "$(dirname "$0")/../assets/sfx" && pwd)"
IN="${1:?Usage: bash sfx-cues.sh in.mp4 cues.tsv out.mp4 [--dur=210]}"
TABLE="${2:?Missing cue table}"
OUT="${3:?Missing output path}"
DUR=""
for a in "$@"; do case "$a" in --dur=*) DUR="${a#*=}";; esac; done
[ -z "$DUR" ] && DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$IN" | cut -d. -f1)

INPUTS=(-i "$IN")
FILTER=""; MIX=""; i=1
while IFS=$'\t' read -r t f db || [ -n "$t" ]; do
  [ -z "$t" ] && continue
  case "$t" in \#*) continue;; esac
  [ ! -f "$SFX_DIR/$f" ] && { echo "✗ SFX not found: $f"; exit 1; }
  INPUTS+=(-i "$SFX_DIR/$f")
  ms=$(python3 -c "print(int(float('$t')*1000))")
  FILTER+="[$i:a]adelay=${ms}:all=1,volume=${db}dB[s$i];"
  MIX+="[s$i]"
  i=$((i+1))
done < "$TABLE"
N=$((i-1))
[ "$N" = "0" ] && { echo "✗ Cue table is empty"; exit 1; }

ffmpeg -y -loglevel error "${INPUTS[@]}" \
  -filter_complex "${FILTER}${MIX}amix=inputs=${N}:normalize=0,apad=whole_dur=${DUR}[aout]" \
  -map 0:v -map "[aout]" -c:v copy -c:a aac -b:a 192k -shortest "$OUT"

echo "✓ ${N} cues → $OUT"
