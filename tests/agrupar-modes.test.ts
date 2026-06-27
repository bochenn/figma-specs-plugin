import { test } from "node:test";
import assert from "node:assert";
import { groupModes } from "../src/plugin/variables/modes.ts";
import type { ModeEntry } from "../src/plugin/modelo/tipos.ts";

const MODOS = [{ modeId: "L", name: "Light" }, { modeId: "D", name: "Dark" }];

function entry(collection: string, appliedAs: string, variableName: string): ModeEntry {
  return {
    collectionName: collection,
    collectionId: `${collection}-id`,
    modes: MODOS,
    layer: "Alert",
    appliedAs,
    variableName,
    values: [{ modeId: "L", value: "#FFFFFF" }, { modeId: "D", value: "#000000" }],
  };
}

test("dos entries de la misma collection → una ModesCollection con dos attributes", () => {
  const cols = groupModes([
    entry("Color", "Background color", "Bg"),
    entry("Color", "Border color", "Bd"),
  ]);
  assert.equal(cols.length, 1);
  assert.equal(cols[0].collectionName, "Color");
  assert.equal(cols[0].collectionId, "Color-id");
  assert.deepEqual(cols[0].modes, MODOS);
  assert.equal(cols[0].attributes.length, 2);
  assert.equal(cols[0].attributes[0].variableName, "Bg");
  assert.equal(cols[0].attributes[1].variableName, "Bd");
});

test("entries de dos collections → dos ModesCollection, en orden de aparición", () => {
  const cols = groupModes([
    entry("Color", "Background color", "Bg"),
    entry("Spacing", "Border color", "Sp"),
  ]);
  assert.deepEqual(cols.map((c) => c.collectionName), ["Color", "Spacing"]);
});
