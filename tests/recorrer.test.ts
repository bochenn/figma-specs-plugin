import { test } from "node:test";
import assert from "node:assert";
import { traverse } from "../src/plugin/traversal/recorrer.ts";
import type { NodeLike } from "../src/plugin/modelo/tipos.ts";

function node(parcial: Partial<NodeLike> & { id: string; type: string }): NodeLike {
  return { name: parcial.id, ...parcial };
}

test("itemiza texts y shapes como hojas, en orden de árbol", () => {
  const root = node({
    id: "root",
    type: "FRAME",
    children: [
      node({ id: "title", type: "TEXT" }),
      node({ id: "bg", type: "RECTANGLE" }),
    ],
  });
  const elements = traverse(root);
  assert.deepEqual(elements.map((r) => r.node.id), ["title", "bg"]);
});

test("frena en instancias: la instancia es element pero sus children NO", () => {
  const root = node({
    id: "root",
    type: "FRAME",
    children: [
      node({
        id: "boton",
        type: "INSTANCE",
        children: [node({ id: "label-interno", type: "TEXT" })],
      }),
    ],
  });
  const elements = traverse(root);
  assert.deepEqual(elements.map((r) => r.node.id), ["boton"]);
});

test("frames: son element y además se recorren to adentro", () => {
  const root = node({
    id: "root",
    type: "FRAME",
    children: [
      node({
        id: "group",
        type: "FRAME",
        children: [node({ id: "child", type: "TEXT" })],
      }),
    ],
  });
  const elements = traverse(root);
  assert.deepEqual(elements.map((r) => r.node.id), ["group", "child"]);
});

test("node sin children devuelve lista vacía", () => {
  const root = node({ id: "root", type: "FRAME", children: [] });
  assert.deepEqual(traverse(root), []);
});

test("con itemize entra en la instancia y badge depth +1", () => {
  const root = node({
    id: "root", type: "FRAME",
    children: [
      node({ id: "boton", type: "INSTANCE", children: [node({ id: "label-interno", type: "TEXT" })] }),
    ],
  });
  const r = traverse(root, true);
  assert.deepEqual(r.map((x) => [x.node.id, x.depth]), [["boton", 0], ["label-interno", 1]]);
});

test("frame normal mantiene la depth del contexto", () => {
  const root = node({
    id: "root", type: "FRAME",
    children: [node({ id: "group", type: "FRAME", children: [node({ id: "child", type: "TEXT" })] })],
  });
  assert.deepEqual(traverse(root, true).map((x) => [x.node.id, x.depth]), [["group", 0], ["child", 0]]);
});

test("itemize es recursivo (instancia dentro de instancia)", () => {
  const root = node({
    id: "root", type: "FRAME",
    children: [node({ id: "a", type: "INSTANCE", children: [
      node({ id: "b", type: "INSTANCE", children: [node({ id: "c", type: "TEXT" })] }),
    ] })],
  });
  assert.deepEqual(traverse(root, true).map((x) => [x.node.id, x.depth]), [["a", 0], ["b", 1], ["c", 2]]);
});

test("traverse: maxLevel 1 → solo children directos", () => {
  const root: NodeLike = { id: "r", name: "R", type: "FRAME", children: [
    { id: "a", name: "A", type: "FRAME", children: [{ id: "a1", name: "A1", type: "FRAME", children: [] }] },
    { id: "b", name: "B", type: "TEXT" },
  ] };
  assert.deepEqual(traverse(root, false, 0, 0, 1).map((x) => x.node.id), ["a", "b"]);
});
test("traverse: maxLevel 0 → vacío", () => {
  const root: NodeLike = { id: "r", name: "R", type: "FRAME", children: [{ id: "a", name: "A", type: "FRAME" }] };
  assert.deepEqual(traverse(root, false, 0, 0, 0), []);
});

test("deepTexts: una instancia muestra sus TEXT internos (no sus shapes)", () => {
  const root: NodeLike = { id: "r", name: "R", type: "FRAME", children: [
    { id: "boton", name: "boton", type: "INSTANCE", children: [
      { id: "icon", name: "icon", type: "VECTOR" },
      { id: "label", name: "label", type: "TEXT" },
    ] },
  ] };
  const r = traverse(root, false, 0, 0, Infinity, true);
  assert.deepEqual(r.map((x) => [x.node.id, x.depth]), [["boton", 0], ["label", 1]]);
});

test("deepTexts: el TEXT anidado aparece aunque supere maxLevel", () => {
  const root: NodeLike = { id: "r", name: "R", type: "FRAME", children: [
    { id: "a", name: "A", type: "FRAME", children: [
      { id: "wrapper", name: "wrapper", type: "FRAME", children: [{ id: "txt", name: "txt", type: "TEXT" }] },
    ] },
  ] };
  const r = traverse(root, false, 0, 0, 1, true);
  assert.deepEqual(r.map((x) => x.node.id), ["a", "txt"]);
});

test("deepTexts false: no rescata text interno de instancias (compat)", () => {
  const root: NodeLike = { id: "r", name: "R", type: "FRAME", children: [
    { id: "boton", name: "boton", type: "INSTANCE", children: [{ id: "label", name: "label", type: "TEXT" }] },
  ] };
  assert.deepEqual(traverse(root, false, 0, 0, Infinity, false).map((x) => x.node.id), ["boton"]);
});
