# Layout & Spacing

## What it does
Shows how the content is organized: direction, alignment, padding, item spacing (gap), grids and dimensions of each Auto Layout frame, with dimension lines over the design.

## What it shows
Per Auto Layout layer, a row (`layoutItem01`, `layoutItem02`…) with:
- **Breadcrumb** of the hierarchy (on the left).
- **Artwork** with dimension lines/overlays: measure lines (red), padding, item spacing; chips with the variable + value when the spacing/dimension is bound to a variable; direction, alignment and resizing icons.
- **Exhibit** (card on the right): Width/Height (with Hug/Fixed/Fill icon), Direction, Alignment, Padding, Item spacing, Corner radius, Grid.

The section **is** the frame-item (`Layout&Spacing`), with its padding and background; the rows go straight inside (no double wrapping).

## Legend (optional, "Include legend")
An **Element | Detail** table (fixed 656px width) explaining the artwork conventions: dimension lines, padding, gap, measure lines, variable chips, hierarchy. Text in Inter Medium 12 / lh 150% / text-secondary.

## Options that affect it
- **Hide outer layout** — skips the outermost frame's row.
- **Element measures** — adds dimension lines to the child elements too.
- **Itemize instances** — descends into instances to measure their layers.
- **Include legend** — adds the legend table (once, at the top).
- **Columns**, Units.

## Key files
- `extraccion/layout.ts`, `traversal/recorrer-autolayout.ts`
- `generadores/layout.ts` (`seccionDeLayout`, artwork/dimension lines, `seccionLeyenda`)
- `utils/marcadores-layout.ts`, `utils/overlays.ts`, `utils/grilla.ts`
