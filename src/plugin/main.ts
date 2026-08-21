import type { UIMessage, PluginMessage, NormSet, Section } from "./modelo/tipos.ts";
import { toNodeLike, visibleNode } from "./extraccion/adaptador.ts";
import { ensureThemeVariables, themeVars } from "./utils/variables-tema.ts";
import { verticalFrame, text } from "./generadores/frames.ts";
import { clampColumns } from "./utils/columnas.ts";
import { applyColorFormat } from "./utils/color.ts";
import { applyRawFormat, applyShowRaw, applyPreference } from "./utils/valores.ts";
import { applyUnit } from "./utils/espaciado.ts";
import { applyTypeFormat } from "./utils/tipografia.ts";
import { extractAnatomy } from "./extraccion/anatomy.ts";
import { anatomySection } from "./generadores/anatomy.ts";
import { resolveComponentSet } from "./extraccion/resolver.ts";
import { propertiesSection } from "./generadores/properties.ts";
import { extractLayout } from "./extraccion/layout.ts";
import { layoutSection, legendSection } from "./generadores/layout.ts";
import { serializeAnatomy } from "./serializacion/anatomy-json.ts";
import { dataSection } from "./generadores/data.ts";
import { collectStyles } from "./inventario/recolectar.ts";
import { groupInventory } from "./inventario/agrupar.ts";
import { documentInventory } from "./inventario/documento.ts";
import { stylingSection } from "./generadores/styling.ts";
import { collectModes } from "./variables/recolectar-modes.ts";
import { groupModes } from "./variables/modes.ts";
import { modesSection } from "./generadores/modes.ts";
import { extractTwoWay } from "./extraccion/properties.ts";
import { twoWaySection } from "./generadores/properties.ts";
import { extractCompleteAnatomy, extractCompleteLayout } from "./extraccion/properties.ts";
import { completeSection } from "./generadores/complete.ts";
import { header, hero, feature, footer, wrapItem, PAGE_WIDTH } from "./generadores/pagina.ts";
import { applyRowLimit } from "./utils/carga.ts";
import { runBenchmark } from "./generadores/benchmark.ts";

const TIPOS_VALIDOS = ["FRAME", "COMPONENT", "INSTANCE", "COMPONENT_SET"];

figma.showUI(__html__, { width: 640, height: 500 });

function respond(msg: PluginMessage): void {
  figma.ui.postMessage(msg);
}

// Visible layers under a node (instances included): the size of the job ahead.
function countLayers(node: SceneNode): number {
  let total = 1;
  if ("children" in node) for (const c of node.children.filter(visibleNode)) total += countLayers(c);
  return total;
}

// Reports the size of the selection so the UI can estimate how long it will take.
function analyzeSelection(): void {
  const selection = figma.currentPage.selection;
  respond({ type: "analysis", layers: selection.length > 0 ? countLayers(selection[0]) : 0 });
}

figma.on("selectionchange", analyzeSelection);

// Places the output to the right of the selected node, applies the theme bg,
// Dark toggle of the last generation (sets the frame's explicit mode).
let darkModeOn = false;

// focuses it and reports success to the UI.
function finalizar(frame: FrameNode, node: SceneNode): void {
  const box = node.absoluteBoundingBox;
  if (box) {
    frame.x = box.x + box.width + 100;
    frame.y = box.y;
  }
  if (darkModeOn) {
    frame.setExplicitVariableModeForCollection(themeVars().collection, themeVars().darkMode);
  }
  figma.viewport.scrollAndZoomIntoView([frame]);
  respond({ type: "result", ok: true });
}

// Builds the NormSet for pure extraction from the real Component Set.
async function normalizarSet(componentSet: ComponentSetNode): Promise<NormSet> {
  const properties: Record<string, string[]> = {};
  const groups = componentSet.variantGroupProperties;
  for (const name of Object.keys(groups)) {
    properties[name] = groups[name].values;
  }
  const componentes = componentSet.children.filter((c): c is ComponentNode => c.type === "COMPONENT");
  const variants = await Promise.all(
    componentes.map(async (c) => ({ variantProperties: c.variantProperties ?? {}, root: await toNodeLike(c) })),
  );
  const defaultProps = componentSet.defaultVariant?.variantProperties ?? {};
  return { properties, variants, defaultProps };
}

// First-level nested instances (doesn't descend into the instances).
function instanciasAnidadas(node: SceneNode): InstanceNode[] {
  const res: InstanceNode[] = [];
  function walk(n: SceneNode): void {
    if (!("children" in n)) return;
    for (const c of n.children.filter(visibleNode)) {
      if (c.type === "INSTANCE") res.push(c);
      else walk(c);
    }
  }
  walk(node);
  return res;
}

// Component sets of the nested instances (in the default variant), without
// duplicates, without the main set, and without components that have no variants.
// Traverses ALL variants (not just the default), so as not to miss subcomponents
// that appear only in some versions (e.g. Badge).
async function setsAnidados(componentSet: ComponentSetNode): Promise<ComponentSetNode[]> {
  const res: ComponentSetNode[] = [];
  const vistos = new Set<string>([componentSet.id]);
  for (const variant of componentSet.children) {
    for (const inst of instanciasAnidadas(variant)) {
      const set = await resolveComponentSet(inst);
      if (!set || vistos.has(set.id)) continue;
      vistos.add(set.id);
      res.push(set);
    }
  }
  return res;
}

// Generation options taken from the UI message.
interface OpcionesGen {
  nested: boolean;
  table: boolean;
  itemize: boolean;
  hideOuter: boolean;
  measureChildren: boolean;
  columns: number;
  anatomyDepth: "self" | "children" | "all";
  layerBadges: boolean;
  stylingTotal: boolean;
}

// Notice frame for a section that doesn't apply to the node (doesn't abort the others).
async function aviso(mensaje: string): Promise<FrameNode> {
  const f = verticalFrame("Aviso", 8);
  f.appendChild(await text(mensaje, 16));
  return f;
}

// Returns the section(s) of a type for the node, or a notice if it doesn't apply.
async function sectionFor(node: SceneNode, section: Section, opts: OpcionesGen): Promise<FrameNode[]> {
  if (section === "anatomy") {
    if (!TIPOS_VALIDOS.includes(node.type)) return [await aviso("Anatomy needs a FRAME, COMPONENT, INSTANCE or COMPONENT_SET.")];
    const maxLevel = opts.anatomyDepth === "self" ? 0 : opts.anatomyDepth === "all" ? Infinity : 1;
    const sections = [await anatomySection(node, extractAnatomy(await toNodeLike(node), opts.itemize, { maxLevel, includeRoot: true, deepTexts: true }), opts.table, opts.layerBadges)];
    if (opts.nested) {
      for (const inst of instanciasAnidadas(node)) {
        sections.push(await anatomySection(inst, extractAnatomy(await toNodeLike(inst), opts.itemize, { maxLevel, includeRoot: true, deepTexts: true }), opts.table, opts.layerBadges));
      }
    }
    return sections;
  }
  if (section === "properties") {
    const componentSet = await resolveComponentSet(node);
    if (!componentSet) return [await aviso("Properties needs a component with variants.")];
    const setNorm = await normalizarSet(componentSet);
    // Properties no longer uses the diff (takes info from the component set); [] is passed.
    const sections = [await propertiesSection(componentSet, [], setNorm.defaultProps, opts.columns)];
    if (opts.nested) {
      for (const set of await setsAnidados(componentSet)) {
        sections.push(await propertiesSection(set, [], (await normalizarSet(set)).defaultProps, opts.columns));
      }
    }
    return sections;
  }
  if (section === "layout") {
    if (!TIPOS_VALIDOS.includes(node.type)) return [await aviso("Layout and Spacing needs a FRAME, COMPONENT or INSTANCE.")];
    return [await layoutSection(node, extractLayout(await toNodeLike(node), opts.itemize), opts.columns, opts.hideOuter, opts.itemize, opts.measureChildren)];
  }
  if (section === "data") {
    if (!TIPOS_VALIDOS.includes(node.type)) return [await aviso("Data needs a FRAME, COMPONENT, INSTANCE or COMPONENT_SET.")];
    return [await dataSection(node.name, serializeAnatomy(extractAnatomy(await toNodeLike(node))))];
  }
  if (section === "styling") {
    if (opts.stylingTotal) return [await stylingSection(node.name, await documentInventory(), true)];
    if (!TIPOS_VALIDOS.includes(node.type)) return [await aviso("Styling Inventory needs a FRAME, COMPONENT, INSTANCE or COMPONENT_SET.")];
    return [await stylingSection(node.name, groupInventory(collectStyles(await toNodeLike(node))), false)];
  }
  if (section === "modes") {
    if (!TIPOS_VALIDOS.includes(node.type)) return [await aviso("Modes needs a FRAME, COMPONENT, INSTANCE or COMPONENT_SET.")];
    return [await modesSection(node, groupModes(await collectModes(node)), opts.columns)];
  }
  if (section === "twoway") {
    const componentSet = await resolveComponentSet(node);
    if (!componentSet) return [await aviso("Two-Way needs a component with variants.")];
    const setNorm = await normalizarSet(componentSet);
    const dosway = extractTwoWay(setNorm);
    if (!dosway) return [await aviso("Two-Way needs at least two variant properties.")];
    return [await twoWaySection(componentSet, dosway, setNorm.defaultProps, opts.columns)];
  }
  // complete
  const componentSet = await resolveComponentSet(node);
  if (!componentSet) return [await aviso("Complete needs a component with variants.")];
  const setNorm = await normalizarSet(componentSet);
  return await completeSection(componentSet.name, extractCompleteAnatomy(setNorm), extractCompleteLayout(setNorm), opts.columns);
}

// Yields to the event loop between sections, so Figma paints the one just added
// and the UI gets its progress message before the next starts.
function yieldNow(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

// Sequential mode: the Specs frame stays open between messages, one section each.
let specsAbiertos: FrameNode | null = null;
// The legend only goes on the first page, across runs too.
let primeraSeccion = true;

// One metrics line for the debug log: how long the section took and how heavy it is.
function metrica(label: string, pagina: FrameNode, ms: number): string {
  return `${label}: ${ms}ms · ${pagina.findAll().length + 1} nodes`;
}

// Builds a section's page: chrome (header/hero/feature/footer) + its content.
async function paginaDe(node: SceneNode, section: Section, opts: OpcionesGen, conLeyenda: boolean): Promise<FrameNode> {
  const pagina = verticalFrame("Specifications", 0, 0);
  pagina.cornerRadius = 40;

  const headerBar = await header(SECTION_LABEL[section]);
  pagina.appendChild(headerBar);
  headerBar.layoutSizingHorizontal = "FILL";
  const barraHero = await hero(SECTION_TITLE[section], SECTION_DESC[section]);
  pagina.appendChild(barraHero);
  barraHero.layoutSizingHorizontal = "FILL";
  const barraFeature = await feature(node);
  pagina.appendChild(barraFeature);
  barraFeature.layoutSizingHorizontal = "FILL";

  if (conLeyenda) {
    const it = wrapItem(await legendSection(), "leyendaItem");
    pagina.appendChild(it);
    it.layoutSizingHorizontal = "FILL";
  }

  const baseItem = ITEM_NAME[section];
  let itemN = 0;
  for (const content of await sectionFor(node, section, opts)) {
    itemN++;
    const itemName = baseItem ? `${baseItem}${String(itemN).padStart(2, "0")}` : undefined;
    // Layout already returns its own frame-item with padding/bg: it isn't re-wrapped.
    let it: FrameNode;
    if (section === "layout") {
      it = content;
      it.name = "Layout&Spacing";
    } else {
      it = wrapItem(content, itemName);
    }
    pagina.appendChild(it);
    it.layoutSizingHorizontal = "FILL";
  }

  const barraFooter = await footer();
  pagina.appendChild(barraFooter);
  barraFooter.layoutSizingHorizontal = "FILL";
  return pagina;
}

// Fixed order in which the chosen sections are stacked.
const ORDEN: Section[] = ["anatomy", "properties", "layout", "data", "styling", "modes", "twoway", "complete"];

// Base name of the wrapper item per section (numbered: anatomyItem01, …).
// Sections without an entry keep wrapItem's default name.
const ITEM_NAME: Partial<Record<Section, string>> = {
  anatomy: "anatomyItem",
};

// Label (uppercase) shown by the headerBox bar for each section.
const SECTION_LABEL: Record<Section, string> = {
  anatomy: "ANATOMY",
  properties: "PROPERTIES",
  layout: "LAYOUT AND SPACING",
  data: "DATA",
  styling: "STYLING INVENTORY",
  modes: "MODES",
  twoway: "TWO-WAY",
  complete: "COMPLETE",
};

// Large Hero title per section.
const SECTION_TITLE: Record<Section, string> = {
  anatomy: "Anatomy",
  properties: "Properties",
  layout: "Layout & Spacing",
  data: "Data",
  styling: "Styling Inventory",
  modes: "Modes",
  twoway: "Two-Way",
  complete: "Complete",
};

// Descriptive Hero paragraph per section.
const SECTION_DESC: Record<Section, string> = {
  anatomy: "Breaks the element down into its layers. Each layer is numbered over the design (on the left) and detailed on the right with its type and attributes —color, dimensions, typography and the variables applied. Use it to understand what the element is made of and which design-system tokens each part uses.",
  properties: "Lists the component's variant properties and their possible values. Use it to know what can be configured and how the variants combine.",
  layout: "Shows how the content is organized: direction, alignment, padding, item spacing (gap) and the dimensions of each Auto Layout frame. The dimension lines over the design mark the measurements in place; the panel on the right details them with their variables. Use it to reproduce the spacing and the resizing behavior.",
  data: "Represents the element as structured data (JSON). Use it to understand its hierarchy and connect it with code.",
  styling: "Inventory of the color, typography and effect styles and variables the element uses. Use it to audit which design-system tokens it applies.",
  modes: "Shows the value of each variable across its modes (e.g. Light/Dark). Use it to see how the element changes between themes.",
  twoway: "Crosses two variant properties in a matrix. Use it to review every combination of two axes at once.",
  complete: "A complete view combining the anatomy and layout of every variant. Use it as an all-in-one reference for the component.",
};

figma.ui.onmessage = async (msg: UIMessage) => {
  if (msg.type === "ready") { analyzeSelection(); return; }
  if (msg.type === "benchmark") {
    await ensureThemeVariables();
    await runBenchmark((line) => respond({ type: "log", line }));
    respond({ type: "result", ok: true });
    return;
  }
  if (msg.type === "cancel") { figma.closePlugin(); return; }
  if (msg.type === "open") { figma.openExternal(msg.url); return; }
  if (msg.type !== "generate") return;

  const selection = figma.currentPage.selection;
  if (selection.length === 0) {
    respond({ type: "result", ok: false, error: "Select something to generate specs." });
    return;
  }
  if (!msg.sections || msg.sections.length === 0) {
    respond({ type: "result", ok: false, error: "Choose at least one section." });
    return;
  }

  const node = selection[0];
  darkModeOn = msg.dark ?? false;
  applyRowLimit(msg.limitRows ?? false);
  // Hidden layers are out of the specs anyway, and skipping them speeds up the
  // traversal of large instances.
  figma.skipInvisibleInstanceChildren = true;
  if (!specsAbiertos) primeraSeccion = true;
  await ensureThemeVariables();
  applyColorFormat(msg.colorFormat ?? "HEX");
  applyUnit(msg.unit ?? "px");
  applyTypeFormat(msg.typeFormat ?? "Plain");
  applyRawFormat(msg.rawFormat ?? "HEX");
  applyShowRaw(msg.showRaw ?? true);
  applyPreference(msg.preference ?? "VARIABLE");
  const opts: OpcionesGen = {
    nested: msg.nested ?? false,
    table: msg.table ?? false,
    itemize: msg.itemize ?? false,
    hideOuter: msg.hideOuter ?? false,
    measureChildren: msg.measureChildren ?? false,
    columns: clampColumns(msg.columns),
    anatomyDepth: msg.anatomyDepth ?? "children",
    layerBadges: msg.layerBadges ?? false,
    stylingTotal: msg.stylingTotal ?? false,
  };
  try {
    const inicio = Date.now();
    const specs = specsAbiertos ?? verticalFrame("Specs", 80, 0);
    specs.minWidth = PAGE_WIDTH; // width floor; grows if any section is wider
    // On the canvas from the start: each section shows up as soon as it's done,
    // instead of the whole thing appearing (and being built) in one blocking pass.
    if (!specs.parent) figma.currentPage.appendChild(specs);

    const pendientes = ORDEN.filter((s) => msg.sections.includes(s));
    // Sequential mode does one section and hands the rest back to the UI.
    const tanda = msg.sequential ? pendientes.slice(0, 1) : pendientes;
    let listas = 0;
    for (const section of tanda) {
      const t0 = Date.now();
      const pagina = await paginaDe(node, section, opts, primeraSeccion && !!msg.legend);
      specs.appendChild(pagina);
      pagina.layoutSizingHorizontal = "FILL"; // the page fills the specs width (aligned chrome)
      primeraSeccion = false;
      listas++;
      respond({ type: "log", line: metrica(SECTION_TITLE[section], pagina, Date.now() - t0) });
      respond({ type: "progress", done: listas, total: pendientes.length, label: SECTION_TITLE[section] });
      await yieldNow();
    }

    const resto = pendientes.slice(tanda.length);
    if (resto.length > 0) {
      specsAbiertos = specs;
      respond({ type: "next", sections: resto });
      return;
    }
    specsAbiertos = null;
    respond({ type: "log", line: `total ${Date.now() - inicio}ms` });
    finalizar(specs, node);
  } catch (e) {
    specsAbiertos = null;
    respond({ type: "result", ok: false, error: String(e) });
  }
};
