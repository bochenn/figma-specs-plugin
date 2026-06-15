# Verificación manual en Figma — Rebanadas 34 a 37

**Fecha:** 2026-06-15
**Para qué sirve:** Las rebanadas 34–37 se mergearon sin verificación manual (por pedido de
continuar sin gates). Tocan partes impuras (API de variables, `createNodeFromSvg`, franjas de
grid), así que conviene recorrerlas una vez en Figma. Este checklist las junta para hacerlo de
una sola pasada.

**Build:** `npm run build` deja el plugin en `dist/`. En Figma: Plugins → Development →
importar el `manifest.json`. Marcá `[x]` lo verificado; si algo falla, anotá abajo y abrimos un PR
de seguimiento.

---

## Preparación (componente de prueba)

Conviene tener a mano un componente que ejercite todo. Ideal: un **frame de pantalla** con:
- Layout grid de **columnas** (ej. 12 columnas, gutter 20, offset 16) y **sin** Auto Layout en la raíz.
- Adentro, un **contenedor con Auto Layout** (padding e item-spacing atados a **variables** de una
  colección de tokens, ej. `DS Space/padding/1x`).
- Algún nodo con **width** (y opcionalmente **height**) atado a una variable (ej. `DS Sizing/…`).
- Fills/strokes atados a variables y/o styles para la parte de Anatomy.

---

## PR #34 — Hide outer layout annotations

- [ ] Componente con Auto Layout anidado → botón **Layout & Spacing** con `Hide outer layout` **OFF**
      → aparece la fila del contenedor raíz + las de los anidados.
- [ ] Mismo componente con `Hide outer layout` **ON** → desaparece la fila del raíz, quedan solo los
      anidados.
- [ ] Frame cuya única capa con Auto Layout es la raíz + `Hide outer layout` ON → mensaje
      "No se detectaron capas con Auto Layout."
- [ ] El toggle no afecta a las demás secciones (Anatomy, Properties, etc.).

## PR #35 — Overlays de layout grids

- [ ] Frame con grilla de **columnas** y **sin** Auto Layout → Layout & Spacing muestra una **fila
      propia** al inicio: artwork con franjas rojas verticales + exhibit con `Grid: Columns ×… · …`.
- [ ] Contenedor **con** Auto Layout que además tiene un grid → franjas rojas sobre su artwork y
      línea `Grid:` en su exhibit (además de los overlays de padding/spacing).
- [ ] Grilla de **filas** (ROWS) → franjas horizontales. Grid uniforme (GRID) → líneas de 1px en
      ambos ejes.
- [ ] Grid con count **Auto** → se dibujan las franjas que entran en el frame (sin desbordar).
- [ ] `Hide outer layout` ON + raíz con grid → la fila propia del raíz también se oculta.
- [ ] Las franjas rojas se leen bien en **Dark mode** (toggle Dark ON).

## PR #36 — Variables de spacing resueltas

- [ ] Contenedor con **padding** atado a variables → el exhibit muestra `Padding: L<nombre> (16) …`
      (nombre de la variable + valor entre paréntesis) en los lados que tengan variable.
- [ ] **Item spacing** atado a variable → `Item spacing: DS Space/item-spacing/0_5x (8)`.
- [ ] Padding/spacing **sin** variable → solo el número (como antes).
- [ ] Con `Units = rem` → el valor entre paréntesis sale en rem (ej. `(1rem)`).

## PR #37 — Variables de width/height resueltas

- [ ] Nodo con **width** atado a variable → en Anatomy: `width: DS Sizing/… (343)`.
- [ ] Nodo con **width sin** variable → `width: 343` (HARDCODED, como antes).
- [ ] Nodo con **height** atado a variable → aparece `height: <nombre> (48)`.
- [ ] Nodo **sin** variable de height → **no** aparece la línea de height (asimetría intencional).
- [ ] Con `Units = rem` → el valor resuelto de width/height en rem.

## Regresión rápida (que nada se haya roto)

- [ ] Dark mode (toggle ON) re-tematiza el output; cambiar el modo de la colección "Specs" en el
      panel de Figma re-tematiza en vivo.
- [ ] `Columns = 2` reparte en columnas en Properties, Layout, Modes, Two-Way y Complete A/L.
- [ ] Anatomy con `Spec nested` ON documenta los subcomponentes; Properties también.

---

## Hallazgos

(Anotar acá lo que falle, con sección + qué se esperaba vs. qué pasó. Sirve para el PR de fix.)

-
