import type { LayoutSpec, NodoLike, Unidad } from "../modelo/tipos.ts";
import { hexARgb } from "../utils/color.ts";
import { frameVertical, frameHorizontal, texto, enColumnas, fillTematizado, chipVariable, tarjeta, filaPill, FONT_BOLD, textoClave, textoValor, tagSeccion } from "./frames.ts";
import { varsTema } from "../utils/variables-tema.ts";
import { rectsPadding, rectsSpacing, type Rect } from "../utils/overlays.ts";
import { unidadActual, etiquetaSpacing } from "../utils/espaciado.ts";
import { recorrerAutoLayout } from "../traversal/recorrer-autolayout.ts";
import { marcasLayout, estiloCota, iconoDireccion, iconoAlineacion, valorDim, valorColor, valorSpacing, separarColisiones, carrilDeMarca, esChico, nombreCorto, type ParteValor, type Marca } from "../utils/marcadores-layout.ts";
import { rectsGrid, textoGrid, gridSpecDe, franjasGridAutolayout } from "../utils/grilla.ts";
import { prefijoProfundidad } from "../utils/jerarquia.ts";
import type { GridSpec } from "../modelo/tipos.ts";
import { nodoIcono, nodoIconoTipo } from "./iconos.ts";

const AZUL: RGB = { r: 0.05, g: 0.4, b: 0.85 };
const VERDE: RGB = { r: 0.1, g: 0.7, b: 0.3 };
const NARANJA: RGB = { r: 1, g: 0.5, b: 0.1 };
const ROJO: RGB = { r: 1, g: 0.1, b: 0.3 };

// Cotas: pill/fondo oscuro + cápsula del nombre de variable en claro + texto.
interface ParCota { oscuro: RGB; claro: RGB; texto: RGB; }
const COTA_PADDING: ParCota = { oscuro: hexARgb("#007BE5"), claro: hexARgb("#62ACFF"), texto: hexARgb("#FFFFFF") }; // azul
const COTA_GAP: ParCota     = { oscuro: hexARgb("#FF24BD"), claro: hexARgb("#FF84DA"), texto: hexARgb("#FFFFFF") }; // magenta
const COTA_DIM: ParCota     = { oscuro: hexARgb("#F24822"), claro: hexARgb("#F6866D"), texto: hexARgb("#FFFFFF") }; // rojo

// Margen del artwork reservado para las anotaciones (arriba e izquierda).
// 80px: la cota vertical (44) + el número de la medida (hasta ~3 dígitos) deben
// entrar sin cortarse contra el borde izquierdo.
const MARGEN = 96;
const MARGEN_IZQ = 160; // margen izquierdo ancho: aloja la cota de alto + breadcrumb del artwork
const RESPIRO = 16; // borde derecho e inferior

// Lado derecho de una fila: textos y chips según las partes.
async function valorConChips(partes: ParteValor[]): Promise<FrameNode> {
  const f = frameHorizontal("Valor", 4);
  f.counterAxisAlignItems = "CENTER";
  for (const p of partes) {
    if ("chip" in p) f.appendChild(await chipVariable(p.chip));
    else f.appendChild(await texto(p.texto, 12));
  }
  return f;
}

// Fila del panel: pill con ícono + label + partes (textos y chips).
async function filaPropiedad(iconoKey: string, label: string, partes: ParteValor[]): Promise<FrameNode> {
  const nodos: SceneNode[] = [nodoIcono(iconoKey), await textoClave(`${label}:`)];
  for (const p of partes) {
    if ("chip" in p) nodos.push(await chipVariable(p.chip));
    else nodos.push(await textoValor(p.texto));
  }
  return filaPill(nodos);
}

const ANCHO_BREADCRUMB = 160;
const GRIS_ANCESTRO: RGB = { r: 0.6, g: 0.6, b: 0.6 };

// Columna de jerarquía: una fila por ancestro (raíz→elemento), con icono de tipo
// e indentación progresiva. Los ancestros van en gris; el último en color normal.
// Ancho fijo para alinear los artworks.
async function breadcrumb(camino: { nombre: string; tipo: string }[]): Promise<FrameNode> {
  const col = frameVertical("Hierarchy", 4);
  col.counterAxisSizingMode = "FIXED";
  col.resize(ANCHO_BREADCRUMB, col.height);
  for (let i = 0; i < camino.length; i++) {
    const fila = frameHorizontal("Capa", 4);
    fila.counterAxisAlignItems = "CENTER";
    fila.paddingLeft = i * 12;
    const icono = nodoIconoTipo(camino[i].tipo, 16);
    if (icono) fila.appendChild(icono);
    const t = await texto(camino[i].nombre, 12);
    if (i < camino.length - 1) t.fills = [{ type: "SOLID", color: GRIS_ANCESTRO }];
    fila.appendChild(t);
    col.appendChild(fila);
  }
  return col;
}

// Filas de padding del panel: una sola "Padding" si los 4 lados son uniformes; si no,
// una fila por lado (Top/Right/Bottom/Left).
async function filasPadding(p: LayoutSpec["padding"], sv: LayoutSpec["spacingVars"], u: Unidad): Promise<FrameNode[]> {
  const uniforme = p.left === p.top && p.top === p.right && p.right === p.bottom
    && sv.paddingLeft === sv.paddingTop && sv.paddingTop === sv.paddingRight && sv.paddingRight === sv.paddingBottom;
  if (uniforme) return [await filaPropiedad("padding", "Padding", valorSpacing(p.left, u, sv.paddingLeft))];
  return [
    await filaPropiedad("padding", "Padding top", valorSpacing(p.top, u, sv.paddingTop)),
    await filaPropiedad("padding", "Padding right", valorSpacing(p.right, u, sv.paddingRight)),
    await filaPropiedad("padding", "Padding bottom", valorSpacing(p.bottom, u, sv.paddingBottom)),
    await filaPropiedad("padding", "Padding left", valorSpacing(p.left, u, sv.paddingLeft)),
  ];
}

// Construye el exhibit (bloque de texto) de una capa con Auto Layout como tarjeta.
async function exhibit(spec: LayoutSpec): Promise<FrameNode> {
  const u = unidadActual();
  const sv = spec.spacingVars;
  const filas: FrameNode[] = [];
  filas.push(await filaPropiedad("width", "Width", valorDim(spec.resizingHorizontal, spec.width, u, spec.widthVar)));
  filas.push(await filaPropiedad("height", "Height", valorDim(spec.resizingVertical, spec.height, u, spec.heightVar)));
  if (spec.fill) filas.push(await filaPropiedad("fill", "Fill", valorColor(spec.fill)));
  if (spec.stroke) filas.push(await filaPropiedad("stroke", "Stroke", valorColor(spec.stroke)));

  if (spec.direccion === "GRID") {
    filas.push(await filaPropiedad("dir-grid", "Direction", [{ texto: "Grid" }]));
    if (spec.gridColumnas !== undefined) filas.push(await filaPropiedad("columns", "Columns", [{ texto: String(spec.gridColumnas) }]));
    if (spec.gridFilas !== undefined) filas.push(await filaPropiedad("rows", "Rows", [{ texto: String(spec.gridFilas) }]));
    if (spec.gridColumnGap !== undefined) filas.push(await filaPropiedad("spacing-h", "Column gap", valorSpacing(spec.gridColumnGap, u, spec.gridColumnGapVar)));
    if (spec.gridRowGap !== undefined) filas.push(await filaPropiedad("spacing-v", "Row gap", valorSpacing(spec.gridRowGap, u, spec.gridRowGapVar)));
    filas.push(...await filasPadding(spec.padding, sv, u));
    if (spec.cornerRadius) filas.push(await filaPropiedad("corner", "Corner radius", valorSpacing(spec.cornerRadius, u, spec.cornerRadiusVar)));
    if (spec.textStyle) filas.push(await filaPropiedad("text", "Text style", spec.textStyle.nombre ? [{ chip: spec.textStyle.nombre }] : [{ texto: spec.textStyle.resumen ?? "" }]));
    return tarjeta([await texto(`${prefijoProfundidad(spec.profundidad ?? 0)}${spec.elementoNombre} · ${spec.tipo}`, 16, FONT_BOLD)], filas);
  }

  const dirKey = spec.direccion === "HORIZONTAL" ? "dir-horizontal" : "dir-vertical";
  const direccion = (spec.direccion === "HORIZONTAL" ? "Horizontal" : "Vertical") + (spec.wrap ? ", wrapping" : "");
  const gapKey = spec.direccion === "HORIZONTAL" ? "spacing-h" : "spacing-v";
  filas.push(await filaPropiedad(dirKey, "Direction", [{ texto: direccion }]));
  filas.push(await filaPropiedad(iconoAlineacion(spec.direccion, spec.alineacionContraria), "Alignment", [{ texto: `${spec.alineacionPrimaria} / ${spec.alineacionContraria}` }]));
  filas.push(...await filasPadding(spec.padding, sv, u));
  filas.push(await filaPropiedad(gapKey, "Item spacing", valorSpacing(spec.itemSpacing, u, sv.itemSpacing)));
  if (spec.cornerRadius) filas.push(await filaPropiedad("corner", "Corner radius", valorSpacing(spec.cornerRadius, u, spec.cornerRadiusVar)));
  for (const g of spec.grids) filas.push(await filaPropiedad("columns", "Grid", [{ texto: textoGrid(g) }]));
  if (spec.textStyle) filas.push(await filaPropiedad("text", "Text style", spec.textStyle.nombre ? [{ chip: spec.textStyle.nombre }] : [{ texto: spec.textStyle.resumen ?? "" }]));
  return tarjeta([await texto(`${prefijoProfundidad(spec.profundidad ?? 0)}${spec.elementoNombre} · ${spec.tipo}`, 16, FONT_BOLD)], filas);
}

// Dibuja un rect de overlay (semitransparente) en el artwork.
function rectOverlay(r: Rect, color: RGB, opacity: number, artwork: FrameNode): void {
  const rect = figma.createRectangle();
  rect.x = r.x;
  rect.y = r.y;
  rect.resize(Math.max(r.width, 0.01), Math.max(r.height, 0.01));
  rect.fills = [{ type: "SOLID", color, opacity }];
  artwork.appendChild(rect);
}

// Banda overlay con fill claro + borde punteado del color saturado del chip.
function bandaPunteada(r: Rect, colorFill: RGB, colorStroke: RGB, artwork: FrameNode): void {
  const rect = figma.createRectangle();
  rect.x = r.x;
  rect.y = r.y;
  rect.resize(Math.max(r.width, 0.01), Math.max(r.height, 0.01));
  rect.fills = [{ type: "SOLID", color: colorFill, opacity: 0.12 }];
  rect.strokes = [{ type: "SOLID", color: colorStroke }];
  rect.strokeWeight = 1;
  rect.dashPattern = [3, 3];
  artwork.appendChild(rect);
}

const SEP_CHIP = 4;     // separación mínima entre cotas del mismo carril
const SEP_VALOR = 4;    // separación constante entre el chip de la cota y su bracket
const FILA_TOP = 24;    // distancia de la fila superior sobre el borde del elemento
const FILA_BOT = 8;     // distancia de la fila inferior bajo el borde
const COL_IZQ = 8;      // distancia de la columna izquierda al borde

// Chip de spacing (padding/gap): con variable → cotaConNombre; sin variable → cota.
async function chipSpacing(val: number, par: ParCota, artwork: FrameNode, varName?: string): Promise<FrameNode> {
  const t = etiquetaSpacing(val, unidadActual());
  return varName ? await cotaConNombre(nombreCorto(varName), t, par, artwork) : await cota(t, par, artwork);
}

// Ubica padding (por lado) + gaps como callouts afuera, exactamente como DesignDoc:
// cada banda se mide con un BRACKET corto (la cota con topes, del color de la banda)
// pegado al borde — vertical a la derecha para top/bottom/gaps verticales, horizontal
// abajo para left/right/gaps horizontales — con el chip al lado.
async function dibujarSpacingCallouts(artwork: FrameNode, clon: FrameNode, spec: LayoutSpec, gaps: Rect[]): Promise<void> {
  const p = spec.padding;
  const sv = spec.spacingVars;
  const xBr = clon.x + clon.width + 6;   // x del bracket vertical (a la derecha del borde)
  const yBr = clon.y + clon.height + 6;  // y del bracket horizontal (abajo del borde)

  // Bracket vertical (mide una banda de alto `largo` desde `y0`) + chip a la derecha.
  const vertical = (largo: number, y0: number, lineaColor: string, chip: FrameNode) => {
    const br = figma.createNodeFromSvg(svgCotaV("fixed", largo, lineaColor));
    br.x = xBr - 6; br.y = y0; artwork.appendChild(br);
    chip.x = xBr + 6 + SEP_VALOR; chip.y = y0 + largo / 2 - chip.height / 2;
  };
  // Bracket horizontal (mide banda de ancho `largo` desde `x0`) + chip abajo.
  const horizontal = (largo: number, x0: number, lineaColor: string, chip: FrameNode) => {
    const br = figma.createNodeFromSvg(svgCotaH("fixed", largo, lineaColor));
    br.x = x0; br.y = yBr - 6; artwork.appendChild(br);
    chip.x = x0 + largo / 2 - chip.width / 2; chip.y = yBr + 6 + SEP_VALOR;
  };

  if (p.top > 0) vertical(p.top, clon.y, LINEA_PADDING, await chipSpacing(p.top, COTA_PADDING, artwork, sv.paddingTop));
  if (p.bottom > 0) vertical(p.bottom, clon.y + clon.height - p.bottom, LINEA_PADDING, await chipSpacing(p.bottom, COTA_PADDING, artwork, sv.paddingBottom));
  if (p.left > 0) horizontal(p.left, clon.x, LINEA_PADDING, await chipSpacing(p.left, COTA_PADDING, artwork, sv.paddingLeft));
  if (p.right > 0) horizontal(p.right, clon.x + clon.width - p.right, LINEA_PADDING, await chipSpacing(p.right, COTA_PADDING, artwork, sv.paddingRight));
  for (const g of gaps) {
    const val = spec.direccion === "VERTICAL" ? g.height : g.width;
    const chip = spec.spacingAuto ? await cota("Auto", COTA_GAP, artwork) : await chipSpacing(val, COTA_GAP, artwork, sv.itemSpacing);
    if (spec.direccion === "VERTICAL") vertical(g.height, g.y, LINEA_GAP, chip);
    else horizontal(g.width, g.x, LINEA_GAP, chip);
  }
}

// Ubica los badges de padding/gap (y de medidas de hijos) en carriles externos
// (fuera del elemento): fila arriba (padding-top + gaps horizontales + anchos de
// hijos), fila abajo (padding bottom/left/right), columna izquierda (gaps
// verticales + altos de hijos). Devuelve el x mínimo a la izquierda.
async function dibujarMarcas(artwork: FrameNode, marcas: Marca[], clon: FrameNode): Promise<number> {
  const top: { c: FrameNode; centro: number }[] = [];
  const bottom: { c: FrameNode; centro: number }[] = [];
  const left: { c: FrameNode; centro: number }[] = [];
  for (const m of marcas) {
    const par = m.tipo === "padding" ? COTA_PADDING : COTA_GAP;
    const c = m.nombre ? await cotaConNombre(m.nombre, m.valor, par, artwork) : await cota(m.valor, par, artwork);
    const carril = carrilDeMarca(m.lado, m.tipo);
    if (carril === "top") top.push({ c, centro: m.centro });
    else if (carril === "left") left.push({ c, centro: m.centro });
    else {
      let centro = m.centro;
      if (m.tipo === "padding" && m.lado === "left") centro = clon.x + c.width / 2;        // chip pegado a la esquina inferior izquierda
      else if (m.tipo === "padding" && m.lado === "right") centro = clon.x + clon.width - c.width / 2; // a la inferior derecha
      bottom.push({ c, centro });
    }
  }
  const filas: [{ c: FrameNode; centro: number }[], number][] = [[top, clon.y - FILA_TOP], [bottom, clon.y + clon.height + FILA_BOT]];
  for (const [grupo, y] of filas) {
    if (grupo.length === 0) continue;
    const ajustados = separarColisiones(grupo.map((g) => g.centro), grupo.map((g) => g.c.width), SEP_CHIP);
    for (let i = 0; i < grupo.length; i++) { grupo[i].c.x = ajustados[i] - grupo[i].c.width / 2; grupo[i].c.y = y; }
  }
  let minLeftX = clon.x;
  if (left.length > 0) {
    const ajustados = separarColisiones(left.map((g) => g.centro), left.map((g) => g.c.height), SEP_CHIP);
    for (let i = 0; i < left.length; i++) {
      const c = left[i].c;
      c.x = clon.x - COL_IZQ - c.width;
      c.y = ajustados[i] - c.height / 2;
      minLeftX = Math.min(minLeftX, c.x);
    }
  }
  return minLeftX;
}


// Cota simple: pill claro con el valor en color oscuro. El caller la posiciona.
async function cota(valor: string, par: ParCota, artwork: FrameNode): Promise<FrameNode> {
  const c = figma.createFrame();
  c.name = "cota";
  c.layoutMode = "HORIZONTAL";
  c.primaryAxisSizingMode = "AUTO";
  c.counterAxisSizingMode = "AUTO";
  c.counterAxisAlignItems = "CENTER";
  c.paddingTop = c.paddingBottom = 1;
  c.paddingLeft = c.paddingRight = 4;
  c.cornerRadius = 4;
  c.fills = [{ type: "SOLID", color: par.oscuro }];
  const t = await texto(valor, 11);
  t.lineHeight = { unit: "PIXELS", value: 16 };
  t.fills = [{ type: "SOLID", color: par.texto }];
  c.appendChild(t);
  artwork.appendChild(c);
  return c;
}

// Cota de dos partes: pill oscuro con sub-cápsula clara `value` (nombre de variable) +
// el valor numérico; textos en el color de texto del par. Estilo cota.pdf / subchip.pdf.
async function cotaConNombre(nombre: string, valor: string, par: ParCota, artwork: FrameNode): Promise<FrameNode> {
  const c = figma.createFrame();
  c.name = "cota";
  c.layoutMode = "HORIZONTAL";
  c.primaryAxisSizingMode = "AUTO";
  c.counterAxisSizingMode = "AUTO";
  c.counterAxisAlignItems = "CENTER";
  c.itemSpacing = 4;
  c.paddingTop = c.paddingBottom = 2;
  c.paddingLeft = 2;
  c.paddingRight = 4;
  c.cornerRadius = 4;
  c.fills = [{ type: "SOLID", color: par.oscuro }];
  const sub = figma.createFrame();
  sub.name = "value";
  sub.layoutMode = "HORIZONTAL";
  sub.primaryAxisSizingMode = "AUTO";
  sub.counterAxisSizingMode = "AUTO";
  sub.paddingTop = sub.paddingBottom = 0;
  sub.paddingLeft = sub.paddingRight = 2;
  sub.cornerRadius = 2;
  sub.fills = [{ type: "SOLID", color: par.claro }];
  const tn = await texto(nombre, 11);
  tn.lineHeight = { unit: "PIXELS", value: 16 };
  tn.fills = [{ type: "SOLID", color: par.texto }];
  sub.appendChild(tn);
  c.appendChild(sub);
  const tv = await texto(valor, 11);
  tv.lineHeight = { unit: "PIXELS", value: 16 };
  tv.fills = [{ type: "SOLID", color: par.texto }];
  c.appendChild(tv);
  artwork.appendChild(c);
  return c;
}

const COTA_DIM_HEX = "#F24822"; // las cotas de dimensión → rojo (acorde a COTA_DIM)
const GRIS_HEX = "#444444";

// Cota horizontal de `largo` px; las puntas codifican el resizing.
function svgCotaH(estilo: "fixed" | "fill" | "hug", largo: number, color = COTA_DIM_HEX): string {
  const L = largo;
  const base = `<line x1="0" y1="6" x2="${L}" y2="6" stroke="${color}"/>`;
  const topes = `<line x1="0.5" y1="0" x2="0.5" y2="12" stroke="${color}"/><line x1="${L - 0.5}" y1="0" x2="${L - 0.5}" y2="12" stroke="${color}"/>`;
  let puntas = topes; // fixed
  if (estilo === "fill") {
    puntas = `<path d="M6 1 L1 6 L6 11" stroke="${color}" fill="none"/><path d="M${L - 6} 1 L${L - 1} 6 L${L - 6} 11" stroke="${color}" fill="none"/>`;
  } else if (estilo === "hug") {
    puntas = `${topes}<path d="M2 1 L7 6 L2 11" stroke="${color}" fill="none"/><path d="M${L - 2} 1 L${L - 7} 6 L${L - 2} 11" stroke="${color}" fill="none"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${L}" height="12">${base}${puntas}</svg>`;
}

// Cota vertical de `largo` px (misma idea, ejes intercambiados).
function svgCotaV(estilo: "fixed" | "fill" | "hug", largo: number, color = COTA_DIM_HEX): string {
  const L = largo;
  const base = `<line x1="6" y1="0" x2="6" y2="${L}" stroke="${color}"/>`;
  const topes = `<line x1="0" y1="0.5" x2="12" y2="0.5" stroke="${color}"/><line x1="0" y1="${L - 0.5}" x2="12" y2="${L - 0.5}" stroke="${color}"/>`;
  let puntas = topes; // fixed
  if (estilo === "fill") {
    puntas = `<path d="M1 6 L6 1 L11 6" stroke="${color}" fill="none"/><path d="M1 ${L - 6} L6 ${L - 1} L11 ${L - 6}" stroke="${color}" fill="none"/>`;
  } else if (estilo === "hug") {
    puntas = `${topes}<path d="M1 2 L6 7 L11 2" stroke="${color}" fill="none"/><path d="M1 ${L - 2} L6 ${L - 7} L11 ${L - 2}" stroke="${color}" fill="none"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="${L}">${base}${puntas}</svg>`;
}

const LINEA_PADDING = "#007BE5"; // azul, acorde a COTA_PADDING
const LINEA_GAP = "#FF24BD";     // magenta, acorde a COTA_GAP

// Línea de cota vertical centrada en `xCentro`, desde `y`, de `largo` px.
function lineaV(artwork: FrameNode, xCentro: number, y: number, largo: number, color: string): void {
  if (largo <= 0) return;
  const n = figma.createNodeFromSvg(svgCotaV("fixed", largo, color));
  n.x = xCentro - 6;
  n.y = y;
  artwork.appendChild(n);
}

// Línea de cota horizontal centrada en `yCentro`, desde `x`, de `largo` px.
function lineaH(artwork: FrameNode, x: number, yCentro: number, largo: number, color: string): void {
  if (largo <= 0) return;
  const n = figma.createNodeFromSvg(svgCotaH("fixed", largo, color));
  n.x = x;
  n.y = yCentro - 6;
  artwork.appendChild(n);
}

// Dibuja una línea de cota sobre cada banda de padding (azul) y cada gap (rosa).
function dibujarLineasMedida(artwork: FrameNode, clon: FrameNode, spec: LayoutSpec, gaps: Rect[]): void {
  const cx = clon.x + clon.width / 2;
  const cy = clon.y + clon.height / 2;
  const p = spec.padding;
  lineaV(artwork, cx, clon.y, p.top, LINEA_PADDING);
  lineaV(artwork, cx, clon.y + clon.height - p.bottom, p.bottom, LINEA_PADDING);
  lineaH(artwork, clon.x, cy, p.left, LINEA_PADDING);
  lineaH(artwork, clon.x + clon.width - p.right, cy, p.right, LINEA_PADDING);
  for (const g of gaps) {
    if (spec.direccion === "VERTICAL") lineaV(artwork, g.x + g.width / 2, g.y, g.height, LINEA_GAP);
    else lineaH(artwork, g.x, g.y + g.height / 2, g.width, LINEA_GAP);
  }
}

// Íconos de dirección (24x24): flecha → / ↓, variante con grilla si hay wrap.
const ICONOS: Record<string, string> = {
  "flecha-h": `<path d="M3 12 H21 M15 6 L21 12 L15 18" stroke="${GRIS_HEX}" fill="none" stroke-width="2"/>`,
  "flecha-v": `<path d="M12 3 V21 M6 15 L12 21 L18 15" stroke="${GRIS_HEX}" fill="none" stroke-width="2"/>`,
  "grilla-h": `<rect x="3" y="3" width="6" height="6" fill="${GRIS_HEX}"/><rect x="11" y="3" width="6" height="6" fill="${GRIS_HEX}"/><rect x="3" y="11" width="6" height="6" fill="${GRIS_HEX}"/><path d="M14 17 H21 M18 14 L21 17 L18 20" stroke="${GRIS_HEX}" fill="none" stroke-width="2"/>`,
  "grilla-v": `<rect x="3" y="3" width="6" height="6" fill="${GRIS_HEX}"/><rect x="11" y="3" width="6" height="6" fill="${GRIS_HEX}"/><rect x="3" y="11" width="6" height="6" fill="${GRIS_HEX}"/><path d="M17 14 V21 M14 18 L17 21 L20 18" stroke="${GRIS_HEX}" fill="none" stroke-width="2"/>`,
};

function svgIcono(nombre: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">${ICONOS[nombre]}</svg>`;
}

// Cotas de W/H (rojo) con su valor. La de alto se ubica a la izquierda de
// `minLeftX` (lo más a la izquierda que llegaron las cotas de ese lado).
async function dibujarCotas(artwork: FrameNode, clon: FrameNode, spec: LayoutSpec, minLeftX: number): Promise<void> {
  const u = unidadActual();
  const cotaH = figma.createNodeFromSvg(svgCotaH(estiloCota(spec.resizingHorizontal), clon.width));
  cotaH.x = clon.x;
  cotaH.y = clon.y - 44;
  artwork.appendChild(cotaH);
  const tW = await cota(etiquetaSpacing(spec.width, u), COTA_DIM, artwork);
  tW.x = clon.x + clon.width / 2 - tW.width / 2;
  tW.y = clon.y - 44 - SEP_VALOR - tW.height;
  const xLinea = Math.min(clon.x - 44, minLeftX - 28);
  const cotaV = figma.createNodeFromSvg(svgCotaV(estiloCota(spec.resizingVertical), clon.height));
  cotaV.x = xLinea;
  cotaV.y = clon.y;
  artwork.appendChild(cotaV);
  const tH = await cota(etiquetaSpacing(spec.height, u), COTA_DIM, artwork);
  tH.x = xLinea - SEP_VALOR - tH.width;
  tH.y = clon.y + clon.height / 2 - tH.height / 2;
}

const UMBRAL_CHICO = 48; // referencia; el umbral real vive en esChico

// Agranda el artwork (a la derecha/abajo) para contener todas las anotaciones que asoman,
// y que no queden cortadas por el borde del fondo gris ni tapadas por el exhibit.
function ajustarArtwork(artwork: FrameNode, pad = 16): void {
  // Asume hijos con x/y >= 0 (el clon arranca en MARGEN_IZQ/MARGEN y las anotaciones
  // caen dentro): solo se agranda a la derecha/abajo, no se reposiciona el origen.
  let maxX = 0;
  let maxY = 0;
  for (const c of artwork.children) {
    maxX = Math.max(maxX, c.x + c.width);
    maxY = Math.max(maxY, c.y + c.height);
  }
  artwork.resize(Math.max(artwork.width, maxX + pad), Math.max(artwork.height, maxY + pad));
}

// Dibuja el artwork de un contenedor en un modo: "completo" (todo), "dimensiones"
// (solo W/H + medidas de hijos) o "spacing" (solo padding/gap). El clon va corrido
// (MARGEN_IZQ, MARGEN) para dejar lugar a las anotaciones.
async function artworkModo(contenedor: FrameNode, spec: LayoutSpec, _medirHijos: boolean, modo: "completo" | "dimensiones" | "spacing"): Promise<FrameNode> {
  const artwork = figma.createFrame();
  artwork.name = `Artwork ${spec.elementoNombre}`;
  artwork.layoutMode = "NONE";
  artwork.clipsContent = false;
  artwork.fills = fillTematizado(varsTema().fondoArtwork);
  const clon = contenedor.clone();
  artwork.appendChild(clon);
  clon.x = MARGEN_IZQ;
  clon.y = MARGEN;
  artwork.resize(clon.width + MARGEN_IZQ + MARGEN, clon.height + 2 * MARGEN);

  const frameRect: Rect = { x: MARGEN_IZQ, y: MARGEN, width: clon.width, height: clon.height };
  const hijosRects: Rect[] = contenedor.children.map((c) => ({
    x: MARGEN_IZQ + c.x, y: MARGEN + c.y, width: c.width, height: c.height,
  }));
  for (const r of hijosRects) rectOverlay(r, AZUL, 0.25, artwork);
  if (modo !== "dimensiones") for (const r of rectsPadding(frameRect, spec.padding)) bandaPunteada(r, COTA_PADDING.oscuro, COTA_PADDING.oscuro, artwork);
  if (spec.direccion === "GRID") {
    const { columnas, filas } = franjasGridAutolayout(frameRect, spec.padding, spec.gridColumnas ?? 0, spec.gridFilas ?? 0, spec.gridColumnGap ?? 0, spec.gridRowGap ?? 0);
    for (const r of columnas) bandaPunteada(r, ROJO, ROJO, artwork);
    for (const r of filas) bandaPunteada(r, ROJO, ROJO, artwork);
    if (modo !== "dimensiones") await dibujarSpacingCallouts(artwork, clon, spec, []);
    const minLeftX = await dibujarMarcas(artwork, [], clon);
    await dibujarCotas(artwork, clon, spec, minLeftX);
    ajustarArtwork(artwork);
    return artwork;
  }
  const gaps = rectsSpacing(hijosRects, spec.direccion);
  if (modo !== "dimensiones") {
    for (const r of gaps) bandaPunteada(r, COTA_GAP.oscuro, COTA_GAP.oscuro, artwork);
    for (const g of spec.grids) {
      for (const r of rectsGrid(frameRect, g)) bandaPunteada(r, ROJO, ROJO, artwork);
    }
    await dibujarSpacingCallouts(artwork, clon, spec, gaps);
  }

  const minLeftX = await dibujarMarcas(artwork, [], clon);
  if (modo !== "spacing") await dibujarCotas(artwork, clon, spec, minLeftX);

  if (modo !== "dimensiones") {
    const icono = figma.createNodeFromSvg(svgIcono(iconoDireccion(spec.direccion, spec.wrap)));
    icono.x = 8;
    icono.y = 8;
    artwork.appendChild(icono);
  }
  ajustarArtwork(artwork);
  return artwork;
}

// Envuelve un artwork con un título arriba.
async function artworkEtiquetado(titulo: string, art: FrameNode): Promise<FrameNode> {
  const col = frameVertical(titulo, 8);
  col.appendChild(await texto(titulo, 16));
  col.appendChild(art);
  return col;
}

// Artwork de un contenedor: único si es grande; dividido en Dimensions | Spacing
// (etiquetados) si es chico.
async function artworkDe(contenedor: FrameNode, spec: LayoutSpec, medirHijos: boolean): Promise<FrameNode> {
  if (!esChico(contenedor.width, contenedor.height, spec.direccion)) {
    return await artworkModo(contenedor, spec, medirHijos, "completo");
  }
  const cont = frameHorizontal(`Artwork ${spec.elementoNombre}`, 48);
  cont.clipsContent = false;
  cont.appendChild(await artworkEtiquetado("Dimensions", await artworkModo(contenedor, spec, medirHijos, "dimensiones")));
  cont.appendChild(await artworkEtiquetado("Spacing", await artworkModo(contenedor, spec, medirHijos, "spacing")));
  return cont;
}

// Artwork de un frame con layout grids pero sin Auto Layout: clon + franjas
// rojas, sin marcadores ni cotas.
async function artworkGrids(frame: FrameNode, grids: GridSpec[]): Promise<FrameNode> {
  const artwork = figma.createFrame();
  artwork.name = `Artwork ${frame.name}`;
  artwork.layoutMode = "NONE";
  artwork.clipsContent = false;
  artwork.fills = fillTematizado(varsTema().fondoArtwork);
  const clon = frame.clone();
  artwork.appendChild(clon);
  clon.x = 0;
  clon.y = 0;
  artwork.resize(clon.width + RESPIRO, clon.height + RESPIRO);
  const frameRect: Rect = { x: 0, y: 0, width: clon.width, height: clon.height };
  for (const g of grids) {
    for (const r of rectsGrid(frameRect, g)) bandaPunteada(r, ROJO, ROJO, artwork);
  }
  return artwork;
}

// Exhibit reducido de un frame con grids (nombre · tipo + líneas Grid).
async function exhibitGrids(frame: SceneNode, grids: GridSpec[]): Promise<FrameNode> {
  const fila = frameVertical(frame.name, 4);
  fila.appendChild(await texto(`${frame.name} · ${frame.type}`, 16));
  for (const g of grids) fila.appendChild(await texto(`Grid: ${textoGrid(g)}`, 12));
  return fila;
}

// Genera el output de Layout and Spacing: una fila artwork+exhibit por cada
// contenedor con Auto Layout (raíz + anidados; mismo orden que extraerLayout).
export async function generarLayout(seleccionado: SceneNode, specs: LayoutSpec[], columnas: number, hideOuter: boolean, itemizar: boolean, medirHijos: boolean): Promise<FrameNode> {
  const specifications = frameVertical("Specifications", 128, 64);
  const spec = frameVertical(`${seleccionado.name} Spec`, 48);
  specifications.appendChild(spec);
  spec.appendChild(await texto(seleccionado.name, 64));
  spec.appendChild(await seccionDeLayout(seleccionado, specs, columnas, hideOuter, itemizar, medirHijos));
  figma.currentPage.appendChild(specifications);
  return specifications;
}

// Construye solo la sección Layout and Spacing (sin Specifications ni título de nodo).
export async function seccionDeLayout(seleccionado: SceneNode, specs: LayoutSpec[], columnas: number, hideOuter: boolean, itemizar: boolean, medirHijos: boolean): Promise<FrameNode> {
  const seccion = frameVertical("Layout and Spacing", 24);
  seccion.clipsContent = false; // los chips/cotas asoman del margen del artwork
  seccion.appendChild(await tagSeccion("Layout and Spacing"));

  const recorridos = recorrerAutoLayout(seleccionado as unknown as NodoLike, itemizar);
  const contenedores = recorridos.map((r) => r.nodo) as unknown as FrameNode[];

  // Con hideOuter, se omite la fila del raíz (solo si la selección misma es el
  // primer contenedor; recorrerAutoLayout devuelve los nodos reales).
  const inicio = hideOuter && contenedores.length > 0 && (contenedores[0] as SceneNode) === seleccionado ? 1 : 0;
  const filas: FrameNode[] = [];
  const n = Math.min(contenedores.length, specs.length);
  for (let i = inicio; i < n; i++) {
    const fila = frameHorizontal(`Layout ${specs[i].elementoNombre}`, 48);
    fila.clipsContent = false; // los chips/cotas del artwork pueden asomar del margen
    fila.appendChild(await breadcrumb(recorridos[i].camino ?? [{ nombre: specs[i].elementoNombre, tipo: specs[i].tipo }]));
    fila.appendChild(await artworkDe(contenedores[i], specs[i], medirHijos));
    fila.appendChild(await exhibit(specs[i]));
    filas.push(fila);
  }

  // Raíz con layout grids pero sin Auto Layout: fila propia. No depende de
  // hideOuter: el grid de la pantalla es información propia, no una anotación de
  // layout del contenedor exterior (esas son padding/spacing/resizing).
  const raizEnFilas = contenedores.length > 0 && (contenedores[0] as SceneNode) === seleccionado;
  // Acceso directo a layoutGrids (no `"layoutGrids" in seleccionado`): el `in`
  // sobre un nodo real de Figma no es confiable; acceder y chequear Array sí.
  const gridsRaizRaw = (seleccionado as { layoutGrids?: ReadonlyArray<Parameters<typeof gridSpecDe>[0]> }).layoutGrids;
  if (!raizEnFilas && Array.isArray(gridsRaizRaw)) {
    const gridsRaiz = gridsRaizRaw.map(gridSpecDe);
    if (gridsRaiz.length > 0) {
      const fila = frameHorizontal(`Layout ${seleccionado.name}`, 48);
      fila.clipsContent = false;
      fila.appendChild(await breadcrumb([{ nombre: seleccionado.name, tipo: seleccionado.type }]));
      fila.appendChild(await artworkGrids(seleccionado as FrameNode, gridsRaiz));
      fila.appendChild(await exhibitGrids(seleccionado, gridsRaiz));
      filas.unshift(fila);
    }
  }

  if (filas.length === 0) {
    seccion.appendChild(await texto("No se detectaron capas con Auto Layout.", 16));
  } else if (columnas > 1) {
    const cont = enColumnas(filas, columnas);
    cont.clipsContent = false;
    seccion.appendChild(cont);
  } else {
    for (const f of filas) seccion.appendChild(f);
  }

  return seccion;
}

const ANCHO_MUESTRA = 150;
const ALTO_MUESTRA = 28;

// Caja de tamaño fijo SIN auto-layout: la muestra (chip/cota/línea) se posiciona
// absoluta y centrada, igual que en el artwork real (así no se colapsa).
function muestraBox(): FrameNode {
  const box = figma.createFrame();
  box.name = "Muestra";
  box.layoutMode = "NONE";
  box.clipsContent = false;
  box.fills = [];
  box.resize(ANCHO_MUESTRA, ALTO_MUESTRA);
  return box;
}

// Mete la muestra en la caja y la centra verticalmente, pegada a la izquierda.
function ponerMuestra(box: FrameNode, nodo: SceneNode): void {
  box.appendChild(nodo);
  nodo.x = 0;
  nodo.y = (ALTO_MUESTRA - nodo.height) / 2;
}

// Fila de la leyenda: muestra visual (ancho fijo) + explicación.
async function filaLeyenda(box: FrameNode, explicacion: string): Promise<FrameNode> {
  const fila = frameHorizontal("Item", 16);
  fila.counterAxisAlignItems = "CENTER";
  fila.appendChild(box);
  fila.appendChild(await texto(explicacion, 14));
  return fila;
}

// Bloque "How to read these specs": explica las convenciones del artwork de Layout
// con muestras visuales reales.
export async function seccionLeyenda(): Promise<FrameNode> {
  const sec = frameVertical("How to read these specs", 16);
  sec.appendChild(await texto("How to read these specs", 36));

  const b1 = muestraBox();
  ponerMuestra(b1, await cota("240", COTA_DIM, b1));
  sec.appendChild(await filaLeyenda(b1, "Dimension cota: element or child width/height (red)."));

  const b2 = muestraBox();
  ponerMuestra(b2, await cotaConNombre("padding-1x", "16", COTA_PADDING, b2));
  sec.appendChild(await filaLeyenda(b2, "Padding: distance to the edge; chip with the variable (blue) + value."));

  const b3 = muestraBox();
  ponerMuestra(b3, await cotaConNombre("gap-0_5x", "8", COTA_GAP, b3));
  sec.appendChild(await filaLeyenda(b3, "Item spacing (gap): space between children (pink)."));

  const b4 = muestraBox();
  ponerMuestra(b4, figma.createNodeFromSvg(svgCotaH("fixed", 40)));
  sec.appendChild(await filaLeyenda(b4, "Measurement line: marks the span of that band."));

  const b5 = muestraBox();
  ponerMuestra(b5, await chipVariable("sizing/card-width"));
  sec.appendChild(await filaLeyenda(b5, "Grey chip in the panel: bound variable (resolved value in parentheses)."));

  const b6 = muestraBox();
  ponerMuestra(b6, await texto("card", 12));
  sec.appendChild(await filaLeyenda(b6, "Left of each row: the layer hierarchy; the row's element is in bold."));

  sec.appendChild(await texto("For small elements the artwork is split in two: Dimensions (W/H) and Spacing (padding & gap).", 14));
  return sec;
}
