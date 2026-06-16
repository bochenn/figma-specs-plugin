import { test } from "node:test";
import assert from "node:assert";
import { recorrerAutoLayout } from "../src/plugin/traversal/recorrer-autolayout.ts";
import type { NodoLike } from "../src/plugin/modelo/tipos.ts";

test("raíz con Auto Layout se incluye", () => {
  const raiz: NodoLike = { id: "r", name: "Root", type: "FRAME", layoutMode: "VERTICAL", children: [] };
  assert.deepEqual(recorrerAutoLayout(raiz).map((r) => r.nodo.id), ["r"]);
});

test("raíz sin Auto Layout pero hijo con sí → solo el hijo", () => {
  const raiz: NodoLike = {
    id: "r", name: "Root", type: "FRAME", layoutMode: "NONE",
    children: [{ id: "h", name: "Inner", type: "FRAME", layoutMode: "HORIZONTAL", children: [] }],
  };
  assert.deepEqual(recorrerAutoLayout(raiz).map((r) => r.nodo.id), ["h"]);
});

test("frena en instancias (no entra a su contenido)", () => {
  const raiz: NodoLike = {
    id: "r", name: "Root", type: "FRAME", layoutMode: "VERTICAL",
    children: [{ id: "i", name: "Btn", type: "INSTANCE", layoutMode: "HORIZONTAL",
      children: [{ id: "x", name: "Deep", type: "FRAME", layoutMode: "VERTICAL", children: [] }] }],
  };
  assert.deepEqual(recorrerAutoLayout(raiz).map((r) => r.nodo.id), ["r"]);
});

test("frame anidado con Auto Layout se incluye además de la raíz", () => {
  const raiz: NodoLike = {
    id: "r", name: "Root", type: "FRAME", layoutMode: "VERTICAL",
    children: [{ id: "n", name: "Nested", type: "FRAME", layoutMode: "HORIZONTAL", children: [] }],
  };
  assert.deepEqual(recorrerAutoLayout(raiz).map((r) => r.nodo.id), ["r", "n"]);
});

test("detecta layoutMode GRID como auto-layout", () => {
  const raiz: NodoLike = { id: "g", name: "Screen", type: "FRAME", layoutMode: "GRID", children: [] };
  assert.deepEqual(recorrerAutoLayout(raiz).map((r) => r.nodo.id), ["g"]);
});

test("con itemizar entra en la instancia con Auto Layout (profundidad +1)", () => {
  const raiz: NodoLike = {
    id: "r", name: "Root", type: "FRAME", layoutMode: "VERTICAL",
    children: [{ id: "i", name: "Btn", type: "INSTANCE", layoutMode: "HORIZONTAL",
      children: [{ id: "x", name: "Deep", type: "FRAME", layoutMode: "VERTICAL", children: [] }] }],
  };
  assert.deepEqual(recorrerAutoLayout(raiz, true).map((r) => [r.nodo.id, r.profundidad]), [["r", 0], ["i", 1], ["x", 1]]);
});
