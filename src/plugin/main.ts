figma.showUI(__html__, { width: 280, height: 200 });

figma.ui.onmessage = (msg: { tipo: string }) => {
  if (msg.tipo === "generar") {
    figma.ui.postMessage({ tipo: "resultado", ok: true });
  }
};
