import { test } from "node:test";
import assert from "node:assert";
import { diffAtributos } from "../src/plugin/comparacion/variantes.ts";
import type { Atributo } from "../src/plugin/modelo/tipos.ts";

function attr(clave: string, valor: string): Atributo {
  return { clave, valor, formato: "HARDCODED" };
}

test("atributo que cambia → incluido con ambos valores", () => {
  const cambios = diffAtributos([attr("background-color", "#888888")], [attr("background-color", "#0E68D4")]);
  assert.deepEqual(cambios, [
    { clave: "background-color", valorDefault: "#888888", valorOpcion: "#0E68D4" },
  ]);
});

test("atributo igual → omitido", () => {
  const cambios = diffAtributos([attr("width", "100")], [attr("width", "100")]);
  assert.deepEqual(cambios, []);
});

test("atributo presente solo en el default → incluido sin valorOpcion", () => {
  const cambios = diffAtributos([attr("opacity", "50%")], []);
  assert.deepEqual(cambios, [{ clave: "opacity", valorDefault: "50%", valorOpcion: undefined }]);
});

test("atributo presente solo en la opcion → incluido sin valorDefault", () => {
  const cambios = diffAtributos([], [attr("opacity", "50%")]);
  assert.deepEqual(cambios, [{ clave: "opacity", valorDefault: undefined, valorOpcion: "50%" }]);
});
