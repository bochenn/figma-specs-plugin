import { test } from "node:test";
import assert from "node:assert";
import { formatearEspaciado } from "../src/plugin/utils/espaciado.ts";

test("formatearEspaciado en px y rem", () => {
  assert.equal(formatearEspaciado(8, "px"), "8");
  assert.equal(formatearEspaciado(8, "rem"), "0.5rem");
  assert.equal(formatearEspaciado(16, "rem"), "1rem");
  assert.equal(formatearEspaciado(24, "rem"), "1.5rem");
});
