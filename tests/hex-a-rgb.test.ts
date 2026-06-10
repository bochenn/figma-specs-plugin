import { test } from "node:test";
import assert from "node:assert";
import { hexARgb } from "../src/plugin/utils/color.ts";

test("#FFFFFF → blanco", () => {
  assert.deepEqual(hexARgb("#FFFFFF"), { r: 1, g: 1, b: 1 });
});

test("#000000 → negro", () => {
  assert.deepEqual(hexARgb("#000000"), { r: 0, g: 0, b: 0 });
});

test("#FF0000 → rojo puro", () => {
  assert.deepEqual(hexARgb("#FF0000"), { r: 1, g: 0, b: 0 });
});
