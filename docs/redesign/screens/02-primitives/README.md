# Step 2 screenshots (primitives)

Captured from the dev-only gallery at `/__primitives` (not in the production build) with headless
Chromium, after scrolling so every reveal has fired.

| File | What it shows |
| --- | --- |
| `gallery-{375,768,1440}-full.png` | SplitReveal at hero and chapter scale (wiggle on "Never"), InkButton paper and cherry, a cream band with PaperEdge top and bottom, Wiggle, Plex Mono batch data |
| `gallery-1440-reduced.png` | Same page with `prefers-reduced-motion: reduce`: nothing hidden, no wiggle, no Lenis, no cursor |
| `focus-dark.png` | Keyboard focus on an InkButton: 2px `--paper` ring, 3px offset, fill swept in |
| `cursor-paper.png`, `cursor-cherry.png` | Cursor over buttons: a ring, so the label stays readable |
| `cursor-on-cream.png` | Resting cursor over a cream band (difference blend keeps it visible) |

Known capture artefacts, not page bugs:

- The full-page shots show a faint change in cream shade about one viewport down. The fixed grain
  layer is one viewport tall, and Chromium's full-page capture stitches around it. In a normal
  viewport the band measures one flat value top to bottom.
- Motion (reveal timing, wiggle, Lenis easing, cursor lag) can't be judged from stills.
