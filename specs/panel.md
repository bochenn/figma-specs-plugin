# Plugin panel

## What it is
The plugin's UI: an iframe (`src/ui/`) that talks to the plugin code over `postMessage`. **Fixed height with scroll** in the content area; tabs and footer are pinned.

## Structure
- **Tabs**: Specs / Options / Format / About (the active one has a gray pill).
- **Specs**: a grid of **selectable cards**. When ticked, the card turns blue (border + background + text + check ✓); the unselected ones stay gray. These are the 8 sections (Anatomy, Properties, Layout & Spacing, Styling Inventory, Two Way, Data, Modes, Complete).
- **Options**: grouped per section (General, Anatomy, Layout & Spacing, Properties, Styling Inventory). Each row: label + control (checkbox/dropdown) + description. See [options and formats](options-and-formats.md).
- **Format**: rows with dropdowns (Columns, Color, Units, Type, Raw values + Show raw value, Preferred).
- **About**: description, how to use it, open source, feedback, and a donation link (`buymeacoffee.com/bochenn`) that opens the browser via `figma.openExternal`.
- **Footer**: Cancel (closes the plugin) + Create Spec (disabled when no spec is selected).

## Messages (UI → plugin)
- `generar` — with the chosen sections + all the options/formats.
- `cancelar` — `figma.closePlugin()`.
- `abrir` `{ url }` — `figma.openExternal(url)`.

## Details
- **Mode** (Light/Dark) is a dropdown that maps to the `dark` boolean.
- Options that appear in two sections (**Itemize instances** in Anatomy/Layout, **Spec nested subcomponents** in Anatomy/Properties) are the same value, **synced** between their two checkboxes.
- The header with the name and the X is **Figma's own window** (it takes the name from the manifest), it's not in the HTML.
- Current size: 640×500.

## Key files
- `src/ui/index.html` (structure + styles), `src/ui/ui.ts` (tabs, selection, sync, messages)
- `src/plugin/main.ts` (`figma.showUI`, message handler)
- `modelo/tipos.ts` (`MensajeUI`)
