# Diseño — Padding por lado (placement DesignDoc exacto) + defaults UI + fondo #EBEBEB

**Fecha:** 2026-06-18
**Proyecto:** Specs Plugin para Figma — handoff.
**Alcance:** Refinar la ronda anterior de callouts de padding + ajustes de UI/fondo,
según feedback (imágenes 26/27/28).

---

## Decisiones (confirmadas con el usuario)

- **#1 Defaults UI:** por defecto tildados — Specs: Anatomy + Layout & Spacing;
  Opciones: Spec nested subcomponents, Itemize instances, Element measures, Show
  raw value.
- **#2 Padding por lado (DesignDoc exacto):** dejar de agrupar; mostrar top/bottom/
  left/right por separado, ubicados como DesignDoc: verticales (top, bottom) a la
  **derecha** alineadas a su banda (top arriba, bottom abajo); horizontales (left,
  right) **abajo** en las esquinas (left a la izq, right a la der); cada una con su
  línea guía. Aplica también al **screen (GRID)**.
- **#3 Fondo:** todos los artworks a **#EBEBEB** (`{0.922,0.922,0.922}`).
- **#4 Estilo de cota del tag:** se resuelve con #2 — al mostrar por lado sin
  variable, la cota usa el pill de valor simple (`cota`), igual que el resto; la
  etiqueta agrupada "padding-x 16" era la que desentonaba.

## Sección 1 — Callouts por lado con anclaje a la banda

Reescribir `dibujarSpacingCallouts(artwork, clon, spec, gaps)` para NO agrupar:
- `top` (si > 0) → derecha, y = `clon.y + p.top/2` (centro de la banda superior).
- `bottom` → derecha, y = `clon.y + clon.height - p.bottom/2`.
- `left` → abajo, x = `clon.x + p.left/2`.
- `right` → abajo, x = `clon.x + clon.width - p.right/2`.
- gap (layout vertical) → derecha (centro del hueco); gap (horizontal) → abajo.
- Cada chip: `cotaConNombre(nombreCorto(var), val)` si hay variable; si no, `cota(val)`.
- Línea guía: horizontal desde el borde derecho (verticales) / vertical desde el
  borde inferior (horizontales) hasta el chip.

`artworkModo` llama a `dibujarSpacingCallouts` tanto en la rama **GRID** (con
`gaps = []`) como en la normal (con los gaps). Se quita el uso de `agruparPadding`
y la **nota al pie** de `seccionDeLayout` (ya no hay agrupado).

## Sección 2 — Defaults de la UI

`src/ui/index.html`: agregar `checked` a `sec-layout`, `nested`, `itemizar`,
`medirHijos` (`sec-anatomy` y `mostrarRaw` ya están).

## Sección 3 — Fondo del artwork #EBEBEB

`utils/variables-tema.ts`: `fondo-artwork` light → `{ r: 0.922, g: 0.922, b: 0.922 }`.

## Sección 4 — Testing

- Pura: sin función nueva (se quita el uso de `agruparPadding`; sus tests pueden
  quedar, la función queda disponible aunque sin uso en el render).
- Manual (PDF): padding por lado ubicado como DesignDoc; defaults correctos al abrir
  el plugin; fondo #EBEBEB; cota del tag consistente.

## Fuera de alcance

- Tres+ instancias; content-width; cambiar W/H o medidas de hijos.
