import { test } from "node:test";
import assert from "node:assert";
import { limpiarPrefijoColeccion } from "../src/plugin/utils/nombre-variable.ts";

test("quita el prefijo 'N. ' inicial", () => {
  assert.equal(limpiarPrefijoColeccion("1. Color modes"), "Color modes");
  assert.equal(limpiarPrefijoColeccion("3. Spacing"), "Spacing");
  assert.equal(limpiarPrefijoColeccion("10. Tokens"), "Tokens");
});

test("no toca nombres sin prefijo numérico", () => {
  assert.equal(limpiarPrefijoColeccion("Color modes"), "Color modes");
  assert.equal(limpiarPrefijoColeccion("Spacing/2xl"), "Spacing/2xl");
});
