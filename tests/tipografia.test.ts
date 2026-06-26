import { test } from "node:test";
import assert from "node:assert";
import { formatearTipografia } from "../src/plugin/utils/tipografia.ts";
import { leerAtributos } from "../src/plugin/utils/atributos.ts";
import { aplicarUnidad } from "../src/plugin/utils/espaciado.ts";
import type { NodoLike } from "../src/plugin/modelo/tipos.ts";

test("formatearTipografia en Plain y CSS", () => {
  assert.equal(formatearTipografia({ family: "Inter", style: "Regular", size: 16 }, "Plain"), "Inter Regular 16");
  assert.equal(formatearTipografia({ family: "Inter", style: "Bold", size: 24 }, "CSS"), "24px Bold Inter");
});

test("formatearTipografia con line-height", () => {
  assert.equal(formatearTipografia({ family: "Inter", style: "Regular", size: 16, lineHeight: { unidad: "px", valor: 24 } }, "Plain"), "Inter Regular 16 / 24");
  assert.equal(formatearTipografia({ family: "Inter", style: "Regular", size: 16, lineHeight: { unidad: "px", valor: 24 } }, "CSS"), "16px/24px Regular Inter");
  assert.equal(formatearTipografia({ family: "Inter", style: "Regular", size: 16, lineHeight: { unidad: "percent", valor: 150 } }, "Plain"), "Inter Regular 16 / 150%");
  assert.equal(formatearTipografia({ family: "Inter", style: "Regular", size: 16, lineHeight: { unidad: "auto" } }, "CSS"), "16px Regular Inter");
});

test("formatearTipografia con letter-spacing", () => {
  assert.equal(formatearTipografia({ family: "Inter", style: "Regular", size: 16, letterSpacing: { unidad: "px", valor: 0.5 } }, "Plain"), "Inter Regular 16 · LS 0.5");
  assert.equal(formatearTipografia({ family: "Inter", style: "Regular", size: 16, letterSpacing: { unidad: "px", valor: 0.5 } }, "CSS"), "16px Regular Inter · LS 0.5px");
  assert.equal(formatearTipografia({ family: "Inter", style: "Regular", size: 16, letterSpacing: { unidad: "percent", valor: 5 } }, "Plain"), "Inter Regular 16 · LS 5%");
  assert.equal(formatearTipografia({ family: "Inter", style: "Regular", size: 16, lineHeight: { unidad: "px", valor: 24 }, letterSpacing: { unidad: "px", valor: 0.5 } }, "Plain"), "Inter Regular 16 / 24 · LS 0.5");
});

test("leerAtributos agrega las propiedades de tipografía para nodos con fuente", () => {
  const nodo: NodoLike = { id: "t", name: "Text", type: "TEXT", fontFamily: "Inter", fontStyle: "Regular", fontSize: 16 };
  const attrs = leerAtributos(nodo);
  assert.equal(attrs.find((a) => a.clave === "Font Family")?.valor, "Inter");
  assert.equal(attrs.find((a) => a.clave === "Font Weight")?.valor, "Regular");
  assert.equal(attrs.find((a) => a.clave === "Font Size")?.valor, "16px");
});

test("leerAtributos no agrega tipografía sin fuente", () => {
  const nodo: NodoLike = { id: "f", name: "Frame", type: "FRAME" };
  assert.equal(leerAtributos(nodo).find((a) => a.clave === "Font Family"), undefined);
  assert.equal(leerAtributos(nodo).find((a) => a.clave === "Text Style"), undefined);
});

test("leerAtributos incluye el line-height como fila propia", () => {
  const nodo: NodoLike = { id: "t", name: "Text", type: "TEXT", fontFamily: "Inter", fontStyle: "Regular", fontSize: 16, lineHeight: { unidad: "px", valor: 24 } };
  assert.equal(leerAtributos(nodo).find((a) => a.clave === "Line Height")?.valor, "24px");
});

test("leerAtributos incluye el letter-spacing como fila propia", () => {
  const nodo: NodoLike = { id: "t", name: "Text", type: "TEXT", fontFamily: "Inter", fontStyle: "Regular", fontSize: 16, letterSpacing: { unidad: "px", valor: 0.5 } };
  assert.equal(leerAtributos(nodo).find((a) => a.clave === "Letter Spacing")?.valor, "0.5px");
});

test("con Units=rem, Plain convierte size, line-height y letter-spacing", () => {
  aplicarUnidad("rem");
  assert.equal(
    formatearTipografia({ family: "Inter", style: "Regular", size: 16, lineHeight: { unidad: "px", valor: 24 }, letterSpacing: { unidad: "px", valor: 4 } }, "Plain"),
    "Inter Regular 1rem / 1.5rem · LS 0.25rem",
  );
  aplicarUnidad("px");
});

test("con Units=rem, CSS convierte size, line-height y letter-spacing", () => {
  aplicarUnidad("rem");
  assert.equal(
    formatearTipografia({ family: "Inter", style: "Regular", size: 16, lineHeight: { unidad: "px", valor: 24 }, letterSpacing: { unidad: "px", valor: 4 } }, "CSS"),
    "1rem/1.5rem Regular Inter · LS 0.25rem",
  );
  aplicarUnidad("px");
});

test("con Units=rem, percent y auto quedan intactos", () => {
  aplicarUnidad("rem");
  assert.equal(
    formatearTipografia({ family: "Inter", style: "Regular", size: 16, lineHeight: { unidad: "percent", valor: 150 } }, "Plain"),
    "Inter Regular 1rem / 150%",
  );
  assert.equal(
    formatearTipografia({ family: "Inter", style: "Regular", size: 16, lineHeight: { unidad: "auto" }, letterSpacing: { unidad: "percent", valor: 5 } }, "CSS"),
    "1rem Regular Inter · LS 5%",
  );
  aplicarUnidad("px");
});
