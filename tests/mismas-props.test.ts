import { test } from "node:test";
import assert from "node:assert";
import { sameProps } from "../src/plugin/comparacion/variantes.ts";

test("mapas iguales → true", () => {
  assert.equal(sameProps({ Size: "Small", Type: "Primary" }, { Size: "Small", Type: "Primary" }), true);
});

test("un value distinto → false", () => {
  assert.equal(sameProps({ Size: "Small" }, { Size: "Large" }), false);
});

test("distinta cantidad de claves → false", () => {
  assert.equal(sameProps({ Size: "Small" }, { Size: "Small", Type: "Primary" }), false);
});
