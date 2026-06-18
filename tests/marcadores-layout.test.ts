import { test } from "node:test";
import assert from "node:assert";
import { marcasLayout, estiloCota, iconoDireccion, textoDimension, valorDim, valorColor, valorSpacing, nombreCorto, separarColisiones, carrilDeMarca, iconoAlineacion, esChico, agruparPadding } from "../src/plugin/utils/marcadores-layout.ts";
import { aplicarUnidad } from "../src/plugin/utils/espaciado.ts";

test("marcasLayout: cada padding va a su lado con su valor", () => {
  const frame = { x: 0, y: 0, width: 200, height: 100 };
  const padding = { left: 16, top: 8, right: 24, bottom: 0 };
  const marcas = marcasLayout(frame, padding, [], "HORIZONTAL", false);
  const porLado = Object.fromEntries(marcas.map((m) => [m.lado, m.valor]));
  assert.equal(porLado.left, "16");
  assert.equal(porLado.top, "8");
  assert.equal(porLado.right, "24");
  assert.equal(porLado.bottom, undefined); // padding 0 → sin marca
});

test("marcasLayout: padding left centrado vertical, top centrado horizontal", () => {
  const frame = { x: 0, y: 0, width: 200, height: 100 };
  const marcas = marcasLayout(frame, { left: 16, top: 8, right: 0, bottom: 0 }, [], "HORIZONTAL", false);
  assert.equal(marcas.find((m) => m.lado === "left").centro, 50);  // frame.y + height/2
  assert.equal(marcas.find((m) => m.lado === "top").centro, 100);  // frame.x + width/2
});

test("marcasLayout: gap HORIZONTAL → lado top en el centro del hueco", () => {
  const frame = { x: 0, y: 0, width: 200, height: 100 };
  const gaps = [{ x: 60, y: 0, width: 12, height: 100 }];
  const marcas = marcasLayout(frame, { left: 0, top: 0, right: 0, bottom: 0 }, gaps, "HORIZONTAL", false);
  assert.deepEqual(marcas, [{ lado: "top", centro: 66, desde: 60, hasta: 72, valor: "12", tipo: "spacing" }]);
});

test("marcasLayout: gap VERTICAL → lado left", () => {
  const frame = { x: 0, y: 0, width: 100, height: 200 };
  const gaps = [{ x: 0, y: 50, width: 100, height: 20 }];
  const marcas = marcasLayout(frame, { left: 0, top: 0, right: 0, bottom: 0 }, gaps, "VERTICAL", false);
  assert.equal(marcas[0].lado, "left");
  assert.equal(marcas[0].centro, 60);
  assert.equal(marcas[0].valor, "20");
});

test("marcasLayout: spacingAuto → gap dice Auto", () => {
  const frame = { x: 0, y: 0, width: 200, height: 100 };
  const gaps = [{ x: 60, y: 0, width: 30, height: 100 }];
  const marcas = marcasLayout(frame, { left: 0, top: 0, right: 0, bottom: 0 }, gaps, "HORIZONTAL", true);
  assert.equal(marcas[0].valor, "Auto");
});

test("marcasLayout: respeta rem", () => {
  aplicarUnidad("rem");
  const marcas = marcasLayout({ x: 0, y: 0, width: 100, height: 100 }, { left: 16, top: 0, right: 0, bottom: 0 }, [], "HORIZONTAL", false);
  assert.equal(marcas.find((m) => m.lado === "left").valor, "1rem");
  aplicarUnidad("px");
});

test("marcasLayout: gaps de igual valor superpuestos → uno solo (wrap)", () => {
  const frame = { x: 0, y: 0, width: 200, height: 100 };
  const gaps = [{ x: 80, y: 0, width: 12, height: 40 }, { x: 85, y: 60, width: 12, height: 40 }];
  const marcas = marcasLayout(frame, { left: 0, top: 0, right: 0, bottom: 0 }, gaps, "HORIZONTAL", false);
  assert.equal(marcas.filter((m) => m.tipo === "spacing").length, 1);
});

test("estiloCota mapea el resizing a las puntas de la cota", () => {
  assert.equal(estiloCota("Fixed"), "fixed");
  assert.equal(estiloCota("Fill"), "fill");
  assert.equal(estiloCota("Hug"), "hug");
});

test("iconoDireccion elige según dirección y wrap", () => {
  assert.equal(iconoDireccion("HORIZONTAL", false), "flecha-h");
  assert.equal(iconoDireccion("VERTICAL", false), "flecha-v");
  assert.equal(iconoDireccion("HORIZONTAL", true), "grilla-h");
  assert.equal(iconoDireccion("VERTICAL", true), "grilla-v");
});

test("textoDimension: Fixed con variable incluye nombre y valor", () => {
  assert.equal(textoDimension("Fixed", 240, "px", "sizing/card-width"), "Fixed sizing/card-width (240)");
});

test("textoDimension: Hug sin variable es resizing + valor", () => {
  assert.equal(textoDimension("Hug", 88, "px"), "Hug 88");
});

test("textoDimension: respeta rem", () => {
  assert.equal(textoDimension("Fixed", 16, "rem"), "Fixed 1rem");
});

test("marcasLayout con spacingVars → nombre y valor separados", () => {
  const marcas = marcasLayout({ x: 0, y: 0, width: 200, height: 100 }, { left: 16, top: 0, right: 0, bottom: 0 }, [], "HORIZONTAL", false, { paddingLeft: "space/padding-1x" });
  const m = marcas.find((x) => x.lado === "left");
  assert.equal(m.nombre, "padding-1x");
  assert.equal(m.valor, "16");
});

test("nombreCorto: último segmento tras la barra", () => {
  assert.equal(nombreCorto("space/padding-1x"), "padding-1x");
  assert.equal(nombreCorto("simple"), "simple");
});

test("valorDim: con variable → resizing + chip + (valor)", () => {
  assert.deepEqual(valorDim("Fixed", 240, "px", "sizing/card-width"), [{ texto: "Fixed" }, { chip: "sizing/card-width" }, { texto: "(240)" }]);
});
test("valorDim: sin variable → resizing + valor en texto", () => {
  assert.deepEqual(valorDim("Hug", 88, "px"), [{ texto: "Hug 88" }]);
});
test("valorColor: variable/style → chip + (raw)", () => {
  assert.deepEqual(valorColor({ clave: "fill", valor: "color/surface", formato: "VARIABLE", rawValue: "#FFFFFF" }), [{ chip: "color/surface" }, { texto: "(#FFFFFF)" }]);
});
test("valorColor: hardcoded → solo texto", () => {
  assert.deepEqual(valorColor({ clave: "fill", valor: "#000000", formato: "HARDCODED" }), [{ texto: "#000000" }]);
});
test("valorSpacing: con variable → chip + (valor)", () => {
  assert.deepEqual(valorSpacing(16, "px", "space/padding-1x"), [{ chip: "space/padding-1x" }, { texto: "(16)" }]);
});
test("valorSpacing: sin variable → solo texto", () => {
  assert.deepEqual(valorSpacing(8, "px"), [{ texto: "8" }]);
});

test("separarColisiones: sin solape deja los centros igual", () => {
  assert.deepEqual(separarColisiones([0, 100], [10, 10], 4), [0, 100]);
});

test("separarColisiones: dos centros iguales se separan tamaño+sep", () => {
  const r = separarColisiones([50, 50], [10, 10], 4);
  assert.equal(r[0], 50);
  assert.equal(r[1], 64); // 50→55 (borde), +4 sep = 59 inicio, +5 mitad = 64
});

test("separarColisiones: respeta el orden original aunque entren desordenados", () => {
  const r = separarColisiones([100, 0], [10, 10], 4);
  assert.equal(r[1], 0);   // el de centro menor no se mueve
  assert.equal(r[0], 100); // el de centro mayor no solapa
});

test("carrilDeMarca: padding top arriba; bottom/left/right abajo", () => {
  assert.equal(carrilDeMarca("top", "padding"), "top");
  assert.equal(carrilDeMarca("bottom", "padding"), "bottom");
  assert.equal(carrilDeMarca("left", "padding"), "bottom");
  assert.equal(carrilDeMarca("right", "padding"), "bottom");
});

test("carrilDeMarca: gap horizontal arriba, gap vertical a la izquierda", () => {
  assert.equal(carrilDeMarca("top", "spacing"), "top");
  assert.equal(carrilDeMarca("left", "spacing"), "left");
});

test("iconoAlineacion: vertical mapea Start/Center/End a left/center/right", () => {
  assert.equal(iconoAlineacion("VERTICAL", "Start"), "align-v-left");
  assert.equal(iconoAlineacion("VERTICAL", "Center"), "align-v-center");
  assert.equal(iconoAlineacion("VERTICAL", "End"), "align-v-right");
});

test("iconoAlineacion: horizontal mapea a top/center/bottom y baseline", () => {
  assert.equal(iconoAlineacion("HORIZONTAL", "Start"), "align-h-top");
  assert.equal(iconoAlineacion("HORIZONTAL", "Center"), "align-h-center");
  assert.equal(iconoAlineacion("HORIZONTAL", "End"), "align-h-bottom");
  assert.equal(iconoAlineacion("HORIZONTAL", "Baseline"), "align-baseline");
});

test("esChico: tag (74x24) es chico; card (240x92) no; GRID nunca", () => {
  assert.equal(esChico(74, 24, "HORIZONTAL"), true);
  assert.equal(esChico(240, 92, "VERTICAL"), false);
  assert.equal(esChico(40, 40, "GRID"), false);
});

test("agruparPadding: uniforme → una etiqueta", () => {
  assert.deepEqual(agruparPadding({ left: 16, top: 16, right: 16, bottom: 16 }), [{ clave: "padding", eje: "v", valor: 16 }]);
});
test("agruparPadding: por eje → padding-y y padding-x", () => {
  assert.deepEqual(agruparPadding({ left: 32, top: 24, right: 32, bottom: 24 }), [
    { clave: "padding-y", eje: "v", valor: 24 },
    { clave: "padding-x", eje: "h", valor: 32 },
  ]);
});
test("agruparPadding: por lado, omite 0", () => {
  assert.deepEqual(agruparPadding({ left: 5, top: 10, right: 20, bottom: 0 }), [
    { clave: "top", eje: "v", valor: 10 },
    { clave: "left", eje: "h", valor: 5 },
    { clave: "right", eje: "h", valor: 20 },
  ]);
});
test("agruparPadding: uniforme con variable lleva nombreCorto", () => {
  assert.deepEqual(agruparPadding({ left: 16, top: 16, right: 16, bottom: 16 }, { paddingLeft: "space/padding-1x", paddingTop: "space/padding-1x", paddingRight: "space/padding-1x", paddingBottom: "space/padding-1x" }), [{ clave: "padding", eje: "v", valor: 16, nombre: "padding-1x" }]);
});
