# Diseño — Líneas de cota para padding/gap + carriles externos sin overlap

**Fecha:** 2026-06-17
**Proyecto:** Specs Plugin para Figma — documentación de specs para handoff.
**Alcance:** Sobre el output de **Layout and Spacing** (PR #58), dos correcciones del
feedback (`specs plugin-layout-8.pdf` + imagen del `tag`):
- **A:** las cotas de padding/gap **no tienen línea de medida**; agregar una línea
  con topes (estilo W/H) sobre cada banda, en su color semántico.
- **B:** **siguen los overlaps** en elementos chicos (los badges de padding/gap,
  W/H y de hijos se pisan). Mover los badges a **carriles externos apilados** fuera
  del área del elemento, conectados a su banda por la línea de cota.

Referencias: `specs plugin-layout-8.pdf`, imagen del `tag`, y `comparacion.pdf`
("MI VERSIÓN" del usuario).

---

## Estado actual

`generadores/layout.ts`:
- W/H: `dibujarCotas` dibuja línea con topes (`svgCotaH/svgCotaV`, color rojo
  `AZUL_HEX`) + badge `cota`.
- Padding/gap: `dibujarMarcas` dibuja **solo el badge** (`cota`/`cotaConNombre`) en
  el borde del lado (top/bottom/left/right), más la `bandaPunteada` de fondo.
  **No hay línea de medida.** Los paddings horizontales se reubican abajo.
- Hijos (toggle Element measures): `dibujarCotaHijo` dibuja líneas W/H + badges por
  cada hijo, cerca de sus bordes.

**Problema:** en un elemento chico (`tag`), badges de padding/gap + W/H + hijos
caen todos pegados al elemento y se superponen; y los de padding/gap no tienen
línea, así que no se entiende qué miden.

## Decisiones (brainstorming)

- Cada padding/gap dibuja una **línea con topes** sobre su banda, en color semántico
  (padding azul, gap rosa).
- Los badges van a **carriles externos** (nunca sobre el elemento), apilados en
  filas (arriba/abajo) o columnas (izquierda/derecha), con anti-colisión por carril.

## Sección A — Líneas de cota de padding/gap

`svgCotaH`/`svgCotaV` hoy fijan el color en `AZUL_HEX`. Se parametriza el color
(nuevo argumento, o variantes) para poder dibujar líneas azules (padding) y rosas
(gap). Cada medida dibuja su línea **sobre la banda** que mide:
- **padding top/bottom:** línea vertical de largo = padding, en el centro-x, sobre
  la franja superior/inferior.
- **padding left/right:** línea horizontal de largo = padding, en el centro-y, sobre
  la franja izquierda/derecha.
- **gap (HORIZONTAL):** línea horizontal de largo = gap.width, sobre el hueco.
- **gap (VERTICAL):** línea vertical de largo = gap.height, sobre el hueco.

Las líneas usan topes simples (estilo `fixed`). La `bandaPunteada` de fondo se
mantiene.

## Sección B — Carriles externos para los badges

Los badges salen del rectángulo del elemento a carriles fuera del clon:
- **Carril superior** (sobre `clon.y`): badges de **padding-top** y **gaps
  horizontales**, en una fila; el badge de **W (width)** en la fila más externa.
- **Carril inferior** (bajo `clon.y + alto`): badges de **padding-bottom**,
  **padding-left**, **padding-right** (los horizontales ya iban abajo) y **gaps
  verticales que no entren a la izquierda**, en una fila.
- **Carril izquierdo** (a la izquierda de `clon.x`): badge de **H (height)** en la
  columna más externa; **gaps verticales** en una columna interior.
- Dentro de cada carril, `separarColisiones` evita que los badges se pisen entre sí
  (eje X en carriles horizontales, eje Y en los verticales). Entre carriles, cada
  uno está en su propia franja de `y` (o `x`) → no se cruzan.

Cada badge se ubica en su carril **alineado** con el centro de su banda (mismo x
para arriba/abajo, mismo y para izquierda/derecha), de modo que la línea de cota
sobre la banda y el badge queden visualmente conectados. El artwork se agranda lo
necesario (alto extra para las filas arriba/abajo; ancho izquierdo `MARGEN_IZQ`).

Las cotas de **hijos** (Element measures) siguen con su línea propia; al estar los
badges de padding/gap/W/H en carriles externos, dejan de chocar con las de los
hijos.

## Sección C — Testing y verificación

- **Pura:** si se extrae el cálculo de los carriles (asignación de fila/columna +
  offset) a un helper puro, se testea (asignación correcta por lado, sin overlap de
  rangos). La generación de nodos sigue siendo impura.
- **Manual (PDF):** cada padding/gap tiene su línea con topes sobre la banda; los
  badges quedan fuera del elemento, sin superponerse; W arriba, H a la izquierda,
  paddings horizontales abajo; legible en `screen`/`card`/`tag`.

## Fuera de alcance

- Rediseñar el panel de propiedades (exhibit).
- Cambiar el componente `cota`/`cotaConNombre` (ya definido).
- Líneas conectoras explícitas (leader lines) entre badge y banda: alcanza con la
  alineación; se evalúa si hace falta tras ver el PDF.
