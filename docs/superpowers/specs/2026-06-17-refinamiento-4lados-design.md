# Diseño — Marcas en 4 lados, padding en Grid y chips 11px (DesignDoc visual · D4)

**Fecha:** 2026-06-17
**Proyecto:** Specs Plugin para Figma — plugin de documentación de specs para handoff.
**Alcance:** Tres ajustes del artwork de Layout (feedback vs DesignDoc):
1. El contenedor **Grid** también muestra los chips de padding (hoy el branch GRID retorna antes).
2. Los chips/cotas se distribuyen en los **4 lados** del clon (no apilados arriba/izquierda), y los
   bordes punteados son **más oscuros** (stroke con el color saturado del chip).
3. Los chips del artwork suben a **11px**.

(El rediseño de la UI del plugin —toggles + CTA— sigue pendiente como rebanada aparte.)

---

## Sección 1 — `marcasLayout` por lado (`utils/marcadores-layout.ts`)

Refactor: en vez de `{ ejeX, ejeY }`, `marcasLayout` devuelve `Marca[]` donde cada marca lleva el
**lado** y su centro sobre ese lado:
```typescript
export interface Marca { lado: "top" | "bottom" | "left" | "right"; centro: number; valor: string; tipo: "padding" | "spacing"; }
```
- `padding.top` → `{ lado: "top", centro: frame.x + frame.width/2 }` (chip arriba, centrado).
- `padding.bottom` → `{ lado: "bottom", centro: frame.x + frame.width/2 }`.
- `padding.left` → `{ lado: "left", centro: frame.y + frame.height/2 }`.
- `padding.right` → `{ lado: "right", centro: frame.y + frame.height/2 }`.
- gaps: dirección HORIZONTAL → lado `"top"` (centro = x del gap); VERTICAL → lado `"left"` (centro = y).
- El `valor` mantiene el formato actual (`nombreCorto valor` con variable, o el número). `spacingAuto`
  sigue dando `"Auto"` para gaps.

Se elimina el dedupe por eje y los ticks (las bandas punteadas ya señalan; los chips van por lado).

## Sección 2 — Dibujo en 4 lados (`generadores/layout.ts`)

El artwork reserva **margen en los 4 lados** (`MARGEN` arriba/izquierda y también abajo/derecha; el
`resize` pasa a `clon.width + 2·MARGEN`, `clon.height + 2·MARGEN`, clon en `(MARGEN, MARGEN)`).

Por cada `Marca`, un `chip` posicionado según `lado`:
- `top`: `x = centro − chip.width/2`, `y = MARGEN − 18`.
- `bottom`: `x = centro − chip.width/2`, `y = MARGEN + clon.height + 6`.
- `left`: `x = MARGEN − 16 − chip.width`, `y = centro − chip.height/2`.
- `right`: `x = MARGEN + clon.width + 16`, `y = centro − chip.height/2`.

Color del chip: `CHIP_PADDING` (padding) / `CHIP_GAP` (spacing).

**Padding en Grid (#1):** las marcas de padding se dibujan para todos los contenedores (también GRID),
moviéndolas antes del `return` del branch GRID. Los **gaps** (item spacing lineal) siguen solo en H/V.

**Bordes punteados más oscuros (#2):** `bandaPunteada(r, colorFill, colorStroke, artwork)` — fill
claro (0.12) + stroke con el **color saturado** del chip: padding → fill `PADDING_BANDA`, stroke
`CHIP_PADDING`; gap → fill `GAP_BANDA`, stroke `CHIP_GAP`; grid → fill `ROJO` claro, stroke `ROJO`.

## Sección 3 — Chips a 11px (#3)

En el helper `chip` del artwork, el texto pasa de `texto(valor, 9)` a `texto(valor, 11)`.

## Sección 4 — Testing y verificación

Tests (`tests/marcadores-layout.test.ts`): `marcasLayout` devuelve marcas con `lado` correcto
(padding top→top, left→left, etc.) y `valor` con nombre corto; gap H→top, V→left. Actualizar los
tests existentes de `marcasLayout` al nuevo shape (`Marca[]`).

Manual: artwork del `card`/`screen` → chips de padding en los 4 lados sin superponerse, el `screen`
Grid muestra su padding, bordes punteados más visibles, chips a 11px. Comparar con
`DesignDoc-layout.pdf`.

## Fuera de alcance

- Rediseño de la UI del plugin (#4 del feedback) — rebanada aparte.
- Cotas W/H y medidas por hijo (ya en rojo / compactas) — solo se ajustan offsets si chocan.
