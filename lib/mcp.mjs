// A public MCP server (Streamable HTTP, stateless, no auth) for Learn Korean: lessons, quizzes and
// judging on the engine. It keeps nothing: the learner's progress is an object the client stores
// and sends back with each call that needs it; calls that change it return the new one.
import * as T from "./tutor.mjs";

const VERSIONS = ["2025-06-18", "2025-03-26", "2024-11-05"];
const SERVER = { name: "learn-korean", title: "Learn Korean (bada ime)", version: "1.0.0", websiteUrl: "https://learn.sjun.me" };
const INSTRUCTIONS = `Learn to type Korean with bada ime, by typing, not writing: every answer is the keys the learner presses, judged on the real keyboard engine. The learner first picks the Korean layout they aim for, and learns it from the first lesson: Korean 2-set (KTS, the standard keyboard, on every computer and phone), bada roman (Korean spelled in Latin letters) or bada (bada ime's own layout). Tell a learner considering bada or bada roman that they work best on a JIS (Japanese) keyboard and that typing them outside the lessons needs bada ime, which is macOS only for now. The same lessons are at https://learn.sjun.me.
This server keeps no state. The learner's progress is a JSON object that YOU keep (in memory, a file, or wherever your client stores things for the user) and pass as \`progress\` to the tools that take it; \`check\` returns the updated object: store it in place of the old one. Without one, a learner starts fresh.
A session: \`lessons\` (with progress) shows where the learner is; with no layout picked yet, ask the learner and call \`start\`. \`lesson\` teaches one; \`quiz\` gives words; the learner answers with keys; \`check\` judges them on the engine and returns the new progress. Quiz lesson "review" drills the learner's mistakes. \`type\` shows what any keys type.
${T.KEYS_NOTE}`;

const progressSchema = {
  type: "object",
  description: "The learner's progress, exactly as the last `check` returned it. Omit for a new learner.",
  properties: {
    v: { type: "integer" },
    target: { type: ["string", "null"], enum: ["2set", "bada-roman", "bada", null], description: "The layout the learner aims for" },
    best: { type: "object", additionalProperties: { type: "number" }, description: "Best accuracy (0–1) per lesson id" },
    attempts: { type: "object", additionalProperties: { type: "integer" } },
    mistakes: { type: "object", additionalProperties: { type: "integer" }, description: "Missed count per question id" },
  },
};

const TOOLS = [
  {
    name: "lessons", title: "Lessons and progress",
    description: "The learner's lessons (for the layout they aim for), with their best accuracy per lesson and the next lesson to take. Without a layout picked, lists the layouts to choose from.",
    inputSchema: { type: "object", properties: { progress: progressSchema } },
    annotations: { readOnlyHint: true, openWorldHint: false },
    run: async a => T.overview(T.normalize(a.progress)),
  },
  {
    name: "start", title: "Pick the layout to learn",
    description: "Sets the Korean layout the learner aims for (2set, bada-roman or bada) and returns their lessons and the updated progress: store it. Scores in other layouts are kept.",
    inputSchema: {
      type: "object",
      properties: { target: { type: "string", enum: ["2set", "bada-roman", "bada"] }, progress: progressSchema },
      required: ["target"],
    },
    annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    run: async a => T.start(a.target, a.progress),
  },
  {
    name: "lesson", title: "A lesson",
    description: "A lesson's teaching text and its drill: each word in Hangul, its standard romanization (Revised Romanization) and the keys that type it.",
    inputSchema: { type: "object", properties: { id: { type: "string", description: 'Lesson id, e.g. "R1.1", "K1.2", "B1.3"' } }, required: ["id"] },
    annotations: { readOnlyHint: true, openWorldHint: false },
    run: async a => {
      const l = T.findLesson(a.id);
      if (!l) throw new Error(`No lesson "${a.id}". Call lessons for the list.`);
      return T.lessonText(l);
    },
  },
  {
    name: "quiz", title: "Quiz",
    description: 'Words from a lesson, in random order, or the learner\'s most-missed words (lesson "review", needs progress). The learner answers each with the keys that type it; the keys aren\'t included: judge the answers with check.',
    inputSchema: {
      type: "object",
      properties: {
        lesson: { type: "string", description: 'Lesson id, or "review"' },
        count: { type: "integer", minimum: 1, maximum: 50, default: 10 },
        progress: progressSchema,
      },
      required: ["lesson"],
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
    run: async a => T.quiz(a, T.normalize(a.progress)),
  },
  {
    name: "check", title: "Check answers",
    description: "Judges the learner's answers: each answer's keys are typed on the engine of the word's layout, so any keys that type the word count. Returns each result (with the expected keys when wrong), per-lesson scores, the next lesson, and the updated progress: store it for the learner.",
    inputSchema: {
      type: "object",
      properties: {
        answers: {
          type: "array",
          items: { type: "object", properties: { id: { type: "string" }, answer: { type: "string", description: "The keys the learner typed" } }, required: ["id", "answer"] },
        },
        progress: progressSchema,
      },
      required: ["answers"],
    },
    annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    run: async a => T.check(a, a.progress),
  },
  {
    name: "type", title: "Type keys",
    description: "What keys type in bada roman (15), 2-set (10) or bada (13): the reading that shows first and the others.",
    inputSchema: {
      type: "object",
      properties: {
        keys: { type: "string", description: "Keys by JIS legend; uppercase or ⇧ before a key is Shift" },
        layout: { type: "integer", enum: [15, 10, 13], default: 15 },
      },
      required: ["keys"],
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
    run: async a => T.type(String(a.keys), [10, 13].includes(a.layout) ? a.layout : 15),
  },
];

const result = (id, r) => ({ jsonrpc: "2.0", id, result: r });
const error = (id, code, message) => ({ jsonrpc: "2.0", id, error: { code, message } });

async function one(msg) {
  if (!msg || msg.jsonrpc !== "2.0" || typeof msg.method !== "string") return error(msg?.id ?? null, -32600, "Invalid Request");
  const { id, method, params = {} } = msg;
  if (id === undefined) return null;   // a notification: nothing to say
  switch (method) {
    case "initialize": {
      const v = VERSIONS.includes(params.protocolVersion) ? params.protocolVersion : VERSIONS[0];
      return result(id, { protocolVersion: v, capabilities: { tools: { listChanged: false } }, serverInfo: SERVER, instructions: INSTRUCTIONS });
    }
    case "ping":
      return result(id, {});
    case "tools/list":
      return result(id, { tools: TOOLS.map(({ run, ...t }) => t) });
    case "tools/call": {
      const tool = TOOLS.find(t => t.name === params.name);
      if (!tool) return error(id, -32602, `Unknown tool: ${params.name}`);
      try {
        const out = await tool.run(params.arguments || {});
        return result(id, { content: [{ type: "text", text: JSON.stringify(out, null, 1) }], structuredContent: out });
      } catch (e) {
        return result(id, { content: [{ type: "text", text: e.message }], isError: true });
      }
    }
    default:
      return error(id, -32601, `Method not found: ${method}`);
  }
}

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, GET, OPTIONS",
  "access-control-allow-headers": "content-type, accept, mcp-protocol-version, mcp-session-id",
};

/** The endpoint: a Web Request in, a Response out. */
export async function handle(req) {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") {
    return new Response("Learn Korean MCP server (Streamable HTTP). POST JSON-RPC here; see https://github.com/team-mirae/learn-korean", {
      status: 405, headers: { ...CORS, allow: "POST, OPTIONS", "content-type": "text/plain; charset=utf-8" },
    });
  }
  let body;
  try { body = await req.json(); } catch { return Response.json(error(null, -32700, "Parse error"), { status: 400, headers: CORS }); }
  const replies = (await Promise.all((Array.isArray(body) ? body : [body]).map(one))).filter(Boolean);
  if (!replies.length) return new Response(null, { status: 202, headers: CORS });
  return Response.json(Array.isArray(body) ? replies : replies[0], { headers: CORS });
}
