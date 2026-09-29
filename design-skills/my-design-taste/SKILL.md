---
name: "my-design-taste"
description: "Apply Taufik's personal cinematic/motion-first web design taste — derived from his 21st.dev reference prompts. Use whenever designing, writing an AI prompt for, or building a hero section, landing page, or marketing UI, so output matches his established typography, color, layout, and animation preferences without him re-explaining them."
---


# My Design Taste — Cinematic Motion-First Web Design

Personal taste profile derived from 4 reference prompts Taufik collected from 21st.dev (Taskly / "Liquid Glass" hero, Aethera / cinematic looping-video hero, Prisma / dark editorial studio site, Securify / dark editorial SaaS hero). Apply these defaults whenever generating design direction, an AI prompt for another tool, or actual code for hero sections, landing pages, or marketing UI — unless Taufik states otherwise.

## Two registered modes

- **Mode A — Dark Cinematic Editorial** (dominant: 3 of 4 references — Aethera, Prisma, Securify). Black/near-black backgrounds, cream/off-white text, moody video, big expressive type.
- **Mode B — Light Liquid Glass** (Taskly). White background, glassmorphism (backdrop-blur, translucent panels), blue accent, used for trustworthy/SaaS/productivity tone.

Default to **Mode A** unless the brief signals a bright/trustworthy/productivity-SaaS tone, in which case use **Mode B**. Flag which mode you picked and why.

## Tech stack defaults

- React + Vite + TypeScript + Tailwind CSS 3.
- Animation: **framer-motion** as the primary library. Reach for **GSAP + ScrollTrigger** instead/in addition when the effect needs scroll-scrubbing, pinning, or a long scrollytelling timeline that framer-motion's `useScroll` gets clunky for.
- Icons: **lucide-react**.
- Fonts: always pair exactly one expressive display/serif font (headlines/logo only) with one restrained sans workhorse (body/UI). Never more than two font families.

## Typography system

- Display font examples seen: Instrument Serif, Fustat. Body font examples seen: Inter, Readex Pro, Almarai.
- Headlines are huge: `text-5xl`–`text-8xl`, or viewport-scaled word-mark type (`13vw`–`26vw`) for hero brand names.
- Negative letter-spacing on headlines is a signature: -1px to -2.46px (or `tracking-tight`/`tracking-tighter`).
- Tight headline line-height: 0.85–1.05.
- All-lowercase headline treatment shows up in the boldest "editorial" mode (Securify) — a deliberate stylistic choice; ask before applying it broadly since it's not universal across the references.

## Color & palette philosophy

- Restrained palette: black/white/near-black-white/cream base + **at most one** accent color.
- Every color must be a literal hex code, never a vague name like "blue" or Tailwind's generic palette — e.g. `#E1E0CC`, `#6F6F6F`, `#0084FF`.
- Text on dark backgrounds is usually a warm off-white/cream (`#E1E0CC`, `#DEDBC8`), not pure white — softer and more premium.
- Secondary/muted text uses a distinct mid-gray hex (`#6F6F6F`, gray-400/500), not just white/black at reduced opacity.
- State explicit exclusions when given (e.g. "no purple/indigo anywhere") and carry them through the whole build, not just the section they were mentioned in.

## Layout patterns (hero archetypes)

1. **Fullscreen video-background hero** (3 of 4 refs) — `<video autoPlay loop muted playsInline className="object-cover">` plus a gradient overlay for legibility (`from-black/30 via-transparent to-black/60` or `from-background via-transparent to-background`).
2. **Floating pill navbar** — glass (backdrop-blur + translucent white) in Mode B, solid dark pill (`bg-neutral-900/90` or `bg-black`) in Mode A. Centered or full-width; logo + links + CTA. Sometimes "hangs" from the top edge (`rounded-b-2xl`/`rounded-b-3xl`).
3. **Editorial/collage layout** — giant headline words absolutely positioned at different points on screen (not centered/stacked) for a bold magazine feel (Securify).
4. **Centered stacked layout** — nav → headline → subhead → CTA, all centered, for a softer premium tone (Aethera).
5. **Inset-card hero** — the whole section is padded (`p-4 md:p-6`) with an inner `rounded-2xl`/`rounded-[2rem] overflow-hidden` container holding the video, giving a "framed" premium feel (Prisma).

## Motion & animation system

- Entrances are always **staggered**, never simultaneous: opacity 0→1, `translateY` 20px→0, ~0.8s duration, 0.08s–0.2s stagger between elements, incremental delay per element (0s, 0.2s, 0.4s…).
- Favor custom cubic-bezier eases over defaults: `[0.16, 1, 0.3, 1]` (smooth premium ease-out for text/CTAs) and `[0.22, 1, 0.36, 1]` (card grid entrances).
- Word- and character-level text reveal are signature techniques: split headline into words or characters, animate each individually, trigger with `useInView({ once: true })`.
- Scroll-linked progressive reveal for body copy: per-character opacity driven by scroll position (`useScroll` + transform ranges), not a simple fade-on-scroll. This is a step above what most AI-generated sites do — default to it for supporting copy under a big headline.
- Hover states stay subtle: scale 1.02–1.03 on buttons/cards. No large jumps or bounces.
- Feature/card grids: staggered scale+fade entrance (0.95→1 scale + fade), triggered by `useInView` with a negative margin like `-100px` so it fires slightly before full visibility.
- If GSAP/ScrollTrigger is used instead of framer-motion, replicate this same stagger/easing sensibility — scroll-scrubbed reveals and pinning for hero-to-section transitions rather than GSAP's default eases.

## Recurring UI components

- CTA buttons: `rounded-full` or `rounded-[16px]`, solid black or single-accent fill, often paired with a circular icon badge holding an arrow (`ArrowRight`, rotated -45° for "learn more" style links).
- Social proof / stat blocks: short number + label pairs ("+65k startups", "Rated 4.9/5"), sometimes with a thin diagonal divider line (`rotate-[20deg]`/`rotate-[-20deg]`) as a graphic accent.
- Feature-card checklists: lucide `Check` icon in the accent color + gray-400 description text.
- Noise/grain texture overlays: inline SVG `feTurbulence` (`baseFrequency` ~0.85–0.9, `numOctaves` 3–4) at low opacity (0.15–0.7), usually `mix-blend-overlay` — keeps flat dark sections from feeling sterile.

## Video treatment

- Background videos: always `autoPlay loop muted playsInline`, `object-cover`.
- For premium polish, prefer a hand-rolled fade in/out loop (monitor `currentTime` via `requestAnimationFrame`, fade 0.5s in/out, manual reset on `ended`) over relying on the browser's native hard-cut loop.
- To brand-match a stock/generated video, recolor via CSS `filter` (hue-rotate, saturate, brightness, contrast) plus `mix-blend-screen` against black, rather than sourcing a new asset.

## Prompt-writing style (how Taufik writes/expects generation prompts)

When drafting a prompt for another AI tool in this taste, follow this structure:

1. One-line brief: page/section type, tech stack, overall mood (e.g. "dark, moody, cinematic with a warm cream palette").
2. **Fonts** section: exact font names + weights + where each is used.
3. **Color system** section: every color as a literal hex, labeled by role (background / primary text / secondary text / accent), plus explicit exclusions if any.
4. Section-by-section breakdown (Hero, About, Features…), each with: layout/positioning (exact Tailwind classes or px/vw values), verbatim copy, and animation behavior (component name, trigger, easing, stagger).
5. Shared/reusable animation components called out by name once, with their mechanics spelled out (e.g. a "WordsPullUp" component, an "AnimatedLetter" component).
6. Closing "Key Technical Specs"/"Notes" section for implementation details (video tag attributes, z-index layering, font-smoothing, responsive breakpoint behavior).

Precision over vagueness throughout — exact px/vw/hex/ease values everywhere, never "make it look nice."

## How to apply this profile

- Default to Mode A (dark cinematic) when no direction is given; switch to Mode B only when the brief implies a light/trustworthy/SaaS tone.
- When asked to write a prompt for another AI tool, follow the "Prompt-writing style" structure above.
- When asked to build the component directly, apply the typography/motion/color defaults above with framer-motion + Tailwind, switching to GSAP/ScrollTrigger for scroll-scrubbed or pinned effects.
- Ask before deviating from the monochrome-plus-one-accent palette rule or before introducing a second display font — those are load-bearing constraints in every reference, not incidental choices.

