import { test } from "node:test";
import assert from "node:assert";
import { emparejar } from "../src/plugin/comparacion/variantes.ts";
import type { NodoLike } from "../src/plugin/modelo/tipos.ts";

function n(id: string, name: string): NodoLike {
  return { id, name, type: "TEXT" };
}

test("empareja por nombre", () => {
  const pares = emparejar([n("a", "Label")], [n("b", "Label")]);
  assert.equal(pares.length, 1);
  assert.equal(pares[0].default?.id, "a");
  assert.equal(pares[0].opcion?.id, "b");
});

test("nombres duplicados se emparejan por orden", () => {
  const pares = emparejar(
    [n("a1", "Icon"), n("a2", "Icon")],
    [n("b1", "Icon"), n("b2", "Icon")],
  );
  assert.equal(pares[0].default?.id, "a1");
  assert.equal(pares[0].opcion?.id, "b1");
  assert.equal(pares[1].default?.id, "a2");
  assert.equal(pares[1].opcion?.id, "b2");
});

test("elemento solo en el default → par sin opcion", () => {
  const pares = emparejar([n("a", "Solo")], []);
  assert.equal(pares[0].default?.id, "a");
  assert.equal(pares[0].opcion, undefined);
});

test("elemento solo en la opcion → par sin default", () => {
  const pares = emparejar([], [n("b", "Nuevo")]);
  assert.equal(pares[0].default, undefined);
  assert.equal(pares[0].opcion?.id, "b");
});
