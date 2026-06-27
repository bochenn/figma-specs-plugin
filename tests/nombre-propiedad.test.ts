import { test } from "node:test";
import assert from "node:assert";
import { propertyName } from "../src/plugin/utils/propiedades.ts";

test("saca el suffix #id", () => {
  assert.equal(propertyName("Show icon#8:0"), "Show icon");
});

test("sin # devuelve igual", () => {
  assert.equal(propertyName("Variant"), "Variant");
});

test("string vacío → vacío", () => {
  assert.equal(propertyName(""), "");
});
