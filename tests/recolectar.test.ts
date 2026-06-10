import { test } from "node:test";
import assert from "node:assert";
import { recolectarEstilos } from "../src/plugin/inventario/recolectar.ts";
import type { NodoLike } from "../src/plugin/modelo/tipos.ts";

test("fill style en nodo no-TEXT → Background color", () => {
  const raiz: NodoLike = { id: "r", name: "Card", type: "FRAME", fillStyleName: "Surface", children: [] };
  assert.deepEqual(recolectarEstilos(raiz), [
    { tabla: "color", nombre: "Surface", appliedAs: "Background color", capa: "Card" },
  ]);
});

test("fill style en TEXT → Text color; text style → Text style", () => {
  const raiz: NodoLike = {
    id: "r", name: "Root", type: "FRAME",
    children: [{ id: "t", name: "Label", type: "TEXT", fillStyleName: "OnSurface", textStyleName: "Body" }],
  };
  const entradas = recolectarEstilos(raiz);
  assert.deepEqual(entradas, [
    { tabla: "color", nombre: "OnSurface", appliedAs: "Text color", capa: "Label" },
    { tabla: "text", nombre: "Body", appliedAs: "Text style", capa: "Label" },
  ]);
});

test("stroke style → Border color", () => {
  const raiz: NodoLike = { id: "r", name: "Box", type: "FRAME", strokeStyleName: "Outline", children: [] };
  assert.deepEqual(recolectarEstilos(raiz), [
    { tabla: "color", nombre: "Outline", appliedAs: "Border color", capa: "Box" },
  ]);
});

test("recorre descendientes y frena en instancias", () => {
  const raiz: NodoLike = {
    id: "r", name: "Root", type: "FRAME", fillStyleName: "A",
    children: [
      { id: "f", name: "Inner", type: "FRAME", fillStyleName: "B",
        children: [{ id: "x", name: "Deep", type: "TEXT", fillStyleName: "C" }] },
      { id: "i", name: "Btn", type: "INSTANCE", fillStyleName: "D",
        children: [{ id: "h", name: "Hidden", type: "TEXT", fillStyleName: "E" }] },
    ],
  };
  const nombres = recolectarEstilos(raiz).map((e) => e.nombre);
  // A (raíz), B (Inner), C (Deep), D (instancia sí); E NO (dentro de instancia)
  assert.deepEqual(nombres, ["A", "B", "C", "D"]);
});
