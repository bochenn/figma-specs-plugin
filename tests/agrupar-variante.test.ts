import { test } from "node:test";
import assert from "node:assert";
import { agruparPorVariante } from "../src/plugin/utils/agrupar-variante.ts";

test("agrupa por variante preservando el orden de primera aparición", () => {
  const elementos = [
    { variante: "Size=M", nombre: "Icon", tipo: "INSTANCE" },
    { variante: "Size=L", nombre: "Badge", tipo: "FRAME" },
    { variante: "Size=M", nombre: "Label", tipo: "TEXT" },
  ];
  assert.deepEqual(agruparPorVariante(elementos), [
    {
      variante: "Size=M",
      elementos: [
        { variante: "Size=M", nombre: "Icon", tipo: "INSTANCE" },
        { variante: "Size=M", nombre: "Label", tipo: "TEXT" },
      ],
    },
    {
      variante: "Size=L",
      elementos: [{ variante: "Size=L", nombre: "Badge", tipo: "FRAME" }],
    },
  ]);
});

test("lista vacía → []", () => {
  assert.deepEqual(agruparPorVariante([]), []);
});
