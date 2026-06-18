import { test } from "node:test";
import assert from "node:assert";
import { parseVariantes } from "../src/plugin/utils/anatomy-variantes.ts";

test("parseVariantes: 'k=v, k=v' → pares", () => {
  assert.deepEqual(parseVariantes("Type=Card 03, Orientation=Vertical, Breakpoint=Mobile"), [
    { clave: "Type", valor: "Card 03" },
    { clave: "Orientation", valor: "Vertical" },
    { clave: "Breakpoint", valor: "Mobile" },
  ]);
});
test("parseVariantes: sin '=' → vacío (no es variante)", () => {
  assert.deepEqual(parseVariantes("Blog post card"), []);
});
test("parseVariantes: undefined → vacío", () => {
  assert.deepEqual(parseVariantes(undefined), []);
});
