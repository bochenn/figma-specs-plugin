import { test } from "node:test";
import assert from "node:assert";
import { groupInventory } from "../src/plugin/inventario/agrupar.ts";
import type { StyleEntry } from "../src/plugin/modelo/tipos.ts";

test("mismo style + mismo appliedAs en dos capas → una row", () => {
  const entries: StyleEntry[] = [
    { table: "color", name: "Error", appliedAs: "Border color", layer: "Active indicator" },
    { table: "color", name: "Error", appliedAs: "Border color", layer: "Caret" },
  ];
  const rows = groupInventory(entries);
  assert.equal(rows.length, 1);
  assert.deepEqual(rows[0], {
    table: "color", name: "Error", appliedAs: "Border color", appliedTo: "Active indicator, Caret",
  });
});

test("mismo style con distinto appliedAs → dos rows", () => {
  const entries: StyleEntry[] = [
    { table: "color", name: "Error", appliedAs: "Background color", layer: "Alert" },
    { table: "color", name: "Error", appliedAs: "Border color", layer: "Caret" },
  ];
  const rows = groupInventory(entries);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].appliedAs, "Background color");
  assert.equal(rows[1].appliedAs, "Border color");
});

test("separa por table color/text", () => {
  const entries: StyleEntry[] = [
    { table: "color", name: "Surface", appliedAs: "Background color", layer: "Card" },
    { table: "text", name: "Body", appliedAs: "Text style", layer: "Label" },
  ];
  const rows = groupInventory(entries);
  assert.equal(rows.filter((f) => f.table === "color").length, 1);
  assert.equal(rows.filter((f) => f.table === "text").length, 1);
});

test("entries variable con swatchHex → row con swatchHex", () => {
  const entries: StyleEntry[] = [
    { table: "variable", name: "Color/Action", appliedAs: "Background color", layer: "A", swatchHex: "#0E68D4" },
    { table: "variable", name: "Color/Action", appliedAs: "Background color", layer: "B", swatchHex: "#0E68D4" },
  ];
  const rows = groupInventory(entries);
  assert.equal(rows.length, 1);
  assert.deepEqual(rows[0], {
    table: "variable", name: "Color/Action", appliedAs: "Background color", appliedTo: "A, B", swatchHex: "#0E68D4",
  });
});
