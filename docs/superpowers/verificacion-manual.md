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

## 0. Preparación (qué armar en Figma, paso a paso)

Seguí estos 5 pasos en un archivo de Figma en blanco. Al terminar tenés 3 objetos seleccionables
(`Tag`, `Card`, `Screen`) que entre los tres ejercitan todo el checklist.

### Paso 1 — Crear las variables (colección "Tokens")

Panel derecho → pestaña con el ícono de variables (al lado de "Local styles") → **+** para crear
colección, nombrarla **`Tokens`**. Adentro, crear estas variables (botón **+** en el panel de la
colección; elegí el tipo a la izquierda de cada fila):

| Nombre | Tipo | Valor |
|---|---|---|
| `space/padding-1x` | Number | `16` |
| `space/gap-0_5x` | Number | `8` |
| `sizing/card-width` | Number | `240` |
| `sizing/card-height` | Number | `48` |
| `color/surface` | Color | `#FFFFFF` |
| `color/border` | Color | `#A6ACB0` |

> El nombre con `/` crea grupos (`space`, `sizing`, `color`); es a propósito, así el plugin muestra
> `space/padding-1x (16)`.

### Paso 2 — Crear un style de color (para probar "Preferred")

Local styles → **+** en Color styles → nombre **`Brand/Surface`**, color cualquiera (ej. `#EEEEEE`).

### Paso 3 — Componente `Tag` (el que se va a anidar)

1. Dibujá un frame chico, ponele **Auto Layout** (tecla `A`), nombralo **`Tag`**.
2. Adentro un texto "Label".
3. Seleccioná el frame `Tag` → click derecho → **Create component** (`⌥⌘K`).
4. Con el componente seleccionado → **Create variant** (botón `+` en la sección Variants del panel)
   una vez, para que tenga 2 variantes (queda una propiedad `Property 1` con valores `Default`/`Variant2`).

### Paso 4 — Componente `Card` con variantes (el principal)

1. Frame nuevo con **Auto Layout vertical**, nombralo **`Card`**.
2. En el panel de Auto Layout: **padding** → click en el ícono de variable del padding → atar a
   `space/padding-1x`. **Item spacing (gap)** → atar a `space/gap-0_5x`.
3. **Width**: poné resizing Fixed y atá el ancho a `sizing/card-width` (ícono de variable junto a W).
4. **Fill** → atar a la variable `color/surface`. Agregá un **stroke** → atalo al **style**
   `Brand/Surface` **y** además dejá la variable `color/border` en otra capa, para tener un caso con
   variable y otro con style (ver nota abajo).
5. Adentro del `Card`: un texto **`Title`** (asignale un text style con line-height y
   letter-spacing, o seteá line-height 24 y letter-spacing 0.5 a mano) y **una instancia de `Tag`**
   (arrastrá `Tag` adentro).
6. Convertí `Card` en componente y creá variantes hasta tener **2 propiedades** (ej. `Size`=Large/Small
   y `Type`=Primary/Secondary → 4 variantes). Para que Two-Way y Complete muestren diferencias,
   en **una** variante cambiá algo: borrá el `Tag`, o cambiá el padding, o agregá una capa extra.

> Para el caso "variable **y** style en el mismo color" (toggle Preferred): en una capa, atá el fill
> a la variable `color/surface` y además asignale el style `Brand/Surface`. Si Figma no deja ambos a
> la vez, alcanza con tener una capa con variable y otra con style por separado.

### Paso 5 — Frame `Screen` con layout grid (sin Auto Layout)

1. Frame grande (ej. 390×800), nombralo **`Screen`**. **No** le pongas Auto Layout.
2. Panel derecho → **Layout grid** → **+** → cambiá el tipo a **Columns**.
3. Seteá: Count **12**, Type **Stretch**, Gutter **20**, Margin **16**.
4. Meté el componente `Card` (una instancia) adentro del `Screen`.

### Qué seleccionar para cada botón

- **Anatomy / Layout & Spacing / Data / Styling Inventory**: seleccioná una instancia de `Card`
  (o el `Screen` para ver la fila propia del grid en Layout).
- **Properties / Modes / Two-Way / Complete A/L**: seleccioná el **component set** de `Card`
  (el contenedor de todas las variantes).

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
