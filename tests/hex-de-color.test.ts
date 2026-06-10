import { test } from "node:test";
import assert from "node:assert";
import { hexDeColor } from "../src/plugin/variables/modes.ts";

test("blanco → #FFFFFF", () => {
  assert.equal(hexDeColor({ r: 1, g: 1, b: 1 }), "#FFFFFF");
});

test("negro → #000000", () => {
  assert.equal(hexDeColor({ r: 0, g: 0, b: 0 }), "#000000");
});

test("gris medio → #808080", () => {
  assert.equal(hexDeColor({ r: 0.5, g: 0.5, b: 0.5 }), "#808080");
});
