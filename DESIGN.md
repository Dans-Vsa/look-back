---
version: 1
name: Look-Back-tribute
basedOn: designs/claude (awesome-design-md) — structure, editorial rhythm, color-block-first depth
description: >
  A fan tribute to Tatsuki Fujimoto's "Look Back". Warm paper canvas, serif Mincho display,
  hand-drawn accents and pencil-sketch illustrations of rural Akita. The cream/coral trinity of
  the base system is re-keyed to the manga cover: paper cream, hoodie leaf-green, title sky-blue,
  and a deep "night desk" surface for the dark bands.

colors:
  canvas: "#f6f1e3"        # paper — default floor (never pure white)
  surface-soft: "#efe8d4"  # soft band
  surface-card: "#e7dfc6"  # cards, pinned notes
  hairline: "#dcd3bb"
  ink: "#1f2a22"           # headlines, line-art
  body: "#3b4238"
  muted: "#6b6f62"
  primary: "#9cc53f"       # hoodie green — primary CTA fill (ink text on top)
  primary-active: "#7fa82b"
  primary-deep: "#3f6a32"  # green for text links / small text on paper (AA)
  sky: "#5fb3d6"           # title-stroke blue — secondary accent, rain, sky
  wood: "#c47f52"          # desk, wooden houses
  stamp: "#d8352a"         # tiny red accent only (JUMP+ cross, spoiler stamp)
  surface-dark: "#16201c"  # night desk — dark bands + footer
  surface-dark-elevated: "#202c27"
  on-dark: "#f3eedf"
  on-dark-soft: "#a3a99a"

typography:
  display: "Shippori Mincho, Cormorant Garamond, serif — weight 500, tracking -0.02em"
  body: "Inter, system-ui, sans-serif — 400/500"
  hand-jp: "Yusei Magic — katakana title & seasonal kanji only (Google Fonts text= subset)"
  hand-latin: "Caveat — margin notes, hints, captions on illustrations"
  scale: { display-xl: "clamp(48px, 8vw, 112px)", display-lg: "clamp(36px, 5vw, 64px)",
           display-md: "clamp(28px, 3.4vw, 40px)", title: 20px, body: 17px, caption: 13px,
           caption-upper: "12px / 0.18em tracking" }

rounded: { xs: 4px, md: 8px, lg: 12px, xl: 16px, pill: 9999px }
spacing: { xs: 8px, sm: 12px, md: 16px, lg: 24px, xl: 32px, xxl: 48px, section: "clamp(80px, 12vw, 144px)" }
---

## Principles
- **Paper first.** Every light band sits on `canvas` with a faint grain. Depth comes from color blocks
  (paper → card → night), shadows only on lifted "paper" objects (notes, door slip).
- **Drawn, not rendered.** Illustrations are line-art (`ink`, 1.5–2.5px, round caps) with flat washes.
  The hero starts as pencil sketch and is colored by the visitor.
- **Serif display at 500, never bold.** Hand fonts are accents only — never body copy.
- **Green is scarce.** `primary` on the main CTA and active states; `primary-deep` for links.
  `sky` for rain/sky/secondary highlights. `stamp` red only for tiny marks.
- **Rhythm alternates** paper → soft → landscape → card → night → paper. No two identical bands in a row.
- **Light & calm motion.** Transform/opacity only, IntersectionObserver reveals, canvases pause offscreen,
  everything respects `prefers-reduced-motion`. No frameworks, no animation libraries.

## Components
- `chapter-label`: caption-upper, muted, "01 — 部屋 · Kamar".
- `btn-primary`: primary fill, ink text, 8px radius, 44px min height; active → primary-active.
- `btn-ghost`: transparent, 1.5px ink border, same metrics. On dark: on-dark border.
- `note-card`: surface-card, 4px radius, slight rotation (-2°…2°), tape strip on top, lifts on hover.
- `scene`: full-bleed SVG landscape with 3–5 parallax layers.
- `toggle-chip`: pill, hairline border; active = ink fill + canvas text.
- Footer: surface-dark, on-dark-soft text, fan disclaimer.

## Don't
- No pure white, no cool grays, no gradients-as-decoration beyond sky washes.
- No stock photos; only the cover art supplied by the owner + hand-made SVG.
- No heavy dependencies (target: < 400 KB total transfer excluding fonts).
