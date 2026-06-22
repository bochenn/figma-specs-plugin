# Fixes del output (feedback Specifications-28) — Diseño

**Fecha:** 2026-06-22
**Referencias:** `Specifications-28.pdf`, `instrucciones.pdf`, Images #12–#14.

## Objetivo

Cuatro mejoras al artwork/output:
1. Marcadores de Anatomy como callouts: fuera del elemento, con línea guía.
2. Título de Layout ("Layout and Spacing") reemplazado por un tag con borde.
3. Distancia constante (4px) entre el valor de la cota y su línea.
4. Ocultar las cotas de dimensión de los hijos en el artwork.

Decisiones confirmadas: (1) marcadores **siempre afuera** con línea (riel izquierdo);
(4) ocultar **todas** las medidas de hijos.

---

## 1. Marcadores de Anatomy como callouts (riel izquierdo)

`src/plugin/generadores/anatomy.ts`, en `seccionDeAnatomy`. Hoy cada marcador (círculo
numerado) se coloca en la esquina superior-izquierda de su box (`marcador(i+1, x-8, y-8)`),
lo que produce superposición cuando dos boxes comparten esquina.

Cambio:
- Se reserva un **riel** a la izquierda del clon (constante `RIEL = 80`). El canvas crece para
  alojarlo y el clon se ubica dejando ese riel libre a su izquierda (sigue centrado en el
  espacio restante / con el mínimo `ARTWORK_MIN`).
- El borde punteado de cada box (`bordeMarca`) se mantiene igual.
- Los marcadores se apilan en el riel (x fijo cerca del borde izquierdo del artwork), a la
  altura (Y) del anchor de su box (esquina superior-izquierda), **separados verticalmente para
  no superponerse** (mismo criterio que `separarColisiones`: gap mínimo `TAM_MARCADOR + 4`).
- Por cada marcador se dibuja una **línea guía** (del color del marcador) desde el borde
  derecho del marcador hasta el anchor del box. Se dibuja como un nodo SVG `<line>` recto.

Resultado: ningún badge encima del otro; cada uno con su línea a su box (estilo Image #13).
(El detalle visual exacto de la línea/posición se ajusta por PDF.)

## 2. Título de Layout → tag

`tagSeccion` hoy vive privada en `anatomy.ts`. Se **mueve a `src/plugin/generadores/frames.ts`**
(primitiva compartida) y se exporta; `anatomy.ts` la importa desde ahí. En
`src/plugin/generadores/layout.ts` (`seccionDeLayout`), se reemplaza
`seccion.appendChild(await texto("Layout and Spacing", 48))` por
`seccion.appendChild(await tagSeccion("Layout and Spacing"))`, y el gap de la sección pasa de
64 a 24 (igual que Anatomy).

## 3. Distancia constante valor–línea de cota (4px)

`src/plugin/generadores/layout.ts`. Hoy los chips de cota se ubican con offsets distintos
(ej. `+8` en `dibujarSpacingCallouts`). Se define una constante `SEP_VALOR = 4` y se usa de
forma uniforme para el gap entre el chip y su línea/bracket, tanto en orientación vertical
como horizontal, en `dibujarSpacingCallouts` y en `dibujarCotas` (cotas de W/H del elemento).

## 4. Ocultar las cotas de dimensión de los hijos

`src/plugin/generadores/layout.ts`. Se deja de dibujar las cotas de ancho/alto de los hijos en
el artwork:
- En `dibujarMarcas`, se elimina el loop que agrega las cotas de `hijos` (las del carril
  superior/izquierdo con `COTA_DIM`).
- `dibujarLineasHijos` (las líneas/brackets de esas medidas) deja de llamarse.
- Queda en el artwork: W/H del elemento (`dibujarCotas`) + padding/gaps (`dibujarSpacingCallouts`).

(Cada hijo auto-layout ya tiene su propia fila en la sección Layout, donde se mide.)

Nota: con esto, el parámetro `medirHijos` deja de afectar las cotas de dimensión. Se conserva
el overlay de hijos (`rectOverlay`) si aplica; solo se quitan sus cotas. Si quedan funciones
sin uso (ej. `dibujarLineasHijos`), se eliminan para no dejar dead-code.

---

## Alcance / no incluye

- No cambian colores ni la estructura de página.
- No se tocan las cards del panel (salvo nada).

## Testing

- Todo es impuro (toca `figma.*`) → verificación por PDF, sin tests unitarios nuevos. Si al
  mover `tagSeccion` o quitar `dibujarLineasHijos` queda algo sin uso, el build lo evidencia.
- Cada tarea: `npm run build && npm test` sin errores ni regresiones (214 tests).
- Verificación final por PDF: badges afuera con línea sin superposición; tag en Layout;
  distancia uniforme de 4px en las cotas; sin cotas de ancho/alto de hijos.
