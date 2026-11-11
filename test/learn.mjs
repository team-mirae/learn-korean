// Types every Learn Korean drill (public/learn-content.js) through the engine in public/engine (the
// one the site serves): each item's keys,
// then Space, must commit its word, as the top reading or (for the words a lesson lists in `menu`)
// from the menu.
//   npm test   (after npm run sync, when the engine moved on)
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { Engine, DATA_FILES } from "../public/engine.js";
import { LESSONS, TRACKS, lessonItems, twoSet, bada, ANTHEM } from "../public/learn-content.js";
import { tokens } from "../public/keys.js";

const dir = fileURLToPath(new URL("../public/engine/", import.meta.url));
const manifest = JSON.parse(readFileSync(dir + "manifest.json", "utf8"));
const engine = await Engine.load(readFileSync(dir + manifest.wasm.path));
DATA_FILES.forEach((f, i) => manifest.data[f] && engine.put(i, gunzipSync(readFileSync(dir + manifest.data[f].path))));
engine.init();

assert.equal(twoSet("한국"), "gksrnr");
assert.equal(twoSet("닭"), "ekfr");
assert.equal(ANTHEM.lines.length, 4);
// bada's keys as its layout page writes them (docs/layouts/13-bada.md in bada-ime)
assert.equal(bada("한"), "vhk");
assert.equal(bada("안녕"), "fhkeuj");
assert.equal(bada("것이"), "dnrfm");
assert.equal(bada("감사합니다"), "dhgrhvhbemah");
assert.deepEqual(TRACKS.map(t => t.levels.length > 0), [true, true, true]);

let checked = 0;
const failures = [];
for (const lesson of LESSONS) {
  engine.applySettings({ enabled: [lesson.level.layout] });
  engine.setMode("henkan");
  for (const item of lessonItems(lesson)) {
    engine.flush();
    let last = null;
    for (const { code, shift } of tokens(item.keys)) last = engine.key(code, { shift });
    const top = last?.preedit ?? "";
    const ok = top === item.ko || (lesson.menu?.includes(item.ko) && last.menu.includes(item.ko));
    if (!ok) failures.push(`${lesson.id} ${item.keys} → ${top} (want ${item.ko}; menu ${last?.menu.join(" ")})`);
    engine.flush();
    checked++;
  }
}
assert.deepEqual(failures, [], failures.join("\n"));
console.log(`learn: ${checked} drill items type as written`);
