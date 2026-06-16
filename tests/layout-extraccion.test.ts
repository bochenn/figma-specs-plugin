import { test } from "node:test";
import assert from "node:assert";
import { extraerLayout } from "../src/plugin/extraccion/layout.ts";
import type { NodoLike } from "../src/plugin/modelo/tipos.ts";

test("arma un LayoutSpec completo desde un nodo con Auto Layout", () => {
  const raiz: NodoLike = {
    id: "r", name: "Card", type: "FRAME",
    layoutMode: "VERTICAL",
    primaryAxisAlignItems: "CENTER",
    counterAxisAlignItems: "MIN",
    paddingLeft: 16, paddingTop: 8, paddingRight: 16, paddingBottom: 8,
    itemSpacing: 12,
    layoutSizingHorizontal: "FILL",
    layoutSizingVertical: "HUG",
    width: 240, height: 100,
    children: [],
  };
  const specs = extraerLayout(raiz);
  assert.equal(specs.length, 1);
  assert.deepEqual(specs[0], {
    elementoNombre: "Card",
    tipo: "FRAME",
    direccion: "VERTICAL",
    alineacionPrimaria: "Center",
    alineacionContraria: "Start",
    resizingHorizontal: "Fill",
    resizingVertical: "Hug",
    padding: { left: 16, top: 8, right: 16, bottom: 8 },
    itemSpacing: 12,
    wrap: false,
    spacingAuto: false,
    grids: [],
    spacingVars: {},
    width: 240,
    height: 100,
  });
});

test("layoutSpecDe con GRID setea direccion y datos de grilla", () => {
  const raiz: NodoLike = {
    id: "r", name: "Screen", type: "FRAME", layoutMode: "GRID",
    gridColumnCount: 12, gridRowCount: 2, gridColumnGap: 20, gridRowGap: 8,
    children: [],
  };
  const s = extraerLayout(raiz)[0];
  assert.equal(s.direccion, "GRID");
  assert.equal(s.gridColumnas, 12);
  assert.equal(s.gridFilas, 2);
  assert.equal(s.gridColumnGap, 20);
  assert.equal(s.gridRowGap, 8);
});

test("extraerLayout con itemizar marca profundidad de la instancia interna", () => {
  const raiz: NodoLike = {
    id: "r", name: "card", type: "FRAME", layoutMode: "VERTICAL",
    children: [{ id: "t", name: "tag", type: "INSTANCE", layoutMode: "HORIZONTAL", children: [] }],
  };
  const specs = extraerLayout(raiz, true);
  assert.deepEqual(specs.map((s) => [s.elementoNombre, s.profundidad ?? 0]), [["card", 0], ["tag", 1]]);
});

test("layoutSpecDe puebla fill/stroke/cornerRadius/dimension vars", () => {
  const nodo: NodoLike = {
    id: "r", name: "Card", type: "FRAME", layoutMode: "VERTICAL",
    width: 240, height: 88,
    widthVariableName: "sizing/card-width",
    cornerRadius: 8,
    fills: [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }],
    fillVariableName: "color/surface",
    strokes: [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }],
    children: [],
  };
  const s = extraerLayout(nodo)[0];
  assert.equal(s.width, 240);
  assert.equal(s.widthVar, "sizing/card-width");
  assert.equal(s.cornerRadius, 8);
  assert.equal(s.fill?.valor, "color/surface");
  assert.equal(s.fill?.formato, "VARIABLE");
  assert.equal(s.stroke?.valor, "#000000"); // sin variable → hardcoded
});

test("spacingVars del nodo pasan al spec", () => {
  const raiz: NodoLike = {
    id: "r", name: "Row", type: "FRAME", layoutMode: "HORIZONTAL",
    spacingVars: { paddingLeft: "DS Space/padding/1x", itemSpacing: "DS Space/gap" },
    children: [],
  };
  assert.deepEqual(extraerLayout(raiz)[0].spacingVars, {
    paddingLeft: "DS Space/padding/1x", itemSpacing: "DS Space/gap",
  });
});

test("layoutGrids del nodo pasan al spec", () => {
  const raiz: NodoLike = {
    id: "r", name: "Page", type: "FRAME",
    layoutMode: "VERTICAL",
    layoutGrids: [{ patron: "COLUMNS", alineacion: "STRETCH", count: 12, gutter: 20, offset: 16 }],
    children: [],
  };
  assert.deepEqual(extraerLayout(raiz)[0].grids, [
    { patron: "COLUMNS", alineacion: "STRETCH", count: 12, gutter: 20, offset: 16 },
  ]);
});

test("padding e itemSpacing ausentes → 0", () => {
  const raiz: NodoLike = { id: "r", name: "Row", type: "FRAME", layoutMode: "HORIZONTAL", children: [] };
  const specs = extraerLayout(raiz);
  assert.deepEqual(specs[0].padding, { left: 0, top: 0, right: 0, bottom: 0 });
  assert.equal(specs[0].itemSpacing, 0);
});

test("wrap y space between → wrap/spacingAuto true", () => {
  const raiz: NodoLike = {
    id: "r", name: "Tags", type: "FRAME",
    layoutMode: "HORIZONTAL",
    layoutWrap: "WRAP",
    primaryAxisAlignItems: "SPACE_BETWEEN",
    children: [],
  };
  const s = extraerLayout(raiz)[0];
  assert.equal(s.wrap, true);
  assert.equal(s.spacingAuto, true);
});
