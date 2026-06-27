import { test } from "node:test";
import assert from "node:assert";
import { layoutKey } from "../src/plugin/extraccion/layout.ts";
import type { LayoutSpec } from "../src/plugin/modelo/tipos.ts";

function spec(padding: number): LayoutSpec {
  return {
    elementName: "Root", type: "FRAME", direction: "VERTICAL",
    primaryAlignment: "Start", counterAlignment: "Start",
    resizingHorizontal: "Fixed", resizingVertical: "Hug",
    padding: { left: padding, top: padding, right: padding, bottom: padding },
    itemSpacing: 8,
  };
}

test("misma config → misma key", () => {
  assert.equal(layoutKey(spec(8)), layoutKey(spec(8)));
});

test("padding distinto → claves distintas", () => {
  assert.notEqual(layoutKey(spec(8)), layoutKey(spec(16)));
});
