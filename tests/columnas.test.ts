import { test } from "node:test";
import assert from "node:assert";
import { containerWidth, clampColumns } from "../src/plugin/utils/columnas.ts";

test("3 columns de 100 con gap 64 → 428", () => {
  assert.equal(containerWidth(3, 100, 64), 428);
});

test("1 columna → solo el width del ítem", () => {
  assert.equal(containerWidth(1, 100, 64), 100);
});

test("2 columns de 50 con gap 10 → 110", () => {
  assert.equal(containerWidth(2, 50, 10), 110);
});

test("clampColumns: undefined → 1, fuera de rango se recorta", () => {
  assert.equal(clampColumns(undefined), 1);
  assert.equal(clampColumns(0), 1);
  assert.equal(clampColumns(5), 4);
});

test("clampColumns: value válido pasa igual", () => {
  assert.equal(clampColumns(3), 3);
});
