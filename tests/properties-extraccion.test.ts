import { test } from "node:test";
import assert from "node:assert";
import { extraerProperties } from "../src/plugin/extraccion/properties.ts";
import type { SetNorm, NodoLike } from "../src/plugin/modelo/tipos.ts";

// Construye un componente-variante con un Label de cierto color.
function variante(props: Record<string, string>, color: { r: number; g: number; b: number }): {
  variantProperties: Record<string, string>;
  raiz: NodoLike;
} {
  return {
    variantProperties: props,
    raiz: {
      id: "root", name: "Root", type: "COMPONENT",
      children: [{ id: "l", name: "Label", type: "RECTANGLE", fills: [{ type: "SOLID", color }] }],
    },
  };
}

test("una propiedad con dos opciones: saltea el default y compara la otra", () => {
  const set: SetNorm = {
    propiedades: { Tone: ["Gris", "Negro"] },
    defaultProps: { Tone: "Gris" },
    variantes: [
      variante({ Tone: "Gris" }, { r: 0.5, g: 0.5, b: 0.5 }),
      variante({ Tone: "Negro" }, { r: 0, g: 0, b: 0 }),
    ],
  };
  const specs = extraerProperties(set);
  assert.equal(specs.length, 1);
  assert.equal(specs[0].nombre, "Tone");
  assert.equal(specs[0].default, "Gris");
  assert.equal(specs[0].opciones.length, 1);
  assert.equal(specs[0].opciones[0].nombre, "Negro");
  assert.equal(specs[0].opciones[0].cambios[0].elementoNombre, "Label");
  assert.deepEqual(specs[0].opciones[0].cambios[0].atributos, [
    { clave: "background-color", valorDefault: "#808080", valorOpcion: "#000000" },
  ]);
});

test("opción cuyo componente-variante no existe → se saltea", () => {
  const set: SetNorm = {
    propiedades: { Tone: ["Gris", "Negro", "Rojo"] },
    defaultProps: { Tone: "Gris" },
    variantes: [
      variante({ Tone: "Gris" }, { r: 0.5, g: 0.5, b: 0.5 }),
      variante({ Tone: "Negro" }, { r: 0, g: 0, b: 0 }),
      // no existe variante "Rojo"
    ],
  };
  const specs = extraerProperties(set);
  assert.equal(specs[0].opciones.length, 1);
  assert.equal(specs[0].opciones[0].nombre, "Negro");
});
