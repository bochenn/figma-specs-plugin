# Diseño — Padding estilo DesignDoc + fondo de artwork + tipografía de cota

**Fecha:** 2026-06-18
**Proyecto:** Specs Plugin para Figma — documentación de specs para handoff.
**Alcance:** Tres ajustes al artwork de Layout (feedback con `Specifications-small-items.pdf`
e imágenes de DesignDoc):
- **#1 padding:** colocar los valores de padding pegados a su banda/borde como DesignDoc.
- **#2 fondo:** el fondo del artwork (#F5F5F5) hace invisibles los objetos blancos →
  oscurecerlo.
- **#3 cota:** el texto de la cota a 11px / line-height 16px.

---

## Estado actual

- `dibujarMarcas` (en `layout.ts`) ubica los badges de padding/gap (y medidas de
  hijos) en carriles: top (padding-top + gaps-h + anchos de hijos) a `clon.y - FILA_TOP`
  (24), bottom (padding bottom/left/right) a `clon.y + h + FILA_BOT` (8), left
  (gaps-v + altos de hijos) a `clon.x - COL_IZQ - w` (8). `dibujarLineasMedida` ya
  dibuja una línea de cota sobre cada banda.
- `cota`/`cotaConNombre` crean el texto con `texto(valor, 11)` (sin line-height).
- `fondo-artwork` (variables-tema): light `{0.96,0.96,0.96}` (#F5F5F5), dark oscuro.

## Decisiones (brainstorming, confirmadas)

- **#1:** valores de padding pegados a su banda — top/bottom centrados en su borde,
  left/right (con nombre) en las esquinas inferiores; cada uno con su línea de cota
  corta sobre la banda. (El split Dimensions|Spacing ya separa W/H del padding en
  chicos, así que no chocan.)
- **#2:** oscurecer `fondo-artwork` (light) de #F5F5F5 a **#C9C9C9** (`{0.788,0.788,0.788}`),
  global (dark queda igual).
- **#3:** texto de la cota: fontSize 11, lineHeight 16px.

## Sección 1 — Padding pegado a la banda (DesignDoc)

En `dibujarMarcas`, los badges de padding se posicionan adyacentes a su borde, no en
una fila lejana:
- **padding-top:** centrado en x, apenas arriba del borde superior.
- **padding-bottom:** centrado en x, apenas abajo del borde inferior.
- **padding-left:** esquina inferior izquierda (alineado al borde izquierdo).
- **padding-right:** esquina inferior derecha (alineado al borde derecho).
- **gap-h:** centrado sobre el hueco, arriba; **gap-v:** a la izquierda del hueco.
- Las medidas de hijos (cuando Element measures) siguen en sus carriles (top para
  anchos, left para altos), separadas de los paddings por `separarColisiones`.

`dibujarLineasMedida` se mantiene (línea de cota corta sobre cada banda; el badge
queda alineado con ella). Se ajustan los offsets para que los badges queden
"pegados" (apenas afuera del borde) y se garantiza que left/right usen
`cotaConNombre` cuando hay variable (nombre + valor) en las esquinas.

## Sección 2 — Fondo de artwork más oscuro

En `utils/variables-tema.ts`, cambiar el valor **light** de `"fondo-artwork"` de
`{ r: 0.96, g: 0.96, b: 0.96 }` a `{ r: 0.788, g: 0.788, b: 0.788 }` (#C9C9C9). Así
los objetos con fill blanco/claro (y su texto blanco) se distinguen del fondo. El
valor dark no cambia.

## Sección 3 — Tipografía de la cota

En `cota` y `cotaConNombre` (`layout.ts`), tras crear cada text node de valor/nombre
(`await texto(..., 11)`), setear `t.lineHeight = { unit: "PIXELS", value: 16 }`.

## Sección 4 — Testing y verificación

- Render impuro → **sin tests nuevos**; verificación manual.
- **Manual (PDF):** padding pegado a sus bandas como DesignDoc; objetos blancos
  (`variable`, fill #FFFFFF) visibles sobre el fondo #C9C9C9; el texto de la cota a
  11/16 (más alto/legible).

## Fuera de alcance

- Reescribir el split Dimensions|Spacing (ya existe).
- Cambiar colores de chips/cotas (solo el fondo del artwork).
- Tocar otras secciones.
