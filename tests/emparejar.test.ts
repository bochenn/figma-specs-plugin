import { test } from "node:test";
import assert from "node:assert";
import { pairUp } from "../src/plugin/comparacion/variantes.ts";
import type { NodeLike } from "../src/plugin/modelo/tipos.ts";

function n(id: string, name: string): NodeLike {
  return { id, name, type: "TEXT" };
}

test("empareja por name", () => {
  const pares = pairUp([n("a", "Label")], [n("b", "Label")]);
  assert.equal(pares.length, 1);
  assert.equal(pares[0].default?.id, "a");
  assert.equal(pares[0].option?.id, "b");
});

test("names duplicados se emparejan por orden", () => {
  const pares = pairUp(
    [n("a1", "Icon"), n("a2", "Icon")],
    [n("b1", "Icon"), n("b2", "Icon")],
  );
  assert.equal(pares[0].default?.id, "a1");
  assert.equal(pares[0].option?.id, "b1");
  assert.equal(pares[1].default?.id, "a2");
  assert.equal(pares[1].option?.id, "b2");
});

test("element solo en el default → par sin option", () => {
  const pares = pairUp([n("a", "Solo")], []);
  assert.equal(pares[0].default?.id, "a");
  assert.equal(pares[0].option, undefined);
});

test("element solo en la option → par sin default", () => {
  const pares = pairUp([], [n("b", "Nuevo")]);
  assert.equal(pares[0].default, undefined);
  assert.equal(pares[0].option?.id, "b");
});
