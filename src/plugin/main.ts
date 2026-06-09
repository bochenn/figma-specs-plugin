import type { MensajeUI, MensajePlugin, SetNorm } from "./modelo/tipos.ts";
import { aNodoLike } from "./extraccion/adaptador.ts";
import { extraerAnatomy } from "./extraccion/anatomy.ts";
import { generarAnatomy } from "./generadores/anatomy.ts";
import { resolverComponentSet } from "./extraccion/resolver.ts";
import { extraerProperties } from "./extraccion/properties.ts";
import { generarProperties } from "./generadores/properties.ts";

const TIPOS_VALIDOS = ["FRAME", "COMPONENT", "INSTANCE", "COMPONENT_SET"];

figma.showUI(__html__, { width: 280, height: 200 });

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

figma.ui.onmessage = async (msg: MensajeUI) => {
  if (msg.tipo !== "generar") return;

  const seleccion = figma.currentPage.selection;
  if (seleccion.length === 0) {
    responder({ tipo: "resultado", ok: false, error: "Seleccioná algo para generar specs." });
    return;
  }

  const nodo = seleccion[0];

  try {
    const componentSet = resolverComponentSet(nodo);
    if (componentSet) {
      // Camino Properties.
      const setNorm = normalizarSet(componentSet);
      const specs = extraerProperties(setNorm);
      const frame = await generarProperties(componentSet, specs, setNorm.defaultProps);
      figma.viewport.scrollAndZoomIntoView([frame]);
      responder({ tipo: "resultado", ok: true });
      return;
    }

    // Camino Anatomy (flujo existente).
    if (!TIPOS_VALIDOS.includes(nodo.type)) {
      responder({ tipo: "resultado", ok: false, error: "Seleccioná un FRAME, COMPONENT, INSTANCE o COMPONENT_SET." });
      return;
    }
    const elementos = extraerAnatomy(aNodoLike(nodo));
    const specifications = await generarAnatomy(nodo, elementos);
    figma.viewport.scrollAndZoomIntoView([specifications]);
    responder({ tipo: "resultado", ok: true });
  } catch (e) {
    responder({ tipo: "resultado", ok: false, error: String(e) });
  }
};
