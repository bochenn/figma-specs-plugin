import { test } from "node:test";
import assert from "node:assert";
import { formatAppliedTo } from "../src/plugin/inventario/agrupar.ts";

test("names distintos → separados por coma", () => {
  assert.equal(formatAppliedTo(["Active indicator", "Caret"]), "Active indicator, Caret");
});

test("name repetido → cantidad entre paréntesis", () => {
  assert.equal(formatAppliedTo(["label-text", "label-text"]), "label-text (2)");
});

test("mezcla → orden de primera aparición con conteos", () => {
  assert.equal(formatAppliedTo(["a", "b", "a"]), "a (2), b");
});
