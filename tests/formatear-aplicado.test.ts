import { test } from "node:test";
import assert from "node:assert";
import { formatearAplicadoA } from "../src/plugin/inventario/agrupar.ts";

test("nombres distintos → separados por coma", () => {
  assert.equal(formatearAplicadoA(["Active indicator", "Caret"]), "Active indicator, Caret");
});

test("nombre repetido → cantidad entre paréntesis", () => {
  assert.equal(formatearAplicadoA(["label-text", "label-text"]), "label-text (2)");
});

test("mezcla → orden de primera aparición con conteos", () => {
  assert.equal(formatearAplicadoA(["a", "b", "a"]), "a (2), b");
});
