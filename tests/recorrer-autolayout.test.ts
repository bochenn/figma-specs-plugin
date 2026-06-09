import { test } from "node:test";
import assert from "node:assert";
import { recorrerAutoLayout } from "../src/plugin/traversal/recorrer-autolayout.ts";
import type { NodoLike } from "../src/plugin/modelo/tipos.ts";

test("raíz con Auto Layout se incluye", () => {
  const raiz: NodoLike = { id: "r", name: "Root", type: "FRAME", layoutMode: "VERTICAL", children: [] };
  assert.deepEqual(recorrerAutoLayout(raiz).map((n) => n.id), ["r"]);
});

test("raíz sin Auto Layout pero hijo con sí → solo el hijo", () => {
  const raiz: NodoLike = {
    id: "r", name: "Root", type: "FRAME", layoutMode: "NONE",
    children: [{ id: "h", name: "Inner", type: "FRAME", layoutMode: "HORIZONTAL", children: [] }],
  };
  assert.deepEqual(recorrerAutoLayout(raiz).map((n) => n.id), ["h"]);
});

test("frena en instancias (no entra a su contenido)", () => {
  const raiz: NodoLike = {
    id: "r", name: "Root", type: "FRAME", layoutMode: "VERTICAL",
    children: [{ id: "i", name: "Btn", type: "INSTANCE", layoutMode: "HORIZONTAL",
      children: [{ id: "x", name: "Deep", type: "FRAME", layoutMode: "VERTICAL", children: [] }] }],
  };
  assert.deepEqual(recorrerAutoLayout(raiz).map((n) => n.id), ["r"]);
});

test("frame anidado con Auto Layout se incluye además de la raíz", () => {
  const raiz: NodoLike = {
    id: "r", name: "Root", type: "FRAME", layoutMode: "VERTICAL",
    children: [{ id: "n", name: "Nested", type: "FRAME", layoutMode: "HORIZONTAL", children: [] }],
  };
  assert.deepEqual(recorrerAutoLayout(raiz).map((n) => n.id), ["r", "n"]);
});
