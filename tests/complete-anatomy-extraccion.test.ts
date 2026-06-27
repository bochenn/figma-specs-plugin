import { test } from "node:test";
import assert from "node:assert";
import { extractCompleteAnatomy } from "../src/plugin/extraccion/properties.ts";
import type { NormSet, NodeLike } from "../src/plugin/modelo/tipos.ts";

function variant(props: Record<string, string>, children: { id: string; name: string; type: string }[]): {
  variantProperties: Record<string, string>;
  root: NodeLike;
} {
  return {
    variantProperties: props,
    root: { id: "r", name: "Root", type: "COMPONENT", children: children.map((h) => ({ ...h })) },
  };
}

test("una variant con una layer extra → ese element es adicional", () => {
  const set: NormSet = {
    properties: { Tone: ["A", "B"] },
    defaultProps: { Tone: "A" },
    variants: [
      variant({ Tone: "A" }, [{ id: "l", name: "Label", type: "TEXT" }]),
      variant({ Tone: "B" }, [{ id: "l", name: "Label", type: "TEXT" }, { id: "i", name: "Icon", type: "INSTANCE" }]),
    ],
  };
  assert.deepEqual(extractCompleteAnatomy(set), [
    { variant: "Tone=B", name: "Icon", type: "INSTANCE" },
  ]);
});

test("todas las variants iguales al default → []", () => {
  const set: NormSet = {
    properties: { Tone: ["A", "B"] },
    defaultProps: { Tone: "A" },
    variants: [
      variant({ Tone: "A" }, [{ id: "l", name: "Label", type: "TEXT" }]),
      variant({ Tone: "B" }, [{ id: "l", name: "Label", type: "TEXT" }]),
    ],
  };
  assert.deepEqual(extractCompleteAnatomy(set), []);
});
