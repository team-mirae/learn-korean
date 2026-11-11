// The MCP server (lib/mcp.mjs) end to end, as a client calls it: initialize, list the tools, pick a
// layout, quiz, answer with keys (right and wrong), review. Stateless: progress goes round the client.
//   node test/mcp.mjs
import assert from "node:assert/strict";
import { handle } from "../lib/mcp.mjs";

let n = 0;
async function rpc(method, params) {
  const res = await handle(new Request("http://x/mcp", { method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: ++n, method, params }) }));
  const body = await res.json();
  assert.ok(!body.error, JSON.stringify(body.error));
  return body.result;
}
const call = async (name, args) => {
  const r = await rpc("tools/call", { name, arguments: args });
  assert.ok(!r.isError, r.content?.[0]?.text);
  return r.structuredContent;
};

const init = await rpc("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "test", version: "0" } });
assert.equal(init.protocolVersion, "2025-06-18");
const { tools } = await rpc("tools/list");
assert.deepEqual(tools.map(t => t.name).sort(), ["check", "lesson", "lessons", "quiz", "start", "type"]);

// No layout yet: asked to pick
assert.ok((await call("lessons", {})).pickFirst);
let { progress, next } = await call("start", { target: "bada" });
assert.equal(progress.target, "bada");
assert.equal(next.id, "B1.1");

// A quiz has no keys in it; answers are keys, judged on the engine
const q = await call("quiz", { lesson: "B1.1", count: 15, progress });
assert.equal(q.questions.length, 15);
assert.ok(q.questions.every(x => !("keys" in x)));
const lesson = await call("lesson", { id: "B1.1" });
const keysOf = Object.fromEntries(lesson.drill.map(d => [d.id, d.keys]));
const answers = q.questions.map((x, i) => ({ id: x.id, answer: i === 0 ? "zzz" : keysOf[x.id] }));
const r = await call("check", { answers, progress });
assert.equal(r.results.filter(x => x.ok).length, 14);
assert.ok(r.results[0].keys, "a wrong answer shows the keys");
assert.equal(r.lessons["B1.1"].right, 14);
progress = r.progress;
assert.equal(progress.best["B1.1"], 14 / 15);
assert.equal(progress.mistakes[q.questions[0].id], 1);

// Review drills the mistake; typing it right clears it
const rev = await call("quiz", { lesson: "review", progress });
assert.deepEqual(rev.questions.map(x => x.id), [q.questions[0].id]);
const fixed = await call("check", { answers: [{ id: q.questions[0].id, answer: keysOf[q.questions[0].id] }], progress });
assert.equal(fixed.progress.mistakes[q.questions[0].id], undefined);

// Any keys that type the word count: 2-set uppercase is Shift; bada ⇧
assert.equal((await call("type", { keys: "gksrnr", layout: 10 })).shown, "한국");
assert.equal((await call("type", { keys: "F H ⇧K V H", layout: 13 })).shown, "않하");
assert.equal((await call("type", { keys: "hanguk" })).shown, "한국");

// A bad answer is judged wrong, with a note, not an error
const bad = await call("check", { answers: [{ id: "R1.1:0", answer: "가" }] });
assert.equal(bad.results[0].ok, false);
assert.ok(bad.results[0].note);

// Notifications get 202; GET is not the transport
assert.equal((await handle(new Request("http://x/mcp", { method: "POST", body: JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) }))).status, 202);
assert.equal((await handle(new Request("http://x/mcp"))).status, 405);
console.log("mcp: ok");
