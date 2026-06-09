import { test } from "node:test";
import assert from "node:assert";
import { posicionMarcador, OFFSET_MARCADOR, TAM_MARCADOR } from "../src/plugin/utils/marcadores.ts";

test("ubica el marcador a la izquierda del artwork, centrado verticalmente con el elemento", () => {
  // elemento de alto 20 que empieza en y=40 → su centro vertical es 50
  const caja = { x: 30, y: 40, width: 100, height: 20 };
  const pos = posicionMarcador(caja);
  // x: pegado al borde izquierdo, empujado hacia afuera por OFFSET + tamaño del marcador
  assert.equal(pos.x, -(OFFSET_MARCADOR + TAM_MARCADOR));
  // y: centro del elemento (50) menos medio marcador
  assert.equal(pos.y, 50 - TAM_MARCADOR / 2);
});

test("dos elementos a distinta altura dan distinta y, misma x", () => {
  const a = posicionMarcador({ x: 0, y: 0, width: 10, height: 10 });
  const b = posicionMarcador({ x: 0, y: 100, width: 10, height: 10 });
  assert.equal(a.x, b.x);
  assert.notEqual(a.y, b.y);
});
