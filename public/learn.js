// Learn Korean (index.html): lessons and drills on the engine. Each drill item is a word: its keys
// go to the engine as on the simulator, Space commits, and the commit is checked against the word.
// The learner picks a track (the layout they aim for) and a keyboard; lessons are in
// learn-content.js; progress is kept in local storage.

import { loadEngine } from "./load.js";
import { LESSONS, TRACKS, ANTHEM, TWO_SET, lessonItems, trackOf, migrateId } from "./learn-content.js";
import { tokens, showKeys, isDrillKey } from "./keys.js";
import { BOARDS, BADA_KEYS, guessBoard } from "./boards.js";

const $ = id => document.getElementById(id);
const STORE = "bada-learn";
const PASS = 0.9;

// ── Theme: the system's ────────────────────────────────────────────────────────────────────────
const dark = matchMedia("(prefers-color-scheme: dark)");
function applyTheme() {
  document.documentElement.dataset.theme = dark.matches ? "dark" : "light";
}
dark.addEventListener("change", applyTheme);
applyTheme();

// ── Progress ───────────────────────────────────────────────────────────────────────────────────
function loadProgress() {
  let p = {};
  try { p = JSON.parse(localStorage.getItem(STORE) || "{}"); } catch {}
  const best = {};
  for (const [k, v] of Object.entries(p.best || {})) best[migrateId(k)] = v;
  const lesson = migrateId(p.lesson || "");
  const target = p.target || LESSONS.find(l => l.id === lesson)?.level.track || null;
  return { target, board: p.board || guessBoard(), lesson, onboarded: !!p.onboarded && !!target, best,
    show: { std: true, keys: true, ...p.show } };
}
const progress = loadProgress();
const save = () => { try { localStorage.setItem(STORE, JSON.stringify(progress)); } catch {} };

// ── State ──────────────────────────────────────────────────────────────────────────────────────
let engine = null;
let track = trackOf(progress.target);
let lesson = LESSONS.find(l => l.id === progress.lesson && l.level.track === track.id) || firstLesson();
function firstLesson() { return LESSONS.find(l => l.level.track === track.id); }
const boardId = () => (track.boards.includes(progress.board) ? progress.board : track.boards[0]);
const drill = { items: [], at: 0, results: [], pressed: 0, out: null, started: 0, shiftLatch: false };

// ── The lesson list ────────────────────────────────────────────────────────────────────────────
function drawLessons() {
  const nav = $("lessons");
  nav.replaceChildren(...track.levels.map(level => {
    const box = document.createElement("div");
    box.className = "level";
    const h = document.createElement("h2");
    h.textContent = `Level ${level.n}: ${level.title}`;
    box.append(h);
    for (const l of level.lessons) {
      const b = document.createElement("button");
      b.className = "lesson-link" + (l.id === lesson.id ? " current" : "");
      if (l.id === lesson.id) b.setAttribute("aria-current", "page");
      const best = progress.best[l.id];
      b.innerHTML = `<span>${l.id} ${esc(l.title)}</span>` +
        (best != null ? `<span class="badge${best >= PASS ? " pass" : ""}" title="Best accuracy">${Math.round(best * 100)}%</span>` : "");
      b.onclick = () => openLesson(l.id);
      box.append(b);
    }
    return box;
  }));
}

function openLesson(id) {
  lesson = LESSONS.find(l => l.id === id && l.level.track === track.id) || firstLesson();
  progress.lesson = lesson.id;
  save();
  drawLessons();
  $("levelTitle").textContent = `Level ${lesson.level.n}: ${lesson.level.title}`;
  $("levelBody").innerHTML = lesson.level.intro;
  $("levelIntro").open = lesson.level.lessons[0].id === lesson.id;
  $("lessonTitle").textContent = `${lesson.id} ${lesson.title}`;
  $("lessonBody").innerHTML = lesson.anthem ? anthemBody() : lesson.body;
  $("drillTitle").textContent = lesson.anthem ? ANTHEM.title : "Drill";
  syncBoardPick();
  drawKeyboard();
  startDrill();
  window.scrollTo(0, 0);
}

function anthemBody() {
  const how = { roman: "every jamo spelled, with <code>;</code> where the blocks split another way",
    short: "with the shortcuts of this level, and without <code>;</code> where the word comes first anyway",
    twoset: "in 2-set keys", bada: "in bada keys" }[lesson.anthem];
  const keys = lessonItems(lesson).map(i => i.keys.length).reduce((a, b) => a + b, 0);
  const roman = lesson.anthem === "short"
    ? ` That's ${keys} keys, against ${ANTHEM.lines.flatMap(l => l.words).reduce((n, w) => n + w.roman.length, 0)} in Level 1.` : "";
  return `<p>The national anthem of Korea, 애국가 (Aegukga): verse 1 and the refrain, typed ${how}.${roman}</p>`;
}

// ── The drill ──────────────────────────────────────────────────────────────────────────────────
function startDrill() {
  drill.items = lessonItems(lesson);
  drill.at = 0;
  drill.results = [];
  drill.pressed = 0;
  drill.out = null;
  drill.started = 0;
  drill.shiftLatch = false;
  if (engine) {
    engine.applySettings({ enabled: [lesson.level.layout] });
    engine.setMode("henkan");
    engine.flush();
  }
  $("result").hidden = true;
  $("shiftBtn").hidden = lesson.level.layout === 15;
  drawWords();
  drawTyping();
}

function wordEl(item, idx) {
  const d = document.createElement("span");
  const r = drill.results[idx];
  d.className = "word" + (idx === drill.at && drill.at < drill.items.length ? " current" : "") + (r ? (r.ok ? " ok" : " bad") : "");
  d.innerHTML = `<span class="std">${esc(item.rr || " ")}</span><span class="keys">${esc(showKeys(item.keys, lesson.level.layout))}</span>` +
    `<span class="ko">${esc(item.ko)}</span>` + (r && !r.ok ? `<span class="got">${esc(r.got || "–")}</span>` : "");
  return d;
}

function drawWords() {
  const host = $("words");
  host.classList.toggle("no-std", !progress.show.std);
  host.classList.toggle("no-keys", !progress.show.keys);
  host.classList.toggle("anthem", !!lesson.anthem);
  if (lesson.anthem) {
    let idx = 0;
    const lines = ANTHEM.lines.map(line => {
      const p = document.createElement("div");
      p.className = "line";
      const ws = document.createElement("div");
      ws.className = "line-words";
      for (const _ of line.words) ws.append(wordEl(drill.items[idx], idx++));
      const en = document.createElement("div");
      en.className = "en";
      en.textContent = line.en;
      p.append(ws, en);
      return p;
    });
    const credit = document.createElement("p");
    credit.className = "credit muted";
    credit.textContent = ANTHEM.credit;
    host.replaceChildren(...lines, credit);
  } else {
    host.replaceChildren(...drill.items.map(wordEl));
  }
  $("drillCount").textContent = `${Math.min(drill.at + 1, drill.items.length)} of ${drill.items.length}`;
  // Keep the current word in view inside the list (never scroll the page itself)
  const cur = host.querySelector(".current");
  if (cur && host.scrollHeight > host.clientHeight) {
    const top = cur.offsetTop, bottom = top + cur.offsetHeight;
    if (top < host.scrollTop) host.scrollTop = top - 8;
    else if (bottom > host.scrollTop + host.clientHeight) host.scrollTop = bottom - host.clientHeight + 8;
  }
}

function drawTyping() {
  const out = drill.out;
  $("preedit").textContent = out?.preedit || "";
  const list = $("readings");
  const menu = out && out.menu.length > 1 ? out.menu : [];
  list.replaceChildren(...menu.map((m, i) => {
    const li = document.createElement("li");
    li.textContent = m;
    if (i === out.selected) li.className = "sel";
    return li;
  }));
  // The next key on the keyboard
  document.querySelectorAll("#board .key.next").forEach(k => k.classList.remove("next"));
  const item = drill.items[drill.at];
  const next = item ? tokens(item.keys)[drill.pressed] : null;
  const show = !!next && progress.show.keys;
  $("board").classList.toggle("shift-next", show && next.shift);
  if (show) document.querySelector(`#board .key[data-code="${next.code}"]`)?.classList.add("next");
  if (show && next.shift) document.querySelectorAll(`#board .key[data-code^="Shift"]`).forEach(k => k.classList.add("next"));
  $("shiftBtn").setAttribute("aria-pressed", String(drill.shiftLatch));
}

/** A key from the keyboard or the screen. Returns whether it was taken. */
function press(code, shift) {
  if (!engine || drill.at >= drill.items.length) return false;
  const staged = !!drill.out?.preedit;
  if (isDrillKey(code, lesson.level.layout)) {
    if (!drill.started) drill.started = performance.now();
    drill.out = engine.key(code, { shift });
    drill.pressed++;
  } else if (code === "Backspace") {
    if (!staged) return true;
    drill.out = engine.key("Backspace");
    drill.pressed = Math.max(0, drill.pressed - 1);
  } else if (code === "Tab" || code === "ArrowDown" || code === "ArrowUp") {
    if (!staged) return false;   // Tab moves the focus as usual
    drill.out = engine.key(code, { shift });
  } else if (code === "Space" || code === "Enter" || code === "NumpadEnter") {
    if (!staged) return true;
    const out = engine.key("Space");
    commit(out.commit.trim());
    return true;
  } else {
    return false;
  }
  drawTyping();
  return true;
}

function commit(got) {
  const item = drill.items[drill.at];
  drill.results[drill.at] = { ok: got === item.ko, got };
  drill.at++;
  drill.pressed = 0;
  drill.out = null;
  drill.shiftLatch = false;
  engine.flush();
  drawWords();
  drawTyping();
  if (drill.at >= drill.items.length) finish();
}

function finish() {
  const ok = drill.results.filter(r => r.ok).length;
  const acc = ok / drill.items.length;
  const minutes = Math.max((performance.now() - drill.started) / 60000, 1 / 60);
  const chars = drill.items.reduce((n, i) => n + [...i.ko].length, 0);
  const best = progress.best[lesson.id];
  if (best == null || acc > best) progress.best[lesson.id] = acc;
  save();
  drawLessons();
  const next = nextLesson();
  const box = $("result");
  box.hidden = false;
  box.innerHTML = `<b>${acc >= PASS ? "Well done!" : "Done."}</b> ${ok} of ${drill.items.length} right (${Math.round(acc * 100)}%),
    ${Math.round(chars / minutes)} Hangul blocks a minute.`;
  const again = document.createElement("button");
  again.textContent = "Again";
  again.onclick = startDrill;
  box.append(" ", again);
  if (next) {
    const go = document.createElement("button");
    go.className = "primary";
    go.textContent = `Next: ${next.id} ${next.title}`;
    go.title = `${MOD}↩`;
    go.onclick = () => openLesson(next.id);
    box.append(" ", go);
  }
}

// ── The keyboard: the whole board, with the layout's legends ───────────────────────────────────
const ROLE = { i: "--i", c: "--c", f: "--f", v: "--v" };
const MODS = { ShiftLeft: 1, ShiftRight: 1, Backspace: 1, Space: 1, Enter: 1, Tab: 1 };

function drawKeyboard() {
  const NS = "http://www.w3.org/2000/svg";
  const U = 54, G = 2.5, PAD = 8;
  const el = (tag, attrs, text) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    return e;
  };
  const board = BOARDS[boardId()];
  const layout = lesson.level.layout;
  const width = board.width * U + PAD * 2, height = 5 * U + PAD * 2;
  const svg = el("svg", { viewBox: `0 0 ${width} ${height}`, role: "img",
    "aria-label": `${board.name} keyboard with ${track.name} legends` });
  const twoSetAt = {};
  for (const [jamo, keys] of Object.entries(TWO_SET)) if (keys.length === 1) twoSetAt[keys] = jamo;
  const roman = { KeyQ: "ㅊ", KeyX: "ㅇ", Semicolon: "split" };
  for (const [code, kx, ky, kw, label] of board.keys) {
    const x = PAD + kx * U, y = PAD + ky * U, w = kw * U;
    const letter = /^Key[A-Z]$/.test(code);
    const takes = isDrillKey(code, layout);
    const g = el("g", { class: "key" + (takes ? "" : " mod"), "data-code": code });
    if (code === "Enter" && board.enter) {
      const { top, bottom } = board.enter, r = PAD + (board.width) * U - G;
      const x1 = PAD + top * U + G, x2 = PAD + bottom * U + G, y1 = PAD + U + G, y2 = PAD + 2 * U, y3 = PAD + 3 * U - G;
      g.append(el("path", { d: `M${x1},${y1}H${r}V${y3}H${x2}V${y2}H${x1}Z`, class: "cap" }));
      g.append(el("text", { x: r - 8, y: y1 + 16, "text-anchor": "end", class: "latin mod" }, label));
    } else {
      g.append(el("rect", { x: x + G, y: y + G, width: w - 2 * G, height: U - 2 * G, rx: 6, class: "cap" }));
      const text = label ?? board.legend(code);
      if (label != null || !takes) {
        g.append(el("text", { x: x + w / 2, y: y + U / 2 + 5, "text-anchor": "middle", class: "latin mod" }, text));
      } else if (layout === 13) {
        const [base, shift, inter] = BADA_KEYS[code] || [];
        g.append(el("text", { x: x + 8, y: y + 17, class: "latin small" }, text.toUpperCase()));
        const jamo = (spec, attrs, cls) => {
          if (!spec) return;
          const [j, r] = spec.split(":");
          g.append(el("text", { ...attrs, class: `jamo ${cls}`, style: `fill:var(${ROLE[r]})` }, j));
        };
        jamo(base, { x: x + U / 2, y: y + U - 11, "text-anchor": "middle" }, "");
        jamo(shift, { x: x + U - 8, y: y + 17, "text-anchor": "end" }, "small");
        jamo(inter, { x: x + U - 8, y: y + U - 9, "text-anchor": "end" }, "small");
      } else if (layout === 10) {
        const ch = letter ? code.slice(3).toLowerCase() : null;
        g.append(el("text", { x: x + 8, y: y + 17, class: "latin small" }, text.toUpperCase()));
        if (ch && twoSetAt[ch]) g.append(el("text", { x: x + U / 2, y: y + U - 11, "text-anchor": "middle", class: "jamo" }, twoSetAt[ch]));
        if (ch && twoSetAt[ch.toUpperCase()]) g.append(el("text", { x: x + U - 8, y: y + 17, "text-anchor": "end", class: "jamo small" }, twoSetAt[ch.toUpperCase()]));
      } else {
        g.append(el("text", { x: x + U / 2, y: y + U / 2 + 7, "text-anchor": "middle", class: "latin" }, letter ? text.toUpperCase() : text));
        const extra = roman[code];
        if (extra && (lesson.level.n >= 2 || code === "Semicolon")) {
          g.append(el("text", { x: x + U - 8, y: y + U - 8, "text-anchor": "end", class: "jamo small" }, extra));
        }
      }
    }
    if (takes || MODS[code]) {
      g.classList.add("live");
      g.addEventListener("pointerdown", e => {
        e.preventDefault();
        g.classList.add("on");
        if (code.startsWith("Shift")) { drill.shiftLatch = !drill.shiftLatch; drawTyping(); return; }
        const shift = drill.shiftLatch;
        drill.shiftLatch = false;
        press(code, shift);
      });
      g.addEventListener("pointerup", () => g.classList.remove("on"));
      g.addEventListener("pointerleave", () => g.classList.remove("on"));
    }
    svg.append(g);
  }
  $("board").replaceChildren(svg);
}

// ── Keys from the keyboard ─────────────────────────────────────────────────────────────────────
/** The lesson after this one in the track, or null at the end. */
function nextLesson() {
  const own = LESSONS.filter(l => l.level.track === track.id);
  return own[own.findIndex(l => l.id === lesson.id) + 1] || null;
}
const MOD = /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl+";

document.addEventListener("keydown", e => {
  // ⌘↩ (Ctrl+Enter elsewhere): the next lesson
  if ((e.metaKey || e.ctrlKey) && (e.code === "Enter" || e.code === "NumpadEnter") && !e.isComposing && !$("onboarding").open) {
    e.preventDefault();
    const next = nextLesson();
    if (next) openLesson(next.id);
    return;
  }
  if ($("onboarding").open || e.metaKey || e.ctrlKey || e.altKey || e.isComposing) return;
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLButtonElement && (e.code === "Space" || e.code === "Enter")) {
    if (e.target instanceof HTMLButtonElement) e.target.blur(); else return;
  }
  if (press(e.code, e.shiftKey)) {
    e.preventDefault();
    document.querySelector(`#board .key[data-code="${e.code}"]`)?.classList.add("on");
  }
});
document.addEventListener("keyup", e => document.querySelector(`#board .key[data-code="${e.code}"]`)?.classList.remove("on"));

// ── Controls ───────────────────────────────────────────────────────────────────────────────────
$("showStd").checked = progress.show.std;
$("showKeys").checked = progress.show.keys;
$("showStd").onchange = e => { progress.show.std = e.target.checked; save(); drawWords(); };
$("showKeys").onchange = e => { progress.show.keys = e.target.checked; save(); drawWords(); drawTyping(); };
$("restartBtn").onclick = () => startDrill();
$("shiftBtn").onclick = () => { drill.shiftLatch = !drill.shiftLatch; drawTyping(); };
$("tabBtn").onclick = () => press("Tab", false);
$("bsBtn").onclick = () => press("Backspace", false);
$("spaceBtn").onclick = () => press("Space", false);
for (const id of ["shiftBtn", "tabBtn", "bsBtn", "spaceBtn"]) $(id).addEventListener("pointerdown", e => e.preventDefault());

// ── The track and the keyboard ─────────────────────────────────────────────────────────────────
function setTrack(id) {
  track = trackOf(id);
  progress.target = track.id;
  save();
  $("trackSel").value = track.id;
  const last = LESSONS.find(l => l.level.track === track.id && progress.best[l.id] == null);
  openLesson((last || firstLesson()).id);
}
$("trackSel").replaceChildren(...TRACKS.map(t => new Option(t.name, t.id)));
$("trackSel").value = track.id;
$("trackSel").onchange = e => setTrack(e.target.value);
$("boardSel").replaceChildren(...Object.entries(BOARDS).map(([id, b]) => new Option(b.name, id)));
$("boardSel").onchange = e => { progress.board = e.target.value; save(); drawKeyboard(); drawTyping(); };
function syncBoardPick() {
  $("boardPick").hidden = track.boards.length < 2;
  $("boardSel").value = boardId();
}

// ── Onboarding: pick the layout to aim for ─────────────────────────────────────────────────────
const onboarding = $("onboarding");
$("tracks").replaceChildren(...TRACKS.map(t => {
  const b = document.createElement("button");
  b.className = "track" + (t.id === track.id && progress.onboarded ? " current" : "");
  b.value = t.id;
  b.innerHTML = `<b>${esc(t.name)}</b><span>${esc(t.blurb)}</span>` +
    (t.caveat ? `<span class="caveat">${esc(t.caveat)}</span>` : "");
  return b;
}));
onboarding.addEventListener("close", () => {
  const pick = TRACKS.find(t => t.id === onboarding.returnValue);
  progress.onboarded = true;
  save();
  if (pick) setTrack(pick.id);
});
$("howBtn").onclick = () => onboarding.showModal();

// ── Start ──────────────────────────────────────────────────────────────────────────────────────
function esc(s) {
  return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

openLesson(lesson.id);
if (!progress.onboarded) onboarding.showModal();
loadEngine((got, total, phase) => {
  $("progress").style.width = `${Math.min(100, (100 * got) / total).toFixed(1)}%`;
  $("progressText").textContent = phase === "starting" ? "Starting the engine…" : `${(got / 1e6).toFixed(1)} of ${(total / 1e6).toFixed(1)} MB`;
}).then(loaded => {
  engine = loaded.engine;
  $("loading").hidden = true;
  startDrill();
}).catch(err => {
  $("progressText").textContent = `The engine didn't load: ${err.message}`;
});
