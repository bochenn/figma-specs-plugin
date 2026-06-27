# Styling Inventory

## What it does
An inventory of the colors, typography and variables the element (or the whole document) uses: it shows **what** each token **looks like** and **where it's used**.

## What it shows
Three subsections (each with title + description + a note when relevant): **Variables**, **Color styles**, **Text styles**. Each entry is a card:
- **Color** (variables + color styles): **large swatch** (56×56, solid or real **gradient**) + name (ChipVar) + hex. If the paint is neither solid nor gradient (e.g. an image), there's no swatch and a note says so.
- **Text styles**: on the left the **properties** (Font family, weight, size, line height, letter spacing); on the right the **preview** *"The quick brown fox jumps over the lazy dog"* rendered in the real style (loads the font, falls back to Inter if missing).
- Below each card (element mode only): **Applied as** / **Applied to** (where it's used).

## Modes
- **Per element** (default): only the styles/variables the selection uses (and its layers, including inside instances). Each entry carries the applied-where.
- **All document styles** (option *All document styles*): a catalog of **all** the **local** color styles, text styles and color variables in the file. No applied-where. Only reaches local styles (not remote libraries).

## Data
Collection captures the resolved color (solid or gradient, with its stops) and, for text styles, the full typography.

## Key files
- `inventario/recolectar.ts` (per element), `inventario/documento.ts` (whole document), `inventario/agrupar.ts`
- `generadores/styling.ts` (cards, preview, gradient swatch)
- `extraccion/adaptador.ts` (paint/gradient capture)
