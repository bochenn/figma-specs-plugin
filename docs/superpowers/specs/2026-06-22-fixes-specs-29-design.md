# Fixes del output (feedback Specifications-29) — Diseño

**Fecha:** 2026-06-22
**Referencias:** `Specifications-29.pdf`, Images #15–#19.

## Objetivo

Tres correcciones:
1. La línea guía de los marcadores de Anatomy debe ser **recta** (sin esquina/ángulo), marcando
   desde **arriba en vertical**.
2. El band del gap debe tener **fill del color de su borde** (`#FF24BD`).
3. Evitar que un frame con clipping **corte el chip de la cota**.

---

## 1. Marcadores con línea vertical recta (riel superior)

`src/plugin/generadores/anatomy.ts`, en `seccionDeAnatomy`. La iteración anterior usó un riel
izquierdo con línea en "L" (horizontal + vertical), que tiene una esquina. Se reemplaza por un
**riel superior** con líneas verticales rectas:

- Se quita el riel izquierdo (`RIEL` a la izquierda) y se agrega un **margen superior**
  `RIEL_TOP = 64` para alojar los marcadores arriba del clon. El clon vuelve a centrarse
  horizontalmente y se baja por `RIEL_TOP`.
- Los marcadores se ubican en una fila arriba del clon, **separados horizontalmente** (gap
  `TAM_MARCADOR + 4`); la X de cada marcador se mantiene dentro del ancho de su box.
- De cada marcador baja una **línea vertical recta** (un solo rect, del color del marcador)
  hasta el borde superior de su box. Sin esquinas.
- El helper `lineaGuia` (en L, 2 rects) se reemplaza por `lineaGuiaV` (vertical, 1 rect).
- El borde punteado de cada box (`bordeMarca`) se mantiene.

(El número del marcador sigue siendo el índice del elemento; el orden horizontal en el riel es
espacial.)

## 2. Fill del band = color del borde

`src/plugin/generadores/layout.ts`. Hoy las bandas se dibujan con fill claro (`GAP_BANDA` /
`PADDING_BANDA`) y borde saturado:
- Gap: `bandaPunteada(r, GAP_BANDA, COTA_GAP.oscuro, artwork)`.
- Padding: `bandaPunteada(r, PADDING_BANDA, COTA_PADDING.oscuro, artwork)`.

Se cambia el fill al **mismo color del borde** (consistencia en ambas bandas):
- Gap → `bandaPunteada(r, COTA_GAP.oscuro, COTA_GAP.oscuro, artwork)` (fill `#FF24BD`).
- Padding → `bandaPunteada(r, COTA_PADDING.oscuro, COTA_PADDING.oscuro, artwork)` (fill `#007BE5`).

`bandaPunteada` ya pinta el fill a opacidad 0.12, así que el fill queda como una versión
translúcida del color del borde. Las constantes `GAP_BANDA` / `PADDING_BANDA` quedan sin uso y
se eliminan.

## 3. El chip de la cota no debe quedar cortado

`src/plugin/generadores/layout.ts` (y `anatomy.ts` si aplica). Los chips de cota que asoman del
artwork quedan cortados. Hay que ubicar el frame responsable y corregirlo:
- Si es por `clipsContent`, ponerlo en `false` en ese frame.
- Si es porque el artwork no contempla el ancho/alto de las anotaciones (los chips asoman fuera
  del fondo gris), **agrandar el artwork** (margen/`RESPIRO`) para que el chip entre en el área
  gris.

El detalle exacto (qué frame y si es clipping o tamaño) se determina en el plan leyendo el
dimensionado del artwork de Layout.

---

## Alcance / no incluye

- No cambian colores de cotas, estructura de página ni cards.

## Testing

- Todo impuro (toca `figma.*`) → verificación por PDF, sin tests nuevos. Si quitar
  `GAP_BANDA`/`PADDING_BANDA` o reemplazar `lineaGuia` deja algo sin uso, el build lo evidencia.
- Cada tarea: `npm run build && npm test` sin errores ni regresiones (214 tests).
- Verificación final por PDF: líneas guía verticales rectas sin esquina; band de gap/padding con
  fill del color de su borde; chips de cota completos (sin corte).
