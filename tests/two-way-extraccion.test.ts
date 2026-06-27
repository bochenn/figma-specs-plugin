import { test } from "node:test";
import assert from "node:assert";
import { extractTwoWay } from "../src/plugin/extraccion/properties.ts";
import type { NormSet, NodeLike } from "../src/plugin/modelo/tipos.ts";

// Construye una variant con un Label de cierto color.
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

function setDosProps(): NormSet {
  return {
    properties: { Size: ["S", "M"], Type: ["P", "Sec"] },
    defaultProps: { Size: "S", Type: "P" },
    variants: [
      variant({ Size: "S", Type: "P" }, { r: 0, g: 0, b: 0 }),
      variant({ Size: "S", Type: "Sec" }, { r: 0.1, g: 0.1, b: 0.1 }),
      variant({ Size: "M", Type: "P" }, { r: 0.2, g: 0.2, b: 0.2 }),
      variant({ Size: "M", Type: "Sec" }, { r: 0.3, g: 0.3, b: 0.3 }),
    ],
  };
}

test("2 props × 2 values → 4 combinations con value1/value2", () => {
  const dosway = extractTwoWay(setDosProps());
  assert.notEqual(dosway, null);
  assert.equal(dosway!.prop1, "Size");
  assert.equal(dosway!.prop2, "Type");
  assert.deepEqual(
    dosway!.combinations.map((c) => `${c.value1}+${c.value2}`),
    ["S+P", "S+Sec", "M+P", "M+Sec"],
  );
});

test("set con una sola property → null", () => {
  const set: NormSet = {
    properties: { Size: ["S", "M"] },
    defaultProps: { Size: "S" },
    variants: [variant({ Size: "S" }, { r: 0, g: 0, b: 0 })],
  };
  assert.equal(extractTwoWay(set), null);
});

test("combinación cuyo variant no existe → se saltea", () => {
  const set = setDosProps();
  set.variants = set.variants.filter((v) => !(v.variantProperties.Size === "M" && v.variantProperties.Type === "Sec"));
  const dosway = extractTwoWay(set);
  assert.equal(dosway!.combinations.length, 3);
});
