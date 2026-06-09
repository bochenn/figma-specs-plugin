import { test } from "node:test";
import assert from "node:assert";
import { alineacion, resizing } from "../src/plugin/extraccion/layout.ts";

test("alineacion traduce los valores de Figma", () => {
  assert.equal(alineacion("MIN"), "Start");
  assert.equal(alineacion("CENTER"), "Center");
  assert.equal(alineacion("MAX"), "End");
  assert.equal(alineacion("SPACE_BETWEEN"), "Space between");
  assert.equal(alineacion("BASELINE"), "Baseline");
  assert.equal(alineacion(undefined), "Start");
});

test("resizing traduce los valores de Figma", () => {
  assert.equal(resizing("FILL"), "Fill");
  assert.equal(resizing("HUG"), "Hug");
  assert.equal(resizing("FIXED"), "Fixed");
  assert.equal(resizing(undefined), "Fixed");
});
