# Discover Egypt — Design System

**Direction:** a luxury travel magazine at golden hour.
Warm cinematic photography. Editorial serif headlines. Quiet, confident UI.
Gold is a **spotlight, not a paint bucket** — it marks the one action that matters on a screen.

Reference: the stakeholder mockup (warm sunset hero, glass "Find Your Egypt" panel, destination rail, dark feature strip). We keep its warmth and layout and the existing typography, and use gold sparingly.

---

## 1. Principles

1. **Photography leads.** Every major section opens with a real, licensed photograph. No clip-art pyramids, no stock-looking icons as decoration.
2. **One hero action per view.** Gold buttons appear at most once per screen area.
3. **Editorial rhythm.** Large serif headline → one-line intro → content. Generous whitespace (`section` padding 96–128 px).
4. **Honest content.** Status badges for anything time-sensitive. No invented testimonials, prices or dates.
5. **Calm motion.** Slow, soft, purposeful. Everything works with motion turned off.
6. **Accessible by default.** WCAG 2.2 AA contrast, 44 px targets, visible focus, keyboard paths.

---

## 2. Colour

| Token | Hex | Use |
| --- | --- | --- |
| `ivory` | `#faf6ee` | Page background |
| `limestone` | `#f1e8d8` | Alternate section background |
| `sand` / `sand-deep` | `#e3d2b4` / `#c9b08a` | Borders, dividers, quiet fills |
| `midnight` | `#0f1b2d` | Headlines, primary buttons on light, dark sections |
| `night` | `#0a1220` | Deepest surfaces (feature strip, footer) |
| `gold-300` | `#e4c486` | **Primary CTA fill on dark** (midnight text, ≥10:1 — checked in tests) |
| `gold` | `#c9a35a` | Decorative accents, icons on dark, rules |
| `gold-ink` | `#7d5f27` | Gold **text** on light backgrounds (5.3:1) |
| `ember` | `#c56a2d` | Sunset accent in gradients only — never text |
| `nile` | `#2f6f6b` | Links and focus on light (5.6:1) |
| `sea` | `#5fa8a2` | Decorative turquoise (Red Sea content) |
| `ink` / `muted` | `#2b2d33` / `#5b5d63` | Body text / secondary text |

**Golden-hour grade** (`.golden-grade`). Hero photos get three layers: a gentle warm filter on the image (`sepia .38, saturate 1.35, hue −6°`), an amber `overlay` wash, and a `night` scrim from the bottom and left so text stays legible. This makes photos taken at different times of day read as one golden-hour series. It is applied in the browser only — the source files are unchanged — and is switched off in high-contrast mode. Tuned on the real hero photos (Giza, Aswan, White Desert, Luxor balloons).

---

## 3. Typography

| Role | Font | Size (desktop / mobile) | Notes |
| --- | --- | --- | --- |
| `display-hero` | Fraunces, 500, UPPERCASE | 104 / 52 px, line-height 0.95, tracking −0.02em | Hero only |
| `display-italic` | Fraunces italic, 400 | 28 / 20 px | Hero subline, pull quotes |
| `h1` | Fraunces 500 | 64 / 44 px | Page titles |
| `h2` | Fraunces 500 | 48 / 36 px | Section titles |
| `h3` | Fraunces 500 | 26 / 22 px | Card titles |
| `eyebrow` | Inter 600, UPPERCASE | 12 px, tracking 0.22em | Above every h2 |
| body | Inter 400 | 17 / 16 px, line-height 1.6 | |
| small | Inter 500 | 14 px | Meta, captions |
| Arabic | **Amiri** 400/700 | 1.25× the Latin size | Proverbs and Arabic phrases; `lang="ar" dir="rtl"` |

Text size controls (A, A+, A++) scale the root font size; all sizes are in `rem`.

---

## 4. Space, shape, depth

- **Container:** `max-w-7xl` (1280 px), padding 20 px mobile / 32 px desktop.
- **Section rhythm:** 96 px mobile, 128 px desktop. Between heading and content: 48 px.
- **Radius:** cards 20 px · panels 24 px · inputs 12 px · buttons and chips: pill.
- **Shadows:** `shadow-soft` (cards at rest), `shadow-lift` (hover / floating panels). No hard shadows.
- **Glass panel:** `midnight / 55 %`, 16 px backdrop blur, 1 px `ivory / 15 %` border. Used only over photography.

---

## 5. Components

| Component | Class / file | Rules |
| --- | --- | --- |
| Button — gold | `.btn .btn-gold` | The single main action on dark or photo backgrounds |
| Button — primary | `.btn .btn-primary` | Main action on light backgrounds |
| Button — outline light | `.btn .btn-outline-light` | Secondary action on dark |
| Button — ghost | `.btn .btn-ghost` | Secondary action on light |
| Chip | `.chip` | Filters and choices; selected = midnight fill (or gold on dark) |
| Card | `.card` | White, 20 px radius, `shadow-soft` |
| Photo card | `PhotoCard` (`components/design.tsx`) | Full-bleed photo, bottom scrim, pin icon + name + tagline, zoom on hover |
| Glass panel | `.glass` | Overlays on photos |
| Section heading | `SectionHeading` | Eyebrow + serif title + optional intro and action link |
| Feature strip | `FeatureStrip` | 6 dark tiles, gold line icons, two-line labels |
| Status badge | `StatusBadge` | Verified · Estimate · Awaiting verification |
| Icons | `lucide-react`, stroke 1.5 | Gold on dark, midnight on light. Always paired with text or an `aria-label` |

---

## 6. Motion

| Pattern | Duration | Easing |
| --- | --- | --- |
| Hover lift / colour | 250 ms | `ease-out-soft` (0.22, 1, 0.36, 1) |
| Reveal on scroll | 800 ms, 24 px rise | `ease-out-soft` |
| Hero cross-fade | 1.4 s | ease-in-out |
| Hero slow zoom ("Ken Burns") | 9 s per slide | linear |

Hero slides auto-advance every 8 s, **pause on hover/focus**, and have a visible pause button (WCAG 2.2.2). With `prefers-reduced-motion`, there is no zoom, no auto-advance and no reveal animation.

---

## 7. Imagery

- Source: Wikimedia Commons (licence + author recorded in `src/content/images.ts`, credited on `/credits` and on the hero).
- Served as Commons thumbnails with `srcset` (500 / 960 / 1920 w) and lazy loading below the fold.
- Prefer golden hour, people for scale, and real places over close-up details.

---

## 8. Voice

Short sentences. Concrete nouns. Second person. Warm but never salesy.
✔ "Watch the sun rise over Luxor from a balloon."
✘ "Experience the magical wonders of timeless Egypt!"
