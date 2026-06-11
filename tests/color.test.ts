import { test } from "node:test";
import assert from "node:assert";
import { formatearColor } from "../src/plugin/utils/color.ts";

test("formatearColor de #FF0000 en cada formato", () => {
  assert.equal(formatearColor("#FF0000", "HEX"), "#FF0000");
  assert.equal(formatearColor("#FF0000", "RGB"), "rgb(255, 0, 0)");
  assert.equal(formatearColor("#FF0000", "HSL"), "hsl(0, 100%, 50%)");
});

test("formatearColor de negro y blanco", () => {
  assert.equal(formatearColor("#000000", "RGB"), "rgb(0, 0, 0)");
  assert.equal(formatearColor("#FFFFFF", "HSL"), "hsl(0, 0%, 100%)");
});
