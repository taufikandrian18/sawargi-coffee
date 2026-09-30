# Step 7: final screenshots

Every home section, plus `/checkout`, `/journal` and the article, at 375, 768 and 1440 px.
File names: `<nn-section>-<width>.webp`.

How they were taken:
- **Build:** the production build under `/sawargi-coffee`, against a stand-in WooCommerce
  store answering with `src/data/__fixtures__/storeApiProducts.json`. The batch values shown
  (SWG-CN-015, "41 of 60 bags", cup scores) are that **test fixture**, not the live store.
- **Browser:** headless Chromium. It can't decode H.264, so the scrub video is a VP9 stand-in
  of the same clip.
- **Timing:** each shot is taken about 1.3 s after scrolling to the section, past the loader.
