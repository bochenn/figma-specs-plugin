const estado = document.getElementById("estado") as HTMLParagraphElement;
const nestedCheck = document.getElementById("nested") as HTMLInputElement;
const darkCheck = document.getElementById("dark") as HTMLInputElement;
const tablaCheck = document.getElementById("tabla") as HTMLInputElement;
const hideOuterCheck = document.getElementById("hideOuter") as HTMLInputElement;
const itemizarCheck = document.getElementById("itemizar") as HTMLInputElement;
const medirHijosCheck = document.getElementById("medirHijos") as HTMLInputElement;
const columnasSelect = document.getElementById("columnas") as HTMLSelectElement;
const formatoColorSelect = document.getElementById("formatoColor") as HTMLSelectElement;
const unidadSelect = document.getElementById("unidad") as HTMLSelectElement;
const formatoTipoSelect = document.getElementById("formatoTipo") as HTMLSelectElement;
const mostrarRawCheck = document.getElementById("mostrarRaw") as HTMLInputElement;
const formatoRawSelect = document.getElementById("formatoRaw") as HTMLSelectElement;
const preferenciaSelect = document.getElementById("preferencia") as HTMLSelectElement;

const SECCIONES = ["anatomy", "properties", "layout", "data", "styling", "modes", "twoway", "complete"] as const;

(document.getElementById("crear") as HTMLButtonElement).onclick = () => {
  const secciones = SECCIONES.filter((s) => (document.getElementById(`sec-${s}`) as HTMLInputElement).checked);
  parent.postMessage({ pluginMessage: { tipo: "generar", secciones, nested: nestedCheck.checked, dark: darkCheck.checked, tabla: tablaCheck.checked, hideOuter: hideOuterCheck.checked, itemizar: itemizarCheck.checked, medirHijos: medirHijosCheck.checked, columnas: parseInt(columnasSelect.value, 10), formatoColor: formatoColorSelect.value, unidad: unidadSelect.value, formatoTipo: formatoTipoSelect.value, formatoRaw: formatoRawSelect.value, mostrarRaw: mostrarRawCheck.checked, preferencia: preferenciaSelect.value } }, "*");
};

window.onmessage = (event: MessageEvent) => {
  const msg = event.data.pluginMessage;
  if (msg && msg.tipo === "resultado") {
    estado.textContent = msg.ok ? "✓ Generado" : "Error: " + msg.error;
  }
};
