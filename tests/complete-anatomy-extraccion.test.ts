import { test } from "node:test";
import assert from "node:assert";
import { extraerCompleteAnatomy } from "../src/plugin/extraccion/properties.ts";
import type { SetNorm, NodoLike } from "../src/plugin/modelo/tipos.ts";

function variante(props: Record<string, string>, hijos: { id: string; name: string; type: string }[]): {
  variantProperties: Record<string, string>;
  raiz: NodoLike;
} {
  return {
    variantProperties: props,
    raiz: { id: "r", name: "Root", type: "COMPONENT", children: hijos.map((h) => ({ ...h })) },
  };
}

test("una variante con una capa extra → ese elemento es adicional", () => {
  const set: SetNorm = {
    propiedades: { Tone: ["A", "B"] },
    defaultProps: { Tone: "A" },
    variantes: [
      variante({ Tone: "A" }, [{ id: "l", name: "Label", type: "TEXT" }]),
      variante({ Tone: "B" }, [{ id: "l", name: "Label", type: "TEXT" }, { id: "i", name: "Icon", type: "INSTANCE" }]),
    ],
  };
  assert.deepEqual(extraerCompleteAnatomy(set), [
    { variante: "Tone=B", nombre: "Icon", tipo: "INSTANCE" },
  ]);
});

test("todas las variantes iguales al default → []", () => {
  const set: SetNorm = {
    propiedades: { Tone: ["A", "B"] },
    defaultProps: { Tone: "A" },
    variantes: [
      variante({ Tone: "A" }, [{ id: "l", name: "Label", type: "TEXT" }]),
      variante({ Tone: "B" }, [{ id: "l", name: "Label", type: "TEXT" }]),
    ],
  };
  assert.deepEqual(extraerCompleteAnatomy(set), []);
});
