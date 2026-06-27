import { test } from "node:test";
import assert from "node:assert";
import { collectStyles } from "../src/plugin/inventario/recolectar.ts";
import type { NodeLike } from "../src/plugin/modelo/tipos.ts";

test("fill style en node no-TEXT → Background color", () => {
  const root: NodeLike = { id: "r", name: "Card", type: "FRAME", fillStyleName: "Surface", children: [] };
  assert.deepEqual(collectStyles(root), [
    { table: "color", name: "Surface", appliedAs: "Background color", layer: "Card" },
  ]);
});

test("fill style en TEXT → Text color; text style → Text style", () => {
  const root: NodeLike = {
    id: "r", name: "Root", type: "FRAME",
    children: [{ id: "t", name: "Label", type: "TEXT", fillStyleName: "OnSurface", textStyleName: "Body" }],
  };
  const entries = collectStyles(root);
  assert.deepEqual(entries, [
    { table: "color", name: "OnSurface", appliedAs: "Text color", layer: "Label" },
    { table: "text", name: "Body", appliedAs: "Text style", layer: "Label" },
  ]);
});

test("stroke style → Border color", () => {
  const root: NodeLike = { id: "r", name: "Box", type: "FRAME", strokeStyleName: "Outline", children: [] };
  assert.deepEqual(collectStyles(root), [
    { table: "color", name: "Outline", appliedAs: "Border color", layer: "Box" },
  ]);
});

test("color style con fill sólido → incluye swatchHex", () => {
  const root: NodeLike = {
    id: "r", name: "Card", type: "FRAME", fillStyleName: "Surface",
    fills: [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }], children: [],
  };
  assert.deepEqual(collectStyles(root), [
    { table: "color", name: "Surface", appliedAs: "Background color", layer: "Card", swatchHex: "#000000" },
  ]);
});

test("recorre descendientes, también dentro de instancias", () => {
  const root: NodeLike = {
    id: "r", name: "Root", type: "FRAME", fillStyleName: "A",
    children: [
      { id: "f", name: "Inner", type: "FRAME", fillStyleName: "B",
        children: [{ id: "x", name: "Deep", type: "TEXT", fillStyleName: "C" }] },
      { id: "i", name: "Btn", type: "INSTANCE", fillStyleName: "D",
        children: [{ id: "h", name: "Hidden", type: "TEXT", fillStyleName: "E" }] },
    ],
  };
  const names = collectStyles(root).map((e) => e.name);
  // A (raíz), B (Inner), C (Deep), D (instancia) y E (dentro de la instancia)
  assert.deepEqual(names, ["A", "B", "C", "D", "E"]);
});

test("fill con variable → entry variable con swatchHex (prioridad sobre style)", () => {
  const root: NodeLike = {
    id: "r", name: "Card", type: "FRAME",
    fillVariableName: "Color/Action", fillStyleName: "Surface",
    fills: [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }],
    children: [],
  };
  assert.deepEqual(collectStyles(root), [
    { table: "variable", name: "Color/Action", appliedAs: "Background color", layer: "Card", swatchHex: "#000000" },
  ]);
});

test("stroke con variable → entry variable / Border color", () => {
  const root: NodeLike = {
    id: "r", name: "Box", type: "FRAME",
    strokeVariableName: "Color/Outline",
    strokes: [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }],
    children: [],
  };
  assert.deepEqual(collectStyles(root), [
    { table: "variable", name: "Color/Outline", appliedAs: "Border color", layer: "Box", swatchHex: "#FFFFFF" },
  ]);
});

test("variable sin fill sólido → sin swatchHex", () => {
  const root: NodeLike = { id: "r", name: "Card", type: "FRAME", fillVariableName: "Color/Action", children: [] };
  const entries = collectStyles(root);
  assert.equal(entries[0].table, "variable");
  assert.equal(entries[0].swatchHex, undefined);
});
