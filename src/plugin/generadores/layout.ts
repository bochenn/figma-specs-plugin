import type { LayoutSpec, NodeLike, Unit } from "../modelo/tipos.ts";
import { hexToRgb } from "../utils/color.ts";
import { verticalFrame, horizontalFrame, text, inColumns, themedFill, variableChip, card, pillRow, keyText, valueText, appendAll, FONT_MEDIUM, cardHeaderText, BORDER_PILL } from "./frames.ts";
import { themeVars } from "../utils/variables-tema.ts";
import { paddingRects, spacingRects, type Rect } from "../utils/overlays.ts";
import { currentUnit, spacingLabel } from "../utils/espaciado.ts";
import { traverseTree } from "../traversal/recorrer.ts";
import { visibleNode } from "../extraccion/adaptador.ts";
import { capRows } from "../utils/carga.ts";
import { dimStyle, directionIcon, alignmentIcon, dimValue, colorValue, spacingValue, separateCollisions, badgeRail, isSmall, shortName, type ValuePart, type Badge } from "../utils/marcadores-layout.ts";
import { gridRects, gridText, autolayoutGridStripes } from "../utils/grilla.ts";
import { depthPrefix } from "../utils/jerarquia.ts";
import type { GridSpec } from "../modelo/tipos.ts";
import { nodeIcon, nodeTypeIcon, resizingIconKey, dimensionIndicator } from "./iconos.ts";
import { layersTree, treeRowsOf, type TreeRow } from "./layers-card.ts";

const BLUE: RGB = { r: 0.05, g: 0.4, b: 0.85 };
const RED: RGB = { r: 1, g: 0.1, b: 0.3 };

// Callouts: pill/dark bg + variable-name capsule in light + text.
interface CalloutPair { dark: RGB; light: RGB; text: RGB; }
const CALLOUT_PADDING: CalloutPair = { dark: hexToRgb("#007BE5"), light: hexToRgb("#62ACFF"), text: hexToRgb("#FFFFFF") }; // blue
const CALLOUT_GAP: CalloutPair     = { dark: hexToRgb("#FF24BD"), light: hexToRgb("#FF84DA"), text: hexToRgb("#FFFFFF") }; // magenta
const CALLOUT_DIM: CalloutPair     = { dark: hexToRgb("#F24822"), light: hexToRgb("#F6866D"), text: hexToRgb("#FFFFFF") }; // red

// Artwork margin reserved for the annotations (top and left).
// 80px: the vertical callout (44) + the measure number (up to ~3 digits) must
// fit without being clipped against the left border.
const MARGIN = 96;
const MARGIN_LEFT = 160; // left margin width: holds the height callout + artwork breadcrumb
const BREATHE = 16; // border rightSide e inferior

// Panel row: pill with icon + label + parts (texts and chips).
async function propertyRow(iconKey: string, label: string, parts: ValuePart[], mode?: string): Promise<FrameNode> {
  const nodes: SceneNode[] = [nodeIcon(iconKey), await keyText(`${label}:`)];
  for (const p of parts) {
    if ("chip" in p) nodes.push(await variableChip(p.chip));
    else if ("icon" in p) nodes.push(nodeIcon(p.icon, 16));
    else nodes.push(await valueText(p.text));
  }
  // width/height: the mode (Fixed/Hug/Fill) goes at the end as an icon box + text.
  if (mode && resizingIconKey(iconKey, mode)) nodes.push(await dimensionIndicator(iconKey, mode));
  return pillRow(nodes);
}

// Panel padding rows: a single "Padding" if all 4 sides are uniform; otherwise,
// one row per side (Top/Right/Bottom/Left).
async function paddingRows(p: LayoutSpec["padding"], sv: LayoutSpec["spacingVars"], u: Unit): Promise<FrameNode[]> {
  const uniform = p.left === p.top && p.top === p.right && p.right === p.bottom
    && sv.paddingLeft === sv.paddingTop && sv.paddingTop === sv.paddingRight && sv.paddingRight === sv.paddingBottom;
  if (uniform) return [await propertyRow("padding", "Padding", spacingValue(p.left, u, sv.paddingLeft))];
  return [
    await propertyRow("padding", "Padding top", spacingValue(p.top, u, sv.paddingTop)),
    await propertyRow("padding", "Padding right", spacingValue(p.right, u, sv.paddingRight)),
    await propertyRow("padding", "Padding bottom", spacingValue(p.bottom, u, sv.paddingBottom)),
    await propertyRow("padding", "Padding left", spacingValue(p.left, u, sv.paddingLeft)),
  ];
}

// Builds the exhibit (text block) of a layer as a card. `hasAuto` = the layer
// has Auto Layout; leaf layers (no Auto Layout) only show size/fill/stroke/corner.
async function exhibit(spec: LayoutSpec, hasAuto: boolean): Promise<FrameNode> {
  const u = currentUnit();
  const sv = spec.spacingVars;
  const header = await cardHeaderText(`${depthPrefix(spec.depth ?? 0)}${spec.elementName} · ${spec.type}`);
  const rows: FrameNode[] = [];
  rows.push(await propertyRow("width", "Width", dimValue(spec.width, u, spec.widthVar), spec.resizingHorizontal));
  rows.push(await propertyRow("height", "Height", dimValue(spec.height, u, spec.heightVar), spec.resizingVertical));
  if (spec.fill) rows.push(await propertyRow("fill", "Fill", colorValue(spec.fill)));
  if (spec.stroke) rows.push(await propertyRow("stroke", "Stroke", colorValue(spec.stroke)));

  // Leaf layer (no Auto Layout): direction/alignment/padding/gap don't apply.
  if (!hasAuto) {
    if (spec.cornerRadius) rows.push(await propertyRow("corner", "Corner radius", spacingValue(spec.cornerRadius, u, spec.cornerRadiusVar)));
    for (const g of spec.grids) rows.push(await propertyRow("columns", "Grid", [{ text: gridText(g) }]));
    return card([header], rows);
  }

  if (spec.direction === "GRID") {
    rows.push(await propertyRow("dir-grid", "Direction", [{ text: "Grid" }]));
    if (spec.gridColumns !== undefined) rows.push(await propertyRow("columns", "Columns", [{ text: String(spec.gridColumns) }]));
    if (spec.gridRows !== undefined) rows.push(await propertyRow("rows", "Rows", [{ text: String(spec.gridRows) }]));
    if (spec.gridColumnGap !== undefined) rows.push(await propertyRow("spacing-h", "Column gap", spacingValue(spec.gridColumnGap, u, spec.gridColumnGapVar)));
    if (spec.gridRowGap !== undefined) rows.push(await propertyRow("spacing-v", "Row gap", spacingValue(spec.gridRowGap, u, spec.gridRowGapVar)));
    rows.push(...await paddingRows(spec.padding, sv, u));
    if (spec.cornerRadius) rows.push(await propertyRow("corner", "Corner radius", spacingValue(spec.cornerRadius, u, spec.cornerRadiusVar)));
    return card([header], rows);
  }

  const dirKey = spec.direction === "HORIZONTAL" ? "dir-horizontal" : "dir-vertical";
  const direction = (spec.direction === "HORIZONTAL" ? "Horizontal" : "Vertical") + (spec.wrap ? ", wrapping" : "");
  const gapKey = spec.direction === "HORIZONTAL" ? "spacing-h" : "spacing-v";
  rows.push(await propertyRow(dirKey, "Direction", [{ text: direction }]));
  rows.push(await propertyRow(alignmentIcon(spec.direction, spec.counterAlignment), "Alignment", [{ text: `${spec.primaryAlignment} / ${spec.counterAlignment}` }]));
  rows.push(...await paddingRows(spec.padding, sv, u));
  rows.push(await propertyRow(gapKey, "Item spacing", spacingValue(spec.itemSpacing, u, sv.itemSpacing)));
  if (spec.cornerRadius) rows.push(await propertyRow("corner", "Corner radius", spacingValue(spec.cornerRadius, u, spec.cornerRadiusVar)));
  for (const g of spec.grids) rows.push(await propertyRow("columns", "Grid", [{ text: gridText(g) }]));
  return card([header], rows);
}

// Draws an overlay rect (semi-transparent) on the artwork.
function rectOverlay(r: Rect, color: RGB, opacity: number, artwork: FrameNode): void {
  const rect = figma.createRectangle();
  rect.x = r.x;
  rect.y = r.y;
  rect.resize(Math.max(r.width, 0.01), Math.max(r.height, 0.01));
  rect.fills = [{ type: "SOLID", color, opacity }];
  artwork.appendChild(rect);
}

// Overlay band with a light fill + dashed border in the chip's saturated color.
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

const SEP_CHIP = 4;     // minimum separation between callouts in the same rail
const VALUE_SEP = 4;    // constant separation between the callout's chip and its bracket
const ROW_TOP = 24;    // distance of the top row above the element's border
const ROW_BOT = 8;     // distance of the bottom row below the border
const COL_IZQ = 8;      // distance of the left column from the border

// Spacing chip (padding/gap): with variable → namedDim; without → callout.
async function chipSpacing(val: number, par: CalloutPair, artwork: FrameNode, varName?: string): Promise<FrameNode> {
  const t = spacingLabel(val, currentUnit());
  return varName ? await namedDim(shortName(varName), t, par, artwork) : await callout(t, par, artwork);
}

// Places padding (per side) + gaps as callouts outside the element:
// each band is measured with a short BRACKET (the callout with caps, in the band's color)
// flush to the border — vertical on the right for top/bottom/vertical gaps, horizontal
// at the bottom for left/right/horizontal gaps — with the chip beside it.
async function drawSpacingCallouts(artwork: FrameNode, clone: FrameNode, spec: LayoutSpec, gaps: Rect[]): Promise<void> {
  const p = spec.padding;
  const sv = spec.spacingVars;
  const xBr = clone.x + clone.width + 6;   // x of the vertical bracket (to the right of the border)
  const yBr = clone.y + clone.height + 6;  // y of the horizontal bracket (bottom of the border)

  // Vertical bracket (measures a band of height `largo` from `y0`) + chip on the right.
  const vertical = (largo: number, y0: number, lineColor: string, chip: FrameNode) => {
    const br = figma.createNodeFromSvg(svgCalloutV("fixed", largo, lineColor));
    br.x = xBr - 6; br.y = y0; artwork.appendChild(br);
    chip.x = xBr + 6 + VALUE_SEP; chip.y = y0 + largo / 2 - chip.height / 2;
  };
  // Horizontal bracket (measures a band of width `largo` from `x0`) + chip below.
  const horizontal = (largo: number, x0: number, lineColor: string, chip: FrameNode) => {
    const br = figma.createNodeFromSvg(svgCalloutH("fixed", largo, lineColor));
    br.x = x0; br.y = yBr - 6; artwork.appendChild(br);
    chip.x = x0 + largo / 2 - chip.width / 2; chip.y = yBr + 6 + VALUE_SEP;
  };

  if (p.top > 0) vertical(p.top, clone.y, LINE_PADDING, await chipSpacing(p.top, CALLOUT_PADDING, artwork, sv.paddingTop));
  if (p.bottom > 0) vertical(p.bottom, clone.y + clone.height - p.bottom, LINE_PADDING, await chipSpacing(p.bottom, CALLOUT_PADDING, artwork, sv.paddingBottom));
  if (p.left > 0) horizontal(p.left, clone.x, LINE_PADDING, await chipSpacing(p.left, CALLOUT_PADDING, artwork, sv.paddingLeft));
  if (p.right > 0) horizontal(p.right, clone.x + clone.width - p.right, LINE_PADDING, await chipSpacing(p.right, CALLOUT_PADDING, artwork, sv.paddingRight));
  // Gap measured in place: bracket over the gap + adjacent chip (not in the border rail).
  // HORIZONTAL direction → gap = vertical stripe, width measured with a horizontal bracket
  // ABOVE the gap with the chip on top. VERTICAL direction → gap = horizontal stripe, height measured
  // with a vertical bracket to the RIGHT of the gap and the chip beside it.
  const gapHorizontal = (g: Rect, chip: FrameNode) => {
    const yBracket = g.y - 12;
    const br = figma.createNodeFromSvg(svgCalloutH("fixed", g.width, LINE_GAP));
    br.x = g.x; br.y = yBracket - 6; artwork.appendChild(br);
    chip.x = g.x + g.width / 2 - chip.width / 2;
    chip.y = Math.max(0, yBracket - 6 - VALUE_SEP - chip.height);
  };
  const gapVertical = (g: Rect, chip: FrameNode) => {
    const xBracket = g.x + g.width + 12;
    const br = figma.createNodeFromSvg(svgCalloutV("fixed", g.height, LINE_GAP));
    br.x = xBracket - 6; br.y = g.y; artwork.appendChild(br);
    chip.x = xBracket + 6 + VALUE_SEP;
    chip.y = g.y + g.height / 2 - chip.height / 2;
  };
  for (const g of gaps) {
    const val = spec.direction === "VERTICAL" ? g.height : g.width;
    const chip = spec.spacingAuto ? await callout("Auto", CALLOUT_GAP, artwork) : await chipSpacing(val, CALLOUT_GAP, artwork, sv.itemSpacing);
    if (spec.direction === "VERTICAL") gapVertical(g, chip);
    else gapHorizontal(g, chip);
  }
}

// Places the padding/gap badges (and child measures) in external rails
// (outside the element): top row (padding-top + horizontal gaps + child
// widths), bottom row (padding bottom/left/right), left column (vertical
// gaps + child heights). Returns the minimum x on the left.
async function drawBadges(artwork: FrameNode, badges: Badge[], clone: FrameNode): Promise<number> {
  const top: { c: FrameNode; center: number }[] = [];
  const bottom: { c: FrameNode; center: number }[] = [];
  const left: { c: FrameNode; center: number }[] = [];
  for (const m of badges) {
    const par = m.type === "padding" ? CALLOUT_PADDING : CALLOUT_GAP;
    const c = m.name ? await namedDim(m.name, m.value, par, artwork) : await callout(m.value, par, artwork);
    const rail = badgeRail(m.side, m.type);
    if (rail === "top") top.push({ c, center: m.center });
    else if (rail === "left") left.push({ c, center: m.center });
    else {
      let center = m.center;
      if (m.type === "padding" && m.side === "left") center = clone.x + c.width / 2;        // chip flush to the bottom-left corner
      else if (m.type === "padding" && m.side === "right") center = clone.x + clone.width - c.width / 2; // to the bottom right
      bottom.push({ c, center });
    }
  }
  const rows: [{ c: FrameNode; center: number }[], number][] = [[top, clone.y - ROW_TOP], [bottom, clone.y + clone.height + ROW_BOT]];
  for (const [group, y] of rows) {
    if (group.length === 0) continue;
    const ajustados = separateCollisions(group.map((g) => g.center), group.map((g) => g.c.width), SEP_CHIP);
    for (let i = 0; i < group.length; i++) { group[i].c.x = ajustados[i] - group[i].c.width / 2; group[i].c.y = y; }
  }
  let minLeftX = clone.x;
  if (left.length > 0) {
    const ajustados = separateCollisions(left.map((g) => g.center), left.map((g) => g.c.height), SEP_CHIP);
    for (let i = 0; i < left.length; i++) {
      const c = left[i].c;
      c.x = clone.x - COL_IZQ - c.width;
      c.y = ajustados[i] - c.height / 2;
      minLeftX = Math.min(minLeftX, c.x);
    }
  }
  return minLeftX;
}


// Simple callout: light pill with the value in a dark color. The caller positions it.
async function callout(value: string, par: CalloutPair, artwork: FrameNode): Promise<FrameNode> {
  const c = figma.createFrame();
  c.name = "callout";
  c.layoutMode = "HORIZONTAL";
  c.primaryAxisSizingMode = "AUTO";
  c.counterAxisSizingMode = "AUTO";
  c.counterAxisAlignItems = "CENTER";
  c.paddingTop = c.paddingBottom = 1;
  c.paddingLeft = c.paddingRight = 4;
  c.cornerRadius = 4;
  c.fills = [{ type: "SOLID", color: par.dark }];
  const t = await text(value, 11, FONT_MEDIUM);
  t.lineHeight = { unit: "PIXELS", value: 16 };
  t.fills = [{ type: "SOLID", color: par.text }];
  c.appendChild(t);
  artwork.appendChild(c);
  return c;
}

// Two-part callout: dark pill with a light sub-capsule `value` (variable name) +
// the numeric value; texts in the pair's text color.
async function namedDim(name: string, value: string, par: CalloutPair, artwork: FrameNode): Promise<FrameNode> {
  const c = figma.createFrame();
  c.name = "callout";
  c.layoutMode = "HORIZONTAL";
  c.primaryAxisSizingMode = "AUTO";
  c.counterAxisSizingMode = "AUTO";
  c.counterAxisAlignItems = "CENTER";
  c.itemSpacing = 4;
  c.paddingTop = c.paddingBottom = 2;
  c.paddingLeft = 2;
  c.paddingRight = 4;
  c.cornerRadius = 4;
  c.fills = [{ type: "SOLID", color: par.dark }];
  const sub = figma.createFrame();
  sub.name = "value";
  sub.layoutMode = "HORIZONTAL";
  sub.primaryAxisSizingMode = "AUTO";
  sub.counterAxisSizingMode = "AUTO";
  sub.paddingTop = sub.paddingBottom = 0;
  sub.paddingLeft = sub.paddingRight = 2;
  sub.cornerRadius = 2;
  sub.fills = [{ type: "SOLID", color: par.light }];
  const tn = await text(name, 11, FONT_MEDIUM);
  tn.lineHeight = { unit: "PIXELS", value: 16 };
  tn.fills = [{ type: "SOLID", color: par.text }];
  sub.appendChild(tn);
  c.appendChild(sub);
  const tv = await text(value, 11, FONT_MEDIUM);
  tv.lineHeight = { unit: "PIXELS", value: 16 };
  tv.fills = [{ type: "SOLID", color: par.text }];
  c.appendChild(tv);
  artwork.appendChild(c);
  return c;
}

const CALLOUT_DIM_HEX = "#F24822"; // the dimension callouts → red (matching CALLOUT_DIM)
const GRAY_HEX = "#444444";

// Horizontal callout of `largo` px; the caps encode the resizing.
function svgCalloutH(style: "fixed" | "fill" | "hug", largo: number, color = CALLOUT_DIM_HEX): string {
  const L = largo;
  const base = `<line x1="0" y1="6" x2="${L}" y2="6" stroke="${color}"/>`;
  const topes = `<line x1="0.5" y1="0" x2="0.5" y2="12" stroke="${color}"/><line x1="${L - 0.5}" y1="0" x2="${L - 0.5}" y2="12" stroke="${color}"/>`;
  let puntas = topes; // fixed
  if (style === "fill") {
    puntas = `<path d="M6 1 L1 6 L6 11" stroke="${color}" fill="none"/><path d="M${L - 6} 1 L${L - 1} 6 L${L - 6} 11" stroke="${color}" fill="none"/>`;
  } else if (style === "hug") {
    puntas = `${topes}<path d="M2 1 L7 6 L2 11" stroke="${color}" fill="none"/><path d="M${L - 2} 1 L${L - 7} 6 L${L - 2} 11" stroke="${color}" fill="none"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${L}" height="12">${base}${puntas}</svg>`;
}

// Vertical callout of `largo` px (same idea, axes swapped).
function svgCalloutV(style: "fixed" | "fill" | "hug", largo: number, color = CALLOUT_DIM_HEX): string {
  const L = largo;
  const base = `<line x1="6" y1="0" x2="6" y2="${L}" stroke="${color}"/>`;
  const topes = `<line x1="0" y1="0.5" x2="12" y2="0.5" stroke="${color}"/><line x1="0" y1="${L - 0.5}" x2="12" y2="${L - 0.5}" stroke="${color}"/>`;
  let puntas = topes; // fixed
  if (style === "fill") {
    puntas = `<path d="M1 6 L6 1 L11 6" stroke="${color}" fill="none"/><path d="M1 ${L - 6} L6 ${L - 1} L11 ${L - 6}" stroke="${color}" fill="none"/>`;
  } else if (style === "hug") {
    puntas = `${topes}<path d="M1 2 L6 7 L11 2" stroke="${color}" fill="none"/><path d="M1 ${L - 2} L6 ${L - 7} L11 ${L - 2}" stroke="${color}" fill="none"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="${L}">${base}${puntas}</svg>`;
}

const LINE_PADDING = "#007BE5"; // blue, acorde a CALLOUT_PADDING
const LINE_GAP = "#FF24BD";     // magenta, acorde a CALLOUT_GAP

// Direction icons (24x24): arrow → / ↓, grid variant if there's wrap.
const ICONS: Record<string, string> = {
  "flecha-h": `<path d="M3 12 H21 M15 6 L21 12 L15 18" stroke="${GRAY_HEX}" fill="none" stroke-width="2"/>`,
  "flecha-v": `<path d="M12 3 V21 M6 15 L12 21 L18 15" stroke="${GRAY_HEX}" fill="none" stroke-width="2"/>`,
  "grilla-h": `<rect x="3" y="3" width="6" height="6" fill="${GRAY_HEX}"/><rect x="11" y="3" width="6" height="6" fill="${GRAY_HEX}"/><rect x="3" y="11" width="6" height="6" fill="${GRAY_HEX}"/><path d="M14 17 H21 M18 14 L21 17 L18 20" stroke="${GRAY_HEX}" fill="none" stroke-width="2"/>`,
  "grilla-v": `<rect x="3" y="3" width="6" height="6" fill="${GRAY_HEX}"/><rect x="11" y="3" width="6" height="6" fill="${GRAY_HEX}"/><rect x="3" y="11" width="6" height="6" fill="${GRAY_HEX}"/><path d="M17 14 V21 M14 18 L17 21 L20 18" stroke="${GRAY_HEX}" fill="none" stroke-width="2"/>`,
};

function svgIcon(name: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">${ICONS[name]}</svg>`;
}

// W/H callouts (red) with their value. The height one sits to the left of
// `minLeftX` (the leftmost reached by the callouts on that side).
async function drawDims(artwork: FrameNode, clone: FrameNode, spec: LayoutSpec, minLeftX: number): Promise<void> {
  const u = currentUnit();
  const calloutH = figma.createNodeFromSvg(svgCalloutH(dimStyle(spec.resizingHorizontal), clone.width));
  calloutH.x = clone.x;
  calloutH.y = clone.y - 44;
  artwork.appendChild(calloutH);
  const tW = await callout(spacingLabel(spec.width, u), CALLOUT_DIM, artwork);
  tW.x = clone.x + clone.width / 2 - tW.width / 2;
  tW.y = clone.y - 44 - VALUE_SEP - tW.height;
  const xLine = Math.min(clone.x - 44, minLeftX - 28);
  const calloutV = figma.createNodeFromSvg(svgCalloutV(dimStyle(spec.resizingVertical), clone.height));
  calloutV.x = xLine;
  calloutV.y = clone.y;
  artwork.appendChild(calloutV);
  const tH = await callout(spacingLabel(spec.height, u), CALLOUT_DIM, artwork);
  tH.x = xLine - VALUE_SEP - tH.width;
  tH.y = clone.y + clone.height / 2 - tH.height / 2;
}

// Grows the artwork (right/bottom) to contain every annotation that sticks out,
// so they aren't clipped by the gray bg border nor covered by the exhibit.
function ajustarArtwork(artwork: FrameNode, pad = 16): void {
  // Assumes children with x/y >= 0 (the clone starts at MARGIN_LEFT/MARGIN and the annotations
  // fall inside): only grows right/bottom, the origin isn't repositioned.
  let maxX = 0;
  let maxY = 0;
  for (const c of artwork.children) {
    maxX = Math.max(maxX, c.x + c.width);
    maxY = Math.max(maxY, c.y + c.height);
  }
  artwork.resize(Math.max(artwork.width, maxX + pad), Math.max(artwork.height, maxY + pad));
}

// Draws a container's artwork in a mode: "completo" (everything), "dimensiones"
// (only W/H + child measures) or "spacing" (only padding/gap). The clone is offset
// (MARGIN_LEFT, MARGIN) to leave room for the annotations.
async function artworkMode(container: SceneNode, spec: LayoutSpec, _medirHijos: boolean, mode: "completo" | "dimensiones" | "spacing"): Promise<FrameNode> {
  const artwork = figma.createFrame();
  artwork.name = `Artwork ${spec.elementName}`;
  artwork.layoutMode = "NONE";
  artwork.clipsContent = false;
  artwork.fills = themedFill(themeVars().bgArtwork);
  // The helpers only read the clone's geometry (x/y/width/height); a leaf clone
  // (e.g. a TextNode) is treated as a FrameNode for those reads.
  const clone = container.clone() as FrameNode;
  artwork.appendChild(clone);
  clone.x = MARGIN_LEFT;
  clone.y = MARGIN;
  artwork.resize(clone.width + MARGIN_LEFT + MARGIN, clone.height + 2 * MARGIN);

  const frameRect: Rect = { x: MARGIN_LEFT, y: MARGIN, width: clone.width, height: clone.height };
  const children = "children" in container ? container.children.filter(visibleNode) : [];
  const childRects: Rect[] = children.map((c) => ({
    x: MARGIN_LEFT + c.x, y: MARGIN + c.y, width: c.width, height: c.height,
  }));
  for (const r of childRects) rectOverlay(r, BLUE, 0.25, artwork);
  if (mode !== "dimensiones") for (const r of paddingRects(frameRect, spec.padding)) bandaPunteada(r, CALLOUT_PADDING.dark, CALLOUT_PADDING.dark, artwork);
  if (spec.direction === "GRID") {
    const { columns, rows } = autolayoutGridStripes(frameRect, spec.padding, spec.gridColumns ?? 0, spec.gridRows ?? 0, spec.gridColumnGap ?? 0, spec.gridRowGap ?? 0);
    for (const r of columns) bandaPunteada(r, RED, RED, artwork);
    for (const r of rows) bandaPunteada(r, RED, RED, artwork);
    if (mode !== "dimensiones") await drawSpacingCallouts(artwork, clone, spec, []);
    const minLeftX = await drawBadges(artwork, [], clone);
    await drawDims(artwork, clone, spec, minLeftX);
    ajustarArtwork(artwork);
    return artwork;
  }
  const gaps = spacingRects(childRects, spec.direction);
  if (mode !== "dimensiones") {
    for (const r of gaps) bandaPunteada(r, CALLOUT_GAP.dark, CALLOUT_GAP.dark, artwork);
    for (const g of spec.grids) {
      for (const r of gridRects(frameRect, g)) bandaPunteada(r, RED, RED, artwork);
    }
    await drawSpacingCallouts(artwork, clone, spec, gaps);
  }

  const minLeftX = await drawBadges(artwork, [], clone);
  if (mode !== "spacing") await drawDims(artwork, clone, spec, minLeftX);

  if (mode !== "dimensiones") {
    const icon = figma.createNodeFromSvg(svgIcon(directionIcon(spec.direction, spec.wrap)));
    icon.x = 8;
    icon.y = 8;
    artwork.appendChild(icon);
  }
  ajustarArtwork(artwork);
  return artwork;
}

// Wraps an artwork with a title on top.
async function labeledArtwork(title: string, art: FrameNode): Promise<FrameNode> {
  const col = verticalFrame(title, 8);
  col.appendChild(await text(title, 16));
  col.appendChild(art);
  return col;
}

// Container artwork: single if large; split into Dimensions | Spacing
// (labeled) if small. Leaf layers (no Auto Layout) only get dimension lines
// (or the grid stripes if the frame carries layout grids).
async function artworkDe(container: SceneNode, spec: LayoutSpec, measureChildren: boolean, hasAuto: boolean): Promise<FrameNode> {
  if (!hasAuto) {
    if (spec.grids.length > 0) return await artworkGrids(container as FrameNode, spec.grids);
    return await artworkMode(container, spec, false, "dimensiones");
  }
  if (!isSmall(container.width, container.height, spec.direction)) {
    return await artworkMode(container, spec, measureChildren, "completo");
  }
  const wrap = horizontalFrame(`Artwork ${spec.elementName}`, 48);
  wrap.clipsContent = false;
  wrap.appendChild(await labeledArtwork("Dimensions", await artworkMode(container, spec, measureChildren, "dimensiones")));
  wrap.appendChild(await labeledArtwork("Spacing", await artworkMode(container, spec, measureChildren, "spacing")));
  return wrap;
}

// Artwork of a frame with layout grids but no Auto Layout: clone + red
// stripes, without markers or callouts.
async function artworkGrids(frame: FrameNode, grids: GridSpec[]): Promise<FrameNode> {
  const artwork = figma.createFrame();
  artwork.name = `Artwork ${frame.name}`;
  artwork.layoutMode = "NONE";
  artwork.clipsContent = false;
  artwork.fills = themedFill(themeVars().bgArtwork);
  const clone = frame.clone();
  artwork.appendChild(clone);
  clone.x = 0;
  clone.y = 0;
  artwork.resize(clone.width + BREATHE, clone.height + BREATHE);
  const frameRect: Rect = { x: 0, y: 0, width: clone.width, height: clone.height };
  for (const g of grids) {
    for (const r of gridRects(frameRect, g)) bandaPunteada(r, RED, RED, artwork);
  }
  return artwork;
}

// Generates the Layout and Spacing output: one artwork+exhibit row per layer
// (root + every descendant; same order as extractLayout).
export async function generateLayout(selected: SceneNode, specs: LayoutSpec[], columns: number, hideOuter: boolean, itemize: boolean, measureChildren: boolean): Promise<FrameNode> {
  const specifications = verticalFrame("Specifications", 128, 64);
  const spec = verticalFrame(`${selected.name} Spec`, 48);
  specifications.appendChild(spec);
  spec.appendChild(await text(selected.name, 64));
  spec.appendChild(await layoutSection(selected, specs, columns, hideOuter, itemize, measureChildren));
  figma.currentPage.appendChild(specifications);
  return specifications;
}

// Builds only the Layout and Spacing section (without Specifications or node title).
export async function layoutSection(selected: SceneNode, specs: LayoutSpec[], columns: number, hideOuter: boolean, itemize: boolean, measureChildren: boolean): Promise<FrameNode> {
  // This section IS the item (it used to be wrapped by a separate layoutspecItem): it carries
  // the page padding and the spec bg; main.ts only names and stretches it.
  const section = verticalFrame("Layout and Spacing", 0);
  section.clipsContent = false; // the chips/callouts stick out of the artwork margin
  section.paddingTop = section.paddingBottom = 72;
  section.paddingLeft = section.paddingRight = 100;
  section.fills = themedFill(themeVars().bgSpec);

  const traversals = traverseTree(selected as unknown as NodeLike, itemize);
  const nodes = traversals.map((r) => r.node) as unknown as SceneNode[];
  // Full flat tree for the "Layers" card: every layer with its indent level + id.
  const tree: TreeRow[] = await treeRowsOf(traversals);
  const isAuto = (node: SceneNode): boolean => {
    const m = (node as FrameNode).layoutMode;
    return m === "HORIZONTAL" || m === "VERTICAL" || m === "GRID";
  };

  // With hideOuter, the root row is skipped (the root is always first in the tree).
  const inicio = hideOuter && nodes.length > 0 && nodes[0] === selected ? 1 : 0;
  const rows: FrameNode[] = [];
  const n = Math.min(nodes.length, specs.length);
  // The row limit is applied before building anything.
  const indices = [];
  for (let i = inicio; i < n; i++) indices.push(i);
  const { rows: visibles, dropped } = capRows(indices);

  // One Layers card for the whole section. Rebuilding the full tree on every row
  // made the cost quadratic: on a 34-layer selection it was 3x the whole section.
  section.appendChild(await layersTree(tree, selected.id));

  for (const i of visibles) {
    const node = nodes[i];
    const hasAuto = isAuto(node);
    const row = horizontalFrame("layoutItem", 48);
    row.paddingTop = row.paddingBottom = 72; // mimics the anatomyItem's vertical breathing space
    row.clipsContent = false; // the artwork's chips/callouts may stick out of the margin
    row.appendChild(await artworkDe(node, specs[i], measureChildren, hasAuto));
    row.appendChild(await exhibit(specs[i], hasAuto));
    rows.push(row);
  }
  if (dropped > 0) section.appendChild(await text(`${dropped} more layers not shown (row limit).`, 16));

  // Unique id per row, in final visual order.
  rows.forEach((f, i) => { f.name = `layoutItem${String(i + 1).padStart(2, "0")}`; });

  if (rows.length === 0) {
    section.appendChild(await text("No layers found.", 16));
  } else if (columns > 1) {
    const container = inColumns(rows, columns);
    container.clipsContent = false;
    section.appendChild(container);
  } else {
    appendAll(section, rows);
  }

  return section;
}

const SAMPLE_WIDTH = 150;   // width of the "Element" column
const SAMPLE_HEIGHT = 28;
const TABLE_WIDTH = 656;     // fixed width of the table
const COL_DET = TABLE_WIDTH - SAMPLE_WIDTH - 16 - 32; // columna "Detail" (resto tras Element, gap y padding)
const HEADER_BG: RGB = { r: 0.953, g: 0.957, b: 0.965 }; // #F3F4F6 (header)
const GRAY_LABEL: RGB = { r: 0.420, g: 0.447, b: 0.502 };    // #6B7280 (text-secondary)

// Explanatory text / table header: Inter Medium 12, line-height 150%, text-secondary.
async function legText(s: string): Promise<TextNode> {
  const t = await text(s, 12, FONT_MEDIUM);
  t.lineHeight = { value: 150, unit: "PERCENT" };
  t.fills = [{ type: "SOLID", color: GRAY_LABEL }];
  return t;
}

// Fixed-size box WITHOUT auto-layout: the sample (chip/callout/line) is positioned
// absolutely and centered, like in the real artwork (so it doesn't collapse).
function muestraBox(): FrameNode {
  const box = figma.createFrame();
  box.name = "Muestra";
  box.layoutMode = "NONE";
  box.clipsContent = false;
  box.fills = [];
  box.resize(SAMPLE_WIDTH, SAMPLE_HEIGHT);
  return box;
}

// Puts the sample in the box and centers it vertically, flush left.
function ponerMuestra(box: FrameNode, node: SceneNode): void {
  box.appendChild(node);
  node.x = 0;
  node.y = (SAMPLE_HEIGHT - node.height) / 2;
}

// Thin bottom divider (#D1D5DB) to separate the table rows.
function rowDivider(f: FrameNode): void {
  f.strokes = [{ type: "SOLID", color: BORDER_PILL }];
  f.strokeTopWeight = 0;
  f.strokeLeftWeight = 0;
  f.strokeRightWeight = 0;
  f.strokeBottomWeight = 1;
}

// Table header: "Element" | "Detail" (gray) with bg and bottom divider.
async function legendHeader(): Promise<FrameNode> {
  const h = horizontalFrame("legendHeader", 16);
  h.counterAxisAlignItems = "CENTER";
  h.paddingTop = h.paddingBottom = 10;
  h.paddingLeft = h.paddingRight = 16;
  h.fills = [{ type: "SOLID", color: HEADER_BG }];
  rowDivider(h);
  const e = await legText("Element"); e.resize(SAMPLE_WIDTH, e.height);
  h.appendChild(e);
  h.appendChild(await legText("Detail"));
  return h;
}

// Data row: Element cell (sample) + Detail cell (wrapping text), with bottom divider.
async function legendRow(box: FrameNode, explicacion: string): Promise<FrameNode> {
  const row = horizontalFrame("legendRow", 16);
  row.counterAxisAlignItems = "CENTER";
  row.paddingTop = row.paddingBottom = 12;
  row.paddingLeft = row.paddingRight = 16;
  rowDivider(row);
  row.appendChild(box);
  const det = await legText(explicacion);
  det.textAutoResize = "HEIGHT";
  det.resize(COL_DET, det.height);
  row.appendChild(det);
  return row;
}

// Footer row across the full width (no columns or divider).
async function legendFooter(nota: string): Promise<FrameNode> {
  const f = horizontalFrame("legendFooter", 0);
  f.paddingTop = f.paddingBottom = 12;
  f.paddingLeft = f.paddingRight = 16;
  const t = await legText(nota);
  t.textAutoResize = "HEIGHT";
  t.resize(SAMPLE_WIDTH + 16 + COL_DET, t.height);
  f.appendChild(t);
  return f;
}

// Sample cell with one or more Figma icons in a row (24px, flush left).
function simbolos(keys: string[], tipos: string[] = []): FrameNode {
  const box = muestraBox();
  const fila = horizontalFrame("Simbolos", 8);
  fila.counterAxisAlignItems = "CENTER";
  const iconos: SceneNode[] = [];
  for (const k of keys) iconos.push(nodeIcon(k, 24));
  for (const t of tipos) { const i = nodeTypeIcon(t, 24); if (i) iconos.push(i); }
  appendAll(fila, iconos);
  ponerMuestra(box, fila);
  return box;
}

// Empty table shell, ready to receive header + rows.
function legendCard(): FrameNode {
  const card = verticalFrame("legendTable", 0);
  card.counterAxisSizingMode = "FIXED";
  card.resize(TABLE_WIDTH, card.height);
  card.cornerRadius = 8;
  card.clipsContent = true;
  card.strokes = [{ type: "SOLID", color: BORDER_PILL }];
  card.strokeWeight = 1;
  card.fills = themedFill(themeVars().bgSpec);
  return card;
}

// "Figma symbols" table: what each icon used across the specs means.
async function symbolsCard(): Promise<FrameNode> {
  const card = legendCard();
  card.appendChild(await legendHeader());

  card.appendChild(await legendRow(simbolos([], ["FRAME", "GROUP"]),
    "Frame and group: plain containers, no Auto Layout."));
  card.appendChild(await legendRow(simbolos([], ["COMPONENT", "COMPONENT_SET", "INSTANCE"]),
    "Component, component set and instance. A renamed instance says \u201c(Instance of: name)\u201d next to its layer."));
  card.appendChild(await legendRow(simbolos([], ["TEXT", "VECTOR"]),
    "Text layer and vector layer."));
  card.appendChild(await legendRow(simbolos(["al-h-top", "al-h-center", "al-h-bottom"]),
    "Horizontal Auto Layout. The icon also shows how the items are aligned: top, center or bottom."));
  card.appendChild(await legendRow(simbolos(["al-v-left", "al-v-center", "al-v-right"]),
    "Vertical Auto Layout, aligned left, center or right."));
  card.appendChild(await legendRow(simbolos(["al-wrap-left", "al-wrap-center", "al-wrap-right"]),
    "Wrapping Auto Layout: the rows are aligned left, center or right."));
  card.appendChild(await legendRow(simbolos(["al-absolute", "dir-grid"]),
    "Absolute position (out of the Auto Layout flow) and grid layout."));
  card.appendChild(await legendRow(simbolos(["width-fixed", "width-hug", "width-fill"]),
    "Resizing of a width/height row: Fixed, Hug contents or Fill container."));
  card.appendChild(await legendRow(simbolos(["border", "border-top", "border-left-right"]),
    "Which sides carry the stroke, followed by its weight."));
  card.appendChild(await legendRow(simbolos(["swatch", "hidden"]),
    "Variable mode applied to the layer, and a fill or stroke with its visibility off."));

  for (const child of card.children) (child as FrameNode).layoutSizingHorizontal = "FILL";
  return card;
}

// "How to read these specs" block: explains the Layout artwork conventions
// with real visual samples.
export async function legendSection(): Promise<FrameNode> {
  const sec = verticalFrame("How to read these specs", 16);
  sec.appendChild(await text("How to read these specs", 36));

  // Table: card with border + radius (clip), fixed width, gray header, rows and footer.
  const card = legendCard();

  card.appendChild(await legendHeader());

  const b1 = muestraBox();
  ponerMuestra(b1, await callout("240", CALLOUT_DIM, b1));
  card.appendChild(await legendRow(b1, "Dimension callout: element or child width/height (red)."));

  const b2 = muestraBox();
  ponerMuestra(b2, await namedDim("padding-1x", "16", CALLOUT_PADDING, b2));
  card.appendChild(await legendRow(b2, "Padding: distance to the edge; chip with the variable (blue) + value."));

  const b3 = muestraBox();
  ponerMuestra(b3, await namedDim("gap-0_5x", "8", CALLOUT_GAP, b3));
  card.appendChild(await legendRow(b3, "Item spacing (gap): space between children (pink)."));

  const b4 = muestraBox();
  ponerMuestra(b4, figma.createNodeFromSvg(svgCalloutH("fixed", 40)));
  card.appendChild(await legendRow(b4, "Measurement line: marks the span of that band."));

  const b5 = muestraBox();
  ponerMuestra(b5, await variableChip("sizing/card-width"));
  card.appendChild(await legendRow(b5, "Grey chip in the panel: bound variable (resolved value in parentheses)."));

  const b6 = muestraBox();
  ponerMuestra(b6, await text("card", 12));
  card.appendChild(await legendRow(b6, "Left of each row: the layer hierarchy; the row's element is in bold."));

  card.appendChild(await legendFooter("For small elements the artwork is split in two: Dimensions (W/H) and Spacing (padding & gap)."));

  // All rows to the card width (so the dividers and bg reach the border).
  for (const child of card.children) (child as FrameNode).layoutSizingHorizontal = "FILL";

  sec.appendChild(card);

  sec.appendChild(await text("Figma symbols", 36));
  sec.appendChild(await symbolsCard());
  return sec;
}
