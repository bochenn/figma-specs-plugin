# Diseño — Medidas por elemento hijo (DesignDoc 3/3 · C3)

**Fecha:** 2026-06-16
**Proyecto:** Specs Plugin para Figma — plugin de documentación de specs para handoff.
**Alcance:** Última pieza del rediseño DesignDoc. Un toggle nuevo **"Element measures"** que, sobre el
artwork de Layout, dibuja una cota de ancho y otra de alto (línea + número) por cada **hijo directo**
del contenedor, como hace DesignDoc en detalle.

---

## Contexto

`artworkDe` (`generadores/layout.ts`) ya calcula `hijosRects` (rect de cada hijo directo, con offset
MARGEN) para pintarlos en azul. C3 reusa esos rects para cotar cada hijo. Detrás de un toggle porque
con muchos hijos (ej. un grid de 12 celdas) saturaría; por defecto OFF.

No hay lógica pura nueva (los anchos/altos ya están en `hijosRects`); es dibujo, se verifica a mano
como los demás marcadores.

## Sección 1 — UI y mensaje

- `src/ui/index.html`: checkbox `Element measures` (sin marcar) en la sección Opciones.
- `src/ui/ui.ts`: leerlo → `medirHijos` en el `pluginMessage`.
- `modelo/tipos.ts`: `medirHijos?: boolean` en `MensajeUI`.
- `main.ts`: `generarSeccionLayout(nodo, columnas, hideOuter, itemizar, medirHijos)` lo pasa a
  `generarLayout`; el dispatch usa `msg.medirHijos ?? false`.

## Sección 2 — Dibujo (`generadores/layout.ts`)

`generarLayout` y `artworkDe` ganan `medirHijos: boolean`. En `artworkDe`, con `medirHijos` activo,
por cada `hijoRect` se dibuja con `dibujarCotaHijo(artwork, hijoRect)`:
- **Ancho**: `svgCotaH("fixed", hijo.width)` posicionado arriba del hijo (`x = hijo.x`,
  `y = hijo.y - 14`), con el número (`etiquetaSpacing(hijo.width, unidad)`) centrado encima.
- **Alto**: `svgCotaV("fixed", hijo.height)` a la izquierda del hijo (`x = hijo.x - 14`,
  `y = hijo.y`), con el número a la izquierda.

Reusa `svgCotaH/svgCotaV` y `textoCota` existentes. Se dibuja en los tres caminos (H/V y GRID), tras
pintar los hijos azules y antes de las anotaciones del contenedor, para los hijos directos.

## Sección 3 — Verificación

`npm run build && node --test` verdes (sin tests nuevos). Manual:
- `Element measures` OFF → como hoy (sin medidas por hijo).
- ON → cada hijo directo muestra su cota de ancho (arriba) y alto (izquierda) con el número.
- Combinar con Units = rem. Comparar contra `designdoc.pdf`.

## Fuera de alcance

- Medidas de capas más profundas (solo hijos directos; lo profundo es Itemize instances).
- `gridRowSpan`/`gridColumnSpan`.
