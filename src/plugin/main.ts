import type { MensajeUI, MensajePlugin, SetNorm } from "./modelo/tipos.ts";
import { aNodoLike } from "./extraccion/adaptador.ts";
import { asegurarVariablesTema, varsTema } from "./utils/variables-tema.ts";
import { fillTematizado } from "./generadores/frames.ts";
import { clampColumnas } from "./utils/columnas.ts";
import { aplicarFormatoColor } from "./utils/color.ts";
import { aplicarFormatoRaw, aplicarMostrarRaw, aplicarPreferencia } from "./utils/valores.ts";
import { aplicarUnidad } from "./utils/espaciado.ts";
import { aplicarFormatoTipo } from "./utils/tipografia.ts";
import { extraerAnatomy } from "./extraccion/anatomy.ts";
import { generarAnatomy, generarAnatomyConNested } from "./generadores/anatomy.ts";
import { resolverComponentSet } from "./extraccion/resolver.ts";
import { extraerProperties } from "./extraccion/properties.ts";
import { generarProperties, generarPropertiesConNested } from "./generadores/properties.ts";
import { extraerLayout } from "./extraccion/layout.ts";
import { generarLayout } from "./generadores/layout.ts";
import { serializarAnatomy } from "./serializacion/anatomy-json.ts";
import { generarData } from "./generadores/data.ts";
import { recolectarEstilos } from "./inventario/recolectar.ts";
import { agruparInventario } from "./inventario/agrupar.ts";
import { generarStyling } from "./generadores/styling.ts";
import { recolectarModes } from "./variables/recolectar-modes.ts";
import { agruparModes } from "./variables/modes.ts";
import { generarModes } from "./generadores/modes.ts";
import { extraerDosWay } from "./extraccion/properties.ts";
import { generarDosWay } from "./generadores/properties.ts";
import { extraerCompleteAnatomy, extraerCompleteLayout } from "./extraccion/properties.ts";
import { generarComplete } from "./generadores/complete.ts";

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

async function generarSeccionAnatomy(nodo: SceneNode, nested: boolean, tabla: boolean): Promise<void> {
  if (!TIPOS_VALIDOS.includes(nodo.type)) {
    responder({ tipo: "resultado", ok: false, error: "Anatomy necesita un FRAME, COMPONENT, INSTANCE o COMPONENT_SET." });
    return;
  }
  const elementos = extraerAnatomy(aNodoLike(nodo));
  let frame: FrameNode;
  if (nested) {
    const nestedSpecs = instanciasAnidadas(nodo).map((inst) => ({ nodo: inst, elementos: extraerAnatomy(aNodoLike(inst)) }));
    frame = await generarAnatomyConNested(nodo, elementos, nestedSpecs, tabla);
  } else {
    frame = await generarAnatomy(nodo, elementos, tabla);
  }
  finalizar(frame, nodo);
}

async function generarSeccionProperties(nodo: SceneNode, columnas: number, nested: boolean): Promise<void> {
  const componentSet = resolverComponentSet(nodo);
  if (!componentSet) {
    responder({ tipo: "resultado", ok: false, error: "Properties necesita un componente con variantes." });
    return;
  }
  const setNorm = normalizarSet(componentSet);
  const specs = extraerProperties(setNorm);
  let frame: FrameNode;
  if (nested) {
    const nestedSpecs = setsAnidados(componentSet).map((set) => {
      const norm = normalizarSet(set);
      return { set, propiedades: extraerProperties(norm), defaultProps: norm.defaultProps };
    });
    frame = await generarPropertiesConNested(componentSet, specs, setNorm.defaultProps, columnas, nestedSpecs);
  } else {
    frame = await generarProperties(componentSet, specs, setNorm.defaultProps, columnas);
  }
  finalizar(frame, nodo);
}

async function generarSeccionLayout(nodo: SceneNode, columnas: number): Promise<void> {
  if (!TIPOS_VALIDOS.includes(nodo.type)) {
    responder({ tipo: "resultado", ok: false, error: "Layout and Spacing necesita un FRAME, COMPONENT o INSTANCE." });
    return;
  }
  const specs = extraerLayout(aNodoLike(nodo));
  const frame = await generarLayout(nodo, specs, columnas);
  finalizar(frame, nodo);
}

async function generarSeccionData(nodo: SceneNode): Promise<void> {
  if (!TIPOS_VALIDOS.includes(nodo.type)) {
    responder({ tipo: "resultado", ok: false, error: "Data necesita un FRAME, COMPONENT, INSTANCE o COMPONENT_SET." });
    return;
  }
  const elementos = extraerAnatomy(aNodoLike(nodo));
  const json = serializarAnatomy(elementos);
  const frame = await generarData(nodo.name, json);
  finalizar(frame, nodo);
}

async function generarSeccionStyling(nodo: SceneNode): Promise<void> {
  if (!TIPOS_VALIDOS.includes(nodo.type)) {
    responder({ tipo: "resultado", ok: false, error: "Styling Inventory necesita un FRAME, COMPONENT, INSTANCE o COMPONENT_SET." });
    return;
  }
  const filas = agruparInventario(recolectarEstilos(aNodoLike(nodo)));
  const frame = await generarStyling(nodo.name, filas);
  finalizar(frame, nodo);
}

async function generarSeccionModes(nodo: SceneNode, columnas: number): Promise<void> {
  if (!TIPOS_VALIDOS.includes(nodo.type)) {
    responder({ tipo: "resultado", ok: false, error: "Modes necesita un FRAME, COMPONENT, INSTANCE o COMPONENT_SET." });
    return;
  }
  const colecciones = agruparModes(recolectarModes(nodo));
  const frame = await generarModes(nodo, colecciones, columnas);
  finalizar(frame, nodo);
}

async function generarSeccionTwoWay(nodo: SceneNode, columnas: number): Promise<void> {
  const componentSet = resolverComponentSet(nodo);
  if (!componentSet) {
    responder({ tipo: "resultado", ok: false, error: "Two-Way necesita un componente con variantes." });
    return;
  }
  const setNorm = normalizarSet(componentSet);
  const dosway = extraerDosWay(setNorm);
  if (!dosway) {
    responder({ tipo: "resultado", ok: false, error: "Two-Way necesita al menos dos propiedades de variante." });
    return;
  }
  const frame = await generarDosWay(componentSet, dosway, setNorm.defaultProps, columnas);
  finalizar(frame, nodo);
}

async function generarSeccionComplete(nodo: SceneNode, columnas: number): Promise<void> {
  const componentSet = resolverComponentSet(nodo);
  if (!componentSet) {
    responder({ tipo: "resultado", ok: false, error: "Complete necesita un componente con variantes." });
    return;
  }
  const setNorm = normalizarSet(componentSet);
  const anatomy = extraerCompleteAnatomy(setNorm);
  const layout = extraerCompleteLayout(setNorm);
  const frame = await generarComplete(componentSet.name, anatomy, layout, columnas);
  finalizar(frame, nodo);
}

figma.ui.onmessage = async (msg: MensajeUI) => {
  if (msg.tipo !== "generar") return;

  const seleccion = figma.currentPage.selection;
  if (seleccion.length === 0) {
    responder({ tipo: "resultado", ok: false, error: "Seleccioná algo para generar specs." });
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
  const columnas = clampColumnas(msg.columnas);
  try {
    if (msg.seccion === "anatomy") await generarSeccionAnatomy(nodo, msg.nested ?? false, msg.tabla ?? false);
    else if (msg.seccion === "properties") await generarSeccionProperties(nodo, columnas, msg.nested ?? false);
    else if (msg.seccion === "layout") await generarSeccionLayout(nodo, columnas);
    else if (msg.seccion === "data") await generarSeccionData(nodo);
    else if (msg.seccion === "styling") await generarSeccionStyling(nodo);
    else if (msg.seccion === "modes") await generarSeccionModes(nodo, columnas);
    else if (msg.seccion === "twoway") await generarSeccionTwoWay(nodo, columnas);
    else await generarSeccionComplete(nodo, columnas);
  } catch (e) {
    responder({ tipo: "resultado", ok: false, error: String(e) });
  }
};
