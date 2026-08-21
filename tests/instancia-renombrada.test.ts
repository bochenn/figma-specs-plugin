import { test } from "node:test";
import assert from "node:assert";
import { originName } from "../src/plugin/extraccion/resolver.ts";
import { anatomyRow } from "../src/plugin/utils/tabla-anatomy.ts";
import type { AnatomyElement } from "../src/plugin/modelo/tipos.ts";

// Mínimo para originName: nombre + parent (que puede ser un component set).
const componente = (name: string, setName?: string) =>
  ({ name, parent: setName ? { type: "COMPONENT_SET", name: setName } : null }) as unknown as ComponentNode;

test("originName: mismo nombre que la capa → nada que aclarar", () => {
  assert.equal(originName("page_header", componente("page_header")), undefined);
});

test("originName: capa renombrada → nombre del componente", () => {
  assert.equal(originName("encabezado", componente("page_header")), "page_header");
});

test("originName: variante → usa el nombre del component set, no 'Size=M'", () => {
  assert.equal(originName("encabezado", componente("Size=M", "page_header")), "page_header");
  // y si la capa ya se llama como el set, no aclara nada
  assert.equal(originName("page_header", componente("Size=M", "page_header")), undefined);
});

test("anatomyRow: la aclaración va pegada al nombre en la tabla", () => {
  const el: AnatomyElement = {
    id: "1", name: "encabezado", type: "INSTANCE", isInstance: true,
    instanceOf: "page_header", attributes: [],
  };
  assert.equal(anatomyRow(1, el)[1], "encabezado (Instance of: page_header)");
});
