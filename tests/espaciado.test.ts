import { test } from "node:test";
import assert from "node:assert";
import { formatearEspaciado, etiquetaSpacing, textoPadding } from "../src/plugin/utils/espaciado.ts";

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

test("textoPadding: 4 lados iguales → un solo valor", () => {
  assert.equal(textoPadding({ left: 16, top: 16, right: 16, bottom: 16 }, "px"), "16");
});

test("textoPadding: 4 lados iguales con variable → nombre (valor) una vez", () => {
  const sv = { paddingLeft: "space/gap-0_5x", paddingTop: "space/gap-0_5x", paddingRight: "space/gap-0_5x", paddingBottom: "space/gap-0_5x" };
  assert.equal(textoPadding({ left: 8, top: 8, right: 8, bottom: 8 }, "px", sv), "space/gap-0_5x (8)");
});

test("textoPadding: vertical/horizontal pares → 2 valores", () => {
  assert.equal(textoPadding({ left: 16, top: 8, right: 16, bottom: 8 }, "px"), "8 16");
});

test("textoPadding: los 4 distintos → T R B L", () => {
  assert.equal(textoPadding({ left: 4, top: 1, right: 2, bottom: 3 }, "px"), "1 2 3 4");
});
