import { test } from "node:test";
import assert from "node:assert";
import { agruparInventario } from "../src/plugin/inventario/agrupar.ts";
import type { EntradaEstilo } from "../src/plugin/modelo/tipos.ts";

test("mismo estilo + mismo appliedAs en dos capas → una fila", () => {
  const entradas: EntradaEstilo[] = [
    { tabla: "color", nombre: "Error", appliedAs: "Border color", capa: "Active indicator" },
    { tabla: "color", nombre: "Error", appliedAs: "Border color", capa: "Caret" },
  ];
  const filas = agruparInventario(entradas);
  assert.equal(filas.length, 1);
  assert.deepEqual(filas[0], {
    tabla: "color", nombre: "Error", appliedAs: "Border color", appliedTo: "Active indicator, Caret",
  });
});

test("mismo estilo con distinto appliedAs → dos filas", () => {
  const entradas: EntradaEstilo[] = [
    { tabla: "color", nombre: "Error", appliedAs: "Background color", capa: "Alert" },
    { tabla: "color", nombre: "Error", appliedAs: "Border color", capa: "Caret" },
  ];
  const filas = agruparInventario(entradas);
  assert.equal(filas.length, 2);
  assert.equal(filas[0].appliedAs, "Background color");
  assert.equal(filas[1].appliedAs, "Border color");
});

test("separa por tabla color/text", () => {
  const entradas: EntradaEstilo[] = [
    { tabla: "color", nombre: "Surface", appliedAs: "Background color", capa: "Card" },
    { tabla: "text", nombre: "Body", appliedAs: "Text style", capa: "Label" },
  ];
  const filas = agruparInventario(entradas);
  assert.equal(filas.filter((f) => f.tabla === "color").length, 1);
  assert.equal(filas.filter((f) => f.tabla === "text").length, 1);
});

test("entradas variable con swatchHex → fila con swatchHex", () => {
  const entradas: EntradaEstilo[] = [
    { tabla: "variable", nombre: "Color/Action", appliedAs: "Background color", capa: "A", swatchHex: "#0E68D4" },
    { tabla: "variable", nombre: "Color/Action", appliedAs: "Background color", capa: "B", swatchHex: "#0E68D4" },
  ];
  const filas = agruparInventario(entradas);
  assert.equal(filas.length, 1);
  assert.deepEqual(filas[0], {
    tabla: "variable", nombre: "Color/Action", appliedAs: "Background color", appliedTo: "A, B", swatchHex: "#0E68D4",
  });
});
