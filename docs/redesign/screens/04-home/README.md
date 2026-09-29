# Step 4 screenshots (home page restructure)

Headless Chromium at 375 / 768 / 1440, with the **scrub video playing**. This Chromium has no
H.264 decoder, so the capture script swapped in a VP9 transcode of `coffee-scrub-720.mp4`
(all keyframes, same timing). Everything else is the real page.

File names: `{width}-{section}.webp`, one viewport per section in BRIEF §6 order:
`hero`, `proof`, `story-cards`, `one`, `process`, `batch-grid`, `journal`, `order`, `footer`.

`reduced-*.webp` are the same page under `prefers-reduced-motion: reduce`: the hero scrolls away
normally, beans are static, and every heading renders in its final state.

Measured during capture:

- No horizontal overflow at any width.
- Keyboard: Tab walks every stop in document order (17 on desktop, 13 on mobile) and every
  focused element scrolls fully into view.
- Scrub: no stalls; with Lenis the frame lands while the page glides its last pixels
  (see the PR for numbers).
