# Sawargi Coffee: project notes for Claude

A single-product coffee site (Ciwidey Natural, sold by numbered batch) built with React 18, Vite 8,
TypeScript, Tailwind 3 and GSAP. Owner: Taufik. Current work is the redesign described in
`docs/redesign/BRIEF.md`; read it before changing any UI.

## Session setup (run first in a fresh cloud session)

```bash
npm ci
mkdir -p .claude/skills && cp -r design-skills/* .claude/skills/   # make the design skills loadable
```

- **Skills:** `design-skills/` holds Taufik's `my-design-taste` skill and a vendored copy of
  `ui-ux-pro-max` (MIT, see its LICENSE).
- **ui-ux-pro-max search tool:** its SKILL.md refers to `${CLAUDE_PLUGIN_ROOT}`. Call the script by
  its repo path instead:
  `python3 design-skills/ui-ux-pro-max/scripts/search.py "<query>" --domain <domain>`.
- **Frontend Design principles:** summarised in BRIEF §2.

## Commands

- `npm run dev`: dev server on 127.0.0.1:5173.
- `npm test`: Vitest + Testing Library (jsdom).
- `npx tsc -b`: type-check.
- `npm run lint`: ESLint (warnings OK, 0 errors).
- `npm run build`: production build into `dist/`.

Run tests, the type-check and lint before every commit. Don't claim something works visually unless
you've seen a screenshot.

## Map

| Path | What it is |
| --- | --- |
| `src/Root.tsx` | Route switch: `/`, `/checkout`, `/journal`, `/journal/ciwidey-natural`. The router is `src/lib/router.tsx` (pushState, no dependency) |
| `src/App.tsx` | Home page. Copy is currently inline; extract it to `src/content/copy.ts` first (BRIEF G6) |
| `src/components/CinematicVideo.tsx` | Scroll-scrubbed background video: rAF-eased seeks, cached section tops, HLS + MP4. **Keep it.** Section progress comes from `[data-video-section]` elements |
| `public/media/scrub/*.mp4` | All-keyframe 1080p/720p encodes made for scrubbing. See `docs/video-scrub.md` |
| `src/data/shop.ts` | Product, batches (sample data), grinds, shipping, currencies. Single source of truth for prices |
| `src/pages/CheckoutPage.tsx` | Dummy checkout (no real payment, stores nothing) |
| `src/pages/JournalPage.tsx` | Journal index + researched article. Evidence notes are in `docs/research/` |

## Rules

- **Copy is locked.** Marketing copy stays verbatim (BRIEF §5). Never invent reviews, stats,
  certifications or farm facts.
- **Don't copy the reference.** Take no assets, SVGs, fonts, code or text from apocalypsecoffee.com;
  re-create techniques only.
- **One animation engine.** Use GSAP (+ ScrollTrigger) with Lenis for smooth scroll. Don't add
  framer-motion or jQuery.
- **Every animation needs a reduced-motion path** that renders the final state.
- **Deep links need hosting config.** Add SPA fallback config (`vercel.json` / `public/_redirects`)
  so `/checkout` and `/journal` work on deploy.
- **Media stays out of git.** Don't commit files > 25 MB. The old 4K HLS folder is intentionally
  git-ignored.
- **Talk to Taufik like an advisor.** Lead with the uncomfortable truth, tag claims `[Certain]`,
  `[Likely]` or `[Guessing]`, and disagree with reasons.
