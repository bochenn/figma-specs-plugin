import { test } from "node:test";
import assert from "node:assert";
import { extractProperties } from "../src/plugin/extraccion/properties.ts";
import type { NormSet, NodeLike } from "../src/plugin/modelo/tipos.ts";

// Construye un componente-variant con un Label de cierto color.
function variant(props: Record<string, string>, color: { r: number; g: number; b: number }): {
  variantProperties: Record<string, string>;
  root: NodeLike;
} {
  return {
    variantProperties: props,
    root: {
      id: "root", name: "Root", type: "COMPONENT",
      children: [{ id: "l", name: "Label", type: "RECTANGLE", fills: [{ type: "SOLID", color }] }],
    },
  };
}

test("una property con dos options: saltea el default y compara la otra", () => {
  const set: NormSet = {
    properties: { Tone: ["Gris", "Negro"] },
    defaultProps: { Tone: "Gris" },
    variants: [
      variant({ Tone: "Gris" }, { r: 0.5, g: 0.5, b: 0.5 }),
      variant({ Tone: "Negro" }, { r: 0, g: 0, b: 0 }),
    ],
  };
  const specs = extractProperties(set);
  assert.equal(specs.length, 1);
  assert.equal(specs[0].name, "Tone");
  assert.equal(specs[0].default, "Gris");
  assert.equal(specs[0].options.length, 1);
  assert.equal(specs[0].options[0].name, "Negro");
  assert.equal(specs[0].options[0].changes[0].elementName, "Label");
  assert.deepEqual(specs[0].options[0].changes[0].attributes, [
    { key: "background-color", defaultValue: "#808080", optionValue: "#000000", swatchHex: "#000000" },
  ]);
});

test("opción cuyo componente-variant no existe → se saltea", () => {
  const set: NormSet = {
    properties: { Tone: ["Gris", "Negro", "Rojo"] },
    defaultProps: { Tone: "Gris" },
    variants: [
      variant({ Tone: "Gris" }, { r: 0.5, g: 0.5, b: 0.5 }),
      variant({ Tone: "Negro" }, { r: 0, g: 0, b: 0 }),
      // no existe variant "Rojo"
    ],
  };
  const specs = extractProperties(set);
  assert.equal(specs[0].options.length, 1);
  assert.equal(specs[0].options[0].name, "Negro");
});
