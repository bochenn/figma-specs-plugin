# Diseño — Soporte de Grid auto-layout (cierra H3)

**Fecha:** 2026-06-16
**Proyecto:** Specs Plugin para Figma — plugin de documentación de specs para handoff.
**Alcance:** Que Layout and Spacing reconozca y documente los frames con el **Grid auto-layout** de
Figma (`layoutMode === "GRID"`), no solo HORIZONTAL/VERTICAL. Cierra H3 (el `screen` daba "No se
detectaron capas con Auto Layout").

---

## Causa raíz de H3

El diagnóstico temporal mostró `tipo=FRAME layoutMode=GRID grids=0`. El `screen` usa el **nuevo Grid
auto-layout** de Figma (`layoutMode: "GRID"`), no un layout grid clásico (`layoutGrids`, vacío). El
plugin solo reconocía `HORIZONTAL`/`VERTICAL`, así que no lo detectaba por ningún camino.

## Sección 1 — Modelo

`NodoLike` += `gridColumnCount?: number; gridRowCount?: number; gridColumnGap?: number; gridRowGap?: number;`
`LayoutSpec`:
- `direccion: "HORIZONTAL" | "VERTICAL" | "GRID";`
- += `gridColumnas?: number; gridFilas?: number; gridColumnGap?: number; gridRowGap?: number;`

## Sección 2 — Traversal y extracción

- `traversal/recorrer-autolayout.ts`: `tieneAutoLayout` incluye `"GRID"`.
- `extraccion/adaptador.ts`: el bloque de layout se activa también con `"GRID"`; copia
  `gridColumnCount/gridRowCount/gridColumnGap/gridRowGap`.
- `extraccion/layout.ts` (`layoutSpecDe`): `direccion` mapea el `layoutMode` real
  (`HORIZONTAL`/`VERTICAL`/`GRID`); con GRID setea `gridColumnas/gridFilas/gridColumnGap/gridRowGap`.

## Sección 3 — Generador

**Exhibit** (`generadores/layout.ts`): para `direccion === "GRID"` el bloque de líneas cambia:
```
Width / Height / Fill / Stroke   (igual)
Direction: Grid
Columns: <gridColumnas>
Rows: <gridFilas>
Column gap: <etiquetaSpacing(gridColumnGap)>
Row gap: <etiquetaSpacing(gridRowGap)>
Padding: <textoPadding>
Corner radius                    (igual)
```
(Sin `Alignment` ni `Item spacing`, que son del modelo lineal.)

**Artwork** (`artworkDe`): para GRID, versión simple — clon + overlay de padding (verde) + hijos
directos (azul). Se saltean los overlays de gap lineal, marcas numéricas, cotas de resizing e ícono
de dirección (asumen un eje H/V). Los marcadores 2D del grid quedan para la Rebanada C.

**Complete Layout** (`generadores/complete.ts`): el texto de dirección muestra "Grid" cuando
corresponde (hoy `=== "HORIZONTAL" ? "Horizontal" : "Vertical"`).

## Sección 4 — Limpieza

Quitar la línea `[debug]` temporal del mensaje de vacío de Layout (ya cumplió su función).

## Sección 5 — Testing y verificación

Tests (`node --test`):
- `recorrerAutoLayout` detecta un nodo `layoutMode: "GRID"`.
- `layoutSpecDe` con GRID → `direccion: "GRID"` y `gridColumnas/gridFilas/gaps`.
- Casos H/V existentes intactos.

Verificación manual: el `screen` (Grid auto-layout) → Layout & Spacing muestra una fila con
`Direction: Grid`, Columns/Rows/gaps y el artwork con padding. Comparar contra `designdoc.pdf`.

## Fuera de alcance

- Marcadores/overlays 2D del grid sobre el artwork (Rebanada C).
- `gridRowSpan`/`gridColumnSpan` por hijo.
