import { test } from "node:test";
import assert from "node:assert";
import { formatearTipografia } from "../src/plugin/utils/tipografia.ts";
import { leerAtributos } from "../src/plugin/utils/atributos.ts";
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

test("leerAtributos agrega typography para nodos con fuente", () => {
  const nodo: NodoLike = { id: "t", name: "Text", type: "TEXT", fontFamily: "Inter", fontStyle: "Regular", fontSize: 16 };
  const typo = leerAtributos(nodo).find((a) => a.clave === "typography");
  assert.ok(typo);
  assert.equal(typo.valor, "Inter Regular 16");
});

test("leerAtributos no agrega typography sin fuente", () => {
  const nodo: NodoLike = { id: "f", name: "Frame", type: "FRAME" };
  assert.equal(leerAtributos(nodo).find((a) => a.clave === "typography"), undefined);
});

test("leerAtributos incluye el line-height en typography", () => {
  const nodo: NodoLike = { id: "t", name: "Text", type: "TEXT", fontFamily: "Inter", fontStyle: "Regular", fontSize: 16, lineHeight: { unidad: "px", valor: 24 } };
  const typo = leerAtributos(nodo).find((a) => a.clave === "typography");
  assert.ok(typo);
  assert.equal(typo.valor, "Inter Regular 16 / 24");
});

test("leerAtributos incluye el letter-spacing en typography", () => {
  const nodo: NodoLike = { id: "t", name: "Text", type: "TEXT", fontFamily: "Inter", fontStyle: "Regular", fontSize: 16, letterSpacing: { unidad: "px", valor: 0.5 } };
  const typo = leerAtributos(nodo).find((a) => a.clave === "typography");
  assert.ok(typo);
  assert.equal(typo.valor, "Inter Regular 16 · LS 0.5");
});
