# Diseño — Panel del exhibit con íconos y chips de variable (DesignDoc visual · D2)

**Fecha:** 2026-06-16
**Proyecto:** Specs Plugin para Figma — plugin de documentación de specs para handoff.
**Alcance:** Segunda de tres sub-rebanadas del refinamiento visual. Reestructurar el panel de texto
del exhibit de Layout (hoy una lista de líneas `Label: valor`) a **filas de 2 columnas**: a la
izquierda un ícono + el nombre de la propiedad; a la derecha el valor, con las variables/styles en
**chips grises** (nombre completo, ej. `sizing/card-width`), como DesignDoc.

---

## Contexto

`exhibit(spec)` (`generadores/layout.ts`) hoy arma una lista vertical de `texto("Width: …")`. DesignDoc
usa un panel tabular: cada fila tiene un ícono (Width ↦, Height ✕, Direction ↓, Fill ◻, Padding ▦…),
el nombre de la propiedad alineado, y el valor a la derecha con las variables en cajitas grises.

## Sección 1 — Helpers nuevos (`generadores/layout.ts`)

**Íconos por propiedad** — un mapa `ICONOS_PROP: Record<string, string>` con SVG 12×12 (stroke gris)
para: `width`, `height`, `direction`, `fill`, `stroke`, `align`, `padding`, `gap`, `corner`,
`columns`, `rows`. (Set simple, líneas/rects básicos; se afinan en D3.)

**`chipVariable(nombre, frame)`** — cajita gris (`fill {0.92}`, corner radius 4, padding 2×5) con el
nombre completo de la variable/style en texto oscuro 11px. Distinto de `chip` (que es para el
artwork, fondo saturado + texto blanco).

**`filaPropiedad(iconoKey, label, valor)`** — frame Auto Layout horizontal:
- Columna izquierda (ancho fijo ~150): el SVG del ícono + `texto(label, 12)`.
- Columna derecha: `valor`, que es un `FrameNode` ya armado (texto + chips) que pasa el caller.

**`valorConChips(partes, frame)`** — arma el lado derecho: recibe `Array<{ texto: string } | { chip: string }>`
y devuelve un frame horizontal con `texto(...)` y `chipVariable(...)` según cada parte.

## Sección 2 — Reescribir `exhibit`

Cada propiedad pasa a una `filaPropiedad`:
- **Width**: ícono `width`, label "Width", valor `[{texto: resizingH}, varW ? {chip: nombreVar} : {texto: medida}, …]`.
  Concretamente: `Fixed` + (variable como chip o el número) + `(valor)` cuando hay variable.
- **Height**: análogo, ícono `height`.
- **Fill**/**Stroke**: ícono `fill`/`stroke`, valor con el color/variable/style en chip (variable/style)
  o texto (hex).
- **Direction**: ícono `direction`, valor texto (`Vertical`/`Horizontal`/`Grid`).
- **Alignment**: ícono `align`, valor texto.
- **Padding**: ícono `padding`, valor: si `spacingVars.padding*`, el nombre en chip + `(textoPadding)`;
  si no, `textoPadding`.
- **Item spacing**: ícono `gap`, análogo con `spacingVars.itemSpacing`.
- **Corner radius**: ícono `corner`, valor texto.
- **Grid (Columns/Rows/Column gap/Row gap)**: íconos `columns`/`rows`/`gap`, valores texto.

El branch GRID y el branch normal del `exhibit` usan las mismas filas (solo cambian qué propiedades).

## Sección 3 — Decisiones

- **Nombre de variable**: completo (`sizing/card-width`, `color/surface`, `space/padding-1x`).
- **Alcance**: solo el exhibit de **Layout** (Anatomy/Properties quedan con su formato actual; se
  pueden alinear después si se quiere).

## Sección 4 — Verificación

`npm run build && node --test` verdes (generador → sin tests nuevos; la lógica de valores ya está
testeada en `etiquetaSpacing`/`textoDimension`/`colorAtributo`). Manual: el panel del `card`/`screen`
muestra cada propiedad con su ícono y las variables en chips grises, en 2 columnas alineadas.
Comparar con `DesignDoc-layout.pdf`.

## Fuera de alcance (D3)

- Refinamiento fino de tamaños/espaciado, anchos exactos de columna, afinado de los íconos.
- Íconos/chips en Anatomy y Properties.
