# Sawargi Cinematic Hero TDD Evidence

## Source Plan

Journeys and acceptance criteria were derived from the user requests in this Codex run.

## User Journeys

- As a visitor, I want a fullscreen cinematic Sawargi hero with the black/white foreground treatment, so the coffee video is not washed out by a page overlay.
- As a visitor, I want the navigation to point to the real story, single-roast, process, and order sections, so the menu matches the page content.
- As a visitor, I want the Sawargi origin story, single-SKU pitch, cupping process, hygiene/process, proof, scarcity, CTA, and trust signal copy on the page, so the sales narrative is complete.
- As a visitor, I want the new content sections to stay transparent over the fixed video, so the background remains visible beyond the hero.
- As a visitor, I want only the three hero words in the first viewport and I want them to fade away smoothly during the scroll into the next section, so the transition feels cinematic and uncluttered.
- As a visitor, I want `quitely roasted`, `never`, and `rushed` to behave as separate parallax objects, so each phrase can fade away in its own left/right direction.
- As a visitor, I want the new high-quality MP4 packaged as HLS without re-encoding, so the page keeps scroll-scrub reliability while preserving source quality.
- As a visitor, I want the HLS background video to scrub with the full page scroll in both directions, so the video stays tied to scroll position.
- As a visitor, I want bottom-of-page HLS seeking to avoid the exact media end, so scrolling up from the page bottom does not freeze the video.
- As a visitor, I want the high-resolution HLS video to use a larger forward/back buffer, so scroll-scrub seeking has more media available around each target.
- As a visitor, I want video progress mapped section by section, so each viewport panel owns a predictable slice of the video timeline.
- As a visitor, I want long sections shortened into one-screen panels, so content does not spill into the next section while the video transitions.

## Task Report

| Behavior | RED Evidence | GREEN Evidence | Guarantee |
|---|---|---|---|
| Story sections and nav anchors | `npm test` failed because the app still rendered `securify/platform` nav and no `our story`, `why just one`, `process`, or `order` regions. | `npm test` passed: 2 files, 15 tests. | Navigation targets the new content sections and the requested Sawargi copy renders. |
| HLS seeking while decoder is busy | `npm test` failed because the retry timer forced `currentTime` from `0` to `20` while `video.seeking` was still true. | `npm test` passed after queuing the latest target until `seeking` clears. | The decoder is not hammered with a new seek before the previous seek finishes. |
| Bottom-edge HLS seeking | `npm test` failed because bottom progress sought to `duration - 0.05` instead of a safer end gap. | `npm test` passed with bottom target clamped to `duration - 0.5`. Browser check showed `currentTime` `7.208333` for `duration` `7.708333`, `ended: false`. | Bottom scroll stays far enough before media end to preserve backward scrubbing. |
| Native scroll fallback | `npm test` failed because a native `scroll` event did not move `currentTime` when `ScrollTrigger.onUpdate` was not invoked. | `npm test` passed after adding a native scroll/resize/metadata sync path into the same seek pipeline. Browser check showed scroll down moved `currentTime` from `0` to `6.514878`, then scroll up moved it to `2.878117`. | Real page scrolling drives HLS seeking even if ScrollTrigger misses an update. |
| Transparent content sections | `npm test` failed because the content layer had no transparent-section test target and the proof rows still used solid `bg-black`. | `npm test` passed after changing the content layer to `bg-transparent` and proof rows to `bg-black/40`. Browser check showed layer background `rgba(0, 0, 0, 0)` and proof row background `rgba(0, 0, 0, 0.4)`. | The fixed HLS video remains visible behind the new sections. |
| Hero copy removal and scroll fade | `npm test` failed because the hero still rendered the description/stats and had no `hero-word-layer` fade target. | `npm test` passed after removing the description/stats and grouping the three words into a GSAP `ScrollTrigger` fade/blur layer. Browser check showed opacity changed from `1` to `0.0001`, blur to `9.9988px`, and y transform to about `-89.99px` after scrolling. | The removed copy stays absent and the three hero words fade smoothly during the first scroll transition. |
| Split hero parallax objects | `npm test -- src/App.test.tsx` failed because `hero-word-quietly` did not exist and the hero still used one grouped `hero-word-layer`. | `npm test -- src/App.test.tsx` passed after replacing the grouped layer with three refs and one GSAP timeline. Browser check showed `quitely roasted` at `x=-162.004`, `never` at `x=162.004`, `rushed` at `x=-162.004`, with opacity `0.1`; scrolling back restored opacity to `0.9999` and x to about `0`. | The three hero phrases are separate parallax targets and fade away left/right/left during the scroll into the next section, then reverse cleanly on scroll back. |
| High-quality MP4 to HLS swap | `npm test -- src/App.test.tsx` failed because the rendered video still used `/media/coffee-bean-hls/master.m3u8`. | `npm test` passed after packaging `Generated Video July 11, 2026 - 3_26AM.mp4` to `/media/generated-video-hls/master.m3u8` with FFmpeg stream copy and updating `videoSrc`. Browser check showed `readyState: 4`, duration `8`, buffered range `0-7.75`, and scroll currentTime `2.573462`. | The app uses the new high-quality HLS package while keeping scroll-controlled video behavior. |
| Larger HLS buffer for high-resolution scrubbing | `npm test -- src/components/CinematicVideo.test.tsx` failed because HLS config still used `maxBufferLength: 120`, `maxMaxBufferLength: 600`, and `maxBufferSize: 200MB`. | The focused test passed after increasing to `maxBufferLength: 240`, `maxMaxBufferLength: 900`, `maxBufferSize: 450MB`, `backBufferLength: 240`, `frontBufferFlushThreshold: 480`, and `startFragPrefetch: true`. | HLS keeps a larger scroll-scrub buffer while still forcing the highest quality level. |
| Section-based video progress | `npm test -- src/components/CinematicVideo.test.tsx` failed because `getSectionScrollProgress` did not exist. Later RED checks caught sticky/nested section-top bugs. | Tests passed after adding section progress mapping, a sticky hero hard anchor, and normal-panel geometry based on `getBoundingClientRect().top + scrollY`. Browser check on `http://127.0.0.1:5180/` showed time samples `0`, `1.143`, `3.429`, `5.714`, `7.5`, then back to `3.429`. | Video seeking advances by marked viewport panels and reverses cleanly when scrolling back. |
| One-screen content panels | `npm test -- src/App.test.tsx` failed because the page had zero `[data-video-section]` panels. | The focused test passed after marking eight panels and compacting section copy/layout. Browser check showed eight 720px panels with tops `0, 720, 1440, 2160, 2880, 3600, 4320, 5040`; every panel fit its viewport. | Major content sections are one-screen video panels instead of uneven long-scroll blocks. |
| Production validation | Full validation was rerun after the section-based HLS change. | `npm run lint`, `npm run build`, `npm test`, `npm run test:coverage`, and `npm audit --cache ./.npm-cache` passed. | TypeScript build, static analysis, regression tests, coverage threshold, and dependency audit are clean. |

## Test Specification

| # | What is guaranteed | Test file or command | Test type | Result | Evidence |
|---|---|---|---|---|---|
| 1 | Sawargi foreground renders brand, three separate hero parallax word objects, and new navigation anchors while removed stat/description copy stays absent | `src/App.test.tsx` | Component | PASS | `npm test` |
| 2 | Story, single-roast, cupping, hygiene, proof, scarcity, CTA, and footer trust sections render | `src/App.test.tsx` | Component | PASS | `npm test` |
| 3 | Direct video fallback renders expected attributes and loading overlay behavior | `src/components/CinematicVideo.test.tsx` | Component | PASS | `npm test` |
| 4 | Native HLS source is assigned directly for Safari-capable playback | `src/components/CinematicVideo.test.tsx` | Component | PASS | `npm test` |
| 5 | hls.js loads HLS manifests with requested config and forces the highest quality level | `src/components/CinematicVideo.test.tsx` | Component | PASS | `npm test` |
| 6 | Buffer progress uses `bufferedEnd / duration * 100` | `src/components/CinematicVideo.test.tsx` | Component | PASS | `npm test` |
| 7 | Scroll seeking queues pending seeks while the decoder is already seeking | `src/components/CinematicVideo.test.tsx` | Component | PASS | `npm test` |
| 8 | Bottom scroll seek targets stay `0.5s` below exact media duration | `src/components/CinematicVideo.test.tsx` | Component | PASS | `npm test` |
| 9 | Native scroll events update HLS seek progress when ScrollTrigger does not emit | `src/components/CinematicVideo.test.tsx` | Component | PASS | `npm test` |
| 10 | Mouse movement drives GSAP parallax on the video wrapper | `src/components/CinematicVideo.test.tsx` | Component | PASS | `npm test` |
| 11 | New content sections use a transparent layer and translucent proof rows | `src/App.test.tsx` | Component | PASS | `npm test` |
| 12 | App video source points at the generated HLS package from the new MP4 | `src/App.test.tsx` | Component | PASS | `npm test` |
| 13 | Hero parallax objects expose left/right/left exit directions and no longer use one grouped fade layer | `src/App.test.tsx` | Component | PASS | `npm test -- src/App.test.tsx` |
| 14 | HLS config uses the larger high-resolution scroll-scrub buffer profile | `src/components/CinematicVideo.test.tsx` | Component | PASS | `npm test` |
| 15 | Section scroll progress maps marked panels to predictable video timeline slices | `src/components/scrollProgress.ts` via `src/components/CinematicVideo.test.tsx` | Unit | PASS | `npm test` |
| 16 | Sticky hero and normal content panels use stable document-top calculations | `src/components/scrollProgress.ts` via `src/components/CinematicVideo.test.tsx` | Unit | PASS | `npm test` |
| 17 | The page exposes eight major viewport panels for section-based video scrubbing | `src/App.test.tsx` | Component | PASS | `npm test` |

## Coverage and Known Gaps

`npm run test:coverage` passed with 94.38% statements, 85.55% branches, 95.23% functions, and 99.44% lines.

Known gap: browser validation reads DOM/media state directly; it does not include a stored screenshot artifact.

## Validation Commands

- `npm test` - PASS, 2 test files and 20 tests.
- `npm run test:coverage` - PASS, coverage above 80%.
- `npm run lint` - PASS.
- `npm run build` - PASS; Vite reports a non-fatal bundle-size warning because GSAP and hls.js are bundled into the single page.
- `npm audit --cache ./.npm-cache` - PASS, 0 vulnerabilities.
- Browser check on `http://127.0.0.1:5174/` - PASS; nav/sections render and HLS currentTime moves down and back up after reaching the page bottom.
- Browser check on `http://127.0.0.1:5175/` - PASS; content layer background is transparent and proof rows are translucent while the HLS video remains active behind them.
- Browser check on `http://127.0.0.1:5176/` - PASS; removed hero copy is absent and the hero word layer fades from opacity `1` to `0.0001` while scrolling into the next section.
- Browser check on `http://127.0.0.1:5177/` - PASS; video source is `/media/generated-video-hls/master.m3u8`, duration is `8`, readyState is `4`, and scroll seeking advances currentTime.
- Browser check on `http://127.0.0.1:5178/` - PASS; `quitely roasted` and `rushed` fade left to about `x=-162px`, `never` fades right to about `x=162px`, and scrolling back restores opacity to about `1`.
- Browser check on `http://127.0.0.1:5180/` - PASS; eight one-screen panels fit the viewport and section-based HLS samples moved `currentTime` from `0` to `1.143`, `3.429`, `5.714`, `7.5`, then back to `3.429`.
