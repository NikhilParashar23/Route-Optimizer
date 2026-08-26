# Reference.md — RouteWise Scroll Sequence

This document is the **design source of truth**, derived from a 10-second
scroll-capture video of the target design. It describes exactly what the
frame sequence contains, how it maps to scroll position, and the visual
system around it. Any coding agent (or human) building the site should treat
this file as the spec to check the build against — not the implementation
prompt itself.

---

## 1. Source Video → Frame Export

- Source clip length: **10.0 seconds**
- Export rate: **60 fps**
- Total frames: **600**, named `frame_0001.jpg` → `frame_0600.jpg`
  (zero-padded to 4 digits)
- Export folder: `/public/sequence-main/`
- Export resolution: match the final largest hero display size (recommend
  1920×1080 source, downscaled responsively — do not export smaller than the
  largest breakpoint you'll display it at, or upscaling will visibly soften
  the canvas image)
- Format: JPEG, quality ~80 (balances file size vs. banding on the dark
  gradient background — test at 70/80/90 and pick the smallest that shows no
  visible banding in the near-black `#0A0C10` regions)

**Why 60fps matters here:** the whole hero/scroll section is one continuous
canvas-scrubbed sequence, not several independent clips. Scroll position maps
linearly to frame index. At 60fps export, each 1% of scroll progress
corresponds to ~6 frames, which is dense enough that even fast scrolling
(trackpad flicks, aggressive mouse-wheel) never visibly skips — this is the
detail that makes it read as "video," not "slideshow."

---

## 2. Frame Index → Chapter Map

| Chapter | Time range | Frame range | Scroll progress | What's on screen |
|---|---|---|---|---|
| 1. Hero | 0.0s – 2.0s | 1 – 120 | 0.00 – 0.20 | Dark grid-floor, 3D yellow school bus centered, headline "School transportation, optimized," fixed glass nav visible throughout |
| 2. Count-up | 2.0s – 4.0s | 121 – 240 | 0.20 – 0.40 | Bus exits frame; cyan/teal glowing dot particles drift and settle above the grid; counter headline animates to "86 students" |
| 3. Pickup points | 4.0s – 6.0s | 241 – 360 | 0.40 – 0.60 | Particles resolve into pulsing ringed pickup-point markers scattered on the grid; two bus icons enter from left/right edges; headline "14 pickup points" / "4 buses" |
| 4. Route draw | 6.0s – 8.0s | 361 – 480 | 0.60 – 0.80 | Glowing blue route line draws itself across a subset of markers; 4 bus icons positioned along the path; headline "4 buses" / "48.2 km" / "optimized route" |
| 5. Dashboard reveal | 8.0s – 10.0s | 481 – 600 | 0.80 – 1.00 | Scene dissolves/scales behind a glassmorphic dashboard mock (visible sidebar labels, stat percentages, chart fragments, notification bell, avatar); headline "One intelligent fleet" |

Scroll-progress values assume a single `h-[600vh]` (or similar) pinned
container mapped linearly 0→1 across the whole sequence. If chapters are
later split into separate pinned sections instead of one continuous pin,
recompute each section's local 0→1 range against its own frame slice
(e.g., Chapter 3 alone = frames 241–360 → local progress 0→1).

---

## 3. Color System

| Token | Hex | Usage |
|---|---|---|
| `bg-grid` | `#0A0C10` | Page/canvas background |
| `bg-panel` | `#12151C` | Glass panel base (before blur/opacity) |
| `route-blue` | `#3B82F6` | Route line, primary buttons, links |
| `signal-cyan` | `#00E5C7` | Pickup-point markers, particle glow, live-data accents |
| `bus-yellow` | `#FFC93C` | Bus models/icons ONLY — never UI chrome |
| `text-primary` | `#F5F6F8` | Headlines, body text |
| `text-muted` | `#8A93A3` | Secondary/supporting text |

Glass panels: `background: rgba(255,255,255,0.05)`, `border: 1px solid
rgba(255,255,255,0.10)`, `backdrop-filter: blur(12px)`.

Glow treatment: route-blue and signal-cyan elements use a soft outer glow
(`box-shadow`/`filter: drop-shadow`) at ~40–50% opacity — this is what
reads as "live/energized" against the near-black background in the source
video, not flat fill color alone.

---

## 4. Typography

| Role | Family | Notes |
|---|---|---|
| Headlines (H1/H2) | Space Grotesk, bold | Wide-line-height, tight tracking; hero H1 is huge (~72–96px desktop) |
| Body / UI | Inter | Standard weights 400/500/600 |
| Stat counters, tags, coordinates | Space Mono | Tabular numerals; used for every animated number ("86 students," "48.2 km," dashboard % stats) |

---

## 5. Fixed Header (present across all 5 chapters)

- Glassmorphic pill shape, fixed top, horizontally centered content
- Left: logo mark (geometric bus/fork icon) + wordmark
- Center/left-of-right: nav links — Services · Routes · Products · Reports ·
  Contact (Contact has a dropdown chevron)
- Right: "Log In" (ghost/outline button) + "Sign Up Now" (filled route-blue
  pill button)
- Header stays visually consistent (no transparent→solid transition) during
  the pinned scroll sequence itself; the transition to solid/blurred happens
  only once scroll passes the pinned section into normal page content

---

## 6. Stat Counters (exact values from source)

Animate each with count-up easing (ease-out, ~0.8–1.2s duration), monospace
numerals:

1. `86 students` — Chapter 2
2. `14 pickup points` — Chapter 3
3. `4 buses` — Chapters 3 & 4 (appears in both)
4. `48.2 km` — Chapter 4
5. `optimized route` — Chapter 4 (static label, not a counter)

---

## 7. Post-Sequence Section (below the pinned scroll block)

Not part of the 600-frame sequence, but the sequence's Chapter 5 dissolves
directly into this static section, so its visual language must match exactly
(same dark background, same glass panels, same blue/cyan accents):

- "One intelligent fleet" as a section headline (repeats the in-sequence
  headline as a proper `<h2>` for SEO/accessibility)
- Supporting line: "You manage scheduling, routing, and communication — while
  RouteWise handles the optimization for buses, riders, and drivers."
- A live-style dashboard panel grid (charts, gauges) continuing the visual
  established in Chapter 5

---

## 8. Non-Negotiable Performance Notes

- All 600 frames must be preloaded (with a visible loading/progress state)
  before scroll-scrubbing is enabled — first-scroll jank on an unloaded
  frame is the single most common way this pattern breaks
- Canvas draw must run on `requestAnimationFrame`, decoupled from React's
  render cycle, and be DPR-aware (`window.devicePixelRatio`) so it stays
  sharp on Retina displays without redundant redraw cost on standard ones
- Provide a reduced-motion / low-power fallback: a single static frame
  (e.g., frame 300) with the final-state headline, for `prefers-reduced-
  motion` users and low-end devices
