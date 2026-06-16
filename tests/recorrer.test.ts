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
  assert.deepEqual(elementos.map((r) => r.nodo.id), ["titulo", "fondo"]);
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
  assert.deepEqual(elementos.map((r) => r.nodo.id), ["boton"]);
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
  assert.deepEqual(elementos.map((r) => r.nodo.id), ["grupo", "hijo"]);
});

test("nodo sin hijos devuelve lista vacía", () => {
  const raiz = nodo({ id: "raiz", type: "FRAME", children: [] });
  assert.deepEqual(recorrer(raiz), []);
});

test("con itemizar entra en la instancia y marca profundidad +1", () => {
  const raiz = nodo({
    id: "raiz", type: "FRAME",
    children: [
      nodo({ id: "boton", type: "INSTANCE", children: [nodo({ id: "label-interno", type: "TEXT" })] }),
    ],
  });
  const r = recorrer(raiz, true);
  assert.deepEqual(r.map((x) => [x.nodo.id, x.profundidad]), [["boton", 0], ["label-interno", 1]]);
});

test("frame normal mantiene la profundidad del contexto", () => {
  const raiz = nodo({
    id: "raiz", type: "FRAME",
    children: [nodo({ id: "grupo", type: "FRAME", children: [nodo({ id: "hijo", type: "TEXT" })] })],
  });
  assert.deepEqual(recorrer(raiz, true).map((x) => [x.nodo.id, x.profundidad]), [["grupo", 0], ["hijo", 0]]);
});

test("itemizar es recursivo (instancia dentro de instancia)", () => {
  const raiz = nodo({
    id: "raiz", type: "FRAME",
    children: [nodo({ id: "a", type: "INSTANCE", children: [
      nodo({ id: "b", type: "INSTANCE", children: [nodo({ id: "c", type: "TEXT" })] }),
    ] })],
  });
  assert.deepEqual(recorrer(raiz, true).map((x) => [x.nodo.id, x.profundidad]), [["a", 0], ["b", 1], ["c", 2]]);
});
