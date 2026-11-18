#!/bin/bash
# design-gate-hook.sh — PreToolUse(Bash) hook: checks design-flow gate files before a long render
#
# Iron-rule background (established 2026-07-17): before doing design, the studio must have
# (1) the asset protocol (brand-spec.md) and (2) three real visual directions for the user to
# choose from (direction-approved.md records the choice or the reason for waiving it).
# B00 (210s) measured: skipping direction approval and rendering the full film directly → the
# whole film was redone. This hook turns that lesson into a machine constraint:
# **for compositions ≥45 seconds, no direction-approved.md means no render** — the cost of
# redoing a long film far outweighs stopping for a moment.
#
# Allow conditions (any one):
#   - composition duration <45s or undeterminable (short pieces/experiments stay low-friction,
#     bounded by the SKILL.md gate protocol)
#   - direction-approved.md exists in the project directory (or one of the two parent levels)
#   - the command explicitly carries SKIP_DESIGN_GATE=1 (used when the user says to skip; auditable)
#
# Safety statement: this hook is **not installed automatically by the skill** — neither SKILL.md
# nor the README contains any instruction that writes to settings.json; it only takes effect once
# you configure it into settings.json by hand. Behaviour ceiling: for matching long-film render
# commands it exits 2 to block execution and prints the reason; no network requests, no file
# writes, no deletions. See SECURITY.md at the repo root.
#
# settings.json configuration: PreToolUse / matcher "Bash" / command points at this script

INPUT=$(cat)
CMD=$(printf '%s' "$INPUT" | python3 -c "import json,sys;print(json.load(sys.stdin).get('tool_input',{}).get('command',''))" 2>/dev/null)
CWD=$(printf '%s' "$INPUT" | python3 -c "import json,sys;print(json.load(sys.stdin).get('cwd',''))" 2>/dev/null)

# Commands that merely talk about a command (echo/grep etc.) pass straight through, so plain
# text is not caught by mistake (QA Bug1)
FIRST=$(echo "$CMD" | sed -E 's/^[[:space:]]*//' | cut -d' ' -f1)
case "$FIRST" in echo|printf|grep|cat|ls|head|tail|wc|sed|awk) exit 0;; esac
# Only render commands matter (including npm run render and narration long-film renders)
echo "$CMD" | grep -qE "hyperframes(@[0-9.]+)? +render|render-video(-seek)?\.js|render-narration\.sh|npm +run +render\b" || exit 0
# Explicit skip (an auditable escape hatch)
echo "$CMD" | grep -q "SKIP_DESIGN_GATE=1" && exit 0

# Locate the project directory: the cd target in the command > hook cwd
DIR="$CWD"
CDDIR=$(echo "$CMD" | grep -oE 'cd +"[^"]+"|cd +[^ &;]+' | head -1 | sed -E 's/^cd +//; s/"//g')
[ -n "$CDDIR" ] && [ -d "$CDDIR" ] && DIR="$CDDIR"

# Get the composition duration: hyperframes projects read data-duration in index.html;
# render-video-seek reads the --duration argument
DUR=""
D_ARG=$(echo "$CMD" | grep -oE '\-\-duration=[0-9]+' | head -1 | cut -d= -f2)
[ -n "$D_ARG" ] && DUR="$D_ARG"
if [ -z "$DUR" ] && [ -f "$DIR/index.html" ]; then
  DUR=$(grep -oE 'data-duration="[0-9.]+"' "$DIR/index.html" | head -1 | grep -oE '[0-9.]+' | cut -d. -f1)
fi
# Cannot determine duration, or a short piece → allow
[ -z "$DUR" ] && exit 0
[ "$DUR" -lt 45 ] 2>/dev/null && exit 0

# Long film: look for the gate file (project directory and two levels up)
for d in "$DIR" "$DIR/.." "$DIR/../.."; do
  [ -f "$d/direction-approved.md" ] && exit 0
done

cat >&2 << EOF
🛑 Design-flow gate: this composition is ${DUR}s long (≥45s, a long film), but no direction-approved.md was found in the project.
Studio iron rule: before rendering a long film you must complete "three real visual directions for the user to choose from" (or get an explicit waiver from the user), and record the choice/waiver in direction-approved.md in the project directory (including: which versions were shown, screenshot paths, the user's own words for the choice).
Fill that in and render again; if the user explicitly says to skip it, prefix the command with SKIP_DESIGN_GATE=1 to pass explicitly.
(Basis: the 2026-07-17 B00 measurement — skipping direction approval and rendering the full 210s film → the whole film's visuals were redone)
EOF
exit 2
