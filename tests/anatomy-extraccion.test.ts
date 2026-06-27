import { test } from "node:test";
import assert from "node:assert";
import { extractAnatomy } from "../src/plugin/extraccion/anatomy.ts";
import type { NodeLike } from "../src/plugin/modelo/tipos.ts";

test("convierte un text en AnatomyElement básico", () => {
  const root: NodeLike = {
    id: "root", name: "Card", type: "FRAME",
    children: [{ id: "t", name: "Título", type: "TEXT" }],
  };
  const elements = extractAnatomy(root);
  assert.equal(elements.length, 1);
  assert.deepEqual(elements[0], {
    id: "t", name: "Título", type: "TEXT", isInstance: false, attributes: [],
  });
});

test("badge instancia y resuelve dependsOn from mainComponentName", () => {
  const root: NodeLike = {
    id: "root", name: "Card", type: "FRAME",
    children: [{ id: "b", name: "Botón", type: "INSTANCE", mainComponentName: "ESDSV Button" }],
  };
  const elements = extractAnatomy(root);
  assert.equal(elements[0].isInstance, true);
  assert.equal(elements[0].dependsOn, "ESDSV Button");
});

test("extractAnatomy con itemize incluye capas internas con depth", () => {
  const root: NodeLike = {
    id: "r", name: "card", type: "FRAME",
    children: [{ id: "t", name: "tag", type: "INSTANCE", children: [{ id: "l", name: "Label", type: "TEXT" }] }],
  };
  const els = extractAnatomy(root, true);
  assert.deepEqual(els.map((e) => [e.name, e.depth ?? 0]), [["tag", 0], ["Label", 1]]);
});

test("incluye attributes visuales del element", () => {
  const root: NodeLike = {
    id: "root", name: "Card", type: "FRAME",
    children: [{
      id: "bg", name: "Fondo", type: "RECTANGLE", width: 100,
      fills: [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }],
    }],
  };
  const elements = extractAnatomy(root);
  assert.deepEqual(elements[0].attributes, [
    { key: "background-color", value: "#000000", format: "HARDCODED", swatchHex: "#000000" },
    { key: "width", value: "100px", format: "HARDCODED" },
  ]);
});

const arbol: NodeLike = { id: "r", name: "screen", type: "FRAME", children: [
  { id: "c", name: "card", type: "INSTANCE", mainComponentName: "Type=A, Orientation=V", children: [
    { id: "t", name: "title", type: "TEXT" },
  ] },
] };

test("extractAnatomy: includeRoot + maxLevel self → solo la raíz", () => {
  const els = extractAnatomy(arbol, false, { maxLevel: 0, includeRoot: true });
  assert.deepEqual(els.map((e) => e.id), ["r"]);
});
test("extractAnatomy: includeRoot + children → raíz + children directos", () => {
  const els = extractAnatomy(arbol, false, { maxLevel: 1, includeRoot: true });
  assert.deepEqual(els.map((e) => e.id), ["r", "c"]);
});
test("extractAnatomy: sin opts → solo descendientes, sin entrar a instancias (compat Data)", () => {
  const els = extractAnatomy(arbol);
  assert.deepEqual(els.map((e) => e.id), ["c"]); // no entra a la instancia card sin itemize
});
test("extractAnatomy: deepTexts surfacea el text interno de una instancia", () => {
  const els = extractAnatomy(arbol, false, { maxLevel: 1, includeRoot: true, deepTexts: true });
  assert.deepEqual(els.map((e) => e.id), ["r", "c", "t"]); // el title interno de la card aparece
});
