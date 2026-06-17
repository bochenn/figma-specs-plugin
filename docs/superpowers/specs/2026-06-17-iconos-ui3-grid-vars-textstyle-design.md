# Diseño — Íconos UI3 + variables del grid + text-style del title

**Fecha:** 2026-06-17
**Proyecto:** Specs Plugin para Figma — documentación de specs para handoff.
**Alcance:** Sobre el output de **Layout and Spacing** (PR #58), cuatro mejoras del
feedback (`specs plugin-layout-9.pdf`, imágenes de gap, `figma-UI3.pdf`):
- **(4) Íconos:** reemplazar los íconos dibujados a mano del panel por la librería
  oficial `resources/figma-UI3`, inlineada en el bundle.
- **(3) Gap H/V:** Column gap usa el ícono de spacing horizontal; Row gap el de
  spacing vertical (hoy usan el mismo). Idem item spacing según dirección.
- **Alignment dinámico:** el ícono de la fila Alignment depende de la dirección y
  la alineación del eje contrario (6 íconos + baseline).
- **(1) Variables del grid:** `Column gap`/`Row gap` muestran su variable como chip.
- **(2) Text-style del title:** si un elemento contiene un texto, mostrar su estilo.

---

## Estado actual

`generadores/layout.ts`: `ICONOS_PROP` es un `Record<string,string>` de SVGs 12×12
dibujados a mano (stroke gris). `filaPropiedad(iconoKey, label, partes)` los
renderiza con `svgIconoProp`. El exhibit usa keys fijas: `width`, `height`,
`direction`, `fill`, `stroke`, `align`, `padding`, `gap`, `corner`, `columns`,
`rows`. El **Grid** usa una sola key `gap` para Column gap y Row gap, y `align`
fijo para Alignment. Los grid gaps se muestran con `etiquetaSpacing` (texto plano,
sin chip). No hay fila de text-style.

`extraccion/adaptador.ts`: arma `spacingVars` desde `boundVariables` para
padding/itemSpacing; para GRID guarda `gridColumnGap`/`gridRowGap` (números, **sin**
variable). Captura font props solo en nodos `TEXT`.

`esbuild.config.mjs`: `buildPlugin` con `bundle:true` (sin loader de `.svg`).

`resources/figma-UI3/`: 659 SVGs oficiales con nombres descriptivos (24×24 y 16×16).

## Decisiones (brainstorming, confirmadas con el usuario)

- Mapeo explícito de íconos (tabla abajo). Inlinear vía `import ... .svg` (loader
  text en esbuild); `resources/figma-UI3` = fuente versionada.
- Alignment: 6 íconos según dirección + eje contrario; baseline horizontal aparte.
  Solo se codifica el eje contrario; el primario sigue en el texto.
- Export = los SVG ya viven en `resources/figma-UI3` (no se genera nada nuevo).

## Sección 1 — Íconos UI3 inlineados

`esbuild.config.mjs`: agregar `loader: { ".svg": "text" }` a `buildPlugin` y al
contexto de `watch`. (Los tests no importan SVGs, así que `buildTests` no cambia.)

Nuevo módulo `src/plugin/generadores/iconos.ts`: importa los SVG necesarios como
texto desde `../../../resources/figma-UI3/...` y exporta un mapa
`ICONOS_UI3: Record<string, string>` (key lógica → SVG). Helper `nodoIcono(key)`
que normaliza el SVG (fuerza `width`/`height` a 16, recolorea el stroke `#171717`
a gris del panel) y devuelve el nodo de `figma.createNodeFromSvg`.

Mapeo (todos `icon.24.*` salvo alignment, que son `icon.16.*`):

| key lógica | archivo |
|---|---|
| width | `prop-width` |
| height | `prop-height` |
| dir-horizontal | `al.layout-horizontal` |
| dir-vertical | `al.layout-vertical` |
| dir-grid | `grid` |
| fill | `fill.solid.small` |
| stroke | `outline.stroke.small` |
| padding | `al.padding-all` |
| spacing-h | `al.spacing-horizontal` |
| spacing-v | `al.spacing-vertical` |
| corner | `corners` |
| columns | `grid-column` |
| rows | `grid-row` |
| text | `prop-text` |
| align-v-left | `autolayoutgrid.vertical.left` |
| align-v-center | `autolayoutgrid.vertical.center` |
| align-v-right | `autolayoutgrid.vertical.right` |
| align-h-top | `autolayoutgrid.horizontal.top` |
| align-h-center | `autolayoutgrid.horizontal.center` |
| align-h-bottom | `autolayoutgrid.horizontal.bottom` |
| align-baseline | `autolayout.alignment.baseline` |

`filaPropiedad` pasa a recibir la key UI3 y renderiza con `nodoIcono`.

## Sección 2 — Dirección, gap y alignment dinámicos

En el exhibit:
- **Direction:** key `dir-horizontal` / `dir-vertical` / `dir-grid` según `spec.direccion`.
- **Item spacing** (H/V layout): `spacing-h` si Horizontal, `spacing-v` si Vertical.
- **Column gap** (GRID): `spacing-h`; **Row gap** (GRID): `spacing-v`.
- **Alignment:** helper puro `iconoAlineacion(direccion, alineacionContraria)` en
  `utils/marcadores-layout.ts`, devuelve la key:
  - VERTICAL: Start→`align-v-left`, Center→`align-v-center`, End→`align-v-right`.
  - HORIZONTAL: Start→`align-h-top`, Center→`align-h-center`, End→`align-h-bottom`,
    Baseline→`align-baseline`.

## Sección 3 — Variables del grid (item 1)

`adaptador.ts`: capturar las variables atadas a `gridColumnGap`/`gridRowGap` desde
`boundVariables` (keys `"gridColumnGap"`/`"gridRowGap"`) → nuevos campos
`gridColumnGapVar`/`gridRowGapVar` en `NodoLike` y `LayoutSpec`.
`extraccion/layout.ts` los copia al spec.
Exhibit GRID: Column gap/Row gap usan `valorSpacing(gap, u, gapVar)` (chip de
variable + valor) en vez de `etiquetaSpacing` (texto plano).

## Sección 4 — Text-style del elemento (item 2)

`extraccion/layout.ts` (`layoutSpecDe`): buscar el primer hijo directo `TEXT`
(`nodo.children`). Si existe, construir `spec.textStyle`:
- si el hijo tiene `textStyleName` → `{ nombre: textStyleName }` (se muestra como chip);
- si no → `{ resumen: "<fontFamily> <fontStyle> · <fontSize>" }` (texto plano).
Exhibit: si `spec.textStyle`, agregar fila "Text style" (key `text`) con chip o texto.

## Sección 5 — Testing y verificación

- **Pura:** `iconoAlineacion(direccion, alineacionContraria)` (todas las
  combinaciones, incluido baseline). Si se extrae el armado de `textStyle` a un
  helper puro sobre `NodoLike`, se testea (con/sin style name).
- **Manual (PDF):** íconos UI3 en el panel; Column gap horizontal / Row gap
  vertical; Alignment correcto por dirección+alineación; grid gaps con chip de
  variable; fila Text style en `title`.

## Fuera de alcance

- Recolorear/normalizar perfecto todos los íconos (fill vs stroke): v1 acepta el
  color nativo, se afina por PDF.
- Mostrar text-style en Anatomy/Properties (solo Layout, caso title).
- Reemplazar íconos fuera del panel de Layout (p. ej. Anatomy/marcadores).
