# Diseño — Rediseño visual de Anatomy (estilo DesignDoc/EightShapes)

**Fecha:** 2026-06-18
**Proyecto:** Specs Plugin para Figma — handoff.
**Alcance:** Rediseñar la sección **Anatomy** para acercarla a DesignDoc/EightShapes:
marcar pocas capas (configurable), con badge numerado en la esquina + borde
punteado del color del badge, y un panel a la derecha con número + ícono de tipo +
atributos. Referencias: `eightshapes.Specs.pdf`, `designdoc spec.pdf`, `tu version.pdf`.

---

## Estado actual

`seccionDeAnatomy`: Display horizontal `[lista | artwork]`. La lista numera TODAS
las capas (1..N) con sus atributos. El artwork es el clon + marcadores numerados
(círculos azules) **mal ubicados**: se reparten dividiendo el alto del clon en
partes iguales (`y = i * altura`), no caen sobre la capa real. `ElementoAnatomy` no
tiene la caja (x/y/w/h) de la capa.

## Decisiones (brainstorming, confirmadas)

- **Profundidad = setting** con 3 opciones: `self` (solo el seleccionado), `children`
  (seleccionado + hijos directos, **default**), `all` (todas, como hoy).
- **Marcadores:** badge numerado (círculo) en la **esquina superior izquierda** de
  cada capa marcada, + **borde punteado** alrededor de esa capa, del **mismo color**
  que el badge. Color por marcador (paleta que cicla, para distinguirlos).
- **Panel (derecha):** por cada capa marcada → `(N) [ícono de tipo] nombre` + sus
  atributos (width, colores con swatch, variant properties como filas
  `Type: …`, typography). Íconos UI3 por tipo de nodo.
- **Layout:** artwork a la **izquierda**, panel a la **derecha** (como las referencias).

## Sección 1 — Profundidad configurable

`MensajeUI`: `anatomyDepth?: "self" | "children" | "all"`. UI: un `<select>` nuevo
"Anatomy depth" en el grupo Formato (Self / Direct children / All). `main` lo pasa
a la generación de Anatomy.

La traversal de Anatomy limita por **profundidad de árbol**: `extraerAnatomy(raiz,
itemizar, profundidadMax)` donde `self`→0 (solo raíz), `children`→1, `all`→Infinity.
(Se agrega un límite de profundidad de árbol al recorrido, distinto de la
`profundidad` de instancias atravesadas que ya existe.)

## Sección 2 — Cajas de las capas (impuro)

El generador clona `seleccionado`; para ubicar los badges/bordes necesita la caja de
cada capa marcada **relativa al clon**. Como los ids del clon cambian, se computa un
mapa `id → { x, y, width, height }` recorriendo el **árbol original** (`seleccionado`):
`box = absoluteBoundingBox(nodo) − absoluteBoundingBox(seleccionado)`. Cada
`ElementoAnatomy` (que ya tiene `id`) busca su caja en el mapa.

## Sección 3 — Marcadores (badge esquina + borde punteado)

Por cada capa marcada (con caja):
- **Badge:** círculo (TAM ~16) con el número, relleno del color del marcador, texto
  blanco; ubicado en la esquina sup-izq de la caja (apenas afuera, ej. `x-8, y-8`).
- **Borde punteado:** rectángulo sin relleno, `dashPattern`, stroke del color del
  marcador, sobre la caja de la capa.
- **Color:** paleta que cicla por índice (p. ej. azul, rosa, violeta, naranja, verde),
  para distinguir marcadores; badge y borde comparten el color.

El clon va en `(0,0)` dentro del artwork; el artwork no recorta (`clipsContent=false`)
para que los badges asomen.

## Sección 4 — Panel de la derecha

Por cada capa marcada, una entrada en el panel (`frameVertical`):
- Header: `[badge número] [ícono de tipo UI3] nombre · TIPO` (el badge mismo color que
  en el artwork).
- Atributos debajo: `width: …`; colores con swatch (como hoy `filaAtributo`); si es
  instancia con variantes, las **variant properties** parseadas de `dependeDe`
  (`Type=… , Orientation=…`) como filas `Type: …`; `typography: …`.

Íconos de tipo (UI3): FRAME→`al.layout-...`/un frame, INSTANCE/COMPONENT→`grid`/
diamante, TEXT→`prop-text`/`shape.text.small`, VECTOR→pluma, etc. (mapa
`iconoTipo(tipo)`; los que no matcheen, sin ícono).

`tabla` (toggle "Tabular anatomy"): se mantiene la vista de tabla como alternativa;
el rediseño de marcadores aplica igual. (El panel nuevo es la vista por defecto.)

## Sección 5 — Testing y verificación

- **Pura:** límite de profundidad en la traversal (`self`/`children`/`all` → cantidad
  de elementos correcta); parseo de variant props de `dependeDe`.
- **Impura (manual, PDF):** badges en la esquina de cada capa real + borde punteado
  del mismo color; panel a la derecha con ícono de tipo + atributos; el setting de
  profundidad cambia cuántas capas se marcan.

## Fuera de alcance

- Leaders/líneas guía a la posición (se eligió badge en esquina).
- Reescribir la tabla tabular (queda como está).
- Cambiar otras secciones.
