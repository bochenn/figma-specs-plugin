import { test } from "node:test";
import assert from "node:assert";
import { agruparModes } from "../src/plugin/variables/modes.ts";
import type { EntradaModo } from "../src/plugin/modelo/tipos.ts";

const MODOS = [{ modeId: "L", nombre: "Light" }, { modeId: "D", nombre: "Dark" }];

function entrada(coleccion: string, appliedAs: string, variableNombre: string): EntradaModo {
  return {
    coleccionNombre: coleccion,
    modos: MODOS,
    capa: "Alert",
    appliedAs,
    variableNombre,
    valores: [{ modeId: "L", valor: "#FFFFFF" }, { modeId: "D", valor: "#000000" }],
  };
}

test("dos entradas de la misma collection → una ColeccionModes con dos atributos", () => {
  const cols = agruparModes([
    entrada("Color", "Background color", "Bg"),
    entrada("Color", "Border color", "Bd"),
  ]);
  assert.equal(cols.length, 1);
  assert.equal(cols[0].coleccionNombre, "Color");
  assert.deepEqual(cols[0].modos, MODOS);
  assert.equal(cols[0].atributos.length, 2);
  assert.equal(cols[0].atributos[0].variableNombre, "Bg");
  assert.equal(cols[0].atributos[1].variableNombre, "Bd");
});

test("entradas de dos collections → dos ColeccionModes, en orden de aparición", () => {
  const cols = agruparModes([
    entrada("Color", "Background color", "Bg"),
    entrada("Spacing", "Border color", "Sp"),
  ]);
  assert.deepEqual(cols.map((c) => c.coleccionNombre), ["Color", "Spacing"]);
});
