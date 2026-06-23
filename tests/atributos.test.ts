import { test } from "node:test";
import assert from "node:assert";
import { leerAtributos } from "../src/plugin/utils/atributos.ts";
import type { NodoLike } from "../src/plugin/modelo/tipos.ts";

test("fill SOLID hardcoded → background-color HARDCODED con swatchHex", () => {
  const nodo: NodoLike = {
    id: "x", name: "x", type: "RECTANGLE",
    fills: [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }],
  };
  assert.deepEqual(
    leerAtributos(nodo).find((a) => a.clave === "background-color"),
    { clave: "background-color", valor: "#FFFFFF", formato: "HARDCODED", swatchHex: "#FFFFFF" },
  );
});

test("fill con variable → background-color VARIABLE con rawValue", () => {
  const nodo: NodoLike = {
    id: "x", name: "x", type: "RECTANGLE",
    fills: [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }],
    fillVariableName: "Color/Action",
  };
  assert.deepEqual(
    leerAtributos(nodo).find((a) => a.clave === "background-color"),
    { clave: "background-color", valor: "Color/Action", formato: "VARIABLE", rawValue: "#000000", swatchHex: "#000000" },
  );
});

test("stroke SOLID → border-color", () => {
  const nodo: NodoLike = {
    id: "x", name: "x", type: "FRAME",
    strokes: [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }],
  };
  assert.deepEqual(
    leerAtributos(nodo).find((a) => a.clave === "border-color"),
    { clave: "border-color", valor: "#000000", formato: "HARDCODED", swatchHex: "#000000" },
  );
});

test("incluye width cuando está presente (sin swatch)", () => {
  const nodo: NodoLike = { id: "x", name: "x", type: "FRAME", width: 240 };
  assert.deepEqual(
    leerAtributos(nodo).find((a) => a.clave === "width"),
    { clave: "width", valor: "240px", formato: "HARDCODED" },
  );
});

test("width con variable atada → VARIABLE + rawValue", () => {
  const nodo: NodoLike = { id: "x", name: "x", type: "FRAME", width: 343, widthVariableName: "DS Sizing/iOS width" };
  assert.deepEqual(
    leerAtributos(nodo).find((a) => a.clave === "width"),
    { clave: "width", valor: "DS Sizing/iOS width", formato: "VARIABLE", rawValue: "343px" },
  );
});

test("height sin variable → no aparece", () => {
  const nodo: NodoLike = { id: "x", name: "x", type: "FRAME", width: 100, height: 200 };
  assert.equal(leerAtributos(nodo).find((a) => a.clave === "height"), undefined);
});

test("height con variable atada → aparece como VARIABLE", () => {
  const nodo: NodoLike = { id: "x", name: "x", type: "FRAME", width: 100, height: 48, heightVariableName: "DS Sizing/button" };
  assert.deepEqual(
    leerAtributos(nodo).find((a) => a.clave === "height"),
    { clave: "height", valor: "DS Sizing/button", formato: "VARIABLE", rawValue: "48px" },
  );
});

test("incluye opacity como porcentaje cuando es menor a 1", () => {
  const nodo: NodoLike = { id: "x", name: "x", type: "FRAME", opacity: 0.8 };
  assert.deepEqual(
    leerAtributos(nodo).find((a) => a.clave === "opacity"),
    { clave: "opacity", valor: "80%", formato: "HARDCODED" },
  );
});

test("opacity 1 (totalmente opaco) no se incluye", () => {
  const nodo: NodoLike = { id: "x", name: "x", type: "FRAME", opacity: 1 };
  assert.equal(leerAtributos(nodo).find((a) => a.clave === "opacity"), undefined);
});

test("typography con estilo aplicado → fila 'Text Style' (nombre) + detalle de la fuente", () => {
  const nodo: NodoLike = {
    id: "x", name: "x", type: "TEXT",
    fontFamily: "Inter", fontStyle: "Medium", fontSize: 14,
    textStyleName: "Text SM/Medium",
  };
  const attrs = leerAtributos(nodo);
  assert.deepEqual(
    attrs.find((a) => a.clave === "Text Style"),
    { clave: "Text Style", valor: "Text SM/Medium", formato: "STYLE" },
  );
  const tipo = attrs.find((a) => a.clave === "typography");
  assert.equal(tipo?.formato, "HARDCODED");
  assert.match(tipo?.valor ?? "", /Inter/);
});

test("typography sin estilo → usa el raw de la fuente", () => {
  const nodo: NodoLike = {
    id: "x", name: "x", type: "TEXT",
    fontFamily: "Inter", fontStyle: "Medium", fontSize: 14,
  };
  const attr = leerAtributos(nodo).find((a) => a.clave === "typography");
  assert.equal(attr?.formato, "HARDCODED");
  assert.match(attr?.valor ?? "", /Inter/);
});

test("width con layoutSizing FIXED → incluye prefijo Fixed", () => {
  const nodo: NodoLike = { id: "x", name: "x", type: "FRAME", width: 67, layoutSizingHorizontal: "FIXED" };
  assert.deepEqual(
    leerAtributos(nodo).find((a) => a.clave === "width"),
    { clave: "width", valor: "67px", formato: "HARDCODED", prefijo: "Fixed" },
  );
});

test("width con layoutSizing HUG → incluye prefijo Hug", () => {
  const nodo: NodoLike = { id: "x", name: "x", type: "FRAME", width: 88, layoutSizingHorizontal: "HUG" };
  assert.deepEqual(
    leerAtributos(nodo).find((a) => a.clave === "width"),
    { clave: "width", valor: "88px", formato: "HARDCODED", prefijo: "Hug" },
  );
});

test("width sin layoutSizing → sin prefijo (igual que antes)", () => {
  const nodo: NodoLike = { id: "x", name: "x", type: "FRAME", width: 240 };
  assert.deepEqual(
    leerAtributos(nodo).find((a) => a.clave === "width"),
    { clave: "width", valor: "240px", formato: "HARDCODED" },
  );
});
