const estado = document.getElementById("estado") as HTMLParagraphElement;
const nestedCheck = document.getElementById("nested") as HTMLInputElement;
const darkCheck = document.getElementById("dark") as HTMLInputElement;
const tablaCheck = document.getElementById("tabla") as HTMLInputElement;
const columnasSelect = document.getElementById("columnas") as HTMLSelectElement;
const formatoColorSelect = document.getElementById("formatoColor") as HTMLSelectElement;
const unidadSelect = document.getElementById("unidad") as HTMLSelectElement;
const formatoTipoSelect = document.getElementById("formatoTipo") as HTMLSelectElement;
const mostrarRawCheck = document.getElementById("mostrarRaw") as HTMLInputElement;
const formatoRawSelect = document.getElementById("formatoRaw") as HTMLSelectElement;
const preferenciaSelect = document.getElementById("preferencia") as HTMLSelectElement;

function generar(seccion: "anatomy" | "properties" | "layout" | "data" | "styling" | "modes" | "twoway" | "complete"): void {
  parent.postMessage({ pluginMessage: { tipo: "generar", seccion, nested: nestedCheck.checked, dark: darkCheck.checked, tabla: tablaCheck.checked, columnas: parseInt(columnasSelect.value, 10), formatoColor: formatoColorSelect.value, unidad: unidadSelect.value, formatoTipo: formatoTipoSelect.value, formatoRaw: formatoRawSelect.value, mostrarRaw: mostrarRawCheck.checked, preferencia: preferenciaSelect.value } }, "*");
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
