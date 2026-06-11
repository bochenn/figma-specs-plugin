import { test } from "node:test";
import assert from "node:assert";
import { anchoContenedor } from "../src/plugin/utils/columnas.ts";

test("3 columnas de 100 con gap 64 → 428", () => {
  assert.equal(anchoContenedor(3, 100, 64), 428);
});

test("1 columna → solo el ancho del ítem", () => {
  assert.equal(anchoContenedor(1, 100, 64), 100);
});

test("2 columnas de 50 con gap 10 → 110", () => {
  assert.equal(anchoContenedor(2, 50, 10), 110);
});
