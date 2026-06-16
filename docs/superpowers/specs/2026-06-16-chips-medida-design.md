# Diseño — Chips de medida con color semántico (DesignDoc visual · D1)

**Fecha:** 2026-06-16
**Proyecto:** Specs Plugin para Figma — plugin de documentación de specs para handoff.
**Alcance:** Primera de tres sub-rebanadas del refinamiento visual hacia DesignDoc. Reemplazar los
números sueltos de las anotaciones del artwork por **chips con fondo de color** y alinear el color
semántico con DesignDoc: padding = azul, gap/spacing = rosa, dimensión (cotas, medidas por hijo) =
rojo. Los chips de padding/gap muestran **nombre de variable + valor** (`padding-1x (16)`).

---

## Contexto

DesignDoc no muestra números sueltos: usa etiquetas con fondo de color (azul `padding-1x 16`, rosa
`gap-0_5x 8`, rojo `800`/`240`). Hoy nosotros pintamos números verdes (padding), naranjas (spacing)
y azules (cotas) sin fondo, que además se amontonan. D1 introduce el chip y el color semántico.

## Sección 1 — Geometría pura (`utils/marcadores-layout.ts`)

`marcasLayout` pasa a recibir `spacingVars` y a formatear el valor con `etiquetaSpacing` (nombre +
valor) en vez de solo el número:
```typescript
export function marcasLayout(
  frame: Rect,
  padding: { left, top, right, bottom },
  gaps: Rect[],
  direccion: "HORIZONTAL" | "VERTICAL",
  spacingAuto: boolean,
  spacingVars: { paddingLeft?, paddingTop?, paddingRight?, paddingBottom?, itemSpacing? } = {},
): { ejeX: MarcaX[]; ejeY: MarcaY[] }
```
- Padding left/right/top/bottom → `etiquetaSpacing(valor, unidad, spacingVars.padding<Lado>)`.
- Gaps → `etiquetaSpacing(g.width/height, unidad, spacingVars.itemSpacing)` (o `"Auto"` si spacingAuto).
- Sin `spacingVars` (tests existentes) → comportamiento equivalente (etiquetaSpacing sin nombre = solo número).

## Sección 2 — Chip (`generadores/layout.ts`)

Helper `chip(texto, colorFondo): Promise<FrameNode>` — frame Auto Layout horizontal, padding 2×5,
corner radius 4, `fills = [colorFondo]`, con un texto blanco 9px. El caller lo posiciona (necesita
width/height tras crearlo).

Colores (constantes RGB):
- `CHIP_PADDING` = azul `{0.05, 0.5, 1}`
- `CHIP_GAP` = rosa `{0.9, 0.2, 0.5}`
- `CHIP_DIM` = rojo `{0.95, 0.25, 0.15}`

## Sección 3 — Reemplazos en `artworkDe`

- **Bandas overlay**: padding pasa de verde a azul claro (`{0.6, 0.78, 1}`, opacity 0.30); gap de
  naranja a rosa claro (`{1, 0.7, 0.85}`, opacity 0.45). Hijos siguen azul. (Coherencia con los chips.)
- **Marcas de padding/spacing** (`marcasLayout`): el texto suelto + ticks se reemplaza por un `chip`
  con `CHIP_PADDING` (padding) o `CHIP_GAP` (spacing), centrado en la posición de la marca. Se
  conservan los ticks finos como guía.
- **Cotas W/H del frame** (`dibujarCotas`): el `textoCota` azul pasa a `chip(…, CHIP_DIM)`.
- **Medidas por hijo** (`dibujarCotaHijo`): los números pasan a `chip(…, CHIP_DIM)`.

## Sección 4 — Testing y verificación

Tests (`tests/marcadores-layout.test.ts`): `marcasLayout` con `spacingVars` → el `valor` de las
marcas incluye el nombre de variable (`padding-1x (16)`); sin `spacingVars` → solo el número (los
tests existentes siguen pasando).

Manual: artwork del `card` → padding/gap/dimensiones como chips de color (azul/rosa/rojo) con el
nombre de variable donde aplique; ya no números sueltos amontonados. Comparar con `DesignDoc-layout.pdf`.

## Fuera de alcance (D2, D3)

- Íconos + chips de variable en el panel de propiedades (D2).
- Refinamiento de tamaños/espaciado (D3).
