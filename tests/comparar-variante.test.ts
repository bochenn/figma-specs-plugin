import { test } from "node:test";
import assert from "node:assert";
import { compareVariant } from "../src/plugin/comparacion/variantes.ts";
import type { NodeLike } from "../src/plugin/modelo/tipos.ts";

test("un attribute distinto produce un element modified", () => {
  const def: NodeLike = {
    id: "r", name: "Root", type: "FRAME",
    children: [{ id: "l", name: "Label", type: "RECTANGLE", fills: [{ type: "SOLID", color: { r: 0.5, g: 0.5, b: 0.5 } }] }],
  };
  const opc: NodeLike = {
    id: "r", name: "Root", type: "FRAME",
    children: [{ id: "l", name: "Label", type: "RECTANGLE", fills: [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }] }],
  };
  const changes = compareVariant(def, opc);
  assert.equal(changes.length, 1);
  assert.equal(changes[0].elementName, "Label");
  assert.equal(changes[0].state, "modified");
  assert.deepEqual(changes[0].attributes, [
    { key: "background-color", defaultValue: "#808080", optionValue: "#000000", swatchHex: "#000000" },
  ]);
});

test("variants idénticas → sin changes", () => {
  const arbol: NodeLike = { id: "r", name: "Root", type: "FRAME", children: [{ id: "l", name: "Label", type: "TEXT" }] };
  assert.deepEqual(compareVariant(arbol, arbol), []);
});

test("change en el attribute de la raíz misma → raíz modificada", () => {
  const def: NodeLike = {
    id: "r", name: "Button", type: "COMPONENT",
    fills: [{ type: "SOLID", color: { r: 0.26, g: 0.5, b: 0.9 } }],
  };
  const opc: NodeLike = {
    id: "r", name: "Button", type: "COMPONENT",
    fills: [{ type: "SOLID", color: { r: 0.4, g: 0.4, b: 0.5 } }],
  };
  const changes = compareVariant(def, opc);
  assert.equal(changes.length, 1);
  assert.equal(changes[0].elementName, "Button");
  assert.equal(changes[0].state, "modified");
  assert.equal(changes[0].attributes[0].key, "background-color");
});

test("element solo en la option → added", () => {
  const def: NodeLike = { id: "r", name: "Root", type: "FRAME", children: [] };
  const opc: NodeLike = { id: "r", name: "Root", type: "FRAME", children: [{ id: "n", name: "Badge", type: "TEXT" }] };
  const changes = compareVariant(def, opc);
  assert.equal(changes.length, 1);
  assert.equal(changes[0].state, "added");
  assert.equal(changes[0].elementName, "Badge");
});
