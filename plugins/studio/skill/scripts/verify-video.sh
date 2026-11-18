#!/bin/bash
# verify-video.sh — Hard check of the rendered product (PASS/FAIL, no eyeballing by the agent)
#
# Checks: resolution/fps, duration error, audio stream presence, head/tail black frames, LUFS loudness, file size
# Composition-side checks (lint/layout/motion/contrast) are handled by hyperframes check; this script only covers the product.
#
# Usage:
#   bash verify-video.sh video.mp4 [--duration=10] [--fps=60] [--width=1920] [--height=1080]
#                        [--no-audio]        # an intermediate product that is explicitly silent; skips the audio + loudness checks
#                        [--allow-black-open] # skip the head black-frame check when the film deliberately opens on black
#
# Exit code: 0 = all PASS; 1 = there is a FAIL

set -u
FILE="${1:-}"
if [ -z "$FILE" ] || [ ! -f "$FILE" ]; then
  echo "Usage: bash verify-video.sh video.mp4 [--duration=N] [--fps=N] [--width=N] [--height=N] [--no-audio] [--allow-black-open]"
  exit 1
fi
shift || true

EXP_DURATION=""; EXP_FPS=""; EXP_W=""; EXP_H=""; NO_AUDIO=0; ALLOW_BLACK_OPEN=0
for a in "$@"; do
  case "$a" in
    --duration=*) EXP_DURATION="${a#*=}" ;;
    --fps=*)      EXP_FPS="${a#*=}" ;;
    --width=*)    EXP_W="${a#*=}" ;;
    --height=*)   EXP_H="${a#*=}" ;;
    --no-audio)   NO_AUDIO=1 ;;
    --allow-black-open) ALLOW_BLACK_OPEN=1 ;;
  esac
done

FAILS=0
pass() { echo "  ✓ PASS  $1"; }
fail() { echo "  ✗ FAIL  $1"; FAILS=$((FAILS+1)); }
warn() { echo "  ⚠ WARN  $1"; }

echo "▸ verify-video: $FILE"

# ---------- basic stream info ----------
INFO=$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height,avg_frame_rate -show_entries format=duration,size -of default=noprint_wrappers=1 "$FILE" 2>/dev/null)
W=$(echo "$INFO" | grep '^width=' | cut -d= -f2)
H=$(echo "$INFO" | grep '^height=' | cut -d= -f2)
FPS_RAW=$(echo "$INFO" | grep '^avg_frame_rate=' | cut -d= -f2)
DUR=$(echo "$INFO" | grep '^duration=' | cut -d= -f2)
SIZE=$(echo "$INFO" | grep '^size=' | cut -d= -f2)
FPS=$(python3 -c "print(round(eval('${FPS_RAW:-0}' if '${FPS_RAW:-0}'!='0/0' else '0'),2))" 2>/dev/null || echo "?")

[ -z "$W" ] && { fail "Cannot read the video stream (corrupt file or not a video)"; echo "✗ 1 item FAIL"; exit 1; }
echo "  info: ${W}x${H} · ${FPS}fps · ${DUR%.*}s · $((SIZE/1024))KB"

# ---------- resolution / fps ----------
if [ -n "$EXP_W" ]; then
  [ "$W" = "$EXP_W" ] && [ "$H" = "$EXP_H" ] && pass "resolution ${W}x${H}" || fail "resolution ${W}x${H}, expected ${EXP_W}x${EXP_H}"
fi
if [ -n "$EXP_FPS" ]; then
  python3 -c "exit(0 if abs($FPS-$EXP_FPS)<=0.5 else 1)" 2>/dev/null && pass "frame rate ${FPS}fps" || fail "frame rate ${FPS}fps, expected ${EXP_FPS}fps"
fi

# ---------- duration error (±2% or ±0.2s, whichever is larger)----------
if [ -n "$EXP_DURATION" ]; then
  python3 -c "
d=float('$DUR'); e=float('$EXP_DURATION')
tol=max(e*0.02,0.2)
exit(0 if abs(d-e)<=tol else 1)" 2>/dev/null && pass "duration ${DUR%.*}s (expected ${EXP_DURATION}s)" || fail "duration ${DUR}s, expected ${EXP_DURATION}s (tolerance 2%)"
fi

# ---------- audio stream ----------
HAS_AUDIO=$(ffprobe -v error -select_streams a -show_entries stream=codec_type -of csv=p=0 "$FILE" 2>/dev/null | head -1)
if [ "$NO_AUDIO" = "1" ]; then
  [ -z "$HAS_AUDIO" ] && pass "no audio track (--no-audio intermediate product)" || warn "--no-audio declared but an audio track is present"
else
  if [ -n "$HAS_AUDIO" ]; then
    pass "audio stream present"
    # ---------- LUFS loudness (deliverable reference -14 LUFS ±4)----------
    LUFS=$(ffmpeg -i "$FILE" -af loudnorm=print_format=summary -f null - 2>&1 | grep 'Input Integrated' | grep -oE '\-?[0-9]+\.?[0-9]*')
    if [ -n "$LUFS" ]; then
      python3 -c "exit(0 if -18<=float('$LUFS')<=-10 else 1)" 2>/dev/null \
        && pass "loudness ${LUFS} LUFS (target range -18~-10)" \
        || warn "loudness ${LUFS} LUFS is outside the -14±4 range, check the mix gain"
    fi
  else
    fail "no audio stream — skill iron rule: the default delivery form for an animation is an MP4 with SFX+BGM; silent = half-finished"
  fi
fi

# ---------- head/tail black frames ----------
BLACK=$(ffmpeg -i "$FILE" -vf "blackdetect=d=0.1:pix_th=0.10" -an -f null - 2>&1 | grep -oE 'black_start:[0-9.]+ black_end:[0-9.]+' )
if [ -n "$BLACK" ]; then
  HEAD_BLACK=$(echo "$BLACK" | awk -F'[: ]' '$2<0.3{print}' | head -1)
  TOTAL=${DUR%.*}
  TAIL_BLACK=$(echo "$BLACK" | awk -F'[: ]' -v t="$TOTAL" '$4>t-0.3{print}' | head -1)
  if [ -n "$HEAD_BLACK" ] && [ "$ALLOW_BLACK_OPEN" = "0" ]; then
    fail "head black frame ($HEAD_BLACK) — the typical symptom of a recording start offset; for a deliberate black opening use --allow-black-open"
  else
    [ -n "$HEAD_BLACK" ] && pass "head black opening (--allow-black-open declared)"
  fi
  [ -n "$TAIL_BLACK" ] && fail "tail black frame ($TAIL_BLACK) — the typical symptom of a loop jump-back or recording past the duration"
  [ -z "$HEAD_BLACK" ] && [ -z "$TAIL_BLACK" ] && warn "black-frame segment inside the film (ignore if it is a deliberate transition): $(echo "$BLACK" | head -2 | tr '\n' ' ')"
else
  pass "no black frames"
fi

# ---------- summary ----------
echo ""
if [ "$FAILS" = "0" ]; then
  echo "◇ verify-video: all PASS"
  exit 0
else
  echo "✗ verify-video: ${FAILS} FAIL"
  exit 1
fi
