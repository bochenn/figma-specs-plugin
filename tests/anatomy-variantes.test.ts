import { test } from "node:test";
import assert from "node:assert";
import { parseVariants } from "../src/plugin/utils/anatomy-variantes.ts";

test("parseVariants: 'k=v, k=v' → pares", () => {
  assert.deepEqual(parseVariants("Type=Card 03, Orientation=Vertical, Breakpoint=Mobile"), [
    { key: "Type", value: "Card 03" },
    { key: "Orientation", value: "Vertical" },
    { key: "Breakpoint", value: "Mobile" },
  ]);
});
test("parseVariants: sin '=' → vacío (no es variant)", () => {
  assert.deepEqual(parseVariants("Blog post card"), []);
});
test("parseVariants: undefined → vacío", () => {
  assert.deepEqual(parseVariants(undefined), []);
});
