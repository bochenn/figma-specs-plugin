import { test } from "node:test";
import assert from "node:assert";
import { hexToRgb } from "../src/plugin/utils/color.ts";

test("#FFFFFF → blanco", () => {
  assert.deepEqual(hexToRgb("#FFFFFF"), { r: 1, g: 1, b: 1 });
});

test("#000000 → negro", () => {
  assert.deepEqual(hexToRgb("#000000"), { r: 0, g: 0, b: 0 });
});

test("#FF0000 → red puro", () => {
  assert.deepEqual(hexToRgb("#FF0000"), { r: 1, g: 0, b: 0 });
});
