const estado = document.getElementById("estado") as HTMLParagraphElement;

function generar(seccion: "anatomy" | "properties" | "layout" | "data" | "styling" | "modes" | "twoway" | "complete"): void {
  parent.postMessage({ pluginMessage: { tipo: "generar", seccion } }, "*");
}

(document.getElementById("anatomy") as HTMLButtonElement).onclick = () => generar("anatomy");
(document.getElementById("properties") as HTMLButtonElement).onclick = () => generar("properties");
(document.getElementById("layout") as HTMLButtonElement).onclick = () => generar("layout");
(document.getElementById("data") as HTMLButtonElement).onclick = () => generar("data");
(document.getElementById("styling") as HTMLButtonElement).onclick = () => generar("styling");
(document.getElementById("modes") as HTMLButtonElement).onclick = () => generar("modes");
(document.getElementById("twoway") as HTMLButtonElement).onclick = () => generar("twoway");
(document.getElementById("complete") as HTMLButtonElement).onclick = () => generar("complete");

window.onmessage = (event: MessageEvent) => {
  const msg = event.data.pluginMessage;
  if (msg && msg.tipo === "resultado") {
    estado.textContent = msg.ok ? "✓ Generado" : "Error: " + msg.error;
  }
};
