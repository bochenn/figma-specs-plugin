import type { MensajeUI, MensajePlugin, SetNorm } from "./modelo/tipos.ts";
import { aNodoLike } from "./extraccion/adaptador.ts";
import { extraerAnatomy } from "./extraccion/anatomy.ts";
import { generarAnatomy } from "./generadores/anatomy.ts";
import { resolverComponentSet } from "./extraccion/resolver.ts";
import { extraerProperties } from "./extraccion/properties.ts";
import { generarProperties } from "./generadores/properties.ts";
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

const TIPOS_VALIDOS = ["FRAME", "COMPONENT", "INSTANCE", "COMPONENT_SET"];

figma.showUI(__html__, { width: 280, height: 300 });

function responder(msg: MensajePlugin): void {
  figma.ui.postMessage(msg);
}

// Ubica el output a la derecha del nodo seleccionado (para no superponerlo),
// hace foco y avisa éxito a la UI.
function finalizar(frame: FrameNode, nodo: SceneNode): void {
  const caja = nodo.absoluteBoundingBox;
  if (caja) {
    frame.x = caja.x + caja.width + 100;
    frame.y = caja.y;
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

async function generarSeccionAnatomy(nodo: SceneNode): Promise<void> {
  if (!TIPOS_VALIDOS.includes(nodo.type)) {
    responder({ tipo: "resultado", ok: false, error: "Anatomy necesita un FRAME, COMPONENT, INSTANCE o COMPONENT_SET." });
    return;
  }
  const elementos = extraerAnatomy(aNodoLike(nodo));
  const frame = await generarAnatomy(nodo, elementos);
  finalizar(frame, nodo);
}

async function generarSeccionProperties(nodo: SceneNode): Promise<void> {
  const componentSet = resolverComponentSet(nodo);
  if (!componentSet) {
    responder({ tipo: "resultado", ok: false, error: "Properties necesita un componente con variantes." });
    return;
  }
  const setNorm = normalizarSet(componentSet);
  const specs = extraerProperties(setNorm);
  const frame = await generarProperties(componentSet, specs, setNorm.defaultProps);
  finalizar(frame, nodo);
}

async function generarSeccionLayout(nodo: SceneNode): Promise<void> {
  if (!TIPOS_VALIDOS.includes(nodo.type)) {
    responder({ tipo: "resultado", ok: false, error: "Layout and Spacing necesita un FRAME, COMPONENT o INSTANCE." });
    return;
  }
  const specs = extraerLayout(aNodoLike(nodo));
  const frame = await generarLayout(nodo, specs);
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

async function generarSeccionModes(nodo: SceneNode): Promise<void> {
  if (!TIPOS_VALIDOS.includes(nodo.type)) {
    responder({ tipo: "resultado", ok: false, error: "Modes necesita un FRAME, COMPONENT, INSTANCE o COMPONENT_SET." });
    return;
  }
  const colecciones = agruparModes(recolectarModes(nodo));
  const frame = await generarModes(nodo, colecciones);
  finalizar(frame, nodo);
}

async function generarSeccionTwoWay(nodo: SceneNode): Promise<void> {
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
  const frame = await generarDosWay(componentSet, dosway, setNorm.defaultProps);
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
  try {
    if (msg.seccion === "anatomy") await generarSeccionAnatomy(nodo);
    else if (msg.seccion === "properties") await generarSeccionProperties(nodo);
    else if (msg.seccion === "layout") await generarSeccionLayout(nodo);
    else if (msg.seccion === "data") await generarSeccionData(nodo);
    else if (msg.seccion === "styling") await generarSeccionStyling(nodo);
    else if (msg.seccion === "modes") await generarSeccionModes(nodo);
    else await generarSeccionTwoWay(nodo);
  } catch (e) {
    responder({ tipo: "resultado", ok: false, error: String(e) });
  }
};
