import { test } from "node:test";
import assert from "node:assert";
import { traverseAutoLayout } from "../src/plugin/traversal/recorrer-autolayout.ts";
import type { NodeLike } from "../src/plugin/modelo/tipos.ts";

test("raíz con Auto Layout se incluye", () => {
  const root: NodeLike = { id: "r", name: "Root", type: "FRAME", layoutMode: "VERTICAL", children: [] };
  assert.deepEqual(traverseAutoLayout(root).map((r) => r.node.id), ["r"]);
});

test("raíz sin Auto Layout pero child con sí → solo el child", () => {
  const root: NodeLike = {
    id: "r", name: "Root", type: "FRAME", layoutMode: "NONE",
    children: [{ id: "h", name: "Inner", type: "FRAME", layoutMode: "HORIZONTAL", children: [] }],
  };
  assert.deepEqual(traverseAutoLayout(root).map((r) => r.node.id), ["h"]);
});

test("frena en instancias (no entra a su content)", () => {
  const root: NodeLike = {
    id: "r", name: "Root", type: "FRAME", layoutMode: "VERTICAL",
    children: [{ id: "i", name: "Btn", type: "INSTANCE", layoutMode: "HORIZONTAL",
      children: [{ id: "x", name: "Deep", type: "FRAME", layoutMode: "VERTICAL", children: [] }] }],
  };
  assert.deepEqual(traverseAutoLayout(root).map((r) => r.node.id), ["r"]);
});

test("frame anidado con Auto Layout se incluye además de la raíz", () => {
  const root: NodeLike = {
    id: "r", name: "Root", type: "FRAME", layoutMode: "VERTICAL",
    children: [{ id: "n", name: "Nested", type: "FRAME", layoutMode: "HORIZONTAL", children: [] }],
  };
  assert.deepEqual(traverseAutoLayout(root).map((r) => r.node.id), ["r", "n"]);
});

test("detecta layoutMode GRID como auto-layout", () => {
  const root: NodeLike = { id: "g", name: "Screen", type: "FRAME", layoutMode: "GRID", children: [] };
  assert.deepEqual(traverseAutoLayout(root).map((r) => r.node.id), ["g"]);
});

test("con itemize entra en la instancia con Auto Layout (depth +1)", () => {
  const root: NodeLike = {
    id: "r", name: "Root", type: "FRAME", layoutMode: "VERTICAL",
    children: [{ id: "i", name: "Btn", type: "INSTANCE", layoutMode: "HORIZONTAL",
      children: [{ id: "x", name: "Deep", type: "FRAME", layoutMode: "VERTICAL", children: [] }] }],
  };
  assert.deepEqual(traverseAutoLayout(root, true).map((r) => [r.node.id, r.depth]), [["r", 0], ["i", 1], ["x", 1]]);
});

test("path: raíz sola trae su name", () => {
  const root: NodeLike = { id: "r", name: "Root", type: "FRAME", layoutMode: "VERTICAL", children: [] };
  assert.deepEqual(traverseAutoLayout(root)[0].path, [{ name: "Root", type: "FRAME" }]);
});

test("path: child anidado incluye el ancestro aunque no tenga Auto Layout", () => {
  const root: NodeLike = {
    id: "r", name: "Root", type: "FRAME", layoutMode: "NONE",
    children: [{ id: "h", name: "Inner", type: "FRAME", layoutMode: "HORIZONTAL", children: [] }],
  };
  assert.deepEqual(traverseAutoLayout(root)[0].path, [{ name: "Root", type: "FRAME" }, { name: "Inner", type: "FRAME" }]);
});

test("path: con itemize acumula la instancia y su content", () => {
  const root: NodeLike = {
    id: "r", name: "screen", type: "FRAME", layoutMode: "VERTICAL",
    children: [{ id: "i", name: "card", type: "INSTANCE", layoutMode: "HORIZONTAL",
      children: [{ id: "x", name: "tag", type: "FRAME", layoutMode: "VERTICAL", children: [] }] }],
  };
  assert.deepEqual(traverseAutoLayout(root, true).map((r) => r.path), [
    [{ name: "screen", type: "FRAME" }],
    [{ name: "screen", type: "FRAME" }, { name: "card", type: "INSTANCE" }],
    [{ name: "screen", type: "FRAME" }, { name: "card", type: "INSTANCE" }, { name: "tag", type: "FRAME" }],
  ]);
});
