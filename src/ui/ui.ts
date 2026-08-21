// Spec-card icons, from "UI3 — Figma's UI Kit" (see resources/figma-UI3/CREDITS.md).
import iconAnatomy from "../../resources/figma-UI3/icon.24.size.small.svg";
import iconProperties from "../../resources/figma-UI3/icon.24.component.small.svg";
import iconLayout from "../../resources/figma-UI3/icon.24.al.width-fill.svg";
import iconStyling from "../../resources/figma-UI3/icon.24.styles.svg";
import iconTwoway from "../../resources/figma-UI3/icon.24.create.variant.svg";
import iconData from "../../resources/figma-UI3/icon.24.code-block.svg";
import iconModes from "../../resources/figma-UI3/icon.24.sun.small.svg";
import iconComplete from "../../resources/figma-UI3/icon.24.move.small.svg";
import blueprintIcon from "../../resources/xBlueprint-icon-64.png";

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
  card.onclick = () => { card.classList.toggle("selected"); refreshCreate(); refreshEstimate(); };
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
const logEl = $("log");

// Appends one line to the debug log (newest at the bottom, auto-scrolled).
function logLine(line: string): void {
  logEl.textContent += (logEl.textContent ? "\n" : "") + line;
  logEl.scrollTop = logEl.scrollHeight;
}

$("log-clear").onclick = () => { logEl.textContent = ""; };
$("benchmark").onclick = () => parent.postMessage({ pluginMessage: { type: "benchmark" } }, "*");

// Load options in effect, to head each run in the log.
function runLabel(): string {
  const on: string[] = [];
  if (inputOf("sequential").checked) on.push("sequential");
  if (inputOf("limitRows").checked) on.push("row limit");
  if (inputOf("table").checked) on.push("table");
  return on.length > 0 ? on.join(" + ") : "default";
}

// Rough cost of generating a section, to warn before a long run.
// ponytail: eyeballed, not measured — tune these two if the estimate reads off.
const MS_PER_LAYER = 4;
const MS_PER_SECTION = 300;
const HEAVY_MS = 5000; // below this the generation is quick enough to say nothing

// Visible layers of the selection, reported by the plugin on open and on every
// selection change.
let selectionLayers = 0;

// Warns in the status line when the chosen sections over this selection look slow.
function refreshEstimate(): void {
  const chosen = cards.filter((c) => c.classList.contains("selected")).length;
  if (selectionLayers === 0 || chosen === 0) { statusEl.textContent = ""; return; }
  const ms = selectionLayers * chosen * MS_PER_LAYER + chosen * MS_PER_SECTION;
  if (ms < HEAVY_MS) { statusEl.textContent = ""; return; }
  const consejo = inputOf("table").checked ? "" : " — try Tabular anatomy";
  statusEl.textContent = `Large selection: ${selectionLayers} layers · about ${Math.round(ms / 1000)}s${consejo}`;
}

($("cancel") as HTMLButtonElement).onclick = () => parent.postMessage({ pluginMessage: { type: "cancel" } }, "*");

($("about-logo") as HTMLImageElement).src = blueprintIcon;

$("donate").onclick = () => parent.postMessage({ pluginMessage: { type: "open", url: "https://buymeacoffee.com/bochenn" } }, "*");
$("link-web").onclick = () => parent.postMessage({ pluginMessage: { type: "open", url: "https://crafter.studio" } }, "*");
$("link-x").onclick = () => parent.postMessage({ pluginMessage: { type: "open", url: "https://x.com/bochenn" } }, "*");
$("link-linkedin").onclick = () => parent.postMessage({ pluginMessage: { type: "open", url: "https://linkedin.com/in/bochenn" } }, "*");

// Last payload sent, so sequential mode can ask for the remaining sections
// with exactly the same options.
let ultimoPayload: Record<string, unknown> | null = null;

create.onclick = () => {
  const sections = cards.filter((c) => c.classList.contains("selected")).map((c) => c.dataset.spec);
  logLine(`— run [${runLabel()}] · ${selectionLayers} layers · ${sections.length} sections`);
  ultimoPayload = {
    type: "generate",
    sections,
    nested: inputOf("nested").checked,
    dark: selectOf("dark").value === "true",
    table: inputOf("table").checked,
    hideOuter: inputOf("hideOuter").checked,
    itemize: inputOf("itemize").checked,
    measureChildren: inputOf("measureChildren").checked,
    legend: inputOf("legend").checked,
    layerBadges: inputOf("layerBadges").checked,
    stylingTotal: inputOf("stylingTotal").checked,
    columns: parseInt(selectOf("columns").value, 10),
    colorFormat: selectOf("colorFormat").value,
    unit: selectOf("unit").value,
    typeFormat: selectOf("typeFormat").value,
    rawFormat: selectOf("rawFormat").value,
    showRaw: inputOf("showRaw").checked,
    preference: selectOf("preference").value,
    anatomyDepth: selectOf("anatomyDepth").value,
    sequential: inputOf("sequential").checked,
    limitRows: inputOf("limitRows").checked,
  };
  parent.postMessage({ pluginMessage: ultimoPayload }, "*");
};

window.onmessage = (event: MessageEvent) => {
  const msg = event.data.pluginMessage;
  if (!msg) return;
  if (msg.type === "analysis") {
    selectionLayers = msg.layers;
    refreshEstimate();
  } else if (msg.type === "log") {
    logLine(msg.line);
  } else if (msg.type === "next") {
    // Sequential mode: same options, only the sections still pending.
    if (ultimoPayload) parent.postMessage({ pluginMessage: { ...ultimoPayload, sections: msg.sections } }, "*");
  } else if (msg.type === "progress") {
    statusEl.textContent = `Rendering ${msg.done}/${msg.total} — ${msg.label}…`;
  } else if (msg.type === "result") {
    statusEl.textContent = msg.ok ? "✓ Created" : "Error: " + msg.error;
  }
};

// Asks the plugin to analyze the current selection now that the UI can receive it.
parent.postMessage({ pluginMessage: { type: "ready" } }, "*");
