# Verificación manual en Figma — checklist maestro

**Fecha:** 2026-06-15
**Por qué re-testear todo:** el rediseño de la UI (#39) reescribió `src/ui/index.html`. Se
conservaron los 20 IDs y el tag de script, así que la lógica (`ui.ts`/`main.ts`) no cambió y los
258 tests automáticos siguen verdes — pero **el cableado UI → generación hay que confirmarlo a
mano**, junto con las verificaciones funcionales que quedaron pendientes de #34–#37.

Este checklist reemplaza al acotado de `verificacion-manual-34-37.md`.

**Cómo:** `npm run build` → en Figma: Plugins → Development → importar `manifest.json`. Marcá
`[x]` lo que pase; anotá fallas en **Hallazgos** para un PR de fix.

---

## 0. Preparación (componente de prueba)

Un frame que ejercite todo:
- Frame de pantalla con **layout grid de columnas** (ej. 12 cols, gutter 20, offset 16), **sin**
  Auto Layout en la raíz.
- Adentro, un **contenedor con Auto Layout** con padding e item-spacing atados a **variables**
  (ej. `DS Space/padding/1x`).
- Un componente con **variantes** (para Properties / Two-Way / Complete) que contenga una
  **instancia anidada** de otro componente con variantes (para Spec nested).
- Nodos con **width/height** atados a variables, y fills/strokes con variables y/o styles.
- Texto con **line-height y letter-spacing** definidos.

---

## 1. UI nueva (#39) — visual

- [ ] La ventana muestra tres secciones con título: **Opciones**, **Formato**, **Generar spec**.
- [ ] Opciones: los 5 toggles en lista vertical, uno por renglón (sin texto encadenado).
- [ ] Formato: 6 filas `label → control`, con el select alineado a la derecha.
- [ ] Generar spec: 8 botones en grilla 2×4, con hover.
- [ ] Tema de Figma en **claro** → UI clara legible.
- [ ] Tema de Figma en **oscuro** → la UI se adapta (fondo/texto oscuros), sin texto ilegible.

## 2. Cableado UI → generación (crítico tras el rediseño)

Confirmar que cada control sigue afectando el output (cambió el HTML, no la lógica):

- [ ] **Los 8 botones** generan su sección: Anatomy, Properties, Layout & Spacing, Data (JSON),
      Styling Inventory, Modes, Two-Way, Complete A/L.
- [ ] Toggle **Spec nested subcomponents** → Anatomy y Properties documentan los subcomponentes.
- [ ] Toggle **Dark mode** → el spec generado sale en modo oscuro.
- [ ] Toggle **Tabular anatomy** → Anatomy sale como tabla.
- [ ] Toggle **Hide outer layout** → Layout omite la fila del contenedor raíz.
- [ ] Toggle **Show raw value** → con OFF desaparece el valor `(…)` junto a variables/styles.
- [ ] Selector **Columns** (1–4) → reparte en columnas (Properties, Layout, Modes, Two-Way, Complete).
- [ ] Selector **Color** (HEX/RGB/HSL) → cambia el formato de los colores hardcodeados.
- [ ] Selector **Units** (px/rem) → cambia width, padding, spacing y typography.
- [ ] Selector **Type** (Plain/CSS) → cambia el formato de typography.
- [ ] Selector **Raw value** (HEX/RGB/HSL) → cambia el valor resuelto junto a variables/styles.
- [ ] Selector **Preferred** (Variable/Style) → cuando un color tiene ambos, gana el elegido.

## 3. Funcional por feature (pendientes acumulados)

### Layout — Hide outer (#34)
- [ ] Anidado + `Hide outer layout` OFF → aparece la fila del raíz; ON → desaparece.
- [ ] Raíz único con Auto Layout + ON → mensaje "No se detectaron capas con Auto Layout."

### Layout — Overlays de grids (#35)
- [ ] Frame con grilla de columnas sin Auto Layout → fila propia con franjas rojas verticales +
      `Grid: Columns ×… · …` en el exhibit.
- [ ] Contenedor con Auto Layout + grid → franjas sobre su artwork y línea `Grid:`.
- [ ] ROWS → franjas horizontales; GRID → líneas de 1px en ambos ejes; count Auto → llena lo que entra.
- [ ] `Hide outer layout` ON oculta también la fila del raíz con grid.
- [ ] Franjas legibles con Dark mode ON.

### Layout — Variables de spacing (#36)
- [ ] Padding atado a variable → `Padding: L<nombre> (16) …`; sin variable → solo el número.
- [ ] Item spacing atado a variable → `Item spacing: DS Space/… (8)`.
- [ ] Con Units = rem → el valor entre paréntesis en rem.

### Anatomy — Variables de width/height (#37)
- [ ] width atado a variable → `width: DS Sizing/… (343)`; sin variable → `width: 343`.
- [ ] height atado a variable → aparece `height: <nombre> (48)`; sin variable → no aparece.
- [ ] Con Units = rem → valor resuelto en rem.

### Dark mode por variables (#33)
- [ ] Generar → cambiar el modo de la colección "Specs" en el panel de Figma re-tematiza en vivo.
- [ ] Toggle Dark ON con página en Light → el spec sale Dark (modo explícito).
- [ ] Modo Dark en un solo artwork → solo ese fondo cambia.
- [ ] Regenerar varias veces → una sola colección "Specs", sin variables duplicadas.

### Custom Value Formats (#29)
- [ ] Color con variable y style a la vez → `Preferred` alterna cuál se muestra.
- [ ] `Show raw value` OFF → nombre sin `(…)`.

### Marcadores de Layout (#28)
- [ ] Números de padding (verde) y spacing (naranja) con sus ticks; cotas de resizing
      (Fixed=topes, Fill=flechas afuera, Hug=flechas adentro); ícono → / ↓ (grilla si hay wrap).

---

## Hallazgos

(Sección + esperado vs. observado. Sirve para el PR de fix.)

-
