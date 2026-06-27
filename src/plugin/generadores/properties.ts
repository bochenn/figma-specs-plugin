import type { PropertySpec, ChangedElement, ChangedAttribute, TwoWaySpec } from "../modelo/tipos.ts";
import { sameProps } from "../comparacion/variantes.ts";
import { verticalFrame, horizontalFrame, text, inColumns, themedFill, card, pillRow, variableChip, FONT_MEDIUM, keyText, valueText } from "./frames.ts";
import { dimensionIndicator, resizingIconKey } from "./iconos.ts";
import { themeVars } from "../utils/variables-tema.ts";
import { hexToRgb } from "../utils/color.ts";
import { propertyName } from "../utils/propiedades.ts";
import { parseVariants } from "../utils/anatomy-variantes.ts";

const GRAY = (n: number): RGB => ({ r: n, g: n, b: n });
const BLUE_HL: RGB = { r: 0.05, g: 0.4, b: 0.85 };

// Traverses the default variant (accumulated offset) and, for each node whose
// visibility references the boolean, draws a blue rect on the artwork and collects
// its name. Stops at instances.
function resaltarBoolean(node: SceneNode, offX: number, offY: number, propKey: string, artwork: FrameNode, names: string[]): void {
  const refs = (node as { componentPropertyReferences?: { visible?: string } | null }).componentPropertyReferences;
  if (refs && refs.visible === propKey) {
    const rect = figma.createRectangle();
    rect.x = offX;
    rect.y = offY;
    rect.resize(Math.max(node.width, 0.01), Math.max(node.height, 0.01));
    rect.fills = [{ type: "SOLID", color: BLUE_HL, opacity: 0.3 }];
    artwork.appendChild(rect);
    names.push(node.name);
  }
  if (node.type === "INSTANCE") return;
  if ("children" in node) {
    for (const c of node.children) resaltarBoolean(c, offX + c.x, offY + c.y, propKey, artwork, names);
  }
}

// Subsection of a boolean property: heading + artwork (clone with highlights) + affected layers.
async function booleanSubsection(componentSet: ComponentSetNode, name: string, propKey: string): Promise<FrameNode> {
  const sub = verticalFrame(name, 40);
  sub.appendChild(await propertyTitle(name));

  const names: string[] = [];
  const defaultVariant = componentSet.defaultVariant;
  if (defaultVariant) {
    const artwork = figma.createFrame();
    artwork.name = "Artwork";
    artwork.layoutMode = "NONE";
    artwork.clipsContent = false;
    artwork.fills = themedFill(themeVars().bgArtwork);
    const clone = defaultVariant.createInstance(); // instance of the variant, not a component clone
    artwork.appendChild(clone);
    clone.x = 0;
    clone.y = 0;
    artwork.resize(clone.width, clone.height);
    // Detects on the original variant (geometry identical to the clone) and draws on the artwork.
    resaltarBoolean(defaultVariant, 0, 0, propKey, artwork, names);
    sub.appendChild(artwork);
  }

  sub.appendChild(await text(`Affected layers: ${names.length ? names.join(", ") : "—"}`, 12));
  return sub;
}

// Finds the real variant component in the set matching the target props.
function findComponent(
  componentSet: ComponentSetNode,
  target: Record<string, string>,
): ComponentNode | undefined {
  for (const child of componentSet.children) {
    if (child.type === "COMPONENT" && sameProps(child.variantProperties ?? {}, target)) {
      return child;
    }
  }
  return undefined;
}

// Any variant that has `value` in property `prop` (sparse matrix).
function findComponentWithValue(componentSet: ComponentSetNode, prop: string, value: string): ComponentNode | undefined {
  for (const child of componentSet.children) {
    if (child.type === "COMPONENT" && (child.variantProperties ?? {})[prop] === value) return child;
  }
  return undefined;
}

// Component title (Blog post card, Badge…): Inter Medium 40 / line-height 48 / letter-spacing -2%.
async function componentTitle(s: string): Promise<TextNode> {
  const t = await text(s, 40, FONT_MEDIUM);
  t.lineHeight = { value: 48, unit: "PIXELS" };
  t.letterSpacing = { value: -2, unit: "PERCENT" };
  return t;
}

// Property title (Type, Orientation…): Inter Medium 24 / line-height 32.
async function propertyTitle(s: string): Promise<TextNode> {
  const t = await text(s, 24, FONT_MEDIUM);
  t.lineHeight = { value: 32, unit: "PIXELS" };
  return t;
}

// ◆ marker preceding each value in the properties table.
function diamante(): PolygonNode {
  const p = figma.createPolygon();
  p.pointCount = 4;
  p.resize(8, 8);
  p.fills = [{ type: "SOLID", color: GRAY(0.1) }];
  return p;
}

// Properties-table row: label (gray, fixed width) + ◆ + value.
async function propTableRow(label: string, value: string): Promise<FrameNode> {
  const row = horizontalFrame("prop", 12);
  row.counterAxisAlignItems = "CENTER";
  const lbl = await keyText(label);
  lbl.textAutoResize = "HEIGHT";
  lbl.resize(160, lbl.height);
  row.appendChild(lbl);
  row.appendChild(diamante());
  row.appendChild(await valueText(value));
  return row;
}

// Variant card: header + [artwork (instance) | properties table].
async function cardVariante(header: string, comp: ComponentNode, propNames: string[]): Promise<FrameNode> {
  const display = horizontalFrame("Display", 64);
  display.counterAxisAlignItems = "MIN";

  const artwork = figma.createFrame();
  artwork.name = "Artwork";
  artwork.layoutMode = "NONE";
  artwork.fills = themedFill(themeVars().bgArtwork);
  const inst = comp.createInstance();
  artwork.appendChild(inst);
  // Minimum 64px padding on all 4 sides (instance + 128), with a 400×156 floor.
  const w = Math.max(400, inst.width + 128);
  const h = Math.max(156, inst.height + 128);
  artwork.resize(w, h);
  inst.x = (w - inst.width) / 2;
  inst.y = (h - inst.height) / 2;
  display.appendChild(artwork);

  const props = comp.variantProperties ?? {};
  const table = verticalFrame("PropsTable", 8);
  for (const name of propNames) {
    if (props[name] === undefined) continue;
    table.appendChild(await propTableRow(name, props[name]));
  }
  display.appendChild(table);

  return card([await text(header, 16, FONT_MEDIUM)], [display]);
}

// Readable text of a changed attribute: "optionValue (raw) (default: defaultValue (raw))".
// The (raw) appears only when the value is a variable/style with a resolved value.
function attributeLine(c: ChangedAttribute): string {
  const op = `${c.optionValue ?? "—"}${c.rawValueOption ? ` (${c.rawValueOption})` : ""}`;
  const def = `${c.defaultValue ?? "—"}${c.rawValueDefault ? ` (${c.rawValueDefault})` : ""}`;
  return `${c.key}: ${op} (default: ${def})`;
}

// Draws an attribute change as TWO horizontal pills: itemValue-current
// (key + option value, on the left) and itemValue-default (default +
// its value, on the right). Visually separates the current value from the default.
async function changedAttributeRow(c: ChangedAttribute): Promise<FrameNode> {
  // itemValue-current: swatch + key + option value
  const current: SceneNode[] = [];
  if (c.swatchHex) {
    const swatch = figma.createRectangle();
    swatch.resize(12, 12);
    swatch.fills = [{ type: "SOLID", color: hexToRgb(c.swatchHex) }];
    swatch.strokes = [{ type: "SOLID", color: { r: 0.8, g: 0.8, b: 0.8 } }];
    swatch.strokeWeight = 1;
    current.push(swatch);
  }
  current.push(await keyText(`${c.key}:`));
  // ChipVar only if it's a token; otherwise plain text
  if (c.optionValue && c.optionValue !== "—") {
    current.push(c.formatOption ? await variableChip(c.optionValue) : await valueText(c.optionValue));
  } else {
    current.push(await valueText("—"));
  }
  if (c.rawValueOption) current.push(await valueText(`(${c.rawValueOption})`));
  if (resizingIconKey(c.key, c.prefixOption)) current.push(await dimensionIndicator(c.key, c.prefixOption!));
  const pillCurrent = pillRow(current);
  pillCurrent.name = "itemValue-current";

  // itemValue-default: default: + default value
  const def: SceneNode[] = [await keyText("default:")];
  if (c.defaultValue && c.defaultValue !== "—") {
    def.push(c.formatDefault ? await variableChip(c.defaultValue) : await valueText(c.defaultValue));
  } else {
    def.push(await valueText("—"));
  }
  if (c.rawValueDefault) def.push(await valueText(`(${c.rawValueDefault})`));
  if (resizingIconKey(c.key, c.prefixDefault)) def.push(await dimensionIndicator(c.key, c.prefixDefault!));
  const pillDefault = pillRow(def);
  pillDefault.name = "itemValue-default";

  const row = horizontalFrame("change", 8);
  row.counterAxisAlignItems = "CENTER";
  row.appendChild(pillCurrent);
  row.appendChild(pillDefault);
  return row;
}

// English label for a changed element's state.
const STATE_LABEL: Record<ChangedElement["state"], string> = {
  modified: "Modified",
  added: "Added",
  removed: "Removed",
};

// Builds an option's change list. Each changed element is a card.
// `baseName` is the component name (for the variant's root card).
async function listaCambios(changes: ChangedElement[], baseName: string): Promise<FrameNode> {
  const lista = verticalFrame("Cambios", 8);
  if (changes.length === 0) {
    lista.appendChild(await text("No changes from the default", 16));
    return lista;
  }
  // Consolidates repeated added/removed (same layer name+state, e.g. several "Vector")
  // into a single card with a count.
  const cuenta = new Map<string, number>();
  const orden: ChangedElement[] = [];
  for (const c of changes) {
    if (c.attributes.length === 0) {
      const k = `${c.elementName}|${c.state}`;
      cuenta.set(k, (cuenta.get(k) ?? 0) + 1);
      if (cuenta.get(k) === 1) orden.push(c);
    } else {
      orden.push(c);
    }
  }
  for (const change of orden) {
    const props = parseVariants(change.elementName); // non-empty only at the root (variant)
    const headerNodes: SceneNode[] = [];
    const rows: FrameNode[] = [];
    if (props.length > 0) {
      // Variant root: component name + its props stacked vertically (Figma style panel).
      headerNodes.push(await text(baseName, 16, FONT_MEDIUM));
      for (const p of props) rows.push(pillRow([await keyText(`${p.key}:`), await valueText(p.value)]));
    } else {
      const n = cuenta.get(`${change.elementName}|${change.state}`) ?? 1;
      const suffix = change.state === "modified" ? "" : ` · ${STATE_LABEL[change.state]}${n > 1 ? ` ×${n}` : ""}`;
      headerNodes.push(await text(`${change.elementName}${suffix}`, 16, FONT_MEDIUM));
    }
    for (const attr of change.attributes) {
      rows.push(await changedAttributeRow(attr));
    }
    // Added/removed without attributes: a note instead of an empty box.
    if (change.attributes.length === 0 && props.length === 0) {
      const nota = change.state === "added" ? "Added in this variant" : "Removed from this variant";
      rows.push(pillRow([await valueText(nota)]));
    }
    lista.appendChild(card(headerNodes, rows));
  }
  return lista;
}

// Builds an option's display: artwork (variant clone) + change list.
async function displayOpcion(
  componentSet: ComponentSetNode,
  target: Record<string, string>,
  changes: ChangedElement[],
): Promise<FrameNode> {
  const display = horizontalFrame("Display", 64);

  const componente = findComponent(componentSet, target);
  if (componente) {
    const artwork = figma.createFrame();
    artwork.name = "Artwork";
    artwork.layoutMode = "NONE";
    artwork.fills = themedFill(themeVars().bgArtwork);
    const clone = componente.createInstance(); // instance of the variant, not a component clone
    artwork.appendChild(clone);
    clone.x = 0;
    clone.y = 0;
    artwork.resize(clone.width, clone.height);
    display.appendChild(artwork);
  }

  display.appendChild(await listaCambios(changes, componentSet.name));
  return display;
}

// Builds the full "{name} Spec" frame of a component set: title +
// Properties section (subsection per variant property + booleans).
async function specDeProperties(
  componentSet: ComponentSetNode,
  properties: PropertySpec[],
  defaultProps: Record<string, string>,
  columns: number,
): Promise<FrameNode> {
  const spec = verticalFrame(`${componentSet.name} Spec`, 48);
  spec.appendChild(await text(componentSet.name, 64));
  spec.appendChild(await propertiesSection(componentSet, properties, defaultProps, columns));
  return spec;
}

// Builds only the Properties section (without Specifications or node title).
// For each value of each property, a card with the variant
// preview + its full properties table. `_properties` is no longer used (the
// info is taken directly from the component set).
export async function propertiesSection(
  componentSet: ComponentSetNode,
  _properties: PropertySpec[],
  defaultProps: Record<string, string>,
  columns: number,
): Promise<FrameNode> {
  const section = verticalFrame("Properties", 64);
  // Title with the name of the component this section belongs to (key to
  // tell the main component's section apart from the nested subcomponents').
  section.appendChild(await componentTitle(componentSet.name));
  const groups = componentSet.variantGroupProperties;
  const propNames = Object.keys(groups);

  if (propNames.length === 0) {
    section.appendChild(await text("No variant properties to compare", 16));
    return section;
  }

  // Default-variant card on top (the component name already goes in the title).
  const defComp = findComponent(componentSet, defaultProps);
  if (defComp) section.appendChild(await cardVariante("Default", defComp, propNames));

  // One subsection per property: a card per value (preview + table).
  for (const prop of propNames) {
    const subsection = verticalFrame(prop, 40);
    subsection.appendChild(await propertyTitle(prop));
    const blocks: FrameNode[] = [];
    for (const value of groups[prop].values) {
      const comp = findComponent(componentSet, { ...defaultProps, [prop]: value })
        ?? findComponentWithValue(componentSet, prop, value);
      if (!comp) continue;
      blocks.push(await cardVariante(value, comp, propNames));
    }
    if (columns > 1) {
      subsection.appendChild(inColumns(blocks, columns));
    } else {
      for (const b of blocks) subsection.appendChild(b);
    }
    section.appendChild(subsection);
  }

  // Boolean properties (kept).
  const defs = componentSet.componentPropertyDefinitions;
  for (const key of Object.keys(defs)) {
    if (defs[key].type === "BOOLEAN") {
      section.appendChild(await booleanSubsection(componentSet, propertyName(key), key));
    }
  }

  return section;
}

// Generates the Properties output. Returns the created Specifications frame.
export async function generateProperties(
  componentSet: ComponentSetNode,
  properties: PropertySpec[],
  defaultProps: Record<string, string>,
  columns: number,
): Promise<FrameNode> {
  const specifications = verticalFrame("Specifications", 128, 64);
  specifications.appendChild(await specDeProperties(componentSet, properties, defaultProps, columns));
  figma.currentPage.appendChild(specifications);
  return specifications;
}

// Already-extracted properties of a nested set.
export interface SetProperties {
  set: ComponentSetNode;
  properties: PropertySpec[];
  defaultProps: Record<string, string>;
}

// Generates Properties for the main set + one section per nested set.
export async function generatePropertiesWithNested(
  componentSet: ComponentSetNode,
  properties: PropertySpec[],
  defaultProps: Record<string, string>,
  columns: number,
  nested: SetProperties[],
): Promise<FrameNode> {
  const specifications = verticalFrame("Specifications", 128, 64);
  specifications.appendChild(await specDeProperties(componentSet, properties, defaultProps, columns));
  for (const n of nested) {
    specifications.appendChild(await specDeProperties(n.set, n.properties, n.defaultProps, columns));
  }
  figma.currentPage.appendChild(specifications);
  return specifications;
}

// Generates the Two-Way output: one combination per block (artwork + changes).
export async function generateTwoWay(
  componentSet: ComponentSetNode,
  dosway: TwoWaySpec,
  defaultProps: Record<string, string>,
  columns: number,
): Promise<FrameNode> {
  const specifications = verticalFrame("Specifications", 128, 64);
  const spec = verticalFrame(`${componentSet.name} Spec`, 48);
  specifications.appendChild(spec);
  spec.appendChild(await text(componentSet.name, 64));
  spec.appendChild(await twoWaySection(componentSet, dosway, defaultProps, columns));
  figma.currentPage.appendChild(specifications);
  return specifications;
}

// Builds only the Two-Way section (without Specifications or node title).
export async function twoWaySection(
  componentSet: ComponentSetNode,
  dosway: TwoWaySpec,
  defaultProps: Record<string, string>,
  columns: number,
): Promise<FrameNode> {
  const section = verticalFrame("Two-Way", 64);
  section.appendChild(await text(`${dosway.prop1} × ${dosway.prop2}`, 24));

  const blocks: FrameNode[] = [];
  for (const comb of dosway.combinations) {
    const target = { ...defaultProps, [dosway.prop1]: comb.value1, [dosway.prop2]: comb.value2 };
    const headerNodes: SceneNode[] = [await text(`${comb.value1} + ${comb.value2}`, 16, FONT_MEDIUM)];
    const display = await displayOpcion(componentSet, target, comb.changes);
    blocks.push(card(headerNodes, [display]));
  }
  if (columns > 1) {
    section.appendChild(inColumns(blocks, columns));
  } else {
    for (const b of blocks) section.appendChild(b);
  }
  return section;
}
