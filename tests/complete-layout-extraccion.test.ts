import { test } from "node:test";
import assert from "node:assert";
import { extractCompleteLayout } from "../src/plugin/extraccion/properties.ts";
import type { NormSet, NodeLike } from "../src/plugin/modelo/tipos.ts";

function varLayout(props: Record<string, string>, layoutMode: "NONE" | "HORIZONTAL" | "VERTICAL", padding: number): {
  variantProperties: Record<string, string>;
  root: NodeLike;
} {
  return {
    variantProperties: props,
    root: {
      id: "r", name: "Root", type: "COMPONENT", layoutMode,
      paddingLeft: padding, paddingTop: padding, paddingRight: padding, paddingBottom: padding,
      children: [],
    },
  };
}

test("variant con padding distinto en la raíz → adicional; misma config / sin auto layout → no", () => {
  const set: NormSet = {
    properties: { Tone: ["A", "B", "C", "D"] },
    defaultProps: { Tone: "A" },
    variants: [
      varLayout({ Tone: "A" }, "VERTICAL", 8),
      varLayout({ Tone: "B" }, "VERTICAL", 16),  // padding distinto → adicional
      varLayout({ Tone: "C" }, "VERTICAL", 8),   // igual → no
      varLayout({ Tone: "D" }, "NONE", 8),       // sin auto layout → no
    ],
  };
  const adicionales = extractCompleteLayout(set);
  assert.equal(adicionales.length, 1);
  assert.equal(adicionales[0].variant, "Tone=B");
  assert.equal(adicionales[0].spec.padding.left, 16);
});

test("todas las variants con la misma config que el default → []", () => {
  const set: NormSet = {
    properties: { Tone: ["A", "B"] },
    defaultProps: { Tone: "A" },
    variants: [varLayout({ Tone: "A" }, "VERTICAL", 8), varLayout({ Tone: "B" }, "VERTICAL", 8)],
  };
  assert.deepEqual(extractCompleteLayout(set), []);
});
