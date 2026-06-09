import { test } from "node:test";
import assert from "node:assert";
import { compararVariante } from "../src/plugin/comparacion/variantes.ts";
import type { NodoLike } from "../src/plugin/modelo/tipos.ts";

test("un atributo distinto produce un elemento modificado", () => {
  const def: NodoLike = {
    id: "r", name: "Root", type: "FRAME",
    children: [{ id: "l", name: "Label", type: "RECTANGLE", fills: [{ type: "SOLID", color: { r: 0.5, g: 0.5, b: 0.5 } }] }],
  };
  const opc: NodoLike = {
    id: "r", name: "Root", type: "FRAME",
    children: [{ id: "l", name: "Label", type: "RECTANGLE", fills: [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }] }],
  };
  const cambios = compararVariante(def, opc);
  assert.equal(cambios.length, 1);
  assert.equal(cambios[0].elementoNombre, "Label");
  assert.equal(cambios[0].estado, "modificado");
  assert.deepEqual(cambios[0].atributos, [
    { clave: "background-color", valorDefault: "#808080", valorOpcion: "#000000" },
  ]);
});

test("variantes idénticas → sin cambios", () => {
  const arbol: NodoLike = { id: "r", name: "Root", type: "FRAME", children: [{ id: "l", name: "Label", type: "TEXT" }] };
  assert.deepEqual(compararVariante(arbol, arbol), []);
});

test("cambio en el atributo de la raíz misma → raíz modificada", () => {
  const def: NodoLike = {
    id: "r", name: "Button", type: "COMPONENT",
    fills: [{ type: "SOLID", color: { r: 0.26, g: 0.5, b: 0.9 } }],
  };
  const opc: NodoLike = {
    id: "r", name: "Button", type: "COMPONENT",
    fills: [{ type: "SOLID", color: { r: 0.4, g: 0.4, b: 0.5 } }],
  };
  const cambios = compararVariante(def, opc);
  assert.equal(cambios.length, 1);
  assert.equal(cambios[0].elementoNombre, "Button");
  assert.equal(cambios[0].estado, "modificado");
  assert.equal(cambios[0].atributos[0].clave, "background-color");
});

test("elemento solo en la opcion → agregado", () => {
  const def: NodoLike = { id: "r", name: "Root", type: "FRAME", children: [] };
  const opc: NodoLike = { id: "r", name: "Root", type: "FRAME", children: [{ id: "n", name: "Badge", type: "TEXT" }] };
  const cambios = compararVariante(def, opc);
  assert.equal(cambios.length, 1);
  assert.equal(cambios[0].estado, "agregado");
  assert.equal(cambios[0].elementoNombre, "Badge");
});
