import { test } from "node:test";
import assert from "node:assert";
import { leerAtributos } from "../src/plugin/utils/atributos.ts";
import type { NodoLike } from "../src/plugin/modelo/tipos.ts";

test("lee background color del primer fill SOLID como hex", () => {
  const nodo: NodoLike = {
    id: "x", name: "x", type: "RECTANGLE",
    fills: [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }],
  };
  const attrs = leerAtributos(nodo);
  assert.deepEqual(
    attrs.find((a) => a.clave === "background-color"),
    { clave: "background-color", valor: "#FFFFFF", formato: "HARDCODED" },
  );
});

test("incluye width cuando está presente", () => {
  const nodo: NodoLike = { id: "x", name: "x", type: "FRAME", width: 240 };
  const attrs = leerAtributos(nodo);
  assert.deepEqual(
    attrs.find((a) => a.clave === "width"),
    { clave: "width", valor: "240", formato: "HARDCODED" },
  );
});

test("incluye opacity como porcentaje cuando es menor a 1", () => {
  const nodo: NodoLike = { id: "x", name: "x", type: "FRAME", opacity: 0.8 };
  const attrs = leerAtributos(nodo);
  assert.deepEqual(
    attrs.find((a) => a.clave === "opacity"),
    { clave: "opacity", valor: "80%", formato: "HARDCODED" },
  );
});

test("opacity 1 (totalmente opaco) no se incluye", () => {
  const nodo: NodoLike = { id: "x", name: "x", type: "FRAME", opacity: 1 };
  const attrs = leerAtributos(nodo);
  assert.equal(attrs.find((a) => a.clave === "opacity"), undefined);
});
