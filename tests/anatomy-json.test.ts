import { test } from "node:test";
import assert from "node:assert";
import { serializarAnatomy } from "../src/plugin/serializacion/anatomy-json.ts";
import type { ElementoAnatomy } from "../src/plugin/modelo/tipos.ts";

test("texto simple → name/type/attributes vacíos, sin instanceOf", () => {
  const elementos: ElementoAnatomy[] = [
    { id: "t", nombre: "Título", tipo: "TEXT", esInstancia: false, atributos: [] },
  ];
  assert.deepEqual(serializarAnatomy(elementos), {
    anatomy: [{ name: "Título", type: "TEXT", attributes: [] }],
  });
});

test("instancia → incluye instanceOf", () => {
  const elementos: ElementoAnatomy[] = [
    { id: "b", nombre: "Botón", tipo: "INSTANCE", esInstancia: true, dependeDe: "ESDSV Button", atributos: [] },
  ];
  const json = serializarAnatomy(elementos);
  assert.equal(json.anatomy[0].instanceOf, "ESDSV Button");
});

test("atributos → value/format/key, sin systemId/rawValue/propertyName", () => {
  const elementos: ElementoAnatomy[] = [
    { id: "f", nombre: "Fondo", tipo: "RECTANGLE", esInstancia: false,
      atributos: [{ clave: "background-color", valor: "#000000", formato: "HARDCODED" }] },
  ];
  const json = serializarAnatomy(elementos);
  assert.deepEqual(json.anatomy[0].attributes, [
    { value: "#000000", format: "HARDCODED", key: "background-color" },
  ]);
});

test("lista vacía → { anatomy: [] }", () => {
  assert.deepEqual(serializarAnatomy([]), { anatomy: [] });
});
