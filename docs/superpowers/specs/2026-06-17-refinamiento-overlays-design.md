# Diseño — Refinamiento de overlays, cotas y chips (DesignDoc visual · D3)

**Fecha:** 2026-06-17
**Proyecto:** Specs Plugin para Figma — plugin de documentación de specs para handoff.
**Alcance:** Tres ajustes del artwork de Layout, del feedback contra DesignDoc:
1. Los chips de padding/gap del artwork muestran el **nombre corto** de la variable + valor
   (`padding-1x 16`), no solo el número.
2. Las bandas overlay (padding y columnas/filas del grid) llevan **borde punteado**.
3. Las **cotas** de width/height usan el **color del chip de dimensión** (rojo), no azul fijo.

(El rediseño de la UI del plugin —toggles + CTA— va en una rebanada aparte.)

---

## Sección 1 — Nombre corto en chips de padding/gap (`utils/marcadores-layout.ts`)

El fix de clipping dejó los chips del artwork con solo el número, perdiendo el nombre de variable.
DesignDoc muestra el nombre **corto** (último segmento) + valor: `padding-1x 16`. (El nombre completo
sigue en el panel D2.)

- Helper puro `nombreCorto(nombre)` → último segmento tras `/` (`space/padding-1x` → `padding-1x`).
- `marcasLayout` vuelve a recibir `spacingVars` y, por marca con variable, arma
  `valor = "<nombreCorto> <número>"`; sin variable, solo el número. (El número usa
  `formatearEspaciado`, no `etiquetaSpacing`, para no repetir el nombre.)
- El generador vuelve a pasar `spec.spacingVars` a `marcasLayout`.
- `MARGEN` del artwork sube de 80 a 96 para que el chip con nombre corto entre en el margen izquierdo.

Las **cotas** de dimensión (W/H) y las **medidas por hijo** quedan en solo número (DesignDoc tampoco
les pone nombre).

## Sección 2 — Borde punteado en las bandas (`generadores/layout.ts`)

Las bandas overlay (padding, columnas y filas del grid) pasan de fill sólido a **fill claro + borde
punteado** del color. Helper `bandaPunteada(r, color, artwork)`:
- rect con `fills = [{ SOLID, color, opacity 0.12 }]`, `strokes = [{ SOLID, color }]`,
  `strokeWeight = 1`, `dashPattern = [3, 3]`.
- Reemplaza `rectOverlay(..., PADDING_BANDA/GAP_BANDA, …)` y las columnas/filas del grid
  (`rectOverlay(..., ROJO, …)`). Los **hijos azules** se mantienen como fill sólido (no son
  "dimensión").

## Sección 3 — Cotas del color del chip (`generadores/layout.ts`)

`svgCotaH`/`svgCotaV` usan `AZUL_HEX`. Como las cotas son de dimensión, su color pasa al rojo del
chip (`CHIP_DIM`). Se agrega un parámetro de color a `svgCotaH/svgCotaV` (o se reemplaza `AZUL_HEX`
por el rojo en su uso para cotas) y `dibujarCotas` lo pasa. Las puntas (Fixed/Fill/Hug) no cambian,
solo el color.

## Sección 4 — Testing y verificación

Tests (`tests/marcadores-layout.test.ts`): `nombreCorto` (con y sin `/`); `marcasLayout` con
`spacingVars` → `valor` = `"padding-1x 16"`. Lo demás es generador (verificación manual).

Manual: artwork del `card` → chips de padding/gap con `padding-1x 16` / `gap-0_5x 8` (sin cortarse),
bandas con borde punteado, cotas W/H en rojo. Comparar con `DesignDoc-layout.pdf` y la captura del
overlay punteado.

## Fuera de alcance

- Rediseño de la UI del plugin (toggles + CTA) — rebanada aparte.
- Bordes punteados en Anatomy/Properties.
