import { test } from "node:test";
import assert from "node:assert";
import { filaAnatomy, HEADERS_ANATOMY } from "../src/plugin/utils/tabla-anatomy.ts";
import type { ElementoAnatomy } from "../src/plugin/modelo/tipos.ts";

test("filaAnatomy → [#, nombre, tipo]", () => {
  const el: ElementoAnatomy = { id: "1", nombre: "Label", tipo: "TEXT", esInstancia: false, atributos: [] };
  assert.deepEqual(filaAnatomy(1, el), ["1", "Label", "TEXT"]);
});

test("HEADERS_ANATOMY son # / Name / Type", () => {
  assert.deepEqual(HEADERS_ANATOMY, ["#", "Name", "Type"]);
});
