import { test } from "node:test";
import assert from "node:assert";
import { claveLayout } from "../src/plugin/extraccion/layout.ts";
import type { LayoutSpec } from "../src/plugin/modelo/tipos.ts";

function spec(padding: number): LayoutSpec {
  return {
    elementoNombre: "Root", tipo: "FRAME", direccion: "VERTICAL",
    alineacionPrimaria: "Start", alineacionContraria: "Start",
    resizingHorizontal: "Fixed", resizingVertical: "Hug",
    padding: { left: padding, top: padding, right: padding, bottom: padding },
    itemSpacing: 8,
  };
}

test("misma config → misma clave", () => {
  assert.equal(claveLayout(spec(8)), claveLayout(spec(8)));
});

test("padding distinto → claves distintas", () => {
  assert.notEqual(claveLayout(spec(8)), claveLayout(spec(16)));
});
