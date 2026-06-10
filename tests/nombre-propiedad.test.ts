import { test } from "node:test";
import assert from "node:assert";
import { nombrePropiedad } from "../src/plugin/utils/propiedades.ts";

test("saca el sufijo #id", () => {
  assert.equal(nombrePropiedad("Show icon#8:0"), "Show icon");
});

test("sin # devuelve igual", () => {
  assert.equal(nombrePropiedad("Variant"), "Variant");
});

test("string vacío → vacío", () => {
  assert.equal(nombrePropiedad(""), "");
});
