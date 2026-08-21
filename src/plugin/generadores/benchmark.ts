// Micro-benchmark of the primitive operations the generators lean on, to find
// where the per-node cost actually goes. Debug-only: it creates N throwaway nodes
// per case and removes them at the end.

import { verticalFrame, horizontalFrame, text, themedFill, appendAll, loadFont, FONT_REG } from "./frames.ts";
import { themeVars } from "../utils/variables-tema.ts";
import { nodeIcon } from "./iconos.ts";

const N = 300;

// Runs one case and formats its line: total and cost per operation.
async function medir(label: string, fn: () => void | Promise<void>): Promise<string> {
  const t0 = Date.now();
  await fn();
  const ms = Date.now() - t0;
  return `  ${label}: ${ms}ms (${(ms / N).toFixed(2)}ms c/u)`;
}

export async function runBenchmark(report: (line: string) => void): Promise<void> {
  const basura: SceneNode[] = [];
  await loadFont(FONT_REG);
  report(`— benchmark · ${N} ops per case`);

  report(await medir("createRectangle", () => {
    for (let i = 0; i < N; i++) basura.push(figma.createRectangle());
  }));

  report(await medir("createFrame", () => {
    for (let i = 0; i < N; i++) basura.push(figma.createFrame());
  }));

  report(await medir("verticalFrame (createFrame + 8 props)", () => {
    for (let i = 0; i < N; i++) basura.push(verticalFrame("b", 0));
  }));

  // appendChild: into a plain frame vs into an Auto Layout frame (which reflows).
  const plano = figma.createFrame();
  plano.layoutMode = "NONE";
  basura.push(plano);
  const sueltos = Array.from({ length: N }, () => figma.createRectangle());
  report(await medir("appendChild → frame sin Auto Layout", () => {
    for (const r of sueltos) plano.appendChild(r);
  }));

  const auto = verticalFrame("bAuto", 0);
  basura.push(auto);
  const sueltos2 = Array.from({ length: N }, () => figma.createRectangle());
  report(await medir("appendChild → frame con Auto Layout", () => {
    for (const r of sueltos2) auto.appendChild(r);
  }));

  report(await medir("layoutSizingHorizontal = FILL", () => {
    for (const r of auto.children) (r as RectangleNode).layoutSizingHorizontal = "FILL";
  }));

  // themedFill calls figma.variables.setBoundVariableForPaint on every node.
  report(await medir("themedFill (setBoundVariableForPaint)", () => {
    for (let i = 0; i < N; i++) themedFill(themeVars().text);
  }));

  // A plain fill, for comparison with the bound-variable one.
  const paraFill = Array.from({ length: N }, () => figma.createRectangle());
  basura.push(...paraFill);
  report(await medir("fills = SOLID plano", () => {
    for (const r of paraFill) r.fills = [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }];
  }));

  report(await medir("createText + characters", () => {
    for (let i = 0; i < N; i++) {
      const t = figma.createText();
      t.fontName = FONT_REG;
      t.characters = "Sample";
      basura.push(t);
    }
  }));

  report(await medir("text()", async () => {
    for (let i = 0; i < N; i++) basura.push(await text("Sample", 14));
  }));

  // appendAll: N appends into a live Auto Layout frame vs one reflow at the end.
  const auto2 = verticalFrame("bAuto2", 0);
  basura.push(auto2);
  const sueltos3 = Array.from({ length: N }, () => figma.createRectangle());
  report(await medir("appendAll (Auto Layout diferido)", () => {
    appendAll(auto2, sueltos3);
  }));

  report(await medir("createNodeFromSvg", () => {
    for (let i = 0; i < N; i++) basura.push(nodeIcon("frame", 16));
  }));

  const plantilla = nodeIcon("frame", 16);
  basura.push(plantilla);
  report(await medir("clone() de un icono ya parseado", () => {
    for (let i = 0; i < N; i++) basura.push(plantilla.clone());
  }));

  const t0 = Date.now();
  for (const n of basura) if (!n.removed) n.remove();
  const filaHuerfana = horizontalFrame("b", 0);
  filaHuerfana.remove();
  report(`  cleanup: ${Date.now() - t0}ms`);
}
