# Modes

## What it does
Shows the value of each color variable across its modes (e.g. Light/Dark), to see how the element changes between themes.

## What it shows
Per **variable collection with ≥2 modes** used by the element: the variable's name, its `appliedAs` (Background/Text/Border color) and the **comparison of values per mode** (hex for each mode, or alias `→ another/variable`).

## Collection
It walks the element and its layers — **including inside instances** — and gathers the color variables bound to fill/stroke whose collection has 2+ modes. Variables in single-mode collections don't appear (there's nothing multi-mode to show).

## Options that affect it
- **Columns**.

## Key files
- `variables/recolectar-modes.ts` (collection, descends into instances)
- `variables/modes.ts` (grouping, `hexDeColor`)
- `generadores/modes.ts`
