import { test } from "node:test";
import assert from "node:assert";
import { serializeAnatomy } from "../src/plugin/serializacion/anatomy-json.ts";
import type { AnatomyElement } from "../src/plugin/modelo/tipos.ts";

test("text simple → name/type/attributes vacíos, sin instanceOf", () => {
  const elements: AnatomyElement[] = [
    { id: "t", name: "Título", type: "TEXT", isInstance: false, attributes: [] },
  ];
  assert.deepEqual(serializeAnatomy(elements), {
    anatomy: [{ name: "Título", type: "TEXT", attributes: [] }],
  });
});

test("instancia → incluye instanceOf", () => {
  const elements: AnatomyElement[] = [
    { id: "b", name: "Botón", type: "INSTANCE", isInstance: true, dependsOn: "ESDSV Button", attributes: [] },
  ];
  const json = serializeAnatomy(elements);
  assert.equal(json.anatomy[0].instanceOf, "ESDSV Button");
});

test("attributes → value/format/key, sin systemId/rawValue/propertyName", () => {
  const elements: AnatomyElement[] = [
    { id: "f", name: "Fondo", type: "RECTANGLE", isInstance: false,
      attributes: [{ key: "background-color", value: "#000000", format: "HARDCODED" }] },
  ];
  const json = serializeAnatomy(elements);
  assert.deepEqual(json.anatomy[0].attributes, [
    { value: "#000000", format: "HARDCODED", key: "background-color" },
  ]);
});

test("lista vacía → { anatomy: [] }", () => {
  assert.deepEqual(serializeAnatomy([]), { anatomy: [] });
});
