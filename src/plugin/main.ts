import type { MensajeUI, MensajePlugin } from "./modelo/tipos.ts";
import { aNodoLike } from "./extraccion/adaptador.ts";
import { extraerAnatomy } from "./extraccion/anatomy.ts";
import { generarAnatomy } from "./generadores/anatomy.ts";

const TIPOS_VALIDOS = ["FRAME", "COMPONENT", "INSTANCE", "COMPONENT_SET"];

figma.showUI(__html__, { width: 280, height: 200 });

function responder(msg: MensajePlugin): void {
  figma.ui.postMessage(msg);
}

figma.ui.onmessage = async (msg: MensajeUI) => {
  if (msg.tipo !== "generar") return;

  const seleccion = figma.currentPage.selection;
  if (seleccion.length === 0) {
    responder({ tipo: "resultado", ok: false, error: "Seleccioná un componente, instancia o frame para generar specs." });
    return;
  }

  const nodo = seleccion[0];
  if (!TIPOS_VALIDOS.includes(nodo.type)) {
    responder({ tipo: "resultado", ok: false, error: "Anatomy necesita un FRAME, COMPONENT, INSTANCE o COMPONENT_SET." });
    return;
  }

  try {
    const elementos = extraerAnatomy(aNodoLike(nodo));
    const specifications = await generarAnatomy(nodo, elementos);
    figma.viewport.scrollAndZoomIntoView([specifications]);
    if (seleccion.length > 1) {
      responder({ tipo: "resultado", ok: false, error: "Se generó para el primer elemento; la selección múltiple llega después." });
    } else {
      responder({ tipo: "resultado", ok: true });
    }
  } catch (e) {
    responder({ tipo: "resultado", ok: false, error: String(e) });
  }
};
