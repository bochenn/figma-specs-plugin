import { test } from "node:test";
import assert from "node:assert";
import { mismasProps } from "../src/plugin/comparacion/variantes.ts";

test("mapas iguales → true", () => {
  assert.equal(mismasProps({ Size: "Small", Type: "Primary" }, { Size: "Small", Type: "Primary" }), true);
});

test("un valor distinto → false", () => {
  assert.equal(mismasProps({ Size: "Small" }, { Size: "Large" }), false);
});

test("distinta cantidad de claves → false", () => {
  assert.equal(mismasProps({ Size: "Small" }, { Size: "Small", Type: "Primary" }), false);
});
