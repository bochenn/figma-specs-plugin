# Fixes del output (feedback Specifications-30) — Diseño

**Fecha:** 2026-06-22
**Referencias:** `Specifications-30.pdf`, `instrucciones-gap.pdf`, Image #20.

## Objetivo

1. Marcadores de Anatomy: distribuir por lados (no superponer) con líneas rectas cortas.
2. Cota de gap pegada al gap (no en el carril del borde).
3. Textos de marcadores y cotas en weight **medium**.
4. (anotado: cuidar la lógica, sin errores).
5. Párrafo explicativo por sección, debajo del tag.

---

## 1. Marcadores con distribución por lados y líneas cortas

`src/plugin/generadores/anatomy.ts`, `seccionDeAnatomy`. El riel superior con líneas
verticales largas superpone los marcadores cuando dos boxes coinciden (badge + su texto) y las
líneas quedan muy largas.

Nuevo modelo — cada marcador se ubica **justo afuera de su box** con una línea **recta corta**:
- **Lado por defecto: izquierda** → marcador a `OFFSET` a la izquierda del borde izquierdo del
  box, a la altura del centro vertical del box; línea **horizontal** corta del marcador al borde.
- **Si su rect colisiona** con un marcador ya ubicado → **lado superior** → marcador arriba del
  borde superior, en el centro horizontal del box; línea **vertical** corta.
- `OFFSET` ≈ 48 (constante tuneable). Se necesitan dos helpers de línea: `lineaGuiaV`
  (vertical, ya existe) y `lineaGuiaH` (horizontal, nuevo).
- El canvas reserva margen (`MARGEN_MARCA = OFFSET + TAM_MARCADOR`) a izquierda y arriba para
  que los marcadores justo-afuera entren; el clon sigue centrado.
- Detección de colisión: se llevan los rects de los marcadores ya ubicados; un marcador colisiona
  si su rect se solapa (con un pequeño margen) con alguno ya puesto.

Resultado esperado (caso del feedback): marcador 1 a la izquierda (línea horizontal azul),
marcador 2 arriba (línea vertical magenta); hijos apilados → todos a la izquierda en distinto Y
sin colisión.

## 2. Cota de gap pegada al gap

`src/plugin/generadores/layout.ts`, `dibujarSpacingCallouts`. Hoy el gap se mide en el carril
del borde del elemento (abajo para dirección horizontal, derecha para vertical), lejos del gap.
Se cambia para medir el gap **en su lugar**:
- Dirección **HORIZONTAL** (gaps = franjas verticales entre ítems): bracket horizontal del ancho
  del gap, ubicado **arriba del gap** (sobre el borde superior de los ítems, en `g.x`), con el
  chip **encima** del bracket.
- Dirección **VERTICAL** (gaps = franjas horizontales): bracket vertical del alto del gap,
  ubicado **a la derecha del gap** (en `g.y`), con el chip **al lado**.
- Los callouts de **padding** se mantienen como están (brackets pegados al borde).

(El detalle de las coordenadas exactas se fija en el plan, reusando `svgCotaH`/`svgCotaV` y la
separación `SEP_VALOR`.)

## 3. Textos en weight medium

Se agrega `FONT_MEDIUM` (Inter Medium, con fallback a Inter Regular vía `cargarFont`) en
`src/plugin/generadores/frames.ts`. Se usa en:
- Los números de los marcadores (`marcador` / `badgePanel` en `anatomy.ts`).
- Los textos de las cotas (`cota` / `cotaConNombre` en `layout.ts`) y de los chips de spacing.

## 4. (sin cambios de código — directiva de cuidado)

## 5. Párrafo explicativo por sección

Debajo del tag de cada sección se agrega un párrafo descriptivo (gris `#6B7280`, ~14px, FILL al
ancho) que explica qué es la sección, qué muestra, para qué y cómo leerla.

- Helper compartido `parrafoSeccion(descripcion: string)` en `src/plugin/generadores/frames.ts`.
- En `seccionDeAnatomy` (anatomy.ts): debajo de `tagSeccion("Anatomy")`, el párrafo de Anatomy.
- En `seccionDeLayout` (layout.ts): debajo de `tagSeccion("Layout and Spacing")`, el párrafo de Layout.

Textos:
- **Anatomy:** "Desglosa el elemento en sus capas. Cada capa se numera sobre el diseño (a la
  izquierda) y se detalla a la derecha con su tipo y sus atributos —color, dimensiones,
  tipografía y las variables aplicadas—. Úsalo para entender de qué está compuesto el elemento
  y qué tokens del sistema usa cada parte."
- **Layout and Spacing:** "Muestra cómo se organiza el contenido: dirección, alineación,
  padding, espaciado entre ítems (gap) y dimensiones de cada frame con Auto Layout. Las cotas
  sobre el diseño marcan las medidas en su lugar; el panel de la derecha las detalla con sus
  variables. Úsalo para reproducir el espaciado y el comportamiento de redimensionado."

(Las demás secciones —Properties, Modes, Complete— no se convierten en este pase; se hará igual
cuando tengan su tag.)

---

## Alcance / no incluye

- No cambian colores de cotas/bands ni la estructura de página.
- El párrafo solo se agrega a Anatomy y Layout en este pase.

## Testing

- Todo impuro (toca `figma.*`) → verificación por PDF, sin tests nuevos. Si agregar
  `lineaGuiaH`/`FONT_MEDIUM`/`parrafoSeccion` deja algo sin uso, el build lo evidencia.
- Cada tarea: `npm run build && npm test` sin errores ni regresiones (214 tests).
- Verificación final por PDF: marcadores sin superposición (1 izq horizontal, 2 arriba vertical),
  líneas cortas; cota de gap pegada al gap; textos de marcadores/cotas en medium; párrafo bajo el
  tag de Anatomy y Layout.
