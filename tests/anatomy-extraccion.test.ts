import { test } from "node:test";
import assert from "node:assert";
import { extraerAnatomy } from "../src/plugin/extraccion/anatomy.ts";
import type { NodoLike } from "../src/plugin/modelo/tipos.ts";

test("convierte un texto en ElementoAnatomy básico", () => {
  const raiz: NodoLike = {
    id: "raiz", name: "Card", type: "FRAME",
    children: [{ id: "t", name: "Título", type: "TEXT" }],
  };
  const elementos = extraerAnatomy(raiz);
  assert.equal(elementos.length, 1);
  assert.deepEqual(elementos[0], {
    id: "t", nombre: "Título", tipo: "TEXT", esInstancia: false, atributos: [],
  });
});

test("marca instancia y resuelve dependeDe desde mainComponentName", () => {
  const raiz: NodoLike = {
    id: "raiz", name: "Card", type: "FRAME",
    children: [{ id: "b", name: "Botón", type: "INSTANCE", mainComponentName: "ESDSV Button" }],
  };
  const elementos = extraerAnatomy(raiz);
  assert.equal(elementos[0].esInstancia, true);
  assert.equal(elementos[0].dependeDe, "ESDSV Button");
});

test("incluye atributos visuales del elemento", () => {
  const raiz: NodoLike = {
    id: "raiz", name: "Card", type: "FRAME",
    children: [{
      id: "fondo", name: "Fondo", type: "RECTANGLE", width: 100,
      fills: [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }],
    }],
  };
  const elementos = extraerAnatomy(raiz);
  assert.deepEqual(elementos[0].atributos, [
    { clave: "background-color", valor: "#000000", formato: "HARDCODED", swatchHex: "#000000" },
    { clave: "width", valor: "100", formato: "HARDCODED" },
  ]);
});
