const $ = (id: string) => document.getElementById(id) as HTMLElement;
const inputDe = (id: string) => document.getElementById(id) as HTMLInputElement;
const selectDe = (id: string) => document.getElementById(id) as HTMLSelectElement;

// Tabs: muestra el panel de la tab clickeada.
const tabs = Array.from(document.querySelectorAll(".tab")) as HTMLButtonElement[];
const panels = Array.from(document.querySelectorAll(".panel")) as HTMLElement[];
for (const tab of tabs) {
  tab.onclick = () => {
    for (const t of tabs) t.classList.toggle("active", t === tab);
    for (const p of panels) p.classList.toggle("hidden", p.dataset.panel !== tab.dataset.tab);
  };
}

// Cards de specs: toggle de selección; habilita "Create Spec" si hay al menos una.
const cards = Array.from(document.querySelectorAll(".spec-card")) as HTMLButtonElement[];
const crear = $("crear") as HTMLButtonElement;
function refrescarCrear(): void {
  crear.disabled = !cards.some((c) => c.classList.contains("selected"));
}
for (const card of cards) {
  card.onclick = () => { card.classList.toggle("selected"); refrescarCrear(); };
}
refrescarCrear();

// Sincroniza dos checkboxes que son la misma opción mostrada en dos secciones.
function sincronizar(a: HTMLInputElement, b: HTMLInputElement): void {
  a.onchange = () => { b.checked = a.checked; };
  b.onchange = () => { a.checked = b.checked; };
}
sincronizar(inputDe("itemizar"), inputDe("itemizar2"));
sincronizar(inputDe("nested"), inputDe("nested2"));

const estado = $("estado");

($("cancelar") as HTMLButtonElement).onclick = () => parent.postMessage({ pluginMessage: { tipo: "cancelar" } }, "*");

$("donate").onclick = () => parent.postMessage({ pluginMessage: { tipo: "abrir", url: "https://buymeacoffee.com/bochenn" } }, "*");

crear.onclick = () => {
  const secciones = cards.filter((c) => c.classList.contains("selected")).map((c) => c.dataset.spec);
  parent.postMessage({ pluginMessage: {
    tipo: "generar",
    secciones,
    nested: inputDe("nested").checked,
    dark: selectDe("dark").value === "true",
    tabla: inputDe("tabla").checked,
    hideOuter: inputDe("hideOuter").checked,
    itemizar: inputDe("itemizar").checked,
    medirHijos: inputDe("medirHijos").checked,
    leyenda: inputDe("leyenda").checked,
    stylingTotal: inputDe("stylingTotal").checked,
    columnas: parseInt(selectDe("columnas").value, 10),
    formatoColor: selectDe("formatoColor").value,
    unidad: selectDe("unidad").value,
    formatoTipo: selectDe("formatoTipo").value,
    formatoRaw: selectDe("formatoRaw").value,
    mostrarRaw: inputDe("mostrarRaw").checked,
    preferencia: selectDe("preferencia").value,
    anatomyDepth: selectDe("anatomyDepth").value,
  } }, "*");
};

window.onmessage = (event: MessageEvent) => {
  const msg = event.data.pluginMessage;
  if (msg && msg.tipo === "resultado") {
    estado.textContent = msg.ok ? "✓ Created" : "Error: " + msg.error;
  }
};
