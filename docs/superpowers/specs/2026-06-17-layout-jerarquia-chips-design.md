# Diseño — Layout estilo DesignDoc: columna de jerarquía + chips sin superposición

**Fecha:** 2026-06-17
**Proyecto:** Specs Plugin para Figma — documentación de specs para handoff.
**Alcance:** Acercar el output de **Layout and Spacing** al de DesignDoc/Spectral en dos frentes:
- **#3 (nuevo):** una columna a la izquierda de cada fila con el **camino de ancestros** (breadcrumb) donde está el elemento, con el elemento actual resaltado.
- **#2 (regresión):** chips que vuelven a **superponerse** y que el **clipping** de frames corta.

Referencia visual del usuario: `Spectral-2.pdf` (tres columnas por fila: jerarquía | artwork | panel).

---

## Estado actual

`generadores/layout.ts` arma, por cada contenedor con Auto Layout, una fila
`frameHorizontal` con `[artwork] | [exhibit]`. El artwork (`artworkDe`) clona el
contenedor corrido `(MARGEN, MARGEN)`, dibuja overlays (hijos, padding, gaps,
grid), cotas de W/H (`dibujarCotas`) y chips de padding/gap en los 4 lados
(`dibujarMarcas`, que posiciona cada `Marca` según su `lado`). `MARGEN = 96`.
Las filas tienen `clipsContent = false`, pero los chips de la izquierda pueden
quedar con `x` negativa respecto del artwork y los cota/padding cercanos a una
esquina se pisan (visto en `specs plugin-layout-6.pdf`).

`traversal/recorrer-autolayout.ts`: `recorrerAutoLayout(nodo, itemizar)` devuelve
`{ nodo, profundidad }[]` (el tipo `Recorrido` viene de `recorrer.ts`).

## Decisiones (brainstorming)

- **Jerarquía:** breadcrumb del **camino de ancestros** (raíz → elemento), el
  actual en negrita y los anteriores en gris. (No el árbol completo en cada fila.)
- **Chips:** se **mantienen en los 4 lados**; se corrige con **anti-colisión**
  (desplazar los que se solapan) y evitando el **corte** (margen/clipping).

## Sección 1 — Camino de ancestros (dato)

`recorrerAutoLayout` acumula los nombres mientras recurre. Cada resultado suma
`camino: string[]` = nombres desde la raíz hasta el nodo inclusive (incluye los
contenedores/instancias atravesados, que es la "estructura de layers" donde está
el elemento). Se agrega `camino?: string[]` opcional al tipo `Recorrido` (no
rompe los usos de Anatomy, que lo ignoran). Lógica pura → test en
`tests/recorrer-autolayout.test.ts`.

Ejemplo: con `screen > card > tag`, la fila de `tag` trae `camino = ["screen",
"card", "tag"]`; la de `screen`, `["screen"]`.

## Sección 2 — Render del breadcrumb

Helper `breadcrumb(camino: string[]): Promise<FrameNode>` en `layout.ts`:
`frameVertical` con un `texto(nombre, 12)` por nivel, indentado por su índice
(p. ej. `"  ".repeat(i)` o sangría con padding). El último ítem (índice
`length-1`, el elemento de esa fila) en color de texto normal/oscuro; los
anteriores en gris (`{ r: 0.6, g: 0.6, b: 0.6 }`). Ancho fijo de la columna
(p. ej. 160) para alinear los artworks entre filas.

Cada fila pasa a `frameHorizontal` con tres hijos en orden:
`[breadcrumb(camino)] | [artworkDe(...)] | [exhibit(...)]`. La fila del frame
raíz con layout grids (sin Auto Layout, rama `artworkGrids`/`exhibitGrids`) usa
`breadcrumb([seleccionado.name])` (un solo ítem, en negrita).

## Sección 3 — Chips sin superposición ni corte

En `artworkDe` / `dibujarMarcas`:

1. **Anti-colisión por lado.** Tras crear y **medir** los chips de un mismo lado,
   se ordenan a lo largo de su eje (top/bottom por `x`, left/right por `y`) y, si
   dos se solapan, se desplaza el segundo hasta dejar una separación mínima
   (`SEP = 4`). Como el ancho/alto del chip solo se conoce tras renderizar el
   texto, este ajuste es **impuro** (en el generador, no en módulo puro).

2. **Sin corte.** Se garantiza que ningún chip quede con `x`/`y` negativa
   respecto del artwork: los chips de la izquierda se anclan contra el borde del
   clon y el **margen izquierdo del artwork** se agranda al ancho del chip más
   ancho de ese lado si hiciera falta (el clon y los overlays se corren en
   consecuencia). Además se pone `clipsContent = false` en los frames intermedios
   que hoy pueden cortar (la sección "Layout and Spacing" y el contenedor de
   `enColumnas`), no solo en la fila.

El color semántico de los chips (padding azul / gap rosa / dimensión rojo) y las
cotas no cambian.

## Sección 4 — Testing y verificación

- **Pura:** test del campo `camino` de `recorrerAutoLayout` (raíz sola; con
  hijos anidados; con `itemizar` entrando a instancias).
- **Impura (manual en Figma, PDF):** breadcrumb correcto por fila (actual en
  negrita), chips sin superposición en elementos chicos (card/tag), ningún chip
  cortado por clipping, artworks alineados entre filas.

## Fuera de alcance

- Mostrar el árbol completo en cada fila (se eligió breadcrumb de ancestros).
- Reubicar los chips al estilo "apilados a la derecha" de DesignDoc (se mantienen
  los 4 lados).
- Cambios en el panel de propiedades (exhibit) o en otras secciones.
