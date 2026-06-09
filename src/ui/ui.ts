const boton = document.getElementById("generar") as HTMLButtonElement;
const estado = document.getElementById("estado") as HTMLParagraphElement;

boton.onclick = () => {
  parent.postMessage({ pluginMessage: { tipo: "generar" } }, "*");
};

window.onmessage = (event: MessageEvent) => {
  const msg = event.data.pluginMessage;
  if (msg && msg.tipo === "resultado") {
    estado.textContent = msg.ok ? "✓ Generado" : "Error: " + msg.error;
  }
};
