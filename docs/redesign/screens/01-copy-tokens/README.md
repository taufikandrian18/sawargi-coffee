# Step 1 screenshots (copy extraction, tokens, fonts)

Taken with headless Chromium at 375 / 768 / 1440 wide, with reduced motion on, at three scroll
positions: `hero`, `#story` and `#order`.

- **The video is not shown.** This Chromium build has no H.264 decoder, so the MP4 never reaches
  `canplay`. The "loading... N%" overlay was hidden by the capture script so the page underneath
  could be seen. The background is therefore black, not a video frame.
- **Compared with `main`:** each shot was pixel-diffed against the same capture of `main`.
  `hero` and `story` are identical (0 px). `order` differs by 6–18 px of anti-aliasing on the
  batch line, which is now one text node instead of several; the two look the same side by side.
