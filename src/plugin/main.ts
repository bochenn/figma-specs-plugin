import type { MensajeUI, MensajePlugin, SetNorm } from "./modelo/tipos.ts";
import { aNodoLike } from "./extraccion/adaptador.ts";
import { extraerAnatomy } from "./extraccion/anatomy.ts";
import { generarAnatomy } from "./generadores/anatomy.ts";
import { resolverComponentSet } from "./extraccion/resolver.ts";
import { extraerProperties } from "./extraccion/properties.ts";
import { generarProperties } from "./generadores/properties.ts";
import { extraerLayout } from "./extraccion/layout.ts";
import { generarLayout } from "./generadores/layout.ts";
import { anatomyADataJSON, propiedadesADataJSON, armarDataJSON } from "./extraccion/data.ts";
import { generarData } from "./generadores/data.ts";
import { extraerStyling } from "./extraccion/styling.ts";
import { generarStyling } from "./generadores/styling.ts";

const TIPOS_VALIDOS = ["FRAME", "COMPONENT", "INSTANCE", "COMPONENT_SET"];

figma.showUI(__html__, { width: 280, height: 290 });

function responder(msg: MensajePlugin): void {
  figma.ui.postMessage(msg);
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
  figma.viewport.scrollAndZoomIntoView([frame]);
  responder({ tipo: "resultado", ok: true });
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
  figma.viewport.scrollAndZoomIntoView([frame]);
  responder({ tipo: "resultado", ok: true });
}

async function generarSeccionLayout(nodo: SceneNode): Promise<void> {
  if (!TIPOS_VALIDOS.includes(nodo.type)) {
    responder({ tipo: "resultado", ok: false, error: "Layout and Spacing necesita un FRAME, COMPONENT o INSTANCE." });
    return;
  }
  const specs = extraerLayout(aNodoLike(nodo));
  const frame = await generarLayout(nodo.name, specs);
  figma.viewport.scrollAndZoomIntoView([frame]);
  responder({ tipo: "resultado", ok: true });
}

async function generarSeccionData(nodo: SceneNode): Promise<void> {
  if (!TIPOS_VALIDOS.includes(nodo.type)) {
    responder({ tipo: "resultado", ok: false, error: "Data necesita un FRAME, COMPONENT, INSTANCE o COMPONENT_SET." });
    return;
  }
  const elementos = extraerAnatomy(aNodoLike(nodo));
  const anatomyData = anatomyADataJSON(elementos);

  let propiedadesData = null;
  const componentSet = resolverComponentSet(nodo);
  if (componentSet) {
    const setNorm = normalizarSet(componentSet);
    const specs = extraerProperties(setNorm);
    propiedadesData = propiedadesADataJSON(specs);
  }

  const jsonString = armarDataJSON(anatomyData, propiedadesData);
  const frame = await generarData(nodo.name, jsonString);
  figma.viewport.scrollAndZoomIntoView([frame]);
  responder({ tipo: "resultado", ok: true });
}

async function generarSeccionStyling(nodo: SceneNode): Promise<void> {
  if (!TIPOS_VALIDOS.includes(nodo.type)) {
    responder({ tipo: "resultado", ok: false, error: "Styling Inventory necesita un FRAME, COMPONENT, INSTANCE o COMPONENT_SET." });
    return;
  }
  const spec = extraerStyling(nodo);
  const frame = await generarStyling(nodo.name, spec);
  figma.viewport.scrollAndZoomIntoView([frame]);
  responder({ tipo: "resultado", ok: true });
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
    else await generarSeccionStyling(nodo);
  } catch (e) {
    responder({ tipo: "resultado", ok: false, error: String(e) });
  }
};
