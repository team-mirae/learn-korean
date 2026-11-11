// The lessons as a tutor, for the MCP server (lib/mcp.mjs) and its test: lessons as text, quizzes,
// judging answers on the engine, and the learner's progress. Learning is by typing: every answer is
// keys, typed on the engine of the layout the learner aims for (their track). Stateless: progress is
// a plain object the client keeps and sends back; the calls that change it return a new one.
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";
import { Engine, DATA_FILES } from "../public/engine.js";
import { LESSONS, TRACKS, lessonItems, trackOf, migrateId } from "../public/learn-content.js";
import { tokens, showKeys } from "../public/keys.js";

export const PASS = 0.9;
const ENGINE = fileURLToPath(new URL("../public/engine/", import.meta.url));
let engine = null;

/** The engine in public/engine (the one the site serves), loaded once per process. */
export function getEngine() {
  if (engine) return engine;
  return (engine = (async () => {
    const manifest = JSON.parse(readFileSync(ENGINE + "manifest.json", "utf8"));
    const e = await Engine.load(readFileSync(ENGINE + manifest.wasm.path));
    DATA_FILES.forEach((f, i) => manifest.data[f] && e.put(i, gunzipSync(readFileSync(ENGINE + manifest.data[f].path))));
    e.init();
    e.manifest = manifest;
    return e;
  })());
}

const LAYOUT_NAMES = { 15: "bada roman", 10: "2-set (KTS)", 13: "bada" };
export const KEYS_NOTE = "Keys: one character per key, by its JIS legend (letters, digits, - ^ ¥ @ [ ; : ] , . / \\). " +
  "⇧ before a key is Shift + that key; in bada roman and 2-set an uppercase letter is too (2-set ㄲ is R), in bada letters are " +
  "case-blind (ㄶ is ⇧K). Spaces are ignored.";

/** HTML of a lesson body as plain text with `code` kept, tables as rows. */
export function text(html) {
  return String(html)
    .replace(/<\/(p|li|tr|h\d)>/gi, "\n").replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/t[dh]>/gi, " | ").replace(/<code>/gi, "`").replace(/<\/code>/gi, "`")
    .replace(/<\/?b>/gi, "**").replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .split("\n").map(l => l.replace(/\s+/g, " ").replace(/\s*\|\s*$/, "").trim()).filter(Boolean).join("\n");
}

export function emptyProgress() {
  return { v: 1, target: null, best: {}, attempts: {}, mistakes: {} };
}

/** A progress object from the client, made safe to use: unknown or broken parts dropped. */
export function normalize(p) {
  const out = emptyProgress();
  if (!p || typeof p !== "object") return out;
  const ids = new Set(LESSONS.map(l => l.id));
  if (TRACKS.some(t => t.id === p.target)) out.target = p.target;
  for (let [k, v] of Object.entries(p.best || {})) { k = migrateId(k); if (ids.has(k) && typeof v === "number" && v >= 0 && v <= 1) out.best[k] = v; }
  for (let [k, v] of Object.entries(p.attempts || {})) { k = migrateId(k); if (ids.has(k) && Number.isInteger(v) && v >= 0) out.attempts[k] = v; }
  for (const [k, v] of Object.entries(p.mistakes || {})) if (findItem(k) && Number.isInteger(v) && v > 0) out.mistakes[k] = v;
  return out;
}

export function findLesson(id) {
  return LESSONS.find(l => l.id === String(id)) || null;
}

/** An item by its id, `<lesson>:<index>`. */
export function findItem(id) {
  const [lid, n] = String(id).split(":");
  const lesson = findLesson(lid);
  const item = lesson && lessonItems(lesson)[Number(n)];
  return item ? { lesson, item, index: Number(n) } : null;
}

/** The first lesson of the learner's track not yet passed, in order. */
export function nextLesson(progress) {
  if (!progress.target) return null;
  return LESSONS.find(l => l.level.track === progress.target && !((progress.best[l.id] ?? 0) >= PASS)) || null;
}

export const tracks = () => TRACKS.map(t => ({ id: t.id, name: t.name, layout: t.layout, about: t.blurb,
  keyboards: t.boards.map(b => ({ ansi: "US (ANSI)", iso: "ISO", jis: "JIS" })[b]) }));

/** The learner's track: its levels and lessons with their scores, and the next lesson. */
export function overview(progress) {
  if (!progress.target) return { pickFirst: "The learner hasn't picked a layout to aim for: ask them, then call start.", tracks: tracks() };
  const track = trackOf(progress.target);
  const next = nextLesson(progress);
  return {
    track: { id: track.id, name: track.name, layout: track.layout },
    levels: track.levels.map(level => ({
      level: level.n, title: level.title,
      lessons: level.lessons.map(l => ({
        id: l.id, title: l.title, items: lessonItems(l).length,
        best: progress.best[l.id] ?? null, passed: (progress.best[l.id] ?? 0) >= PASS,
      })),
    })),
    next: next ? { id: next.id, title: next.title } : null,
    passMark: PASS,
    otherTracks: tracks().filter(t => t.id !== track.id).map(t => t.id),
  };
}

/** Sets the layout the learner aims for (scores in other tracks are kept). */
export function start(target, progress) {
  if (!TRACKS.some(t => t.id === target)) throw new Error(`No layout "${target}". Pick one of: ${TRACKS.map(t => t.id).join(", ")}.`);
  const next = normalize(progress);
  next.target = target;
  return { ...overview(next), progress: next };
}

export function lessonText(lesson) {
  const layout = lesson.level.layout;
  const items = lessonItems(lesson).map((it, i) => ({ id: `${lesson.id}:${i}`, hangul: it.ko, romanization: it.rr, keys: showKeys(it.keys, layout) }));
  return {
    id: lesson.id, title: lesson.title, track: lesson.level.track,
    level: { n: lesson.level.n, title: lesson.level.title, layout: `${layout} (${LAYOUT_NAMES[layout]})` },
    levelIntro: lesson.level.lessons[0].id === lesson.id ? text(lesson.level.intro) : undefined,
    text: lesson.anthem ? "The national anthem of Korea, 애국가 (Aegukga): verse 1 and the refrain." : text(lesson.body),
    drill: items,
  };
}

/**
 * A quiz: `count` words of a lesson in random order, or the learner's most-missed words (lesson
 * "review"). Shown the Hangul (and the romanization as a hint), the learner answers with the keys.
 */
export function quiz({ lesson: lid, count = 10 }, progress) {
  let pool;
  if (lid === "review") {
    pool = Object.entries(progress.mistakes).sort((a, b) => b[1] - a[1]).map(([id]) => ({ id, ...findItem(id) }))
      .filter(q => !progress.target || q.lesson.level.track === progress.target);
    if (!pool.length) throw new Error("Nothing to review yet: no mistakes recorded in this progress.");
  } else {
    const lesson = findLesson(lid);
    if (!lesson) throw new Error(`No lesson "${lid}". Call lessons for the list, or use "review".`);
    pool = lessonItems(lesson).map((item, index) => ({ id: `${lesson.id}:${index}`, lesson, item, index }));
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  }
  const n = Math.max(1, Math.min(Number(count) || 10, 50));
  return {
    instructions: "Have the learner type each word: their answer is the keys they press, not the Hangul. " + KEYS_NOTE,
    questions: pool.slice(0, n).map(({ id, lesson, item }) => ({ id, hangul: item.ko, romanization: item.rr, layout: LAYOUT_NAMES[lesson.level.layout] })),
  };
}

/** Types `keys` on `layout` (15, 10 or 13) and returns what shows: the first reading and the others. */
export async function type(keys, layout) {
  // bada's keys are written by their legends, D H K: Shift is only ever ⇧ there
  let k = String(keys).replace(/\s+/g, "");
  if (layout === 13) k = k.toLowerCase();
  const presses = tokens(k);
  const e = await getEngine();
  e.applySettings({ enabled: [layout] });
  e.setMode("henkan");
  e.flush();
  let out = null;
  for (const { code, shift } of presses) out = e.key(code, { shift });
  e.flush();
  return { shown: out?.preedit ?? "", readings: out?.menu ?? [] };
}

/** Judges answers to a quiz on the engine; returns the results and the progress updated. */
export async function check({ answers = [] }, progress) {
  const next = normalize(progress);
  const results = [];
  const byLesson = new Map();
  for (const a of answers) {
    const found = findItem(a.id);
    if (!found) { results.push({ id: a.id, error: "No such question" }); continue; }
    const { lesson, item } = found;
    const answer = String(a.answer ?? "").trim();
    let ok = false, got = "", note;
    try {
      const typed = await type(answer, lesson.level.layout);
      got = typed.shown;
      ok = got === item.ko || (!!lesson.menu?.includes(item.ko) && typed.readings.includes(item.ko));
    } catch (e) {
      note = `${e.message}. ${KEYS_NOTE}`;
    }
    const r = { id: a.id, ok, word: item.ko, answer, typed: got };
    if (!ok) { r.keys = showKeys(item.keys, lesson.level.layout); r.romanization = item.rr; }
    if (note) r.note = note;
    results.push(r);
    if (ok) { if (next.mistakes[a.id] && --next.mistakes[a.id] <= 0) delete next.mistakes[a.id]; }
    else next.mistakes[a.id] = (next.mistakes[a.id] || 0) + 1;
    const s = byLesson.get(lesson.id) || { ok: 0, n: 0 };
    s.n++; if (ok) s.ok++;
    byLesson.set(lesson.id, s);
  }
  const lessons = {};
  for (const [id, s] of byLesson) {
    const acc = s.ok / s.n;
    next.attempts[id] = (next.attempts[id] || 0) + 1;
    // A lesson's best counts only when the quiz covered all of it or at least 10 of its items
    const size = lessonItems(findLesson(id)).length;
    if ((s.n >= Math.min(10, size)) && acc > (next.best[id] ?? -1)) next.best[id] = acc;
    lessons[id] = { right: s.ok, of: s.n, accuracy: acc, best: next.best[id] ?? null, passed: (next.best[id] ?? 0) >= PASS };
  }
  const n = nextLesson(next);
  return { results, lessons, next: n ? { id: n.id, title: n.title } : null, progress: next };
}
