# Specs

One page per plugin feature: **what it does, what it shows, its output structure, the options that affect it, and the key files** in the code.

These specs are the plugin's living documentation. **When a feature changes, its spec is updated in the same change**; when a feature is added, its page is added here.

## Sections of the generated spec

- [Anatomy](anatomy.md)
- [Properties](properties.md)
- [Layout & Spacing](layout-and-spacing.md)
- [Styling Inventory](styling-inventory.md)
- [Modes](modes.md)
- [Two-Way](two-way.md)
- [Data (JSON)](data.md)
- [Complete](complete.md)

## Cross-cutting

- [Plugin panel](panel.md) — the UI: Specs / Options / Format / About tabs.
- [Options and formats](options-and-formats.md) — settings that apply across sections.

## Architecture (summary)

The plugin separates **extraction** (Figma nodes → plain data, pure logic testable against `NodoLike`) from **generation** (data → Auto Layout frames, touches `figma.*`). `main.ts` orchestrates: it validates the selection, builds one page per section and positions the output. The panel (`src/ui/`) runs in an iframe and communicates over `postMessage`.

> Source code identifiers and comments are written in Spanish; these docs are in English.
