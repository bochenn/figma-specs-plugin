import { test } from "node:test";
import assert from "node:assert";
import { filaAnatomy, HEADERS_ANATOMY } from "../src/plugin/utils/tabla-anatomy.ts";
import type { ElementoAnatomy } from "../src/plugin/modelo/tipos.ts";

test("HEADERS_ANATOMY incluye la columna Attributes", () => {
  assert.deepEqual(HEADERS_ANATOMY, ["#", "Name", "Type", "Attributes"]);
});

test("filaAnatomy sin atributos → celda de atributos vacía", () => {
  const el: ElementoAnatomy = { id: "1", nombre: "Label", tipo: "TEXT", esInstancia: false, atributos: [] };
  assert.deepEqual(filaAnatomy(1, el), ["1", "Label", "TEXT", ""]);
});

test("filaAnatomy aplana los atributos como clave: valor", () => {
  const el: ElementoAnatomy = {
    id: "2",
    nombre: "Box",
    tipo: "FRAME",
    esInstancia: false,
    atributos: [
      { clave: "width", valor: "120", formato: "HARDCODED" },
      { clave: "opacity", valor: "50%", formato: "HARDCODED" },
    ],
  };
  assert.deepEqual(filaAnatomy(1, el), ["1", "Box", "FRAME", "width: 120, opacity: 50%"]);
});

test("filaAnatomy incluye el valor resuelto (rawValue) de variables/styles", () => {
  const el: ElementoAnatomy = {
    id: "3",
    nombre: "Card",
    tipo: "INSTANCE",
    esInstancia: true,
    atributos: [
      { clave: "background-color", valor: "color/surface", formato: "VARIABLE", rawValue: "#FFFFFF" },
      { clave: "width", valor: "sizing/card-width", formato: "VARIABLE", rawValue: "240" },
    ],
  };
  assert.deepEqual(filaAnatomy(1, el), [
    "1", "Card", "INSTANCE",
    "background-color: color/surface (#FFFFFF), width: sizing/card-width (240)",
  ]);
});
