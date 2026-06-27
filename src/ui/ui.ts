// Spec-card icons, from "UI3 — Figma's UI Kit" (see resources/figma-UI3/CREDITS.md).
import iconAnatomy from "../../resources/figma-UI3/icon.24.size.small.svg";
import iconProperties from "../../resources/figma-UI3/icon.24.component.small.svg";
import iconLayout from "../../resources/figma-UI3/icon.24.al.width-fill.svg";
import iconStyling from "../../resources/figma-UI3/icon.24.styles.svg";
import iconTwoway from "../../resources/figma-UI3/icon.24.create.variant.svg";
import iconData from "../../resources/figma-UI3/icon.24.code-block.svg";
import iconModes from "../../resources/figma-UI3/icon.24.sun.small.svg";
import iconComplete from "../../resources/figma-UI3/icon.24.move.small.svg";

const $ = (id: string) => document.getElementById(id) as HTMLElement;
const inputOf = (id: string) => document.getElementById(id) as HTMLInputElement;
const selectOf = (id: string) => document.getElementById(id) as HTMLSelectElement;

// One icon per spec card (keyed by data-spec).
const SPEC_ICONS: Record<string, string> = {
  anatomy: iconAnatomy, properties: iconProperties, layout: iconLayout, styling: iconStyling,
  twoway: iconTwoway, data: iconData, modes: iconModes, complete: iconComplete,
};

// Normalizes a UI3 SVG to 16px and to currentColor, so CSS drives its color
// (matching the card title: --text when idle, --brand-text when selected).
function specIcon(svg: string): string {
  return svg
    .replace(/\s*style="[^"]*"/g, "")
    .split('fill="black"').join('fill="currentColor"')
    .replace(/width="\d+"/, 'width="20"')
    .replace(/height="\d+"/, 'height="20"');
}

// Tabs: show the panel of the clicked tab.
const tabs = Array.from(document.querySelectorAll(".tab")) as HTMLButtonElement[];
const panels = Array.from(document.querySelectorAll(".panel")) as HTMLElement[];
for (const tab of tabs) {
  tab.onclick = () => {
    for (const t of tabs) t.classList.toggle("active", t === tab);
    for (const p of panels) p.classList.toggle("hidden", p.dataset.panel !== tab.dataset.tab);
  };
}

// Spec cards: toggle selection; enables "Create Spec" if at least one is selected.
const cards = Array.from(document.querySelectorAll(".spec-card")) as HTMLButtonElement[];
const create = $("create") as HTMLButtonElement;
function refreshCreate(): void {
  create.disabled = !cards.some((c) => c.classList.contains("selected"));
}
for (const card of cards) {
  const svg = card.dataset.spec ? SPEC_ICONS[card.dataset.spec] : undefined;
  if (svg) {
    const ico = document.createElement("span");
    ico.className = "ico";
    ico.innerHTML = specIcon(svg);
    card.insertBefore(ico, card.querySelector(".t"));
  }
  card.onclick = () => { card.classList.toggle("selected"); refreshCreate(); };
}
refreshCreate();

// Syncs two checkboxes that are the same option shown in two sections.
function sync(a: HTMLInputElement, b: HTMLInputElement): void {
  a.onchange = () => { b.checked = a.checked; };
  b.onchange = () => { a.checked = b.checked; };
}
sync(inputOf("itemize"), inputOf("itemize2"));
sync(inputOf("nested"), inputOf("nested2"));

const statusEl = $("status");

($("cancel") as HTMLButtonElement).onclick = () => parent.postMessage({ pluginMessage: { type: "cancel" } }, "*");

$("donate").onclick = () => parent.postMessage({ pluginMessage: { type: "open", url: "https://buymeacoffee.com/bochenn" } }, "*");

create.onclick = () => {
  const sections = cards.filter((c) => c.classList.contains("selected")).map((c) => c.dataset.spec);
  parent.postMessage({ pluginMessage: {
    type: "generate",
    sections,
    nested: inputOf("nested").checked,
    dark: selectOf("dark").value === "true",
    table: inputOf("table").checked,
    hideOuter: inputOf("hideOuter").checked,
    itemize: inputOf("itemize").checked,
    measureChildren: inputOf("measureChildren").checked,
    legend: inputOf("legend").checked,
    stylingTotal: inputOf("stylingTotal").checked,
    columns: parseInt(selectOf("columns").value, 10),
    colorFormat: selectOf("colorFormat").value,
    unit: selectOf("unit").value,
    typeFormat: selectOf("typeFormat").value,
    rawFormat: selectOf("rawFormat").value,
    showRaw: inputOf("showRaw").checked,
    preference: selectOf("preference").value,
    anatomyDepth: selectOf("anatomyDepth").value,
  } }, "*");
};

window.onmessage = (event: MessageEvent) => {
  const msg = event.data.pluginMessage;
  if (msg && msg.type === "result") {
    statusEl.textContent = msg.ok ? "✓ Created" : "Error: " + msg.error;
  }
};
