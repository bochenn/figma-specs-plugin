import { test } from "node:test";
import assert from "node:assert";
import { anchoContenedor, clampColumnas } from "../src/plugin/utils/columnas.ts";

test("3 columnas de 100 con gap 64 → 428", () => {
  assert.equal(anchoContenedor(3, 100, 64), 428);
});

test("1 columna → solo el ancho del ítem", () => {
  assert.equal(anchoContenedor(1, 100, 64), 100);
});

test("2 columnas de 50 con gap 10 → 110", () => {
  assert.equal(anchoContenedor(2, 50, 10), 110);
});

test("clampColumnas: undefined → 1, fuera de rango se recorta", () => {
  assert.equal(clampColumnas(undefined), 1);
  assert.equal(clampColumnas(0), 1);
  assert.equal(clampColumnas(5), 4);
});

test("clampColumnas: valor válido pasa igual", () => {
  assert.equal(clampColumnas(3), 3);
});
