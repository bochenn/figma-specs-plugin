import { test } from "node:test";
import assert from "node:assert";
import { anatomyADataJSON, propiedadesADataJSON, armarDataJSON } from "../src/plugin/extraccion/data.ts";
import type { ElementoAnatomy, PropiedadSpec } from "../src/plugin/modelo/tipos.ts";

test("anatomyADataJSON convierte un elemento básico", () => {
  const elementos: ElementoAnatomy[] = [
    { id: "1", nombre: "Título", tipo: "TEXT", esInstancia: false, atributos: [] },
  ];
  const result = anatomyADataJSON(elementos);
  assert.equal(result.length, 1);
  assert.deepEqual(result[0], { name: "Título", type: "TEXT", attributes: [] });
});

test("anatomyADataJSON incluye instanceOf para instancias", () => {
  const elementos: ElementoAnatomy[] = [
    {
      id: "2",
      nombre: "Ícono",
      tipo: "INSTANCE",
      esInstancia: true,
      dependeDe: "Icon/Plus",
      atributos: [],
    },
  ];
  const result = anatomyADataJSON(elementos);
  assert.equal(result[0].instanceOf, "Icon/Plus");
});

test("anatomyADataJSON convierte atributos al formato Data", () => {
  const elementos: ElementoAnatomy[] = [
    {
      id: "3",
      nombre: "Fondo",
      tipo: "RECTANGLE",
      esInstancia: false,
      atributos: [{ clave: "background-color", valor: "#FF0000", formato: "HARDCODED" }],
    },
  ];
  const result = anatomyADataJSON(elementos);
  assert.deepEqual(result[0].attributes, [
    { key: "background-color", value: "#FF0000", format: "HARDCODED", rawValue: "#FF0000" },
  ]);
});

test("propiedadesADataJSON convierte una propiedad VARIANT", () => {
  const props: PropiedadSpec[] = [
    {
      nombre: "Size",
      tipo: "VARIANT",
      default: "Medium",
      opciones: [
        {
          nombre: "Small",
          cambios: [
            {
              elementoNombre: "Label",
              estado: "modificado",
              atributos: [{ clave: "width", valorDefault: "100", valorOpcion: "80" }],
            },
          ],
        },
      ],
    },
  ];
  const result = propiedadesADataJSON(props);
  assert.equal(result.length, 1);
  assert.equal(result[0].name, "Size");
  assert.equal(result[0].type, "VARIANT");
  assert.equal(result[0].default, "Medium");
  assert.equal(result[0].options[0].name, "Small");
  assert.equal(result[0].options[0].elements[0].name, "Label");
  assert.equal(result[0].options[0].elements[0].state, "modified");
  assert.deepEqual(result[0].options[0].elements[0].attributes, [
    { key: "width", from: "100", to: "80" },
  ]);
});

test("propiedadesADataJSON mapea estados correctamente", () => {
  const props: PropiedadSpec[] = [
    {
      nombre: "Estado",
      tipo: "VARIANT",
      default: "Default",
      opciones: [
        {
          nombre: "Disabled",
          cambios: [
            { elementoNombre: "Capa A", estado: "agregado", atributos: [] },
            { elementoNombre: "Capa B", estado: "removido", atributos: [] },
          ],
        },
      ],
    },
  ];
  const result = propiedadesADataJSON(props);
  assert.equal(result[0].options[0].elements[0].state, "added");
  assert.equal(result[0].options[0].elements[1].state, "removed");
});

test("armarDataJSON incluye solo anatomy cuando properties es null", () => {
  const json = armarDataJSON([{ name: "A", type: "TEXT", attributes: [] }], null);
  const parsed = JSON.parse(json);
  assert.ok(parsed.anatomy);
  assert.equal(parsed.properties, undefined);
});

test("armarDataJSON incluye ambos cuando se proveen", () => {
  const json = armarDataJSON(
    [{ name: "A", type: "TEXT", attributes: [] }],
    [{ name: "Size", type: "VARIANT", default: "M", options: [] }],
  );
  const parsed = JSON.parse(json);
  assert.ok(parsed.anatomy);
  assert.ok(parsed.properties);
});

test("armarDataJSON produce JSON válido con indentación", () => {
  const json = armarDataJSON([], []);
  assert.doesNotThrow(() => JSON.parse(json));
  assert.ok(json.includes("\n")); // indented
});
