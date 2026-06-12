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
