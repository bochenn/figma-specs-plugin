import { test } from "node:test";
import assert from "node:assert";
import { hexOfColor } from "../src/plugin/variables/modes.ts";

test("blanco → #FFFFFF", () => {
  assert.equal(hexOfColor({ r: 1, g: 1, b: 1 }), "#FFFFFF");
});

test("negro → #000000", () => {
  assert.equal(hexOfColor({ r: 0, g: 0, b: 0 }), "#000000");
});

test("gray medio → #808080", () => {
  assert.equal(hexOfColor({ r: 0.5, g: 0.5, b: 0.5 }), "#808080");
});
