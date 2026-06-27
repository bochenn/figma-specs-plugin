import { test } from "node:test";
import assert from "node:assert";
import { formatColor } from "../src/plugin/utils/color.ts";

test("formatColor de #FF0000 en cada format", () => {
  assert.equal(formatColor("#FF0000", "HEX"), "#FF0000");
  assert.equal(formatColor("#FF0000", "RGB"), "rgb(255, 0, 0)");
  assert.equal(formatColor("#FF0000", "HSL"), "hsl(0, 100%, 50%)");
});

test("formatColor de negro y blanco", () => {
  assert.equal(formatColor("#000000", "RGB"), "rgb(0, 0, 0)");
  assert.equal(formatColor("#FFFFFF", "HSL"), "hsl(0, 0%, 100%)");
});
