import { cp, mkdir, rm, readdir, copyFile, stat } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "dist");
const nm = path.join(root, "node_modules");

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

// 1. ship the site itself
await cp(path.join(root, "public"), dist, { recursive: true });

// 2. vendor the proxy engine + transport out of node_modules
const jobs = [
  ["@mercuryworkshop/scramjet", "scram"],
  ["@mercuryworkshop/bare-mux", "baremux"],
  ["@mercuryworkshop/epoxy-transport", "epoxy"],
];

for (const [pkg, out] of jobs) {
  const pkgDir = path.join(nm, pkg);
  const candidates = [path.join(pkgDir, "dist"), pkgDir];
  let src = null;
  for (const c of candidates) {
    try {
      if ((await stat(c)).isDirectory()) {
        src = c;
        const entries = await readdir(c);
        if (entries.length) break;
      }
    } catch {}
  }
  if (!src) throw new Error(`Missing package: ${pkg} (did npm install run?)`);

  const dest = path.join(dist, out);
  await mkdir(dest, { recursive: true });
  await cp(src, dest, { recursive: true });
}

// 3. normalise filenames the engine expects
const scram = path.join(dist, "scram");
const scramFiles = await readdir(scram);

if (!scramFiles.includes("scramjet.wasm.wasm")) {
  const wasm = scramFiles.find((f) => /\.wasm(\.wasm)?$/i.test(f));
  if (!wasm) throw new Error("scramjet.wasm.wasm not found in scramjet dist");
  await copyFile(path.join(scram, wasm), path.join(scram, "scramjet.wasm.wasm"));
}

const epoxy = path.join(dist, "epoxy");
const epoxyFiles = await readdir(epoxy);
if (!epoxyFiles.includes("index.mjs")) {
  const mjs = epoxyFiles.find((f) => f.endsWith(".mjs"));
  if (!mjs) throw new Error("epoxy index.mjs not found in epoxy-transport dist");
  await copyFile(path.join(epoxy, mjs), path.join(epoxy, "index.mjs"));
}

for (const required of ["scramjet.all.js", "scramjet.sync.js"]) {
  if (!scramFiles.includes(required)) throw new Error(`Missing ${required} in scramjet dist`);
}
if (!(await readdir(path.join(dist, "baremux"))).includes("worker.js")) {
  throw new Error("baremux worker.js not found");
}

console.log("build ok:", (await readdir(dist)).join(", "));