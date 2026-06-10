import { test } from "node:test";
import assert from "node:assert";
import { extraerDosWay } from "../src/plugin/extraccion/properties.ts";
import type { SetNorm, NodoLike } from "../src/plugin/modelo/tipos.ts";

// Construye una variante con un Label de cierto color.
function variante(props: Record<string, string>, color: { r: number; g: number; b: number }): {
  variantProperties: Record<string, string>;
  raiz: NodoLike;
} {
  return {
    variantProperties: props,
    raiz: {
      id: "root", name: "Root", type: "COMPONENT",
      children: [{ id: "l", name: "Label", type: "RECTANGLE", fills: [{ type: "SOLID", color }] }],
    },
  };
}

function setDosProps(): SetNorm {
  return {
    propiedades: { Size: ["S", "M"], Type: ["P", "Sec"] },
    defaultProps: { Size: "S", Type: "P" },
    variantes: [
      variante({ Size: "S", Type: "P" }, { r: 0, g: 0, b: 0 }),
      variante({ Size: "S", Type: "Sec" }, { r: 0.1, g: 0.1, b: 0.1 }),
      variante({ Size: "M", Type: "P" }, { r: 0.2, g: 0.2, b: 0.2 }),
      variante({ Size: "M", Type: "Sec" }, { r: 0.3, g: 0.3, b: 0.3 }),
    ],
  };
}

test("2 props × 2 valores → 4 combinaciones con valor1/valor2", () => {
  const dosway = extraerDosWay(setDosProps());
  assert.notEqual(dosway, null);
  assert.equal(dosway!.prop1, "Size");
  assert.equal(dosway!.prop2, "Type");
  assert.deepEqual(
    dosway!.combinaciones.map((c) => `${c.valor1}+${c.valor2}`),
    ["S+P", "S+Sec", "M+P", "M+Sec"],
  );
});

test("set con una sola propiedad → null", () => {
  const set: SetNorm = {
    propiedades: { Size: ["S", "M"] },
    defaultProps: { Size: "S" },
    variantes: [variante({ Size: "S" }, { r: 0, g: 0, b: 0 })],
  };
  assert.equal(extraerDosWay(set), null);
});

test("combinación cuyo variante no existe → se saltea", () => {
  const set = setDosProps();
  set.variantes = set.variantes.filter((v) => !(v.variantProperties.Size === "M" && v.variantProperties.Type === "Sec"));
  const dosway = extraerDosWay(set);
  assert.equal(dosway!.combinaciones.length, 3);
});
