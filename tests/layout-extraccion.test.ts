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
  });
});

test("padding e itemSpacing ausentes → 0", () => {
  const raiz: NodoLike = { id: "r", name: "Row", type: "FRAME", layoutMode: "HORIZONTAL", children: [] };
  const specs = extraerLayout(raiz);
  assert.deepEqual(specs[0].padding, { left: 0, top: 0, right: 0, bottom: 0 });
  assert.equal(specs[0].itemSpacing, 0);
});
