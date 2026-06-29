import * as esbuild from "esbuild";
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from "node:fs";

const watch = process.argv.includes("--watch");
const test = process.argv.includes("--test");

// Construye dist/ui.html: compila ui.ts y lo embebe inline en el HTML.
async function buildUI() {
  const out = await esbuild.build({
    entryPoints: ["src/ui/ui.ts"],
    bundle: true,
    write: false,
    format: "iife",
    loader: { ".svg": "text" },
  });
  const js = out.outputFiles[0].text;
  let html = readFileSync("src/ui/index.html", "utf8");
  html = html.replace('<script src="ui.js"></script>', `<script>${js}</script>`);
  mkdirSync("dist", { recursive: true });
  writeFileSync("dist/ui.html", html);
}

// Construye dist/code.js (código del plugin).
async function buildPlugin() {
  await esbuild.build({
    entryPoints: ["src/plugin/main.ts"],
    bundle: true,
    outfile: "dist/code.js",
    target: "es2017",
    format: "iife",
    loader: { ".svg": "text" },
  });
}

// Compila los tests a dist-test/ para node --test.
// Lee dinámicamente los .test.ts que existan (en TDD aparecen de a uno).
// bundle:true → cada test arrastra sus imports y queda como un .js autónomo
// (node:test y node:assert quedan externos por ser builtins de Node).
async function buildTests() {
  const archivos = existsSync("tests")
    ? readdirSync("tests").filter((f) => f.endsWith(".test.ts")).map((f) => `tests/${f}`)
    : [];
  if (archivos.length === 0) {
    console.log("no hay tests todavía");
    return;
  }
  await esbuild.build({
    entryPoints: archivos,
    bundle: true,
    outdir: "dist-test",
    platform: "node",
    format: "cjs",
  });
}

if (test) {
  await buildTests();
} else if (watch) {
  const ctxPlugin = await esbuild.context({
    entryPoints: ["src/plugin/main.ts"],
    bundle: true,
    outfile: "dist/code.js",
    target: "es2017",
    format: "iife",
    loader: { ".svg": "text" },
  });
  await ctxPlugin.watch();
  await buildUI();
  console.log("watch activo (recargá el plugin en Figma tras cada cambio)");
} else {
  await buildPlugin();
  await buildUI();
  console.log("build OK → dist/code.js + dist/ui.html");
}
