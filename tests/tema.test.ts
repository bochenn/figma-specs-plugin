import { test } from "node:test";
import assert from "node:assert";
import { aplicarTema, temaActual } from "../src/plugin/utils/tema.ts";

test("dark → fondo no null", () => {
  aplicarTema(true);
  assert.notEqual(temaActual().fondo, null);
});

test("light → fondo null y texto negro", () => {
  aplicarTema(false);
  assert.equal(temaActual().fondo, null);
  assert.deepEqual(temaActual().texto, { r: 0, g: 0, b: 0 });
});
