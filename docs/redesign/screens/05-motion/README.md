# Step 5 screenshots (motion: marquee, pinned story, sticky process)

Headless Chromium with the scrub video playing (VP9 stand-in, range-served; see `../04-home/README.md`).

| File | What it shows |
| --- | --- |
| `1440-story-{0,50,102}.webp` | Chapter I pinned: the title panel and cards slide left as you scroll; at the end the last card sits fully in view |
| `1440-marquee.webp` | Proof band ticker: proof items and batch tickets (the page was mid-scroll, so the hero is fading out above) |
| `1440-process-{12,42}.webp` | Sticky process steps: the active step is full strength, the others dim; the still on the right stays put and swaps |
| `375-story.webp`, `375-story-swiped.webp` | Phones: the cards are a swipeable row with snap; no page overflow |
| `reduced-1440-marquee.webp` | Reduced motion: marquee static and wrapped, story stacked, no pin |

Measured (see PR): marquee pauses on hover; pin ends with the last card fully visible; the scrub
runs 0 → 7.96 s top to bottom with no stalls, including through the pinned section.
