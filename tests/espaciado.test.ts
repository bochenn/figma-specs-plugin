import { test } from "node:test";
import assert from "node:assert";
import { formatearEspaciado, etiquetaSpacing } from "../src/plugin/utils/espaciado.ts";

test("formatearEspaciado en px y rem", () => {
  assert.equal(formatearEspaciado(8, "px"), "8");
  assert.equal(formatearEspaciado(8, "rem"), "0.5rem");
  assert.equal(formatearEspaciado(16, "rem"), "1rem");
  assert.equal(formatearEspaciado(24, "rem"), "1.5rem");
});

test("etiquetaSpacing: sin variable es solo el valor", () => {
  assert.equal(etiquetaSpacing(8, "px"), "8");
  assert.equal(etiquetaSpacing(16, "rem"), "1rem");
});

test("etiquetaSpacing: con variable es nombre + valor", () => {
  assert.equal(etiquetaSpacing(8, "px", "DS Space/item-spacing/0_5x"), "DS Space/item-spacing/0_5x (8)");
  assert.equal(etiquetaSpacing(16, "rem", "DS Space/padding/1x"), "DS Space/padding/1x (1rem)");
});
