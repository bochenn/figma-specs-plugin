# Anatomy

## Qué hace
Descompone el elemento seleccionado en sus capas: cada capa se numera sobre un clon del diseño y se detalla a la derecha con su tipo y atributos.

## Qué muestra
- **Artwork** (izquierda): un clon del elemento con un **badge numerado por capa**. Los badges se colocan en los **4 lados** del elemento (izq/der/arriba/abajo), eligiendo el lado cuyo badge no caiga sobre otra capa y cuya línea cruce menos elementos; conectados con una línea perpendicular. El canvas tiene margen generoso para que respiren.
- **Lista** (derecha): una card por elemento con header `nombre · TIPO` (+ ícono de tipo) y filas de atributos:
  - Color (`background-color`, `border-color`) con swatch; si es token, **ChipVar** (chip rosa `#FFE0FC`/`#EA10AC`) con el nombre de la variable/style + el valor resuelto.
  - `width`/`height` con el **ícono de resizing** (Hug/Fixed/Fill) cuando aplica.
  - Para texto: `Text Style`, `Font Family`, `Font Weight`, `Font Size`, `Line Height`, `Letter Spacing`, `Alignment`, `Case`.
  - `Depends on` / props de variante para instancias.

## Recorrido
Por defecto desciende según `Anatomy depth` (self / direct children / all), pero **siempre rescata las capas TEXT** anidadas y las de adentro de instancias, para no perder sus text styles.

## Opciones que la afectan
- **Anatomy depth** (`children`/`self`/`all`) — profundidad de capas.
- **Tabular anatomy** — muestra la lista como tabla en vez de cards.
- **Spec nested subcomponents** — agrega una sección Anatomy por cada instancia anidada.
- **Itemize instances** — abre las instancias para listar sus capas internas.
- Formatos globales: Color, Units, Type, Raw value, Preferred.

## Archivos clave
- `extraccion/anatomy.ts`, `traversal/recorrer.ts` (recorrido + `textosProfundos`)
- `generadores/anatomy.ts` (artwork, badges, cards)
- `utils/atributos.ts` (atributos por capa), `extraccion/adaptador.ts` (Figma → `NodoLike`)
