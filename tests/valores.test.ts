import { test } from "node:test";
import assert from "node:assert";
import {
  applyRawFormat, currentRawFormat,
  applyShowRaw, currentShowRaw,
  applyPreference, currentPreference,
} from "../src/plugin/utils/valores.ts";

test("defaults: HEX, mostrar true, preference VARIABLE", () => {
  assert.equal(currentRawFormat(), "HEX");
  assert.equal(currentShowRaw(), true);
  assert.equal(currentPreference(), "VARIABLE");
});

test("aplicarX cambia el state y se puede restaurar", () => {
  applyRawFormat("RGB");
  applyShowRaw(false);
  applyPreference("STYLE");
  assert.equal(currentRawFormat(), "RGB");
  assert.equal(currentShowRaw(), false);
  assert.equal(currentPreference(), "STYLE");
  applyRawFormat("HEX");
  applyShowRaw(true);
  applyPreference("VARIABLE");
});
