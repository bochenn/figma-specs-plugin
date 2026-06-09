import { test } from "node:test";
import assert from "node:assert";
import { recorrer } from "../src/plugin/traversal/recorrer.ts";
import type { NodoLike } from "../src/plugin/modelo/tipos.ts";

function nodo(parcial: Partial<NodoLike> & { id: string; type: string }): NodoLike {
  return { name: parcial.id, ...parcial };
}

test("itemiza textos y shapes como hojas, en orden de árbol", () => {
  const raiz = nodo({
    id: "raiz",
    type: "FRAME",
    children: [
      nodo({ id: "titulo", type: "TEXT" }),
      nodo({ id: "fondo", type: "RECTANGLE" }),
    ],
  });
  const elementos = recorrer(raiz);
  assert.deepEqual(elementos.map((n) => n.id), ["titulo", "fondo"]);
});

test("frena en instancias: la instancia es elemento pero sus hijos NO", () => {
  const raiz = nodo({
    id: "raiz",
    type: "FRAME",
    children: [
      nodo({
        id: "boton",
        type: "INSTANCE",
        children: [nodo({ id: "label-interno", type: "TEXT" })],
      }),
    ],
  });
  const elementos = recorrer(raiz);
  assert.deepEqual(elementos.map((n) => n.id), ["boton"]);
});

test("frames: son elemento y además se recorren hacia adentro", () => {
  const raiz = nodo({
    id: "raiz",
    type: "FRAME",
    children: [
      nodo({
        id: "grupo",
        type: "FRAME",
        children: [nodo({ id: "hijo", type: "TEXT" })],
      }),
    ],
  });
  const elementos = recorrer(raiz);
  assert.deepEqual(elementos.map((n) => n.id), ["grupo", "hijo"]);
});

test("nodo sin hijos devuelve lista vacía", () => {
  const raiz = nodo({ id: "raiz", type: "FRAME", children: [] });
  assert.deepEqual(recorrer(raiz), []);
});
