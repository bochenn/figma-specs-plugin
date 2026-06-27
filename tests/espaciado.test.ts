import { test } from "node:test";
import assert from "node:assert";
import { formatSpacing, spacingLabel, paddingText } from "../src/plugin/utils/espaciado.ts";

test("formatSpacing en px y rem", () => {
  assert.equal(formatSpacing(8, "px"), "8");
  assert.equal(formatSpacing(8, "rem"), "0.5rem");
  assert.equal(formatSpacing(16, "rem"), "1rem");
  assert.equal(formatSpacing(24, "rem"), "1.5rem");
});

test("spacingLabel: sin variable es solo el value", () => {
  assert.equal(spacingLabel(8, "px"), "8");
  assert.equal(spacingLabel(16, "rem"), "1rem");
});

test("spacingLabel: con variable es name + value", () => {
  assert.equal(spacingLabel(8, "px", "DS Space/item-spacing/0_5x"), "DS Space/item-spacing/0_5x (8)");
  assert.equal(spacingLabel(16, "rem", "DS Space/padding/1x"), "DS Space/padding/1x (1rem)");
});

test("paddingText: 4 lados iguales → un solo value", () => {
  assert.equal(paddingText({ left: 16, top: 16, right: 16, bottom: 16 }, "px"), "16");
});

test("paddingText: 4 lados iguales con variable → name (value) una vez", () => {
  const sv = { paddingLeft: "space/gap-0_5x", paddingTop: "space/gap-0_5x", paddingRight: "space/gap-0_5x", paddingBottom: "space/gap-0_5x" };
  assert.equal(paddingText({ left: 8, top: 8, right: 8, bottom: 8 }, "px", sv), "space/gap-0_5x (8)");
});

test("paddingText: vertical/horizontal pares → 2 values", () => {
  assert.equal(paddingText({ left: 16, top: 8, right: 16, bottom: 8 }, "px"), "8 16");
});

test("paddingText: los 4 distintos → T R B L", () => {
  assert.equal(paddingText({ left: 4, top: 1, right: 2, bottom: 3 }, "px"), "1 2 3 4");
});

test("formatSpacing redondea a máximo 2 decimales", () => {
  assert.equal(formatSpacing(485.3333435058594, "px"), "485.33");
  assert.equal(formatSpacing(197.33334350585938, "px"), "197.33");
  assert.equal(formatSpacing(296, "px"), "296");
});

test("formatSpacing con showUnit agrega px", () => {
  assert.equal(formatSpacing(296, "px", true), "296px");
  assert.equal(formatSpacing(485.3333435058594, "px", true), "485.33px");
  assert.equal(formatSpacing(24, "rem", true), "1.5rem");
});
