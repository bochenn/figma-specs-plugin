# Blueprint Specs & Handoff

A Figma plugin that generates **visual design specs for handoff**: it automatically documents the anatomy, properties, layout, variables and styles of the selected components and frames, right on the canvas.

The goal is to cut the manual work of documenting components and improve the clarity of the handoff between design, design systems and development.

---

## ✨ Features

In the panel you pick which specs to include, select a node, and create the spec:

| Section | What it does |
|---------|--------------|
| **Anatomy** | Breaks the element into its layers: a cloned artwork with numbered badges (placed on the 4 sides) + a list of cards with each layer's type and attributes (color, dimensions with Hug/Fixed/Fill icon, typography). Tokens show as a **ChipVar** with the variable/style name + resolved value. |
| **Properties** | One card per value of each variant property: the variant's preview + its full property table (`Label ◆ Value`). Includes **Boolean** properties with the affected layers highlighted. |
| **Layout & Spacing** | Per Auto Layout layer: direction, alignment, resizing, padding, item spacing and sizes, with dimension lines and color overlays on the artwork. Optional **legend** table. |
| **Styling Inventory** | A catalog of the colors, typography and variables used — each with a swatch (solid or gradient) or a live text preview, its properties, and where it's applied. Optionally inventories every local style/variable of the document. |
| **Modes** | Per variable collection with ≥2 modes (e.g. Light/Dark): the value of each variable across its modes. |
| **Two-Way** | Crosses the first two variant properties (cartesian product) and shows what changes vs the default — for *compound props*. |
| **Data (JSON)** | The element's anatomy as syntax-highlighted JSON. |
| **Complete** | The added elements and layouts of every variant vs the default, all in one place. |

---

## 🚀 Development

Requires **Figma Desktop** (the web version can't load plugins in development) and **Node.js**.

```bash
npm install        # install dependencies
npm run build      # compiles to dist/code.js + dist/ui.html
npm run watch      # recompiles on change
npm test           # runs the pure-logic tests (node --test)
```

**Load the plugin in Figma:**
1. Figma Desktop → **Plugins → Development → Import plugin from manifest…**
2. Pick this repo's `manifest.json`.
3. Run it: **Plugins → Development → Blueprint Specs & Handoff**.

After each `npm run build`, run the plugin again to pick up the changes.

---

## 🧱 Architecture

TypeScript + [esbuild](https://esbuild.github.io/), no UI frameworks. The plugin has two worlds that talk over `postMessage` (required by Figma):

- `src/plugin/` — runs in the Figma sandbox (the only side with access to `figma.*`).
- `src/ui/` — the panel (HTML iframe).

The logic is split into:

- **extraction** (`extraccion/`, `traversal/`, `comparacion/`, `inventario/`, `variables/`): Figma nodes → plain data. **Pure** logic, testable without Figma against a minimal `NodoLike` interface.
- **generation** (`generadores/`): data → Auto Layout frames. Touches `figma.*`; validated by eye.
- **orchestration** (`main.ts`): validates the selection, branches per section, places the output.

This pure/impure split is what allows ~220 unit tests without mocking the Figma API.

```
src/plugin/
├── main.ts              # orchestrator (one branch per section)
├── modelo/tipos.ts      # domain interfaces
├── traversal/           # layer traversal
├── extraccion/          # nodes → data (Anatomy, Properties, Layout…)
├── comparacion/         # variant diff
├── inventario/          # Styling Inventory
├── variables/           # Modes, color formatting
├── serializacion/       # Data (JSON)
├── generadores/         # data → frames
└── utils/               # pure helpers (attributes, color, overlays…)
```

> Source code (identifiers and comments) is written in Spanish.

---

## 🧪 Tests

```bash
npm test
```

The tests cover the decision logic (what is an element, which attributes, what changes between variants, where the overlays go, etc.) over fixture data. The visual generation is validated by eye inside Figma.

---

## 📐 Design documentation

Each feature has its **spec** in `specs/`: what it does, what it shows, its output structure, the options that affect it and the key files. They are kept up to date as the features evolve (see `specs/README.md`).

---

## 🤝 Open source

This plugin is open source. You're free to modify and improve it — if you do, please let me know and credit the original plugin in your version. Feature requests and ideas are welcome.

Created and maintained by **bochenn**. If it saves you time, a donation helps keep the development going: [buymeacoffee.com/bochenn](https://buymeacoffee.com/bochenn).

---

## 📦 Status

In active development.
