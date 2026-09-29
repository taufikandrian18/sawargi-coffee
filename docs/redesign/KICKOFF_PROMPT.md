# Kickoff prompt: paste this into Claude Code on the web

Open the repo `taufikandrian18/sawargi-coffee` in Claude Code (claude.ai/code), branch `main`, and paste:

---

Read `CLAUDE.md` and `docs/redesign/BRIEF.md` fully before touching code, then run the session setup
from `CLAUDE.md` so the `my-design-taste` and `ui-ux-pro-max` skills are loadable. Use both skills,
plus the Frontend Design principles in BRIEF §2, for every UI decision.

Goal: redesign the Sawargi site so its style and animation mimic apocalypsecoffee.com, while
**keeping** the scroll-scrubbed background video (`CinematicVideo` + `data-video-section`) and
**every line of copy verbatim** (BRIEF §5). The page **structure and flow** must follow BRIEF §6. Copy
techniques only; take no assets, fonts, SVGs, code or text from the reference.

Work in the order of BRIEF §10, **one branch + PR per step** (`redesign/01-copy-tokens`,
`redesign/02-primitives`, …). For each step:

1. State which decisions from BRIEF §9 it touches and which default you applied.
2. Implement.
3. Run `npx tsc -b`, `npm test`, `npm run lint` and `npm run build`, and paste the results.
4. Take screenshots at 375 / 768 / 1440 if a headless browser is available. If it isn't, say so
   plainly.
5. Open the PR with: what changed, what you didn't verify, and the open decisions.

Stop and ask me before:
- adding any dependency other than `lenis`;
- changing any copy string;
- changing prices or batch data;
- deleting tests instead of rewriting them.

Start with step 1.
