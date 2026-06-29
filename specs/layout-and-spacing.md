# Layout & Spacing

## What it does
Shows how the content is organized: direction, alignment, padding, item spacing (gap), grids and dimensions of each Auto Layout frame, with dimension lines over the design.

## What it shows
Per layer (root + every descendant, not only Auto Layout ones), a row (`layoutItem01`, `layoutItem02`…) with:
- **Layers card** (on the left): the FULL layer tree of the selection, with hierarchy guide lines (`└`/`├`) and a type icon per layer. The layer this row documents (the "current") is dark + Medium; the rest are #999999 + Regular.
- **Artwork** with dimension lines/overlays: measure lines (red), padding, item spacing; chips with the variable + value when the spacing/dimension is bound to a variable; direction, alignment and resizing icons. Leaf layers (no Auto Layout) only get the W/H dimension lines.
- **Exhibit** (card on the right): Width/Height (with Hug/Fixed/Fill icon), Direction, Alignment, Padding, Item spacing, Corner radius, Grid. Leaf layers show only Width/Height, Fill, Stroke, Corner radius and Grid (direction/alignment/padding/gap don't apply).

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
- `extraccion/layout.ts`, `traversal/recorrer.ts` (`traverseTree`: every layer with its path)
- `generadores/layout.ts` (`layoutSection`, `layersTree` + tree guides, artwork/dimension lines, `legendSection`)
- `utils/marcadores-layout.ts`, `utils/overlays.ts`, `utils/grilla.ts`
