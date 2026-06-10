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

test("atributos de color con swatchHex distintos → cambio con swatchHex de la opción", () => {
  const def: Atributo[] = [{ clave: "background-color", valor: "#808080", formato: "HARDCODED", swatchHex: "#808080" }];
  const opc: Atributo[] = [{ clave: "background-color", valor: "#000000", formato: "HARDCODED", swatchHex: "#000000" }];
  assert.deepEqual(diffAtributos(def, opc), [
    { clave: "background-color", valorDefault: "#808080", valorOpcion: "#000000", swatchHex: "#000000" },
  ]);
});

test("cambio no-color → sin swatchHex", () => {
  const def: Atributo[] = [{ clave: "width", valor: "100", formato: "HARDCODED" }];
  const opc: Atributo[] = [{ clave: "width", valor: "200", formato: "HARDCODED" }];
  assert.deepEqual(diffAtributos(def, opc), [
    { clave: "width", valorDefault: "100", valorOpcion: "200" },
  ]);
});
