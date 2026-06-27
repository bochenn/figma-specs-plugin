# Anatomy

## What it does
Breaks the selected element down into its layers: each layer is numbered over a clone of the design and detailed on the right with its type and attributes.

## What it shows
- **Artwork** (left): a clone of the element with a **numbered badge per layer**. Badges are placed on the **4 sides** of the element (left/right/top/bottom), choosing the side whose badge doesn't land on another layer and whose line crosses the fewest elements; connected with a perpendicular line. The canvas has generous margin so everything breathes.
- **List** (right): one card per element with a `name · TYPE` header (+ type icon) and attribute rows:
  - Color (`background-color`, `border-color`) with a swatch; if it's a token, a **ChipVar** (pink chip `#FFE0FC`/`#EA10AC`) with the variable/style name + resolved value.
  - `width`/`height` with the **resizing icon** (Hug/Fixed/Fill) when it applies.
  - For text: `Text Style`, `Font Family`, `Font Weight`, `Font Size`, `Line Height`, `Letter Spacing`, `Alignment`, `Case`.
  - `Depends on` / variant props for instances.

## Traversal
By default it descends per `Anatomy depth` (self / direct children / all), but it **always rescues nested TEXT layers** and those inside instances, so their text styles aren't lost.

## Options that affect it
- **Anatomy depth** (`children`/`self`/`all`) — layer depth.
- **Tabular anatomy** — shows the list as a table instead of cards.
- **Spec nested subcomponents** — adds an Anatomy section per nested instance.
- **Itemize instances** — opens instances to list their inner layers.
- Global formats: Color, Units, Type, Raw value, Preferred.

## Key files
- `extraccion/anatomy.ts`, `traversal/recorrer.ts` (traversal + `textosProfundos`)
- `generadores/anatomy.ts` (artwork, badges, cards)
- `utils/atributos.ts` (per-layer attributes), `extraccion/adaptador.ts` (Figma → `NodoLike`)
