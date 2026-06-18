import type { MensajeUI, MensajePlugin, SetNorm, Seccion } from "./modelo/tipos.ts";
import { aNodoLike } from "./extraccion/adaptador.ts";
import { asegurarVariablesTema, varsTema } from "./utils/variables-tema.ts";
import { fillTematizado, frameVertical, texto } from "./generadores/frames.ts";
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
  frame.fills = fillTematizado(varsTema().fondoSpec);
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
    if (!TIPOS_VALIDOS.includes(nodo.type)) return [await aviso("Anatomy necesita un FRAME, COMPONENT, INSTANCE o COMPONENT_SET.")];
    const secciones = [await seccionDeAnatomy(nodo, extraerAnatomy(aNodoLike(nodo), opts.itemizar), opts.tabla)];
    if (opts.nested) {
      for (const inst of instanciasAnidadas(nodo)) {
        secciones.push(await seccionDeAnatomy(inst, extraerAnatomy(aNodoLike(inst), opts.itemizar), opts.tabla));
      }
    }
    return secciones;
  }
  if (seccion === "properties") {
    const componentSet = resolverComponentSet(nodo);
    if (!componentSet) return [await aviso("Properties necesita un componente con variantes.")];
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
    if (!TIPOS_VALIDOS.includes(nodo.type)) return [await aviso("Layout and Spacing necesita un FRAME, COMPONENT o INSTANCE.")];
    return [await seccionDeLayout(nodo, extraerLayout(aNodoLike(nodo), opts.itemizar), opts.columnas, opts.hideOuter, opts.itemizar, opts.medirHijos)];
  }
  if (seccion === "data") {
    if (!TIPOS_VALIDOS.includes(nodo.type)) return [await aviso("Data necesita un FRAME, COMPONENT, INSTANCE o COMPONENT_SET.")];
    return [await seccionDeData(nodo.name, serializarAnatomy(extraerAnatomy(aNodoLike(nodo))))];
  }
  if (seccion === "styling") {
    if (!TIPOS_VALIDOS.includes(nodo.type)) return [await aviso("Styling Inventory necesita un FRAME, COMPONENT, INSTANCE o COMPONENT_SET.")];
    return [await seccionDeStyling(nodo.name, agruparInventario(recolectarEstilos(aNodoLike(nodo))))];
  }
  if (seccion === "modes") {
    if (!TIPOS_VALIDOS.includes(nodo.type)) return [await aviso("Modes necesita un FRAME, COMPONENT, INSTANCE o COMPONENT_SET.")];
    return [await seccionDeModes(nodo, agruparModes(recolectarModes(nodo)), opts.columnas)];
  }
  if (seccion === "twoway") {
    const componentSet = resolverComponentSet(nodo);
    if (!componentSet) return [await aviso("Two-Way necesita un componente con variantes.")];
    const setNorm = normalizarSet(componentSet);
    const dosway = extraerDosWay(setNorm);
    if (!dosway) return [await aviso("Two-Way necesita al menos dos propiedades de variante.")];
    return [await seccionDeDosWay(componentSet, dosway, setNorm.defaultProps, opts.columnas)];
  }
  // complete
  const componentSet = resolverComponentSet(nodo);
  if (!componentSet) return [await aviso("Complete necesita un componente con variantes.")];
  const setNorm = normalizarSet(componentSet);
  return await seccionDeComplete(componentSet.name, extraerCompleteAnatomy(setNorm), extraerCompleteLayout(setNorm), opts.columnas);
}

// Orden fijo en el que se apilan las secciones elegidas.
const ORDEN: Seccion[] = ["anatomy", "properties", "layout", "data", "styling", "modes", "twoway", "complete"];

figma.ui.onmessage = async (msg: MensajeUI) => {
  if (msg.tipo !== "generar") return;

  const seleccion = figma.currentPage.selection;
  if (seleccion.length === 0) {
    responder({ tipo: "resultado", ok: false, error: "Seleccioná algo para generar specs." });
    return;
  }
  if (!msg.secciones || msg.secciones.length === 0) {
    responder({ tipo: "resultado", ok: false, error: "Elegí al menos una sección." });
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
  };
  try {
    const specifications = frameVertical("Specifications", 128, 64);
    const spec = frameVertical(`${nodo.name} Spec`, 48);
    specifications.appendChild(spec);
    if (msg.leyenda) spec.appendChild(await seccionLeyenda());
    spec.appendChild(await texto(nodo.name, 64));
    for (const seccion of ORDEN) {
      if (!msg.secciones.includes(seccion)) continue;
      for (const f of await seccionPara(nodo, seccion, opts)) spec.appendChild(f);
    }
    figma.currentPage.appendChild(specifications);
    finalizar(specifications, nodo);
  } catch (e) {
    responder({ tipo: "resultado", ok: false, error: String(e) });
  }
};
