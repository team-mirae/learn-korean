# Learn Korean

[learn.sjun.me](https://learn.sjun.me): learn to type Korean, on the engine of
[bada ime](https://github.com/team-mirae/bada-ime) compiled to WebAssembly.

**Learn by typing, not writing.** Every answer is keys, typed on the real engine and judged by what
it gives. The learner first picks the Korean layout to aim for, and learns it from the first lesson:

| Track | Layout | Keyboards | Lessons |
|---|---|---|---|
| `2set` | Korean 2-set (10, KTS): the standard keyboard | US (ANSI), ISO, JIS | K1 home, top and bottom rows, Shift, compound jamo |
| `bada-plain` | bada plain (16): bada ime's default, vowels left and consonants right | JIS | P1 home, top and bottom rows, compound vowels, Shift |
| `bada-roman` | bada roman (15): Korean spelled in Latin letters | US (ANSI), ISO, JIS | R1 the letters, R2 the shortcuts |
| `bada` | bada (13): bada ime's first JIS layout | JIS | B1 home row, vowels, consonants, finals, number row |

bada plain, bada roman and bada work best on a JIS (Japanese) keyboard, and typing them outside the lessons
needs bada ime, which is macOS only for now; the onboarding says so.

Each lesson ends in a drill: a word, its standard romanization (Revised Romanization) and its keys
above it; Space commits it and it's checked. Each track ends with the national anthem (애국가, verse 1
and the refrain) and its English adaptation. The on-screen keyboard is the whole board the learner
picked, with the layout's legends. Progress stays in the browser.

## MCP server

`https://learn.sjun.me/mcp`: a public MCP server (Streamable HTTP, no auth) for learning in an AI
client. It keeps nothing: the learner's progress is a JSON object the client stores and passes back;
the server teaches, quizzes and judges answers on the same engine.

| Tool | Does |
|---|---|
| `lessons` | The learner's track, scores per lesson, and the next lesson (or the tracks to pick from) |
| `start` | Picks the track; returns the progress to store |
| `lesson` | A lesson's text and its drill (words, romanizations, keys) |
| `quiz` | Words from a lesson, or `review`: the learner's misses. No keys in it |
| `check` | Types each answer's keys on the engine; results, scores, and the new progress |
| `type` | What any keys type in a layout |

Keys are written one character per key by its JIS legend; ⇧ before a key is Shift (in bada roman and
2-set an uppercase letter is too; bada and bada plain letters are case-blind). Add it to Claude Code with
`claude mcp add --transport http learn-korean https://learn.sjun.me/mcp`.

## Files

- `public/`: the site, served as it is (no build step).
  - `index.html`, `learn.js`, `learn.css` (on top of `style.css`, bada ime's simulator styles).
  - `learn-content.js`: tracks, levels, lessons, drills and the anthem; the 2-set, bada plain and bada keys
    of a word (`twoSet`, `plain`, `bada`). Data only.
  - `keys.js`: the key notation (legends to key codes, Shift). `boards.js`: the keyboards drawn.
  - `engine.js`, `load.js`: the engine's JSON interface and its loader.
  - `engine/`: the engine as WebAssembly and its data, gzipped and named by hash, with
    `manifest.json` (bada ime's version and commit). Written by `tools/sync-engine.mjs`; committed.
- `lib/tutor.mjs` (lessons, quizzes, judging, progress) and `lib/mcp.mjs` (the MCP protocol);
  `api/mcp.js` serves them as a Vercel Function at `/mcp`.
- `test/learn.mjs`: types every drill through `public/engine` and fails if one doesn't give its
  word. `test/mcp.mjs`: the MCP server as a client calls it.

## Working on it

```sh
npm start                 # http://localhost:8000 (the page; not the MCP server)
npm test                  # every drill types as written; the MCP server end to end
npm run sync              # rebuild public/engine from ../bada-ime (Rust + wasm32-unknown-unknown)
```

To move to a newer engine: pull bada-ime, `npm run sync`, `npm test`, commit `public/engine`.
Only the data the lessons need is shipped (no hanja, kanji, emoji or Unicode names); add a file to
`NEEDED` in `tools/sync-engine.mjs` if a lesson needs it.

## Deploy

Vercel's Git integration deploys every push to `main` (`vercel.json`: `public/` as it is, no build;
`api/mcp.js` as a function with `public/engine` included; the hashed engine files cached for good,
the manifest never). The domain is learn.sjun.me. bada.sjun.me/learn redirects here.

## Licenses

The engine and its data are bada ime's: `public/engine/licenses/`.
