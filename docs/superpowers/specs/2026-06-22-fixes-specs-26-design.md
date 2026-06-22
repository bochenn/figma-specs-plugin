# Fixes del output (feedback Specifications-26) — Diseño

**Fecha:** 2026-06-22
**Referencias:** `Specifications-26.pdf`, Images #4–#8.

## Objetivo

Siete fixes/refinamientos al output, surgidos del feedback:
1. Renombrar el layer `_Status` a `title` en el encabezado.
2. Quitar el prefijo `N. ` del nombre de las variables (ej. `1. Color modes/…` → `Color modes/…`).
3. No repetir la medida del elemento con la de los hijos full-width.
4. Redondear medidas a máximo 2 decimales.
5. Mostrar la unidad `px` en el panel/cards.
6. Padding no uniforme: un `chipVar` por lado (no texto plano).
7. Aplicar lo anterior de forma consistente en todos lados.

Decisiones confirmadas: (3) se omite la cota de un hijo cuando su ancho/alto coincide con el
del contenedor; (5) el `px` va **solo en el panel/cards**, las cotas del artwork quedan sin
`px` (pero igual redondeadas).

---

## 1. Renombrar `_Status` → `title`

`src/plugin/generadores/encabezado.ts`, en `barraStatus`: `frameHorizontal("_Status", 0)`
pasa a `frameHorizontal("title", 0)`. Solo cambia el nombre del frame.

## 2. Quitar el prefijo `N. ` de los nombres de variable

El nombre completo se arma en `src/plugin/extraccion/adaptador.ts` (`nombreVariable`):
`return col ? `${col.name}/${variable.name}` : variable.name;`. El prefijo `N. ` viene del
nombre de la colección (`1. Color modes`, `3. Spacing`).

Se agrega un helper **puro** `limpiarPrefijoColeccion(nombre)` que quita un prefijo inicial
`^\d+\.\s*` del string, y se aplica al nombre de la colección antes de concatenar. Así el
prefijo desaparece en cards, layout y cotas (todas consumen este nombre). El helper se
testea de forma aislada (puro).

## 3. Omitir la cota de un hijo cuando coincide con el padre

`src/plugin/generadores/layout.ts`. En la medición de hijos (vista *Dimensions*):
- `dibujarMarcas` (cotas de ancho/alto por hijo): no agregar la cota de **ancho** del hijo si
  `h.width === clon.width`, ni la de **alto** si `h.height === clon.height`.
- `dibujarLineasHijos` (los brackets/líneas de esas medidas): aplicar la misma condición para
  no dibujar la línea de la dimensión omitida.

Los hijos con medida distinta a la del padre se siguen midiendo normalmente.

## 4. Redondear a máximo 2 decimales (en todos los valores)

`src/plugin/utils/espaciado.ts`. `formatearEspaciado` hoy devuelve el número crudo
(`String(n)` o `n/16` para rem), lo que produce `485.3333435058594`. Se redondea a 2
decimales sin ceros sobrantes mediante un helper puro `redondear2(n) = Math.round(n*100)/100`.
Aplica a px y rem, y por lo tanto a cotas y panel (todos pasan por `formatearEspaciado`).

## 5. Unidad `px` solo en el panel/cards

`formatearEspaciado(n, unidad)` se extiende con un parámetro opcional para mostrar la unidad:
`formatearEspaciado(n, unidad, mostrarUnidad = false)`:
- `rem`: siempre `"{n/16}rem"` (sin cambios).
- `px`: `mostrarUnidad ? "{n}px" : "{n}"`.

Consumidores:
- **Cotas** (artwork) → `etiquetaSpacing` → `formatearEspaciado(px, u)` (sin unidad, bare). Sin cambios de llamada.
- **Panel/cards** → pasan `mostrarUnidad = true`:
  - `valorDim`, `valorSpacing`, `textoDimension` en `src/plugin/utils/marcadores-layout.ts`.
  - `dimensionAtributo` en `src/plugin/utils/atributos.ts` (rawValue/valor de width/height en las cards de Anatomy).

(El redondeo del punto 4 ya está dentro de `formatearEspaciado`, así que cotas y panel quedan
redondeados; solo el panel lleva `px`.)

## 6. Padding no uniforme: un `chipVar` por lado

`src/plugin/generadores/layout.ts` (`exhibit`). Hoy:
```ts
const partesPadding: ParteValor[] = padUniforme
  ? valorSpacing(p.left, u, sv.paddingLeft)
  : [{ texto: textoPadding(p, u, sv) }];
```
La rama no uniforme concatena los 4 lados como texto plano. Se cambia para producir, por cada
lado (top, right, bottom, left), las partes de `valorSpacing(valor, u, varDelLado)` —es decir
un `chipVar` (cuando hay variable) + `(valor)`, o solo texto si es hardcoded—, en ese orden:

```ts
const partesPadding: ParteValor[] = padUniforme
  ? valorSpacing(p.left, u, sv.paddingLeft)
  : [
      ...valorSpacing(p.top, u, sv.paddingTop),
      ...valorSpacing(p.right, u, sv.paddingRight),
      ...valorSpacing(p.bottom, u, sv.paddingBottom),
      ...valorSpacing(p.left, u, sv.paddingLeft),
    ];
```
Así cada padding con variable aparece como su propio `chipVar` (con el prefijo ya limpio por
el punto 2 y la unidad `px` por el punto 5). `textoPadding` puede quedar sin uso; si es así se
elimina.

## 7. Barrido de consistencia

Los puntos 2 (prefijo), 4 (redondeo) y 5 (px) se aplican vía las funciones compartidas
(`nombreVariable`/`limpiarPrefijoColeccion`, `formatearEspaciado`), por lo que afectan
uniformemente width, height, padding, gap, corner, item-spacing, cotas y cards. No hace falta
tocar cada call site por separado salvo el de padding (punto 6).

---

## Alcance / no incluye

- No cambian colores ni estructura de página (ya cerrados en iteraciones previas).
- No se tocan badges/marcadores.

## Testing

- **Puros / con test**: `limpiarPrefijoColeccion` (punto 2), `redondear2` + `formatearEspaciado`
  con y sin unidad (puntos 4 y 5), `valorDim`/`valorSpacing` con `px` (punto 5), y la armada de
  partes de padding no uniforme si se extrae a helper puro (punto 6).
- **Impuros (PDF)**: renombre `title` (1), omisión de cota hijo=padre (3), padding en el exhibit (6).
- Cada tarea: `npm run build && npm test` sin errores ni regresiones; los tests de
  `espaciado.test.ts` se actualizan al nuevo formato (redondeo + unidad).
- Verificación final por PDF: variables sin `N.`, medidas redondeadas, `px` en el panel y no en
  cotas, padding como chips, sin la medida 296 repetida.
