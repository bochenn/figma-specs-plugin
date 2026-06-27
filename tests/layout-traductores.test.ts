import { test } from "node:test";
import assert from "node:assert";
import { alignment, resizing } from "../src/plugin/extraccion/layout.ts";

test("alignment traduce los values de Figma", () => {
  assert.equal(alignment("MIN"), "Start");
  assert.equal(alignment("CENTER"), "Center");
  assert.equal(alignment("MAX"), "End");
  assert.equal(alignment("SPACE_BETWEEN"), "Space between");
  assert.equal(alignment("BASELINE"), "Baseline");
  assert.equal(alignment(undefined), "Start");
});

test("resizing traduce los values de Figma", () => {
  assert.equal(resizing("FILL"), "Fill");
  assert.equal(resizing("HUG"), "Hug");
  assert.equal(resizing("FIXED"), "Fixed");
  assert.equal(resizing(undefined), "Fixed");
});
