import { test } from "node:test";
import assert from "node:assert";
import { textStyleDe } from "../src/plugin/extraccion/layout.ts";
import type { NodoLike } from "../src/plugin/modelo/tipos.ts";

test("textStyleDe: hijo TEXT con text style → nombre", () => {
  const n: NodoLike = { id: "f", name: "title", type: "FRAME", children: [
    { id: "t", name: "Heading", type: "TEXT", textStyleName: "Heading/H1" },
  ] };
  assert.deepEqual(textStyleDe(n), { nombre: "Heading/H1" });
});

test("textStyleDe: hijo TEXT sin style → resumen de fuente", () => {
  const n: NodoLike = { id: "f", name: "title", type: "FRAME", children: [
    { id: "t", name: "Heading", type: "TEXT", fontFamily: "Inter", fontStyle: "Semi Bold", fontSize: 16 },
  ] };
  assert.deepEqual(textStyleDe(n), { resumen: "Inter Semi Bold · 16" });
});

test("textStyleDe: sin hijo texto → undefined", () => {
  const n: NodoLike = { id: "f", name: "box", type: "FRAME", children: [
    { id: "r", name: "rect", type: "RECTANGLE" },
  ] };
  assert.equal(textStyleDe(n), undefined);
});
