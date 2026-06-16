# Diseño — Overlay de columnas/filas del Grid auto-layout (DesignDoc 3/3 · C2)

**Fecha:** 2026-06-16
**Proyecto:** Specs Plugin para Figma — plugin de documentación de specs para handoff.
**Alcance:** Dibujar las columnas (y filas) del Grid auto-layout sobre el clon del artwork, con sus
gaps, como muestra DesignDoc. Junto con C1 (valor en las cotas del frame), completa el artwork del
caso Grid.

---

## Contexto

Tras soportar Grid auto-layout (PR #48), el artwork de un contenedor GRID muestra clon + padding +
hijos, pero **no dibuja las columnas/filas** del grid. El usuario espera ver las 12 columnas
marcadas, como DesignDoc.

## Sección 1 — Geometría pura (`utils/grilla.ts`)

Función nueva, testeable:
```typescript
export interface FranjasGrid { columnas: Rect[]; filas: Rect[]; }

// Franjas de un Grid auto-layout dentro del área de contenido (frame menos
// padding). Reparte el ancho/alto entre los counts, restando los gaps.
export function franjasGridAutolayout(
  frame: Rect,
  padding: { left: number; top: number; right: number; bottom: number },
  columnas: number, filas: number, columnGap: number, rowGap: number,
): FranjasGrid
```
- Área de contenido: `x = frame.x + padding.left`, `w = frame.width − left − right` (idem alto).
- Columnas: `anchoCol = (w − (columnas−1)·columnGap) / columnas`; franja `i` en
  `x = contentX + i·(anchoCol + columnGap)`, ancho `anchoCol`, alto = alto del contenido.
- Filas: análogo sobre el eje Y.
- `columnas`/`filas` ≤ 0 o ancho/alto ≤ 0 → array vacío correspondiente.

## Sección 2 — Dibujo (`generadores/layout.ts`)

En el branch GRID de `artworkDe` (antes del `return`), dibujar las franjas con `rectOverlay` en
ROJO semitransparente (igual que los layout grids clásicos):
- Columnas: siempre que `gridColumnas > 1`.
- Filas: solo si `gridFilas > 1` (para `filas = 1`, la franja sería todo el alto → redundante).

Usa `spec.gridColumnas/gridFilas/gridColumnGap/gridRowGap` y `spec.padding`, sobre el `frameRect`
del clon.

## Sección 3 — C1 incluido: valor en las cotas del frame

(Spec `2026-06-16-cotas-frame-valor-design.md`.) Se implementa en la misma rebanada: las cotas
azules W/H muestran el valor (`etiquetaSpacing(width/height, unidad, var)`), y se dibujan también
para GRID.

## Sección 4 — Testing y verificación

Tests (`node --test`, `tests/grilla.test.ts`): `franjasGridAutolayout` para el caso del `screen`
(800 ancho, padding 16, 12 columnas, gap 20 → 12 franjas de ~45.67 desde x=16) y filas>1; counts 0
o ancho ≤ 0 → vacío.

Manual: el `screen` (Grid) → Layout muestra las 12 columnas marcadas sobre el clon, con la cota
`800` arriba y `120` a la izquierda. Comparar contra `designdoc.pdf`.

## Fuera de alcance (C3)

- Cotas (medidas) por cada hijo.
- `gridRowSpan`/`gridColumnSpan` por hijo.
