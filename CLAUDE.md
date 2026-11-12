# Learn Korean

- Typing lessons and a public MCP server at learn.sjun.me, on bada ime's engine (`../bada-ime`,
  team-mirae/bada-ime). Layout rules (2-set 10, bada plain 16, bada roman 15, bada 13) are bada ime's:
  `../bada-ime/docs/layouts/` and `docs/bada-layout.md`. A lesson must teach what the engine does;
  when a drill fails after `npm run sync`, the engine changed: fix the lesson or raise it in bada-ime.
- Principles: learn by typing, not writing (every answer is keys, judged on the engine); the learner
  picks the layout to aim for (2-set, bada plain, bada roman, bada) and learns it from the first lesson, no detour
  through another layout. bada plain and bada are JIS only; bada roman and 2-set offer US (ANSI), ISO and JIS boards.
- The MCP server keeps no state: progress lives in the client and goes round in each call.
- `public/` is served as it is (Vercel Git integration, `vercel.json`). No build step, no packages.
- `public/engine/` comes only from `npm run sync`; don't edit it by hand.
- `npm test` before committing a lesson, an engine sync or an MCP change.
- Names: bada (lowercase), bada plain, bada roman, Korean 2-set (KTS).
