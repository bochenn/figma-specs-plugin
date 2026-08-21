import { test } from "node:test";
import assert from "node:assert";
import { applyRowLimit, capRows, ROW_LIMIT } from "../src/plugin/utils/carga.ts";

test("capRows: apagado no recorta nada", () => {
  applyRowLimit(false);
  const filas = new Array(ROW_LIMIT + 20).fill(0);
  assert.deepEqual(capRows(filas), { rows: filas, dropped: 0 });
});

test("capRows: prendido recorta e informa cuántas quedaron afuera", () => {
  applyRowLimit(true);
  const r = capRows(new Array(ROW_LIMIT + 20).fill(0));
  assert.equal(r.rows.length, ROW_LIMIT);
  assert.equal(r.dropped, 20);
});

test("capRows: por debajo del tope no toca nada", () => {
  applyRowLimit(true);
  assert.equal(capRows(new Array(10).fill(0)).dropped, 0);
  applyRowLimit(false);
});
