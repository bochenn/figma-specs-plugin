# Diseño — Overlays de layout grids — Rebanada 34

**Fecha:** 2026-06-12
**Proyecto:** Specs Plugin para Figma — plugin de documentación de specs para handoff (una sola versión, sin tiers)
**Alcance de este spec:** Anotar los layout grids (COLUMNS/ROWS/GRID) en Layout and Spacing: franjas sobre el artwork y línea descriptiva en el exhibit. Cubre contenedores con Auto Layout que además tienen grids, y el caso típico de raíz con grid pero sin Auto Layout (fila propia).

---

## Contexto y estrategia

Desde la Rebanada 9, los frames con layout grids quedan sin anotar (solo HORIZONTAL/VERTICAL).
El caso más común — un frame de pantalla con grilla de columnas y sin Auto Layout — hoy produce
"No se detectaron capas con Auto Layout".

**Decisiones de diseño (rebanada autónoma, sin gates de usuario por pedido explícito):**
- Franjas semitransparentes rojas sobre el artwork: verticales para COLUMNS, horizontales para
  ROWS, líneas de 1px en ambos ejes para GRID.
- Línea `Grid: …` en el exhibit por cada grid del contenedor.
- Si la selección tiene grids pero no Auto Layout, se agrega una **fila propia** (artwork con
  franjas + exhibit con las líneas Grid) al principio; respeta `hideOuter` (es el contenedor
  exterior).
- `count` puede ser `Infinity` ("Auto" en Figma): se deriva la cantidad que entra en el frame.

---

## Sección 1 — Modelo y geometría pura

`modelo/tipos.ts`:

```typescript
export interface GridSpec {
  patron: "GRID" | "COLUMNS" | "ROWS";
  alineacion?: "MIN" | "MAX" | "CENTER" | "STRETCH";
  count?: number;        // puede venir Infinity ("Auto")
  gutter?: number;
  sectionSize?: number;  // ancho/alto fijo de franja (no aplica a STRETCH)
  offset?: number;       // margen (MIN/MAX/STRETCH)
}
```

`NodoLike` += `layoutGrids?: GridSpec[]`; `LayoutSpec` += `grids: GridSpec[]`.

`utils/grilla.ts` (puro, testeado):
- `gridSpecDe(g)` — mapea un LayoutGrid crudo de Figma (`pattern`, `alignment`, `gutterSize`,
  `count`, `sectionSize`, `offset`) a `GridSpec`.
- `rectsGrid(frame: Rect, grid: GridSpec): Rect[]` — franjas:
  - COLUMNS STRETCH: `w = (frame.width − 2·offset − (count−1)·gutter) / count`, desde `offset`.
  - COLUMNS MIN: franjas de `sectionSize` desde `offset`, separadas por `gutter`; MAX espejado;
    CENTER centrado (`total = count·sectionSize + (count−1)·gutter`).
  - ROWS: lo mismo sobre Y.
  - GRID: líneas de 1px en X e Y cada `sectionSize`.
  - `count` no finito → cantidad máxima que entra; datos inválidos (count ≤ 0, ancho ≤ 0) → `[]`.
- `textoGrid(grid): string` — `"Columns ×12 · gutter 20 · offset 16 · Stretch"`,
  `"Rows ×4 · alto 40 · gutter 8 · Min"`, `"Grid 8px"`.

## Sección 2 — Extracción y generador

- `extraccion/adaptador.ts`: copia `layoutGrids` del nodo real vía `gridSpecDe` (para cualquier
  frame, no solo Auto Layout).
- `extraccion/layout.ts`: `layoutSpecDe` += `grids: nodo.layoutGrids ?? []`.
- `generadores/layout.ts`:
  - `artworkDe`: tras los overlays, pinta `rectsGrid` de cada `spec.grids` con `rectOverlay`
    (rojo `{r:1, g:0.1, b:0.3}`, opacity 0.12).
  - `exhibit`: una línea `Grid: ${textoGrid(g)}` por grid.
  - `generarLayout`: si la selección no está en las filas (sin Auto Layout) pero tiene grids y
    `hideOuter` es false, agrega al inicio una fila con `artworkGrids` (clon + franjas, sin
    marcadores) y un exhibit reducido (nombre · tipo + líneas Grid).

## Sección 3 — Testing y verificación

Tests (`tests/grilla.test.ts` + `tests/layout-extraccion.test.ts`): `rectsGrid` para COLUMNS
(Stretch/Min/Center), ROWS, GRID, count Infinity y casos inválidos; `gridSpecDe`; `textoGrid`;
extracción con `layoutGrids` en el nodo.

Verificación manual (pendiente, asincrónica): frame con grilla de columnas sin Auto Layout →
fila propia con franjas; contenedor con Auto Layout + grid → franjas sobre su artwork y línea
Grid en el exhibit; `hideOuter` ON oculta la fila del raíz con grids; Dark mode legible.

## Fuera de alcance

- Variables atadas a grids; colores configurables de franjas; grids en otras secciones.
