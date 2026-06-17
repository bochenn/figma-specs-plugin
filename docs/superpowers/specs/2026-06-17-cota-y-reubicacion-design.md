# Diseño — Componente `cota` (dos partes) + reubicación de medidas en Layout

**Fecha:** 2026-06-17
**Proyecto:** Specs Plugin para Figma — documentación de specs para handoff.
**Alcance:** Sobre el output de **Layout and Spacing** (PR #58), dos correcciones del
feedback del usuario:
- **A:** rediseñar el badge de medida como **`cota`** (renombrar `chip`) con forma de
  dos partes para padding/gap con variable: `[ sub-pill: nombre ] valor`.
- **B:** reubicar las medidas para que **no se superpongan** (estilo "MI VERSIÓN"
  del usuario), donde hoy la cota de alto, la de padding izquierda y los gaps se
  pisan en el carril izquierdo.

Referencias del usuario: `cota.pdf` (forma del badge), `comparacion.pdf` (MI vs TU
versión), `specs plugin-layout-7.pdf` (errores actuales).

---

## Estado actual

`generadores/layout.ts`:
- `chip(valor, color, artwork)`: pill de color con texto blanco; usado para
  padding/gap (`dibujarMarcas`), W/H (`dibujarCotas`) y medidas de hijos
  (`dibujarCotaHijo`).
- `dibujarMarcas`: agrupa por lado y aplica `separarColisiones`. Posiciones:
  top `y=MARGEN-18`, bottom `y=MARGEN+clon.height+6`, left `x=MARGEN-16-c.width`,
  right `x=MARGEN+clon.width+16`. `MARGEN=96`.
- `dibujarCotas`: línea de ancho arriba (`y=MARGEN-44`) con número centrado; línea
  de alto a la izquierda (`x=MARGEN-44`) con número a su izquierda.

`utils/marcadores-layout.ts`: `marcasLayout(...)` devuelve `Marca[]` con
`{ lado, centro, desde, hasta, valor, tipo }`, donde `valor` ya viene combinado
(`"nombreCorto valor"` cuando hay variable, vía `nombreCorto`/`spacingVars`).

**Problema (layout-7 / comparacion):** la cota de alto (carril izquierdo ~x52),
la cota de padding-izquierda (ancha, anclada por su borde derecho) y los gaps caen
todos en el mismo carril izquierdo y se superponen.

## Decisiones (brainstorming)

- La `cota` de dos partes aplica **solo a padding/gap con variable**; mantiene el
  **color semántico** (padding azul, gap rosa). W/H siguen como número rojo simple.
- Reubicación con **esquema fijo estilo MI VERSIÓN** (v1; se afina por PDF).

## Sección A — Componente `cota`

`Marca` pasa a llevar `nombre?` y `valor` **separados** (hoy `valor` es el string
combinado): `marcasLayout` deja `valor` con el número (con unidad) y `nombre` con
el `nombreCorto` de la variable si existe. Lógica pura → se actualizan los tests de
`marcadores-layout` que hoy esperan el string combinado.

Se renombra `chip` → **`cota`** en `layout.ts` y todos sus usos. Dos formas:
- `cota(valor, color, artwork)` — pill simple: fondo `color`, texto `valor` blanco.
  (W/H, hijos, y padding/gap sin variable.)
- `cotaConNombre(nombre, valor, color, artwork)` — dos partes: pill exterior con
  `color` (corner 4, padding 2/4/2/2, gap 4), un sub-pill interno `value`
  (mismo color más claro, corner 2, padding 0/2) con el `nombre` en blanco, y el
  `valor` numérico en blanco al lado. (padding/gap con variable.)

`dibujarMarcas` elige una u otra según `m.nombre`. El color semántico
(`CHIP_PADDING`/`CHIP_GAP`) no cambia; el sub-pill usa una versión más clara del
mismo color (mezcla con blanco).

## Sección B — Reubicación sin superposición

Esquema v1 (`artworkDe` / `dibujarMarcas` / `dibujarCotas`):

1. **Alto (cota W/H vertical):** carril externo izquierdo. El **margen izquierdo
   del artwork** se calcula dinámicamente = `max(MARGEN, anchoCotaAlto + anchoMayorCotaIzquierda + sep)`
   para garantizar que la cota de alto quede a la izquierda de cualquier cota del
   lado izquierdo, sin pisarse. (El clon y overlays se corren según ese margen.)
2. **Paddings horizontales (left/right):** se dibujan en la **fila de abajo**
   (left-padding alineado al borde izquierdo, right-padding al borde derecho), para
   liberar los lados izquierdo/derecho.
3. **Padding vertical (top/bottom)** sobre/bajo el borde; **width** arriba; **gap**
   en el hueco interior, anclado para no invadir el carril del alto.
4. **`separarColisiones` por lado** se mantiene como red de seguridad final.

Render impuro → verificación manual por PDF. El reparto exacto es v1.

## Sección C — Testing y verificación

- **Pura:** ajustar/expandir tests de `marcasLayout` para el nuevo shape
  (`nombre` + `valor` separados, sin combinar).
- **Impura (manual, PDF):** la cota se ve como en `cota.pdf` (sub-pill + valor);
  ninguna medida se superpone (card/tag/screen); alto a la izquierda separado;
  paddings horizontales abajo.

## Fuera de alcance

- Aplicar la `cota` de dos partes a W/H (quedan número rojo simple).
- Color rojo unificado (se mantiene el semántico azul/rosa).
- Cambios en el panel de propiedades o en otras secciones.
