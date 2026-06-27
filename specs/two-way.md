# Two-Way

## What it does
Crosses the **first two variant properties** (cartesian product) and, for each combination, shows the variant's artwork + **what changes vs the default variant**. Useful for *compound props* (when two axes have to be seen together).

## What it shows
Header `Prop1 × Prop2`. For each existing combination, a card with:
- Artwork (instance of that combination's variant).
- **List of changes** vs the default:
  - **Variant root**: component name + its props stacked vertically (`Type: …`, etc.) and its attribute changes.
  - For each **modified** element: the change in two pills — `itemValue-current` (the combination's key + value) and `itemValue-default` (default + its value). ChipVar only if the value is a token; `width`/`height` with the Hug/Fixed/Fill icon.
  - **Added/removed** elements: a note ("Added/Removed in this variant"); repeats of the same name are consolidated (`Vector · Added ×2`).

## Options that affect it
- **Columns**.

## Key files
- `extraccion/properties.ts` (`extraerDosWay`)
- `comparacion/variantes.ts` (`compararVariante`, `diffAtributos`, `emparejar`)
- `generadores/properties.ts` (`seccionDeDosWay`, `listaCambios`, `filaAtributoCambiado`)
