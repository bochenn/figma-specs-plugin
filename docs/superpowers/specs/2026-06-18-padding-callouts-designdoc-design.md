# Diseño — Cotas de padding como callouts (estilo DesignDoc)

**Fecha:** 2026-06-18
**Proyecto:** Specs Plugin para Figma — documentación de specs para handoff.
**Alcance:** Rehacer la colocación de las **cotas de padding (y gap)** del artwork de
Layout para que sean **callouts afuera del elemento con línea guía**, dispuestos
como DesignDoc, con etiquetas agrupadas. Basado en `cota.md`, la infografía del
usuario, y `paddings.pdf` (DesignDoc).

---

## Estado actual

`dibujarMarcas` ubica los badges de padding/gap en carriles (fila arriba: padding-top
+ gaps-h; fila abajo: padding bottom/left/right; columna izq: gaps-v) sin línea guía
y sin agrupar (un badge por lado). `dibujarLineasMedida` dibuja una línea de cota
sobre cada banda. W/H (`dibujarCotas`) van arriba (ancho) e izquierda (alto); las
medidas de hijos (Element measures) en los carriles top/left.

## Decisiones (brainstorming, confirmadas)

- **Siempre afuera:** las cotas de padding/gap van como callout fuera del elemento,
  con una **línea guía** fina que apunta a la banda que miden. Nunca dentro.
- **Layout DesignDoc:** las cotas del **eje vertical** (padding-top, gaps de layout
  vertical, padding-bottom) se apilan en una **columna a la derecha** del elemento;
  las del **eje horizontal** (padding-left, gaps de layout horizontal, padding-right)
  en una **fila abajo**. Cada callout con su línea guía a la banda.
- **Agrupar etiquetas:** padding igual en los 4 lados → una sola etiqueta
  `padding: N` (o el chip de variable); distinto por eje (top==bottom, left==right) →
  `padding-x` / `padding-y`; distinto por lado → los lados con valor. Cuando se
  agrupa por ser uniforme, agregar una **nota al pie** de la sección aclarándolo.

## Sección 1 — Agrupado de padding (puro)

Nueva función pura `agruparPadding(padding, spacingVars): CotaPadding[]` en
`utils/marcadores-layout.ts`. `CotaPadding = { clave: "padding" | "padding-x" |
"padding-y" | "left" | "right" | "top" | "bottom"; eje: "h" | "v"; valor: number;
nombre?: string }`.

Reglas:
- Si los 4 lados son iguales en valor **y** variable → `[{ clave:"padding", eje:"v", valor, nombre }]`
  (una sola; se ubica como callout único + nota al pie).
- Si `top==bottom` y `left==right` pero los ejes difieren → `[{clave:"padding-y", eje:"v", ...}, {clave:"padding-x", eje:"h", ...}]`.
- Si no → un ítem por lado con valor > 0 (`top`/`bottom` eje "v"; `left`/`right` eje "h").

Testeable: uniforme → 1; por eje → 2; por lado → los que correspondan; valor 0 se omite.

## Sección 2 — Callouts con línea guía y layout DesignDoc

En `artworkDe`/`dibujarMarcas` (reescritura de la parte de padding/gap):
- Cada `CotaPadding`/gap se dibuja como un chip (igual que hoy: `cota` o
  `cotaConNombre`) ubicado **afuera** del elemento:
  - **eje vertical** (`eje:"v"`, y gaps de layout vertical) → columna a la **derecha**
    del clon (`x = clon.x + clon.width + margen`), apiladas y separadas por
    `separarColisiones` en Y; el padding-top arriba, gap al medio, padding-bottom abajo.
  - **eje horizontal** (`eje:"h"`, y gaps de layout horizontal) → fila **abajo** del
    clon (`y = clon.y + clon.height + margen`), separadas en X; padding-left a la
    izquierda, padding-right a la derecha.
  - el callout único `padding` (uniforme) → un solo chip abajo a la izquierda.
- **Línea guía:** una línea fina (gris/neutra, sin topes) desde el borde del chip
  hasta el centro de la banda que mide (helper `lineaGuia(artwork, x1,y1, x2,y2)`).
- Se mantienen `dibujarCotas` (W/H) y las medidas de hijos como están.
- `dibujarLineasMedida` (las líneas sobre las bandas) se mantiene para marcar la
  banda; el callout se conecta con su línea guía.

## Sección 3 — Nota al pie cuando se agrupa

Cuando `agruparPadding` devuelve el caso **uniforme** (una sola etiqueta), agregar
al final de la sección de Layout una nota chica (texto 12, gris):
`* padding: N — igual en los 4 lados`. (Si es por eje, opcionalmente
`padding-x / padding-y`; para v1 la nota es solo para el caso uniforme.)

## Sección 4 — Testing y verificación

- **Pura:** `agruparPadding` (uniforme/por-eje/por-lado, omitir 0, respetar variable).
- **Manual (PDF):** padding como callouts afuera con línea guía, eje vertical a la
  derecha y horizontal abajo (como DesignDoc); padding uniforme → una etiqueta + nota
  al pie; el resto del artwork (W/H, hijos) sin cambios.

## Fuera de alcance

- Mover las cotas adentro de la banda (se decidió siempre afuera).
- Rehacer W/H dims o medidas de hijos (quedan como están).
- Content-width / medidas de contenido como en DesignDoc (v1 se enfoca en padding/gap).
