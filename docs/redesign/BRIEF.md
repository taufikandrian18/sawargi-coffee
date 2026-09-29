# Sawargi Redesign Brief: Apocalypse-style motion, Sawargi voice

Status: ready to build. The decisions in §9 still need Taufik's answers, but each has a default so
work can start.
Owner: Taufik. Written 29 Sep 2026 from a live inspection of https://apocalypsecoffee.com/, the two
design skills in `design-skills/` (`my-design-taste`, `ui-ux-pro-max`), and the Frontend Design
principles summarised in §2.

---

## 0. The job

Redesign the Sawargi home page so it **moves and feels like apocalypsecoffee.com**, then restyle
`/checkout` and `/journal` to match. That means split-word reveals, wiggling display words, cream
"paper" cards with hard offset shadows, a pinned horizontal timeline, sticky process steps, a marquee,
a custom cursor and Lenis smooth scroll.

Keep two things:

- the scroll-scrubbed background video and its component `src/components/CinematicVideo.tsx`;
- **every line of existing copy, verbatim**.

What changes is the **structure and flow** of the page: new section order and new layouts, not new
words.

### Hard constraints

1. **Keep the scrub video.** `CinematicVideo` stays the background.
   - Keep the `data-video-section` markers on each major section; they drive scrub progress.
   - Keep the all-keyframe MP4 sources in `public/media/scrub/`. The component still supports HLS,
     but the MP4s are what make scrubbing smooth (see `docs/video-scrub.md`). Don't swap back to the
     4K HLS file.
2. **Keep the copy.** Use the strings in §5 exactly.
   - Allowed: short UI labels (nav items, button verbs, form labels, batch metadata labels).
   - Not allowed: rewriting, "improving" or inventing marketing copy, testimonials, stats,
     certifications or reviews.
3. **Copy the techniques, not the site.** Re-create the techniques listed in §3. Do **not** copy any
   of these from Apocalypse:
   - images and illustrations;
   - SVG shapes;
   - the logo;
   - fonts (they're commercially licensed);
   - CSS or JS source;
   - wording.

   Every asset and shape must be original.
4. **Stay on the current stack**: React 18, Vite 8, TypeScript, Tailwind 3, GSAP/ScrollTrigger.
   - Add only `lenis` (smooth scroll) and, if chosen in §9, `matter-js`.
   - No framer-motion (GSAP is the only animation engine) and no jQuery.
5. **Quality floor:**
   - works down to 360px wide, with no horizontal page scroll;
   - visible keyboard focus;
   - under `prefers-reduced-motion`, every section renders in its final readable state;
   - CLS < 0.1.

---

## 1. What the reference actually does (inspected live, 29 Sep 2026)

[Certain: read from the page's computed styles, CSS rules and `theme.js`]

**Palette:**
- `--black #090705`, `--cream #F0EDE8`, card ink `#1A1A1A`;
- dark panels `#0D0D0D` / `#141414` / `#1A1A1A`, muted text `#8C8D91`;
- one accent, `--ac #E06D2D` (orange).

**Type (4 families):**

| Role | Font | Treatment |
| --- | --- | --- |
| Display | **Arnel** (condensed) | uppercase; `letter-spacing ~0.02–0.03em`; `line-height 0.92`; size `clamp(64px, 9vw, 145px)` |
| Script accent | **Lovely Mess** | used for a few accent words |
| UI / body | **Akzidenz Grotesk BE** | body 15px; labels use `font-stretch: expanded`; uppercase eyebrows at `letter-spacing 0.18–0.22em` |
| Paragraphs | **DM Mono** | 18px, line-height 1.55, colour `#BDBDBD` |

**Smooth scroll:** Lenis `{ autoRaf: true, anchors: true, lerp: 0.07 }`, switched off under reduced
motion.

**Headline reveal:**
- each word is wrapped as `span.sr-mask > span.sr-word`, and the mask has `overflow:hidden`;
- a word starts at `translateY(110%)` and moves to `0` when `.is-in` is added;
- the per-word delay variable `--sr-d` steps by **0.06s**.

**Wiggle words:** script words are `display:inline-block` and rotate `2deg → -2deg`, alternating.
There's also a smaller ±1deg variant.

**Cards:**
- cream background with a **hard offset shadow**, `drop-shadow(8px 8px 0 #1A1A1A)`;
- an organic pill silhouette via `clip-path: url(#…)`;
- `padding: 64px 60px 76px`.

**Sticky steps:**
- The section is `min-height:100dvh`.
- On the left, a text list with `row-gap: 30dvh`, padded by `calc(50dvh - 7.5em)`.
- On the right, media with `position: sticky; top: 0`, showing a 4:5 image inside an SVG clip-path.
- An IntersectionObserver with `rootMargin: -45% 0 -45% 0` picks the active step and sets
  `data-status` to before / active / after.

**Timeline:**
- The section is `height: 300vh`, with an inner pin at `position: sticky; height:100vh`.
- A horizontal track of cards (`flex: 0 0 28vw; min-width: 340px; gap: 8vw`) is translated as you
  scroll.
- Year labels are in the accent colour, `letter-spacing 0.22em`.

**Marquee:**
- The track is duplicated (`innerHTML += innerHTML`) and moved with requestAnimationFrame.
- Cards are `flex: 0 0 460px`.
- On mobile it becomes a native horizontal scroll that loops.

**Buttons:**
- uppercase grotesk, 18px, weight 500, expanded;
- the background is an SVG **sprite 300% wide**, stepped on hover;
- `:active { scale: .975 }`, and the focus ring is a box-shadow on `::after`.

**Cursor:** a 14px cream dot, `position: fixed`, shadow `0 2px 12px rgb(0 0 0 / .4)`. It fades in
once the mouse moves.

**Ambient beans:**
- floating bean PNGs with `bean-pop` (scale .45↔1 plus opacity) and `bean-sweep` keyframes;
- a Matter.js physics bean field you can drag and grab.

**Dividers:** torn, rough paper edges between dark and light bands.

**Section order:**
1. hero
2. reviews marquee
3. value props
4. best-sellers carousel
5. sticky steps (organic / traceable / precision)
6. pinned horizontal timeline
7. CTA
8. subscribe CTA
9. footer

---

## 2. Design principles to apply (from the three skills)

**my-design-taste.** Read `design-skills/my-design-taste/SKILL.md` in full. The key points:
- Use Mode A, Dark Cinematic Editorial.
- Exact hex values everywhere; monochrome plus **one** accent.
- Warm cream text on dark, and a distinct mid-grey for muted text.
- Huge headlines with tight leading (0.85–1.05) and controlled or negative tracking.
- Staggered entrances, never simultaneous.
- Eases: `cubic-bezier(0.16,1,0.3,1)` for text and CTAs, `cubic-bezier(0.22,1,0.36,1)` for card grids.
- Subtle hovers (scale 1.02–1.03).
- Grain overlay: `feTurbulence` at baseFrequency ~0.85, low opacity, `mix-blend-overlay`.
- **Ask before** adding a second display font or breaking the one-accent rule (see §9).

**ui-ux-pro-max.** Run its search tool (see `CLAUDE.md`). It recommends two page patterns:
- **Scroll-Triggered Storytelling:** intro hook, then chapters, then a climax CTA, with a mini-CTA in
  each chapter. The story must still read fine without scroll effects.
- **Horizontal Scroll Journey** for one chapter.

Its GSAP rules:
- Pin at most 1–2 sections.
- Use scrub values of `0.5–1.5`, not instant jumps.
- Call `ScrollTrigger.refresh()` after fonts and images load.
- Split text only on short headlines (under ~8 words), and revert splits on unmount.
- Skip all of it under reduced motion.

Its pre-delivery checklist:
- no emoji icons;
- cursor-pointer on everything clickable;
- 150–300ms hover transitions;
- 4.5:1 contrast;
- visible focus;
- test at 375 / 768 / 1024 / 1440.

*Note:* its auto-generated palette and fonts (green + Rubik) did **not** fit this brand and were
rejected. Use the §4 tokens instead.

**Frontend Design.** These principles aren't in the repo:
- The hero is a thesis.
- Typography carries the personality.
- Structural devices (numbers, eyebrows) must encode something true. Numbering is allowed in the
  process section because it's a real sequence, and nowhere else.
- Spend boldness on **one signature element** and keep everything else quiet.
- Copy is design material.
- Build to a quality floor.
- Critique your work from screenshots before calling it done.

---

## 3. Technique → Sawargi implementation map

**Smooth scroll**
- Build: `src/lib/smoothScroll.ts`. Lenis `{ lerp: 0.07, autoRaf: false }`, driven by `gsap.ticker`,
  with `lenis.on('scroll', ScrollTrigger.update)`.
- Notes:
  - Off under reduced motion and on touch devices.
  - `CinematicVideo` reads `window.scrollY`, which Lenis keeps in sync.
  - With Lenis on, lower `SCRUB_SMOOTHING` to about 0.35 so the two don't double-ease. Check by feel.

**Split-word reveal**
- Build: `<SplitReveal as="h2">`.
  - Wraps each word in a mask and an inner span.
  - CSS moves the word from `translateY(110%)` to `0` with
    `transition: transform 0.9s cubic-bezier(0.16,1,0.3,1)` and a delay of `index * 0.06s`.
  - An IntersectionObserver at `threshold: 0.15` triggers it once.
- Notes: headlines only. Keep the full string available to screen readers (an aria-label on the
  heading or sr-only text).

**Wiggle words**
- Build: `<Wiggle>`.
  - Inline-block words with `@keyframes sw-wiggle { from { rotate: 2deg } to { rotate: -2deg } }`,
    running `1.1s ease-in-out infinite alternate`.
  - Per-word `animation-delay: i * -0.18s`.
- Notes: use it on only 1–2 accent phrases in total (see §5).

**Paper cards**
- Build: `.paper-card`, with:
  - `background: var(--paper)` and `color: var(--ink)`;
  - `filter: drop-shadow(8px 8px 0 var(--char))`;
  - either a 28px radius **or** an original SVG clip-path.
- Notes: on hover, `translate(-2px,-2px)` and grow the shadow to 10px, over 200ms.

**Sticky steps**
- Build: `<StickySteps>` for the process chapter.
  - An IntersectionObserver with `rootMargin: '-45% 0px -45% 0px'` sets
    `data-status` to before / active / after.
  - That status drives opacity (0.25 → 1) and swaps the right-side media.
- Notes: the right-side media are stills from the scrub video (see §9 G5) inside an original
  clip-path.

**Pinned timeline**
- Build: `<StoryTimeline>`.
  - ScrollTrigger with `pin: true`, `scrub: 1` and `end: '+=' + trackWidth`.
  - The track moves horizontally with `xPercent`.
  - Cards are `flex: 0 0 28vw; min-width: 320px`.
- Notes:
  - Under 768px: no pin, just native horizontal scroll with snap.
  - Reduced motion: a vertical stack.

**Marquee**
- Build: `<Marquee>`.
  - Duplicated track animated with CSS `@keyframes` translateX(-50%), 40s linear infinite.
  - Pauses on hover and focus-within.
- Notes: content is the proof items plus batch tickets. **No reviews**, because none exist.

**Button**
- Build: `<InkButton>`.
  - Pill shape, uppercase Readex Pro 500, `letter-spacing: 0.08em`.
  - Hover: the accent fill sweeps in, `clip-path: inset(0 100% 0 0) → inset(0)`, over 350ms.
  - `:active { scale: .975 }`.
  - Focus ring: 2px `--paper`, offset 3px.
- Notes: the sweep is our own. Don't copy the reference's sprite SVG.

**Cursor**
- Build: `<CursorDot>`.
  - A 14px `--paper` dot that follows via `gsap.quickTo` on x/y (0.35s).
  - Scales ×2.6 over links and buttons.
  - Hidden when `(pointer: coarse)` or reduced motion; `pointer-events: none`.
- Notes: keep the native cursor visible for accessibility.

**Torn edges**
- Build: `<PaperEdge>`, one original SVG path (a hand-drawn irregular edge), used at the top and bottom
  of cream bands.
- Notes: draw your own path; don't trace theirs.

**Ambient beans**
- Build: `<BeanDrift>`, 4–6 original SVG beans with a `bean-pop`-style scale and opacity loop, placed
  in the hero margins.
- Notes: the optional physics field is decision D4 in §9.

**Grain**
- Build: a fixed full-screen SVG noise layer, `opacity: 0.08`, `mix-blend-mode: overlay`,
  `pointer-events: none`.
- Notes: this comes from my-design-taste.

---

## 4. Design tokens (defaults; confirm in §9)

```css
:root {
  --ink:       #0C0A08; /* page background: warm roast black */
  --char:      #1B1714; /* dark panels, card shadow, card text */
  --panel:     #141110; /* alternate dark band */
  --paper:     #ECE6DA; /* cream: text on dark, card background */
  --paper-mut: #8E877C; /* muted text on dark (≥ 4.5:1 on --ink) */
  --ink-mut:   #5A544B; /* muted text on paper (≥ 4.5:1 on --paper) */
  --cherry:    #B8412E; /* THE accent: dried coffee-cherry red (natural process). The only accent. */
}
```

**Exclusions:** no orange `#E06D2D` (that's Apocalypse's), no purple or indigo, and no decorative
gradients.

**Type** (Google Fonts, free):

| Role | Font | Treatment |
| --- | --- | --- |
| Display | `Big Shoulders Display` 700/800 | uppercase; `line-height: 0.9`; `letter-spacing: 0.01em`; `clamp(3.5rem, 9vw, 9rem)` for chapter titles and `clamp(4rem, 13vw, 13rem)` for the hero |
| Body / UI | `Readex Pro` 300/400/500 | already loaded, so the brand stays continuous. Eyebrows are 12–13px, weight 500, uppercase, `letter-spacing: 0.22em` |
| Utility (data only) | `IBM Plex Mono` 400/500 | batch codes, roast dates, cup scores and prices. Not for paragraphs |

**Radius:** cards 28px, buttons full pill.

**Spacing scale:** 8 / 16 / 24 / 40 / 64 / 96 / 160px.

**Motion tokens:**
- `--ease-text: cubic-bezier(0.16,1,0.3,1)`;
- `--ease-card: cubic-bezier(0.22,1,0.36,1)`;
- reveal 900ms, hover 200ms;
- stagger 60ms for words, 90ms for cards.

**Signature element: the Batch Ticket.** Sawargi's whole proof is "every batch dated, numbered,
cupped", so each batch from `src/data/shop.ts` becomes a cream paper ticket with:
- a perforated left edge;
- the batch code large, in Plex Mono;
- a roast-date "stamp" in `--cherry`, rotated −4°;
- a bags-left counter and the tasting notes;
- a hard offset shadow.

The ticket appears in the hero strip, the marquee, the batch chapter and the checkout picker.
Everything else stays quiet.

---

## 5. Copy inventory (use verbatim)

The source of truth is `src/App.tsx` at commit `d386d15`. The strings are copied here so layout work
can't drift from them.

| Key | Text |
| --- | --- |
| nav | story · one roast · process · order · journal · **Buy Now** |
| hero.line1 | Quietly **Roasted** *(§9 D1: typo "Quitely" corrected)* |
| hero.line2 | Never **Rushed** |
| story.eyebrow / title | our story / Born When the Cafes Went Quiet |
| story.p1 | Before 2020, coffee in Bandung wasn't something you drank alone - it was something you did with people. A cup outside, a bit of time, a few friends. |
| story.p2 | Then the streets emptied and bean prices collapsed. We had time, cheap beans, and no excuse left, so we learned the process one failed cup at a time. |
| story.p3 | Sawargi started with that refusal to serve anything we wouldn't drink ourselves. That habit is why every batch still has to earn the name. |
| one.eyebrow / title | why just one / Master One Coffee Completely |
| one.p1 | Most coffee brands spread thin across a dozen blends, hoping one sticks. We never had that luxury, so mastering one coffee became the standard we kept on purpose. |
| one.pull | Every harvest. Every roast. Every bag. Held to the same standard - refined, never replaced. |
| process.eyebrow / title | tasted before it's trusted / Cupped, Scored, Then Released |
| process.p1 | We roast by hand in a small pan, a little at a time, and never hurry the heat. Then every roast is cupped and scored against our own benchmark: body, acidity, sweetness, finish. If it misses the profile, it doesn't ship. *(§9 D9)* |
| process.pull | Every batch cupped. Every batch scored. Every batch dated. |
| clean.eyebrow / title | clean hands, careful process / Care Starts Before the Cup |
| clean.p1 | It starts at the cherry. Ciwidey Natural dries whole, fruit still on the bean, and from drying to packing our rule doesn't change: nothing touches your coffee that wouldn't touch our own cup. *(§9 D9)* |
| proof.eyebrow / title | proof, not promises / Freshness You Can Audit |
| proof.p1 | Everything we just told you is printed on the bag in your hand. *(§9 D9, added)* |
| proof.items | Roast date printed on every bag · Batch number for full traceability · One-way valve packaging to lock in aroma *(4th item cut, see §9 D2)* |
| scarcity.eyebrow / title | the scarcity angle / No New Flavor to Hide Behind |
| scarcity.p1 | We don't launch a new flavor every season. When this batch sells out, the next one waits for proof, not a deadline. |
| cta.eyebrow / title | call to action / Bring the Table Back |
| cta.p1 | The pandemic took the cup we used to share with friends. This is the one we built to bring it back - cupped, dated, and roasted the same unhurried way since the year cheap beans were all we had. |
| cta.button | Order This Batch |
| cta.meta | Batch {code} roasted {date}. Limited to {total} bags — {left} left. *(data-driven)* |
| footer | Small batch. Fully traceable. Cupped before it's sold. Best enjoyed with someone else in the room. |

Eyebrows like "call to action" and "the scarcity angle" read as internal labels rather than customer
copy. See §9 D3.

---

## 6. New structure & flow

The current flow is 8 equal, full-height text panels: the same rhythm throughout, no climax, and the
CTA only at the end. The new flow follows *Scroll-Triggered Storytelling*: a hook, three chapters that
each end in a mini-CTA, a proof band, then a climax. Bands alternate between dark (video visible) and
cream (paper, video hidden) so the page has rhythm.

```
┌───────────────────────────────────────────────────────────────┐
│ 0  HERO (dark, video)                                         │
│    QUITELY ROASTED  ← split reveal, left, 13vw                 │
│             NEVER RUSHED ← right, wiggle on "Never"           │
│    [BATCH TICKET strip: SWG-CN-014 · roasted 24 Sep · 23 left │
│     · Order This Batch →]   floating beans in margins          │
├───────────────────────────────────────────────────────────────┤
│ 1  PROOF MARQUEE (cream band, torn edges)                     │
│    Roast date printed… • Batch number… • One-way valve… • …   │
├───────────────────────────────────────────────────────────────┤
│ 2  CHAPTER I — OUR STORY (dark, video)  PINNED HORIZONTAL      │
│    title left → track of 3 paper cards = p1 / p2 / p3          │
│    labels: "Before 2020" · "Then" · "Sawargi"  (words already │
│    in the copy — no invented dates)                            │
├───────────────────────────────────────────────────────────────┤
│ 3  CHAPTER II — WHY JUST ONE (cream)                           │
│    huge title "Master One Coffee Completely" (split reveal)    │
│    p1 left │ pull quote right, "Every harvest. Every roast.    │
│    Every bag." wiggle   → mini-CTA "Choose a batch"            │
├───────────────────────────────────────────────────────────────┤
│ 4  CHAPTER III — PROCESS (dark, video)  STICKY STEPS           │
│    01 Cupped, Scored, Then Released   │ ┌────────┐ sticky      │
│    02 Care Starts Before the Cup      │ │ still  │ clip-path   │
│    03 Freshness You Can Audit (list)  │ └────────┘ swaps/step  │
├───────────────────────────────────────────────────────────────┤
│ 5  THE BATCH (cream)  — signature                              │
│    "No New Flavor to Hide Behind" + p1                         │
│    [ticket 014] [ticket 013] [ticket 012 SOLD OUT]  → checkout │
├───────────────────────────────────────────────────────────────┤
│ 6  JOURNAL TEASER (dark)  "Dried in the Fruit" card → /journal │
├───────────────────────────────────────────────────────────────┤
│ 7  CLIMAX CTA (dark, video, full-bleed)                        │
│    BRING THE TABLE BACK (split reveal, 12vw) + p1 + button     │
│    + cta.meta                                                  │
├───────────────────────────────────────────────────────────────┤
│ 8  FOOTER (cream, torn top edge) footer line + nav + legal     │
└───────────────────────────────────────────────────────────────┘
```

Rules for the flow:
- **Pinning:** only sections 2 (timeline) and 4 (sticky steps) pin. That's the maximum of two that
  ui-ux-pro-max allows.
- **Video markers:** every chapter keeps `data-video-section`, so scrub progress still spans the whole
  page. Cream bands cover the video, but the scrub keeps running underneath, so the frame is right when
  the next dark band opens.
- **Desktop nav:** keep the existing floating dark pill and add a thin scroll-progress line in
  `--cherry` under it. "Buy Now" goes to `/checkout`.
- **Mobile nav:** logo, Buy Now and a menu button. The menu is full-screen and traps focus.
- **Mini-CTAs:** each links to `/checkout` (or `#batch`), never to a dead anchor.

---

## 7. Other pages

- **`/checkout`:** reuse the tokens.
  - Batch radio cards become Batch Tickets.
  - The order summary becomes a paper card.
  - The place-order button is an `InkButton` in `--cherry`.
  - Keep all behaviour and the tests in `CheckoutPage.test.tsx`.
- **`/journal` and the article:**
  - cream reading surface;
  - display face for H1/H2;
  - Readex body at 18px / 1.8;
  - Plex Mono for source numbers.
  - Keep all text and references exactly.
- **Loader** (in `CinematicVideo`): restyle "loading... N%" as a roast-date stamp counter and keep the
  behaviour.

---

## 8. Acceptance criteria

- [ ] `npm run build`, `npx tsc -b`, `npm test` and `npm run lint` all pass (lint: 0 errors).
- [ ] Every string in §5 appears verbatim.
  - First move the copy into `src/content/copy.ts`, then redesign.
  - Add a test that imports the copy map and asserts each string renders on `/`.
- [ ] Scrub video: scrolling top to bottom moves the frame continuously, with no visible stalls, in
      Chrome and Safari at 1440px and 390px. `CinematicVideo` tests still pass.
- [ ] Reduced motion: no Lenis, no pinning, and no split, wiggle, marquee or cursor animation. Every
      section is readable.
- [ ] Keyboard: every link and button is reachable in order, focus is visible, and the mobile menu
      traps focus and restores it on close.
- [ ] Lighthouse (mobile): Performance ≥ 80, Accessibility ≥ 95, CLS < 0.1.
- [ ] No asset, SVG path, font file or text taken from apocalypsecoffee.com.
- [ ] Screenshots of every section at 375 / 768 / 1440 committed to `docs/redesign/screens/` for
      review.

---

## 9. Gaps & decisions

### Decisions only Taufik can make (defaults let work start; flag them in the PR)

| # | Question | Default if unanswered |
| --- | --- | --- |
| D1 | The hero said **"Quitely"**. Is that a typo for "Quietly"? | **Decided 29 Sep 2026:** corrected to "Quietly" |
| D2 | Proof item "Best enjoyed within **[X]** days of roast": what's X? | **Decided 29 Sep 2026:** line cut |
| D3 | The eyebrows "call to action" and "the scarcity angle" look like internal labels. Keep them as visible text? | Keep verbatim (copy rule), flag |
| D4 | Add the Matter.js draggable bean field like the reference? It's +~90 KB of JS and mostly a novelty. | No; use the CSS `BeanDrift` only |
| D5 | Is the accent `--cherry #B8412E` OK? (It must not be Apocalypse orange.) | Use it |
| D6 | Add a script or hand-drawn accent font like the reference's? my-design-taste caps it at 2 families plus a utility face. | No script font; wiggle the display face instead |
| D7 | The price is Rp150.000 per 1 kg, likely below green-bean cost (see earlier analysis). | Leave `src/data/shop.ts` untouched |
| D8 | Deploy target (Vercel, Netlify, other)? `/checkout` and `/journal` need a rewrite to `index.html`. | Add both `vercel.json` and `public/_redirects` |

| D9 | Process narration vs photos | **Decided 29 Sep 2026:** Taufik asked for the process copy to match the new photos. Steps now run in real order: 01 Care Starts Before the Cup (cherries), 02 Cupped, Scored, Then Released (hand pan roast), 03 Freshness You Can Audit (bag). `clean.p1` and `process.p1` rewritten and `proof.p1` added, using only established facts (natural process from `shop.ts`, pan roasting confirmed by Taufik). The "facility standard" claim was dropped because it contradicts the pan-roast photo. Sawargi has no farm affiliation, so the farm photo is cropped to the cherry baskets. |

### Gaps Claude (cloud) must close itself

**G1: skills aren't auto-loaded in the cloud.**
The setup step in `CLAUDE.md` copies `design-skills/*` into `.claude/skills/`.

**G2: no `lenis` dependency.**
Run `npm i lenis`.

**G3: fonts.**
Add Big Shoulders Display and IBM Plex Mono to `src/styles/fonts.css` (Google Fonts, `display=swap`),
and preload the display weight.

**G4: no product photography, bean cut-outs or illustrations.**
- Draw original SVG beans and a bag outline.
- Use stills from the scrub video for the sticky-steps media (G5).
- Leave clearly named placeholder slots for real photos, documented in
  `/public/media/photos/README.md`.

**G5: stills for the sticky steps.**
Extract three frames, then convert them to WebP at ≤ 150 KB each:
```bash
ffmpeg -i public/media/scrub/coffee-scrub-1080.mp4 \
  -vf "select=eq(n\,24)+eq(n\,96)+eq(n\,168)" -vsync 0 -q:v 3 \
  public/media/stills/step-%d.jpg
```
If ffmpeg isn't available in the cloud VM, stub the stills with CSS gradients and list them as a
follow-up.

**G6: the copy is inline JSX.**
Extract it to `src/content/copy.ts` before any layout change, and add the verbatim test from §8.

**G7: `App.test.tsx` pins the old DOM** (8 video sections, specific classes).
Rewrite the tests around behaviour:
- nav links;
- CTA hrefs;
- copy presence;
- `data-video-section` count ≥ 6.

**G8: ScrollTrigger, Lenis and the scrub video all touch scroll.**
- Have a single requestAnimationFrame owner (`gsap.ticker`).
- Call `ScrollTrigger.refresh()` after fonts load.
- Retune `SCRUB_SMOOTHING`.

**G9: visual QA in the cloud.**
- If a headless browser is available, install Playwright and take the §8 screenshots.
- If not, say so in the PR and hand visual review to Taufik. Don't claim it looks right without
  seeing it.

**G10: the old 58 MB HLS folder** is git-ignored and absent from the repo.
Nothing references it; don't recreate it.

---

## 10. Suggested build order (one PR per step)

1. Extract copy to `copy.ts`, add the verbatim test, the token CSS variables and the fonts (no visual
   change yet).
2. Primitives: `SplitReveal`, `Wiggle`, `InkButton`, `PaperEdge`, `CursorDot`, `Grain`, smooth scroll.
3. The Batch Ticket component, wired to `shop.ts`.
4. The home page restructure (§6), section by section, keeping `data-video-section`.
5. Timeline pin, sticky steps and marquee.
6. Restyle `/checkout`, `/journal` and the loader.
7. Reduced-motion pass, accessibility pass, Lighthouse, screenshots, PR.
