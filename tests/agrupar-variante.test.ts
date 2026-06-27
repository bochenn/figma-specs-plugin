import { test } from "node:test";
import assert from "node:assert";
import { groupByVariant } from "../src/plugin/utils/agrupar-variante.ts";

test("agrupa por variant preservando el orden de primera aparición", () => {
  const elements = [
    { variant: "Size=M", name: "Icon", type: "INSTANCE" },
    { variant: "Size=L", name: "Badge", type: "FRAME" },
    { variant: "Size=M", name: "Label", type: "TEXT" },
  ];
  assert.deepEqual(groupByVariant(elements), [
    {
      variant: "Size=M",
      elements: [
        { variant: "Size=M", name: "Icon", type: "INSTANCE" },
        { variant: "Size=M", name: "Label", type: "TEXT" },
      ],
    },
    {
      variant: "Size=L",
      elements: [{ variant: "Size=L", name: "Badge", type: "FRAME" }],
    },
  ]);
});

test("lista vacía → []", () => {
  assert.deepEqual(groupByVariant([]), []);
});
