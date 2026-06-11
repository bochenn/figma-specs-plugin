import { test } from "node:test";
import assert from "node:assert";
import { extraerCompleteLayout } from "../src/plugin/extraccion/properties.ts";
import type { SetNorm, NodoLike } from "../src/plugin/modelo/tipos.ts";

function varLayout(props: Record<string, string>, layoutMode: "NONE" | "HORIZONTAL" | "VERTICAL", padding: number): {
  variantProperties: Record<string, string>;
  raiz: NodoLike;
} {
  return {
    variantProperties: props,
    raiz: {
      id: "r", name: "Root", type: "COMPONENT", layoutMode,
      paddingLeft: padding, paddingTop: padding, paddingRight: padding, paddingBottom: padding,
      children: [],
    },
  };
}

test("variante con padding distinto en la raíz → adicional; misma config / sin auto layout → no", () => {
  const set: SetNorm = {
    propiedades: { Tone: ["A", "B", "C", "D"] },
    defaultProps: { Tone: "A" },
    variantes: [
      varLayout({ Tone: "A" }, "VERTICAL", 8),
      varLayout({ Tone: "B" }, "VERTICAL", 16),  // padding distinto → adicional
      varLayout({ Tone: "C" }, "VERTICAL", 8),   // igual → no
      varLayout({ Tone: "D" }, "NONE", 8),       // sin auto layout → no
    ],
  };
  const adicionales = extraerCompleteLayout(set);
  assert.equal(adicionales.length, 1);
  assert.equal(adicionales[0].variante, "Tone=B");
  assert.equal(adicionales[0].spec.padding.left, 16);
});

test("todas las variantes con la misma config que el default → []", () => {
  const set: SetNorm = {
    propiedades: { Tone: ["A", "B"] },
    defaultProps: { Tone: "A" },
    variantes: [varLayout({ Tone: "A" }, "VERTICAL", 8), varLayout({ Tone: "B" }, "VERTICAL", 8)],
  };
  assert.deepEqual(extraerCompleteLayout(set), []);
});
