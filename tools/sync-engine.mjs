// Copies bada ime's engine into public/engine: the engine compiled to WebAssembly (bada-ime's
// web/wasm) and the data files the lessons need, gzipped and named by content hash, with
// manifest.json saying which they are. The result is committed: Vercel serves public/ as it is
// (no Rust there), so run this, then `npm test`, then commit, whenever the engine should move on.
//
//   node tools/sync-engine.mjs                 bada ime at ../bada-ime
//   node tools/sync-engine.mjs /path/to/bada-ime
//
// Needs Rust with the wasm32-unknown-unknown target.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFileSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { DATA_FILES } from "../public/engine.js";

const here = fileURLToPath(new URL("..", import.meta.url));
const bada = resolve(process.argv[2] || here + "../bada-ime") + "/";
const out = here + "public/engine/";
// The lessons type layouts 15 (bada roman) and 10 (2-set) only: hanja, kanji, emoji and Unicode
// names are left out (about 7 MB). The engine takes an empty slot as no data.
const NEEDED = new Set(["ko-words.tsv", "en-words.txt", "oecd.tsv", "ja-words.txt", "ko-jamo-4gram.bin", "symbols.tsv", "en-ko.tsv"]);
const hash = bytes => createHash("sha256").update(bytes).digest("hex").slice(0, 12);

execFileSync("cargo", ["build", "--release", "--target", "wasm32-unknown-unknown", "--manifest-path", bada + "web/wasm/Cargo.toml"], { stdio: "inherit" });

rmSync(out, { recursive: true, force: true });
mkdirSync(out + "data", { recursive: true });
mkdirSync(out + "licenses", { recursive: true });

const wasm = readFileSync(bada + "web/wasm/target/wasm32-unknown-unknown/release/bada_web.wasm");
const version = readFileSync(bada + "engine/Cargo.toml", "utf8").match(/^version = "(.+)"/m)[1];
const commit = execFileSync("git", ["-C", bada, "rev-parse", "--short", "HEAD"], { encoding: "utf8" }).trim();
const manifest = { version, commit, wasm: { path: `bada.${hash(wasm)}.wasm`, size: wasm.length }, data: {} };
writeFileSync(out + manifest.wasm.path, wasm);

// en-ko.tsv: layout 15's English dictionary, put together as bada-ime's web/build.mjs does
// (sensitive words left out): the common words, then the brand names after a `#! brands` line.
function enKo() {
  const dir = bada + "engine/data/en-ko/";
  const nl = t => (t.endsWith("\n") ? t : t + "\n");
  const brands = readdirSync(dir + "brands").filter(f => f.endsWith(".tsv")).sort().map(f => nl(readFileSync(dir + "brands/" + f, "utf8")));
  return Buffer.from([nl(readFileSync(dir + "common.tsv", "utf8")), "#! brands\n", ...brands].join(""));
}
for (const f of DATA_FILES.filter(f => NEEDED.has(f))) {
  const gz = gzipSync(f === "en-ko.tsv" ? enKo() : readFileSync(bada + "engine/data/" + f), { level: 9 });
  const path = `data/${f}.${hash(gz)}.gz`;
  writeFileSync(out + path, gz);
  manifest.data[f] = { path, size: gz.length };
}
for (const f of readdirSync(bada + "engine/data").filter(f => f.startsWith("LICENSE"))) copyFileSync(bada + "engine/data/" + f, out + "licenses/" + f);
copyFileSync(bada + "LICENSE", out + "licenses/LICENSE.txt");
writeFileSync(out + "manifest.json", JSON.stringify(manifest, null, 1) + "\n");
const total = manifest.wasm.size + Object.values(manifest.data).reduce((n, d) => n + d.size, 0);
console.log(`public/engine: bada ime ${version} (${commit}), ${(total / 1e6).toFixed(1)} MB to download`);
