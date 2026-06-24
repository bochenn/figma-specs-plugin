import type { MensajeUI, MensajePlugin, SetNorm, Seccion } from "./modelo/tipos.ts";
import { aNodoLike } from "./extraccion/adaptador.ts";
import { asegurarVariablesTema, varsTema } from "./utils/variables-tema.ts";
import { frameVertical, texto } from "./generadores/frames.ts";
import { clampColumnas } from "./utils/columnas.ts";
import { aplicarFormatoColor } from "./utils/color.ts";
import { aplicarFormatoRaw, aplicarMostrarRaw, aplicarPreferencia } from "./utils/valores.ts";
import { aplicarUnidad } from "./utils/espaciado.ts";
import { aplicarFormatoTipo } from "./utils/tipografia.ts";
import { extraerAnatomy } from "./extraccion/anatomy.ts";
import { seccionDeAnatomy } from "./generadores/anatomy.ts";
import { resolverComponentSet } from "./extraccion/resolver.ts";
import { extraerProperties } from "./extraccion/properties.ts";
import { seccionDeProperties } from "./generadores/properties.ts";
import { extraerLayout } from "./extraccion/layout.ts";
import { seccionDeLayout, seccionLeyenda } from "./generadores/layout.ts";
import { serializarAnatomy } from "./serializacion/anatomy-json.ts";
import { seccionDeData } from "./generadores/data.ts";
import { recolectarEstilos } from "./inventario/recolectar.ts";
import { agruparInventario } from "./inventario/agrupar.ts";
import { seccionDeStyling } from "./generadores/styling.ts";
import { recolectarModes } from "./variables/recolectar-modes.ts";
import { agruparModes } from "./variables/modes.ts";
import { seccionDeModes } from "./generadores/modes.ts";
import { extraerDosWay } from "./extraccion/properties.ts";
import { seccionDeDosWay } from "./generadores/properties.ts";
import { extraerCompleteAnatomy, extraerCompleteLayout } from "./extraccion/properties.ts";
import { seccionDeComplete } from "./generadores/complete.ts";
import { header, hero, feature, footer, envolverItem, ANCHO_PAGINA } from "./generadores/pagina.ts";

const TIPOS_VALIDOS = ["FRAME", "COMPONENT", "INSTANCE", "COMPONENT_SET"];

figma.showUI(__html__, { width: 280, height: 460 });

function responder(msg: MensajePlugin): void {
  figma.ui.postMessage(msg);
}

// Ubica el output a la derecha del nodo seleccionado, aplica el fondo del tema,
// Toggle Dark de la última generación (setea el modo explícito del frame).
let modoOscuro = false;

// hace foco y avisa éxito a la UI.
function finalizar(frame: FrameNode, nodo: SceneNode): void {
  const caja = nodo.absoluteBoundingBox;
  if (caja) {
    frame.x = caja.x + caja.width + 100;
    frame.y = caja.y;
  }
  if (modoOscuro) {
    frame.setExplicitVariableModeForCollection(varsTema().coleccion, varsTema().modoDark);
  }
  figma.viewport.scrollAndZoomIntoView([frame]);
  responder({ tipo: "resultado", ok: true });
}

// Construye el SetNorm para la extracción pura a partir del Component Set real.
function normalizarSet(componentSet: ComponentSetNode): SetNorm {
  const propiedades: Record<string, string[]> = {};
  const grupos = componentSet.variantGroupProperties;
  for (const nombre of Object.keys(grupos)) {
    propiedades[nombre] = grupos[nombre].values;
  }
  const variantes = componentSet.children
    .filter((c): c is ComponentNode => c.type === "COMPONENT")
    .map((c) => ({ variantProperties: c.variantProperties ?? {}, raiz: aNodoLike(c) }));
  const defaultProps = componentSet.defaultVariant?.variantProperties ?? {};
  return { propiedades, variantes, defaultProps };
}

// Instancias anidadas de primer nivel (no entra dentro de las instancias).
function instanciasAnidadas(nodo: SceneNode): InstanceNode[] {
  const res: InstanceNode[] = [];
  function walk(n: SceneNode): void {
    if (!("children" in n)) return;
    for (const c of n.children) {
      if (c.type === "INSTANCE") res.push(c);
      else walk(c);
    }
  }
  walk(nodo);
  return res;
}

// Component sets de las instancias anidadas (en la variante default), sin
// repetidos, sin el set principal y sin componentes que no tengan variantes.
function setsAnidados(componentSet: ComponentSetNode): ComponentSetNode[] {
  const raiz = componentSet.defaultVariant ?? componentSet;
  const res: ComponentSetNode[] = [];
  const vistos = new Set<string>([componentSet.id]);
  for (const inst of instanciasAnidadas(raiz)) {
    const set = resolverComponentSet(inst);
    if (!set || vistos.has(set.id)) continue;
    vistos.add(set.id);
    res.push(set);
  }
  return res;
}

// Opciones de generación tomadas del mensaje de la UI.
interface OpcionesGen {
  nested: boolean;
  tabla: boolean;
  itemizar: boolean;
  hideOuter: boolean;
  medirHijos: boolean;
  columnas: number;
  anatomyDepth: "self" | "children" | "all";
}

// Frame de aviso para una sección que no aplica al nodo (no aborta las demás).
async function aviso(mensaje: string): Promise<FrameNode> {
  const f = frameVertical("Aviso", 8);
  f.appendChild(await texto(mensaje, 16));
  return f;
}

// Devuelve la(s) sección(es) de un tipo para el nodo, o un aviso si no aplica.
async function seccionPara(nodo: SceneNode, seccion: Seccion, opts: OpcionesGen): Promise<FrameNode[]> {
  if (seccion === "anatomy") {
    if (!TIPOS_VALIDOS.includes(nodo.type)) return [await aviso("Anatomy needs a FRAME, COMPONENT, INSTANCE or COMPONENT_SET.")];
    const nivelMax = opts.anatomyDepth === "self" ? 0 : opts.anatomyDepth === "all" ? Infinity : 1;
    const secciones = [await seccionDeAnatomy(nodo, extraerAnatomy(aNodoLike(nodo), opts.itemizar, { nivelMax, incluirRaiz: true, textosProfundos: true }), opts.tabla)];
    if (opts.nested) {
      for (const inst of instanciasAnidadas(nodo)) {
        secciones.push(await seccionDeAnatomy(inst, extraerAnatomy(aNodoLike(inst), opts.itemizar, { nivelMax, incluirRaiz: true, textosProfundos: true }), opts.tabla));
      }
    }
    return secciones;
  }
  if (seccion === "properties") {
    const componentSet = resolverComponentSet(nodo);
    if (!componentSet) return [await aviso("Properties needs a component with variants.")];
    const setNorm = normalizarSet(componentSet);
    const secciones = [await seccionDeProperties(componentSet, extraerProperties(setNorm), setNorm.defaultProps, opts.columnas)];
    if (opts.nested) {
      for (const set of setsAnidados(componentSet)) {
        const norm = normalizarSet(set);
        secciones.push(await seccionDeProperties(set, extraerProperties(norm), norm.defaultProps, opts.columnas));
      }
    }
    return secciones;
  }
  if (seccion === "layout") {
    if (!TIPOS_VALIDOS.includes(nodo.type)) return [await aviso("Layout and Spacing needs a FRAME, COMPONENT or INSTANCE.")];
    return [await seccionDeLayout(nodo, extraerLayout(aNodoLike(nodo), opts.itemizar), opts.columnas, opts.hideOuter, opts.itemizar, opts.medirHijos)];
  }
  if (seccion === "data") {
    if (!TIPOS_VALIDOS.includes(nodo.type)) return [await aviso("Data needs a FRAME, COMPONENT, INSTANCE or COMPONENT_SET.")];
    return [await seccionDeData(nodo.name, serializarAnatomy(extraerAnatomy(aNodoLike(nodo))))];
  }
  if (seccion === "styling") {
    if (!TIPOS_VALIDOS.includes(nodo.type)) return [await aviso("Styling Inventory needs a FRAME, COMPONENT, INSTANCE or COMPONENT_SET.")];
    return [await seccionDeStyling(nodo.name, agruparInventario(recolectarEstilos(aNodoLike(nodo))))];
  }
  if (seccion === "modes") {
    if (!TIPOS_VALIDOS.includes(nodo.type)) return [await aviso("Modes needs a FRAME, COMPONENT, INSTANCE or COMPONENT_SET.")];
    return [await seccionDeModes(nodo, agruparModes(recolectarModes(nodo)), opts.columnas)];
  }
  if (seccion === "twoway") {
    const componentSet = resolverComponentSet(nodo);
    if (!componentSet) return [await aviso("Two-Way needs a component with variants.")];
    const setNorm = normalizarSet(componentSet);
    const dosway = extraerDosWay(setNorm);
    if (!dosway) return [await aviso("Two-Way needs at least two variant properties.")];
    return [await seccionDeDosWay(componentSet, dosway, setNorm.defaultProps, opts.columnas)];
  }
  // complete
  const componentSet = resolverComponentSet(nodo);
  if (!componentSet) return [await aviso("Complete needs a component with variants.")];
  const setNorm = normalizarSet(componentSet);
  return await seccionDeComplete(componentSet.name, extraerCompleteAnatomy(setNorm), extraerCompleteLayout(setNorm), opts.columnas);
}

// Orden fijo en el que se apilan las secciones elegidas.
const ORDEN: Seccion[] = ["anatomy", "properties", "layout", "data", "styling", "modes", "twoway", "complete"];

// Nombre base del item-envoltorio por sección (se numera: anatomyItem01, …).
// Las secciones sin entrada conservan el nombre por defecto de envolverItem.
const NOMBRE_ITEM: Partial<Record<Seccion, string>> = {
  anatomy: "anatomyItem",
};

// Etiqueta (mayúsculas) que muestra la barra del encabezado por cada sección.
const ETIQUETA_SECCION: Record<Seccion, string> = {
  anatomy: "ANATOMY",
  properties: "PROPERTIES",
  layout: "LAYOUT AND SPACING",
  data: "DATA",
  styling: "STYLING INVENTORY",
  modes: "MODES",
  twoway: "TWO-WAY",
  complete: "COMPLETE",
};

// Título grande del Hero por sección.
const TITULO_SECCION: Record<Seccion, string> = {
  anatomy: "Anatomy",
  properties: "Properties",
  layout: "Layout & Spacing",
  data: "Data",
  styling: "Styling Inventory",
  modes: "Modes",
  twoway: "Two-Way",
  complete: "Complete",
};

// Párrafo descriptivo del Hero por sección.
const DESCRIPCION_SECCION: Record<Seccion, string> = {
  anatomy: "Breaks the element down into its layers. Each layer is numbered over the design (on the left) and detailed on the right with its type and attributes —color, dimensions, typography and the variables applied. Use it to understand what the element is made of and which design-system tokens each part uses.",
  properties: "Lists the component's variant properties and their possible values. Use it to know what can be configured and how the variants combine.",
  layout: "Shows how the content is organized: direction, alignment, padding, item spacing (gap) and the dimensions of each Auto Layout frame. The dimension lines over the design mark the measurements in place; the panel on the right details them with their variables. Use it to reproduce the spacing and the resizing behavior.",
  data: "Represents the element as structured data (JSON). Use it to understand its hierarchy and connect it with code.",
  styling: "Inventory of the color, typography and effect styles and variables the element uses. Use it to audit which design-system tokens it applies.",
  modes: "Shows the value of each variable across its modes (e.g. Light/Dark). Use it to see how the element changes between themes.",
  twoway: "Crosses two variant properties in a matrix. Use it to review every combination of two axes at once.",
  complete: "A complete view combining the anatomy and layout of every variant. Use it as an all-in-one reference for the component.",
};

figma.ui.onmessage = async (msg: MensajeUI) => {
  if (msg.tipo !== "generar") return;

  const seleccion = figma.currentPage.selection;
  if (seleccion.length === 0) {
    responder({ tipo: "resultado", ok: false, error: "Select something to generate specs." });
    return;
  }
  if (!msg.secciones || msg.secciones.length === 0) {
    responder({ tipo: "resultado", ok: false, error: "Choose at least one section." });
    return;
  }

  const nodo = seleccion[0];
  modoOscuro = msg.dark ?? false;
  await asegurarVariablesTema();
  aplicarFormatoColor(msg.formatoColor ?? "HEX");
  aplicarUnidad(msg.unidad ?? "px");
  aplicarFormatoTipo(msg.formatoTipo ?? "Plain");
  aplicarFormatoRaw(msg.formatoRaw ?? "HEX");
  aplicarMostrarRaw(msg.mostrarRaw ?? true);
  aplicarPreferencia(msg.preferencia ?? "VARIABLE");
  const opts: OpcionesGen = {
    nested: msg.nested ?? false,
    tabla: msg.tabla ?? false,
    itemizar: msg.itemizar ?? false,
    hideOuter: msg.hideOuter ?? false,
    medirHijos: msg.medirHijos ?? false,
    columnas: clampColumnas(msg.columnas),
    anatomyDepth: msg.anatomyDepth ?? "children",
  };
  try {
    const specs = frameVertical("Specs", 80, 0);
    specs.minWidth = ANCHO_PAGINA; // piso de ancho; crece si alguna sección es más ancha
    let primeraSeccion = true;
    for (const seccion of ORDEN) {
      if (!msg.secciones.includes(seccion)) continue;

      const pagina = frameVertical("Specifications", 0, 0);
      pagina.cornerRadius = 40;

      const barraHeader = await header(ETIQUETA_SECCION[seccion]);
      pagina.appendChild(barraHeader);
      barraHeader.layoutSizingHorizontal = "FILL";
      const barraHero = await hero(TITULO_SECCION[seccion], DESCRIPCION_SECCION[seccion]);
      pagina.appendChild(barraHero);
      barraHero.layoutSizingHorizontal = "FILL";
      const barraFeature = await feature(nodo.name);
      pagina.appendChild(barraFeature);
      barraFeature.layoutSizingHorizontal = "FILL";

      if (primeraSeccion && msg.leyenda) {
        const it = envolverItem(await seccionLeyenda(), "leyendaItem");
        pagina.appendChild(it);
        it.layoutSizingHorizontal = "FILL";
      }
      const baseItem = NOMBRE_ITEM[seccion];
      let itemN = 0;
      for (const contenido of await seccionPara(nodo, seccion, opts)) {
        itemN++;
        const nombreItem = baseItem ? `${baseItem}${String(itemN).padStart(2, "0")}` : undefined;
        // Layout ya devuelve su propio frame-item con padding/fondo: no se re-envuelve.
        let it: FrameNode;
        if (seccion === "layout") {
          it = contenido;
          it.name = "Layout&Spacing";
        } else {
          it = envolverItem(contenido, nombreItem);
        }
        pagina.appendChild(it);
        it.layoutSizingHorizontal = "FILL";
      }

      const barraFooter = await footer();
      pagina.appendChild(barraFooter);
      barraFooter.layoutSizingHorizontal = "FILL";

      specs.appendChild(pagina);
      pagina.layoutSizingHorizontal = "FILL"; // la página llena el ancho de specs (chrome alineado)
      primeraSeccion = false;
    }
    figma.currentPage.appendChild(specs);
    finalizar(specs, nodo);
  } catch (e) {
    responder({ tipo: "resultado", ok: false, error: String(e) });
  }
};
