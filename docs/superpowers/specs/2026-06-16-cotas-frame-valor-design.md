# Diseño — Valor en las cotas del frame (DesignDoc 3/3 · C1)

**Fecha:** 2026-06-16
**Proyecto:** Specs Plugin para Figma — plugin de documentación de specs para handoff.
**Alcance:** Primera de tres sub-rebanadas de C (marcadores de medidas). Agregar el **valor numérico**
(ancho/alto del contenedor, con unidad y variable) a las cotas azules de width/height que ya se
dibujan sobre el artwork, como DesignDoc (`800`, `120`). Y que esas cotas se dibujen también para
contenedores con Grid auto-layout.

---

## Contexto

`artworkDe` (`generadores/layout.ts`) ya dibuja dos cotas azules: horizontal arriba (`svgCotaH`,
puntas según `resizingHorizontal`) y vertical a la izquierda (`svgCotaV`, según `resizingVertical`).
Hoy van **sin número**. DesignDoc les pone el valor de la medida. Además, el branch GRID de
`artworkDe` retorna antes de dibujar las cotas, así que un frame Grid no las muestra.

No hay lógica pura nueva: el texto de la medida es `etiquetaSpacing(width, unidad, widthVar)` (ya
testeado). Esta rebanada es de presentación; se verifica a mano (como los marcadores de la
Rebanada 9/28).

---

## Sección 1 — Dibujo (`generadores/layout.ts`)

Helper local `textoCota(valor): Promise<TextNode>` — texto chico (10px) en azul (`AZUL_HEX`),
agregado al artwork; el caller lo posiciona.

En `artworkDe`, donde hoy se crean `cotaH`/`cotaV`:
- **cotaH** (horizontal, arriba): además de la línea, un texto con
  `etiquetaSpacing(clon.width, unidad, spec.widthVar)` centrado horizontalmente sobre la cota
  (`x = MARGEN + clon.width/2 - t.width/2`), apenas encima de la línea.
- **cotaV** (vertical, izquierda): un texto con `etiquetaSpacing(clon.height, unidad, spec.heightVar)`
  a la izquierda de la cota (`x = MARGEN - 44 - t.width - 2`), centrado verticalmente
  (`y = MARGEN + clon.height/2 - t.height/2`).

El valor usa `spec.width`/`spec.height` para el número y `spec.widthVar`/`spec.heightVar` para el
nombre de variable si la dimensión está atada a una variable (ej. `sizing/card-width (240)`).

## Sección 2 — Cotas también en GRID

Mover el dibujo de las cotas W/H (con su número) a **antes** del `return artwork` del branch GRID,
de modo que apliquen a todos los contenedores (H/V y GRID). Lo que queda solo para H/V: gaps
naranjas, marcas numéricas de padding/spacing, y el ícono de dirección (esos asumen un eje). Las
cotas de resizing usan `estiloCota(resizing…)`, válido también para GRID.

## Sección 3 — Verificación

`npm run build && node --test` verdes (sin tests nuevos: no hay lógica pura nueva). Manual:
- Frame H/V con width fijo (ej. 240) → cota superior muestra `240` (o `sizing/card-width (240)` si
  está atado a variable); cota izquierda muestra el alto.
- Frame Grid (`screen`, 800×120) → ahora muestra las cotas con `800` arriba y `120` a la izquierda.
- Con Units = rem, los valores en rem. Comparar contra `designdoc.pdf`.

## Fuera de alcance (C2, C3)

- Overlay de columnas/filas del grid (C2).
- Medidas (cotas) por cada hijo (C3).
