# Audio design rules · the studio

> Audio application recipes for every animation demo. Use together with `sfx-library.md` (the asset list).
> Battle-tested through: the studio's launch hero v1-v9 iterations · deep Gemini teardowns of three official Anthropic films · 8000+ A/B comparisons

---

## Core principle · the two-track audio system (iron rule)

Animation audio **must be designed as two independent layers**, never one:

| Layer | Role | Time scale | Relationship to visuals | Frequency band occupied |
|---|---|---|---|---|
| **SFX (beat layer)** | Marks every visual beat | 0.2-2s, short | **Strongly synced** (frame-level alignment) | **High band 800Hz+** |
| **BGM (atmosphere bed)** | Emotional bed, soundstage | Continuous, 20-60s | Weakly synced (section level) | **Low-mid band <4kHz** |

**An animation with BGM only is crippled** — the audience subconsciously registers "the picture moves but nothing answers in sound", and that is exactly where the cheap feeling comes from.

---

## Gold standard · the golden mix

These numbers are **hard engineering parameters** measured from three official Anthropic films plus our own v9 final-cut comparison. Apply them directly:

### Volume
- **BGM volume**: `0.40-0.50` (relative to full scale 1.0)
- **SFX volume**: `1.00`
- **Loudness gap**: BGM sits **-6 to -8 dB below** the SFX peak (make SFX stand out through the loudness gap, not through absolute SFX loudness)
- **amix parameter**: `normalize=0` (never use normalize=1, it flattens the dynamic range)

### Frequency-band isolation (P1 hard optimisation)
Anthropic's secret is not "loud SFX", it is **band separation**:

```bash
[bgm_raw]lowpass=f=4000[bgm]      # keep BGM in the low-mid band below <4kHz
[sfx_raw]highpass=f=800[sfx]      # push SFX into the upper-mid band at 800Hz+
[bgm][sfx]amix=inputs=2:duration=first:normalize=0[a]
```

Why: the human ear is most sensitive in the 2-5kHz range (the "presence band"). If all your SFX live there and BGM covers the full spectrum, **the high-frequency part of the BGM masks the SFX**. Push SFX up with a highpass and pull BGM down with a lowpass, and the two sides each own part of the spectrum; SFX clarity jumps a full grade.

### Fade
- BGM in: `afade=in:st=0:d=0.3` (0.3s, avoids a hard cut)
- BGM out: `afade=out:st=N-1.5:d=1.5` (1.5s long tail, a sense of resolution)
- SFX carry their own envelope; no extra fade needed

---

## SFX cue design rules

### Density (how many SFX per 10 seconds)
Three official Anthropic films measure out to three tiers of SFX density:

| Film | SFX per 10s | Product personality | Scenario |
|---|---|---|---|
| Artifacts (ref-1) | **~9 per 10s** | Feature-dense, information-heavy | Complex tool demo |
| Code Desktop (ref-2) | **0** | Pure atmosphere, meditative | Developer tool, focus state |
| Word (ref-3) | **~4 per 10s** | Balanced, office rhythm | Productivity tool |

**Heuristics**:
- Calm/focused product personality → low SFX density (0-3 per 10s), BGM leads
- Lively/information-heavy product personality → high SFX density (6-9 per 10s), SFX drives the rhythm
- **Do not fill every visual beat** — negative space reads as more refined than density. **Deleting 30-50% of the cues makes the rest more dramatic**.

### Cue selection priority
Not every visual beat needs an SFX. Choose by this priority:

**P0 must have** (omitting it feels wrong):
- Typing (terminal/input)
- Click/select (the user's decision moment)
- Focus change (the visual protagonist moves)
- Logo reveal (brand resolution)

**P1 recommended**:
- Element entry/exit (modal / card)
- Completion/success feedback
- AI generation start/end
- Major transition (scene change)

**P2 optional** (more of these and it turns messy):
- hover / focus-in
- progress tick
- decorative ambient

### Timestamp alignment precision
- **Same frame** (0ms error): clicks / focus changes / logo landing
- **1-2 frames early** (-33ms): fast whooshes (prime the audience's expectation)
- **1-2 frames late** (+33ms): objects landing / impact (matches real physics)

---

## BGM selection decision tree

The studio skill ships 6 BGM tracks (`assets/bgm-*.mp3`):

```
What is the animation's character?
├─ Product launch / tech demo → bgm-tech.mp3 (minimal synth + piano)
├─ Tutorial / tool walkthrough → bgm-tutorial.mp3 (warm, instructional)
├─ Education / explaining a principle → bgm-educational.mp3 (curious, thoughtful)
├─ Marketing / brand film → bgm-ad.mp3 (upbeat, promotional)
└─ Need a variant of a similar style → bgm-*-alt.mp3 (one alternative per track)
```

### Scenarios with no BGM (worth considering)
Look at Anthropic Code Desktop (ref-2): **0 SFX + pure Lo-fi BGM** can also look premium.

**When to go without BGM**:
- Animation is <10s (BGM cannot establish itself)
- The product personality is "focused/meditative"
- The scene already has ambience/narration
- SFX density is very high (avoid auditory overload)

---

## Scenario recipes (ready to use)

### Recipe A · product launch hero (same as the studio v9)
```
Duration: 25 seconds
BGM: bgm-tech.mp3 · 45% · band <4kHz
SFX density: ~6 per 10s

cue:
  terminal typing → type × 4 (0.6s apart)
  enter key       → enter
  cards converge  → card × 4 (staggered 0.2s)
  selection       → click
  Ripple          → whoosh
  4 focus changes → focus × 4
  Logo            → thud (1.5s)

Volume: BGM 0.45 / SFX 1.0 · amix normalize=0
```

### Recipe B · tool feature demo (after Anthropic Code Desktop)
```
Duration: 30-45 seconds
BGM: bgm-tutorial.mp3 · 50%
SFX density: 0-2 per 10s (very few)

Strategy: let BGM + narration voiceover drive; SFX only at **decisive moments** (file saved / command finished)
```

### Recipe C · AI generation demo
```
Duration: 15-20 seconds
BGM: bgm-tech.mp3 or no BGM
SFX density: ~8 per 10s (high density)

cue:
  user input → type + enter
  AI starts processing → magic/ai-process (1.2s loop)
  generation complete → feedback/complete-done
  result appears → magic/sparkle
  
Highlight: ai-process can loop 2-3 times across the whole generation
```

### Recipe D · pure-atmosphere long take (after Artifacts)
```
Duration: 10-15 seconds
BGM: none
SFX: 3-5 carefully designed cues on their own

Strategy: every SFX is the lead; no BGM to smear them together.
Good for: slow single-product shots, close-up reveals
```

---

## ffmpeg mixing templates

### Template 1 · single SFX layered onto video
```bash
ffmpeg -y -i video.mp4 -itsoffset 2.5 -i sfx.mp3 \
  -filter_complex "[0:a][1:a]amix=inputs=2:normalize=0[a]" \
  -map 0:v -map "[a]" output.mp4
```

### Template 2 · multi-SFX timeline mix (aligned to cue times)
```bash
ffmpeg -y \
  -i sfx-type.mp3 -i sfx-enter.mp3 -i sfx-click.mp3 -i sfx-thud.mp3 \
  -filter_complex "\
[0:a]adelay=1100|1100[a0];\
[1:a]adelay=3200|3200[a1];\
[2:a]adelay=7000|7000[a2];\
[3:a]adelay=21800|21800[a3];\
[a0][a1][a2][a3]amix=inputs=4:duration=longest:normalize=0[mixed]" \
  -map "[mixed]" -t 25 sfx-track.mp3
```
**Key parameters**:
- `adelay=N|N`: the first value is the left-channel delay (ms), the second the right channel; write it twice so the stereo channels stay aligned
- `normalize=0`: preserves the dynamic range — critical!
- `-t 25`: truncate to the specified duration

### Template 3 · video + SFX track + BGM (with band isolation)
```bash
ffmpeg -y -i video.mp4 -i sfx-track.mp3 -i bgm.mp3 \
  -filter_complex "\
[2:a]atrim=0:25,afade=in:st=0:d=0.3,afade=out:st=23.5:d=1.5,\
     lowpass=f=4000,volume=0.45[bgm];\
[1:a]highpass=f=800,volume=1.0[sfx];\
[bgm][sfx]amix=inputs=2:duration=first:normalize=0[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k final.mp4
```

---

## Failure modes cheat sheet

| Symptom | Root cause | Fix |
|---|---|---|
| SFX inaudible | masked by the BGM's high band | add `lowpass=f=4000` to BGM + `highpass=f=800` to SFX |
| SFX too loud and harsh | absolute SFX volume too high | drop SFX volume to 0.7 and BGM to 0.3 at the same time, keeping the gap |
| BGM and SFX rhythms fight | wrong BGM (music with a strong beat) | switch to an ambient / minimal synth BGM |
| BGM cuts off abruptly at the end | no fade out | `afade=out:st=N-1.5:d=1.5` |
| SFX smear into mush | cues too dense + each SFX too long | keep SFX under 0.5s and cue spacing ≥ 0.2s |
| WeChat official account mp4 has no sound | the platform sometimes mutes autoplay | do not worry; it plays with sound once the user taps it. GIFs have no sound anyway |

---

## Coupling with the visuals (advanced)

### SFX timbre must match the visual style
- Warm off-white / paper feel → **wooden/soft** SFX timbres (Morse, paper snap, soft click)
- Cold black tech look → **metallic/digital** SFX timbres (beep, pulse, glitch)
- Hand-drawn / playful look → **cartoon/exaggerated** SFX timbres (boing, pop, zap)

Our current `apple-gallery-showcase.md` warm off-white base → paired with `keyboard/type.mp3` (mechanical) + `container/card-snap.mp3` (soft) + `impact/logo-reveal-v2.mp3` (cinematic bass)

### SFX can drive the visual rhythm
Advanced technique: **design the SFX timeline first, then adjust the visual animation to align with the SFX** (not the other way round).
Because every SFX cue is a "clock tick", visual animation fitted to the SFX rhythm is rock solid — whereas SFX chasing visuals often lands ±1 frame off and feels wrong.

---

## Quality checklist (self-check before publishing)

- [ ] Loudness gap: SFX peak - BGM peak = -6 to -8 dB?
- [ ] Bands: BGM lowpass 4kHz + SFX highpass 800Hz?
- [ ] amix normalize=0 (preserves dynamic range)?
- [ ] BGM fade-in 0.3s + fade-out 1.5s?
- [ ] SFX count appropriate (density chosen per scenario personality)?
- [ ] Every SFX aligned to its visual beat within the same frame (within ±1 frame)?
- [ ] Logo reveal SFX long enough (1.5s recommended)?
- [ ] Listen once with BGM off: are the SFX rhythmic enough on their own?
- [ ] Listen once with SFX off: does the BGM alone have emotional movement?

Either layer listened to alone should hold up. If it only sounds good with both stacked, it is not done.

---

## References

- SFX asset list: `sfx-library.md`
- Visual style reference: `apple-gallery-showcase.md`
- Deep audio analysis of the three Anthropic films: AUDIO-BEST-PRACTICES.md (author's local material, not distributed with the repository)
- studio v9 case study: hero-animation-v9-final.mp4 (author's local sample, not distributed with the repository)
