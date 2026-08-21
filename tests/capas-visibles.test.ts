import { test } from "node:test";
import assert from "node:assert";
import { traverse, traverseTree } from "../src/plugin/traversal/recorrer.ts";
import { traverseAutoLayout } from "../src/plugin/traversal/recorrer-autolayout.ts";
import { readAttributes } from "../src/plugin/utils/atributos.ts";
import type { NodeLike } from "../src/plugin/modelo/tipos.ts";

function node(parcial: Partial<NodeLike> & { id: string; type: string }): NodeLike {
  return { name: parcial.id, ...parcial };
}

test("traverseTree: las capas con visibility off quedan fuera (con su subárbol)", () => {
  const root = node({
    id: "card", type: "FRAME",
    children: [
      node({ id: "title", type: "TEXT" }),
      node({ id: "oculto", type: "FRAME", visible: false, children: [node({ id: "icon", type: "VECTOR" })] }),
    ],
  });
  assert.deepEqual(traverseTree(root).map((x) => x.node.id), ["card", "title"]);
});

test("traverse: adentro de una instancia itemizada también se saltean las ocultas", () => {
  const root = node({ id: "root", type: "FRAME", children: [
    node({ id: "boton", type: "INSTANCE", children: [
      node({ id: "label", type: "TEXT" }),
      node({ id: "badge", type: "TEXT", visible: false }),
    ] }),
  ] });
  assert.deepEqual(traverse(root, true).map((x) => x.node.id), ["boton", "label"]);
});

test("traverseAutoLayout: un frame Auto Layout oculto no se documenta", () => {
  const root = node({ id: "root", type: "FRAME", layoutMode: "VERTICAL", children: [
    node({ id: "fila", type: "FRAME", layoutMode: "HORIZONTAL", visible: false }),
  ] });
  assert.deepEqual(traverseAutoLayout(root).map((x) => x.node.id), ["root"]);
});

test("readAttributes: expone los variable modes aplicados con el icono swatch", () => {
  const attrs = readAttributes(node({
    id: "card", type: "FRAME",
    variableModes: [{ collection: "Theme", mode: "Dark" }],
  }));
  assert.deepEqual(attrs[0], { key: "Theme", value: "Dark", format: "HARDCODED", icon: "swatch" });
});
