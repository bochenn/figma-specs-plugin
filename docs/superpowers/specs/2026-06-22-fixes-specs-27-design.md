# Fixes del output (feedback Specifications-27) — Diseño

**Fecha:** 2026-06-22
**Referencias:** `Specifications-27.pdf`, Images #9–#11.

## Objetivo

Cuatro mejoras al output:
1. Padding-top al layer `title` del encabezado.
2. En las cards de Anatomy, mostrar el tipo de width/height (Hug / Fill / Fixed).
3. En la columna Hierarchy de Layout, un icono de tipo de capa por elemento.
4. Descomponer el padding del panel en 4 filas etiquetadas (Top/Right/Bottom/Left) cuando no
   es uniforme.

Decisión confirmada (4): padding no uniforme → 4 filas labeled; uniforme → 1 fila `Padding:`.

---

## 1. Padding-top al `title`

`src/plugin/generadores/encabezado.ts`, en `barraStatus`: el frame `title` hoy tiene
`paddingBottom = 12` y nada arriba. Se agrega `barra.paddingTop = 24` (valor inicial, se
ajusta por PDF) para dar aire arriba de la barra (Specifications tiene padding 0).

## 2. Tipo de width/height en las cards de Anatomy

El dato ya existe: `NodoLike.layoutSizingHorizontal` / `layoutSizingVertical`
(`"FIXED" | "HUG" | "FILL"`), poblados por el adaptador. Falta usarlos.

- `Atributo` (en `src/plugin/modelo/tipos.ts`) suma un campo opcional `prefijo?: string`
  (el modo de resizing, ya formateado: `"Fixed"` / `"Hug"` / `"Fill"`).
- `dimensionAtributo` (en `src/plugin/utils/atributos.ts`) recibe el modo y, si está, setea
  `prefijo`. Un helper puro mapea `"FIXED"→"Fixed"`, `"HUG"→"Hug"`, `"FILL"→"Fill"`.
- `leerAtributos` pasa `nodo.layoutSizingHorizontal` al atributo `width` y
  `nodo.layoutSizingVertical` al de `height`.
- `filaAtributo` (en `src/plugin/generadores/anatomy.ts`): después de `textoClave`, si
  `attr.prefijo` existe, agrega un `textoValor(attr.prefijo)` antes del chip/valor.

Resultado: `width: Fixed 67px`, `height: Hug 88px`, `width: Fill sizing/card (296px)`. Si no
hay modo (nodo sin auto-layout sizing), queda como hoy (`width: 67px`).

(Los otros consumidores de `Atributo` —tabla, json, diff— ignoran `prefijo`.)

## 3. Icono de tipo de capa en Hierarchy (Layout)

`camino` (la ruta del breadcrumb) hoy es `string[]` (solo nombres). Se enriquece con el tipo:

- `Recorrido.camino` (en `src/plugin/traversal/recorrer.ts`) pasa de `string[]` a
  `{ nombre: string; tipo: string }[]`.
- `recorrerAutoLayout` (en `src/plugin/traversal/recorrer-autolayout.ts`) arma
  `propio = [...camino, { nombre: nodo.name, tipo: nodo.type }]`.
- `breadcrumb` (en `src/plugin/generadores/layout.ts`) recibe `{ nombre, tipo }[]`; por cada
  entrada arma una fila horizontal con el icono de tipo (`nodoIconoTipo(tipo)`, reescalado a
  ~16px) + el nombre, indentada por nivel.
- Los call sites de `breadcrumb` (fallbacks en layout.ts) pasan
  `[{ nombre: <name>, tipo: <tipo> }]`.

`nodoIconoTipo` ya existe (`src/plugin/generadores/iconos.ts`) y mapea
FRAME/INSTANCE/COMPONENT/GROUP/TEXT/VECTOR.

## 4. Padding en 4 filas etiquetadas (panel de Layout)

`src/plugin/generadores/layout.ts` (`exhibit`). Hoy el padding es una sola fila (uniforme o
los 4 valores juntos). Se extrae un helper `filasPadding(p, sv, u)` que devuelve:
- **Uniforme** (`padUniforme`): una fila `filaPropiedad("padding", "Padding", valorSpacing(p.left, u, sv.paddingLeft))`.
- **No uniforme**: cuatro filas, una por lado:
  - `filaPropiedad("padding", "Padding top", valorSpacing(p.top, u, sv.paddingTop))`
  - `filaPropiedad("padding", "Padding right", valorSpacing(p.right, u, sv.paddingRight))`
  - `filaPropiedad("padding", "Padding bottom", valorSpacing(p.bottom, u, sv.paddingBottom))`
  - `filaPropiedad("padding", "Padding left", valorSpacing(p.left, u, sv.paddingLeft))`

Ambas ramas del `exhibit` (GRID y auto-layout) usan el helper en lugar del `partesPadding`
+ `filaPropiedad("padding", "Padding", partesPadding)` actuales. El `padUniforme` ya existe y
se conserva (incluye el caso hardcoded uniforme).

---

## Alcance / no incluye

- No cambian colores, estructura de página ni cotas.
- El modo de resizing en Anatomy reusa el dato existente; no se toca el adaptador.

## Testing

- **Puros / con test**: el mapeo de modo de resizing (punto 2) y el cambio de tipo de
  `camino` (punto 3) en `recorrerAutoLayout`. Se actualizan los tests de
  `recorrer-autolayout` al nuevo `camino` `{nombre,tipo}[]`, y se agregan tests del modo en
  `atributos` (width/height con `prefijo`).
- **Impuros (PDF)**: padding-top (1), render de `filaAtributo` con prefijo (2),
  iconos en breadcrumb (3), filas de padding (4).
- Cada tarea: `npm run build && npm test` sin errores ni regresiones.
- Verificación final por PDF: aire arriba de la barra; `width: Fixed 67px` / `height: Hug …`
  en cards; iconos de tipo en Hierarchy; padding en 4 filas labeled cuando no es uniforme.
