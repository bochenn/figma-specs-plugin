# Anatomy como página de documento — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Envolver el bloque artwork + cards de Anatomy con header de página, título + descripción y tag "ANATOMY", para que la salida se vea como una página de documento (mockup `Specifications-redesign 2.pdf`).

**Architecture:** Se agregan tres generadores impuros (tocan `figma.*`) en `src/plugin/generadores/anatomy.ts` y se cablean en `specDeAnatomy` / `seccionDeAnatomy` / `generarAnatomy` / `generarAnatomyConNested`. No se cambian cards, filas-pill, ChipVar ni el artwork.

**Tech Stack:** TypeScript, Figma Plugin API, esbuild (bundle a `dist/`), `node --test`.

---

## Nota sobre testing (leer antes de empezar)

Este proyecto separa lógica **pura** (testeable con `node --test`) de generadores
**impuros** que tocan `figma.*` y se verifican manualmente por PDF. Todo lo de este plan
es impuro (crea nodos de Figma), así que **no lleva tests unitarios nuevos**: la
verificación de cada tarea es `npm run build` OK + `npm test` sin regresiones. Esto
respeta el patrón existente del repo (el resto de generadores no tiene test unitario).

Helpers existentes que vas a usar (de `src/plugin/generadores/frames.ts`):
- `texto(contenido, fontSize, font?)` → `Promise<TextNode>`. `font` default `FONT_REG`.
- `FONT_REG`, `FONT_BOLD`, `FONT_SEMI` (FontName de Inter).
- `frameVertical(nombre, gap, padding?)`, `frameHorizontal(nombre, gap)`.
- Constantes de color local en `frames.ts`: `BORDE_PILL` (#D1D5DB), `COLOR_CLAVE`
  (#6B7280), `COLOR_VALOR` (#374151) — son `const` privadas, NO exportadas. En
  `anatomy.ts` definí los colores que necesites como literales RGB (igual que ya hace
  `GRIS` ahí), no los importes.

Patrón de color RGB ya usado en `anatomy.ts`: `const GRIS = (n: number): RGB => ({ r: n, g: n, b: n });`

---

## Task 1: Constante del nombre del plugin + generador `headerPagina`

**Files:**
- Modify: `src/plugin/generadores/anatomy.ts` (imports arriba; agregar constante y función)

- [ ] **Step 1: Agregar la constante del nombre y colores del header**

En `src/plugin/generadores/anatomy.ts`, justo debajo de la línea
`const GRIS = (n: number): RGB => ({ r: n, g: n, b: n });`, agregá:

```ts
// Nombre del plugin para el header de página (coincide con manifest.json "name").
const NOMBRE_PLUGIN = "BLUEPRINT SPECS & HANDOFF";
// Gris oscuro del header/tag (#374151) y borde del header (#D1D5DB).
const GRIS_OSCURO: RGB = { r: 0.216, g: 0.255, b: 0.318 };
const BORDE_HEADER: RGB = { r: 0.819, g: 0.835, b: 0.859 };
```

- [ ] **Step 2: Agregar `FONT_SEMI` al import de frames**

En `anatomy.ts`, la línea de import desde `./frames.ts` hoy termina en
`FONT_BOLD, textoClave, textoValor }`. Agregá `FONT_SEMI`:

```ts
import { frameVertical, frameHorizontal, texto, tablaDe, fillTematizado, tarjeta, filaPill, chipVariable, FONT_BOLD, FONT_SEMI, textoClave, textoValor } from "./frames.ts";
```

- [ ] **Step 3: Escribir el generador `headerPagina`**

Agregá esta función en `anatomy.ts` (cerca de los otros helpers de presentación, por
ejemplo justo arriba de `specDeAnatomy`):

```ts
// Header de página: nombre del plugin (izq) + nombre de sección (der) + borde inferior.
// Pensado para ir como primer hijo de Specifications (se estira a FILL al appendearlo).
async function headerPagina(seccion: string): Promise<FrameNode> {
  const header = frameHorizontal("Header de página", 0);
  header.primaryAxisAlignItems = "SPACE_BETWEEN";
  header.counterAxisAlignItems = "CENTER";
  header.paddingBottom = 12;
  header.strokes = [{ type: "SOLID", color: BORDE_HEADER }];
  header.strokeTopWeight = 0;
  header.strokeLeftWeight = 0;
  header.strokeRightWeight = 0;
  header.strokeBottomWeight = 1;

  const izq = await texto(NOMBRE_PLUGIN, 12, FONT_SEMI);
  izq.fills = [{ type: "SOLID", color: GRIS_OSCURO }];
  izq.letterSpacing = { value: 8, unit: "PERCENT" };

  const der = await texto(seccion.toUpperCase(), 12, FONT_SEMI);
  der.fills = [{ type: "SOLID", color: GRIS_OSCURO }];
  der.letterSpacing = { value: 8, unit: "PERCENT" };

  header.appendChild(izq);
  header.appendChild(der);
  return header;
}
```

- [ ] **Step 4: Build + tests (sin regresiones)**

Run: `npm run build && npm test`
Expected: build sin errores; los tests existentes pasan (mismo número que antes).

- [ ] **Step 5: Commit**

```bash
git add src/plugin/generadores/anatomy.ts
git commit -m "feat: generador headerPagina para Anatomy"
```

---

## Task 2: Generador `tituloYDescripcion`

**Files:**
- Modify: `src/plugin/generadores/anatomy.ts`

- [ ] **Step 1: Agregar la constante de la descripción placeholder**

Debajo de las constantes agregadas en Task 1, agregá:

```ts
// Texto placeholder de la descripción (el usuario lo edita a mano en Figma).
const DESCRIPCION_PLACEHOLDER =
  "This a placeholder text to add a brief description of what this element does in the project.";
// Gris de la descripción (#6B7280).
const GRIS_DESC: RGB = { r: 0.420, g: 0.447, b: 0.502 };
```

- [ ] **Step 2: Escribir el generador `tituloYDescripcion`**

Agregá en `anatomy.ts`, cerca de `headerPagina`:

```ts
// Bloque de título (nombre del nodo, 40px) + descripción placeholder (gris, 16px).
async function tituloYDescripcion(nombre: string): Promise<FrameNode> {
  const bloque = frameVertical("Título", 8);
  bloque.appendChild(await texto(nombre, 40, FONT_BOLD));
  const desc = await texto(DESCRIPCION_PLACEHOLDER, 16);
  desc.fills = [{ type: "SOLID", color: GRIS_DESC }];
  bloque.appendChild(desc);
  return bloque;
}
```

- [ ] **Step 3: Build + tests**

Run: `npm run build && npm test`
Expected: build OK; tests pasan sin regresiones.

- [ ] **Step 4: Commit**

```bash
git add src/plugin/generadores/anatomy.ts
git commit -m "feat: generador tituloYDescripcion para Anatomy"
```

---

## Task 3: Generador `tagSeccion`

**Files:**
- Modify: `src/plugin/generadores/anatomy.ts`

- [ ] **Step 1: Escribir el generador `tagSeccion`**

Agregá en `anatomy.ts`, cerca de los otros helpers de presentación:

```ts
// Chip con borde para el nombre de la sección (ej. "ANATOMY"): sin fill, stroke #374151.
async function tagSeccion(etiqueta: string): Promise<FrameNode> {
  const chip = frameHorizontal("Tag", 0);
  chip.counterAxisAlignItems = "CENTER";
  chip.paddingTop = chip.paddingBottom = 6;
  chip.paddingLeft = chip.paddingRight = 16;
  chip.cornerRadius = 6;
  chip.fills = [];
  chip.strokes = [{ type: "SOLID", color: GRIS_OSCURO }];
  chip.strokeWeight = 1;

  const t = await texto(etiqueta.toUpperCase(), 12, FONT_SEMI);
  t.fills = [{ type: "SOLID", color: GRIS_OSCURO }];
  t.letterSpacing = { value: 8, unit: "PERCENT" };
  chip.appendChild(t);
  return chip;
}
```

- [ ] **Step 2: Build + tests**

Run: `npm run build && npm test`
Expected: build OK; tests pasan sin regresiones.

- [ ] **Step 3: Commit**

```bash
git add src/plugin/generadores/anatomy.ts
git commit -m "feat: generador tagSeccion (chip con borde) para Anatomy"
```

---

## Task 4: Cablear los tres elementos en la salida de Anatomy

**Files:**
- Modify: `src/plugin/generadores/anatomy.ts` (`specDeAnatomy`, `seccionDeAnatomy`, `generarAnatomy`, `generarAnatomyConNested`)

- [ ] **Step 1: Reemplazar el tag de sección en `seccionDeAnatomy`**

En `seccionDeAnatomy`, hoy las primeras dos líneas del cuerpo son:

```ts
  const seccion = frameVertical("Anatomy", 64);
  seccion.appendChild(await texto("Anatomy", 48));
```

Reemplazá la segunda línea por el tag con borde (cambia gap a 24, como el mockup):

```ts
  const seccion = frameVertical("Anatomy", 24);
  seccion.appendChild(await tagSeccion("Anatomy"));
```

- [ ] **Step 2: Reemplazar el título 64 por el bloque título + descripción en `specDeAnatomy`**

En `specDeAnatomy`, hoy el cuerpo es:

```ts
  const spec = frameVertical(`${seleccionado.name} Spec`, 48);
  spec.appendChild(await texto(seleccionado.name, 64));
  spec.appendChild(await seccionDeAnatomy(seleccionado, elementos, tabla));
  return spec;
```

Reemplazá el `spec.appendChild(await texto(...64))` por el bloque, y bajá el gap a 24:

```ts
  const spec = frameVertical(`${seleccionado.name} Spec`, 24);
  spec.appendChild(await tituloYDescripcion(seleccionado.name));
  spec.appendChild(await seccionDeAnatomy(seleccionado, elementos, tabla));
  return spec;
```

- [ ] **Step 3: Insertar el header de página una sola vez en `generarAnatomy`**

En `generarAnatomy`, hoy:

```ts
  const specifications = frameVertical("Specifications", 128, 64);
  specifications.appendChild(await specDeAnatomy(seleccionado, elementos, tabla));
  figma.currentPage.appendChild(specifications);
  return specifications;
```

Agregá el header como primer hijo y estiralo a FILL (después de appendear):

```ts
  const specifications = frameVertical("Specifications", 128, 64);
  const header = await headerPagina("Anatomy");
  specifications.appendChild(header);
  header.layoutSizingHorizontal = "FILL";
  specifications.appendChild(await specDeAnatomy(seleccionado, elementos, tabla));
  figma.currentPage.appendChild(specifications);
  return specifications;
```

- [ ] **Step 4: Insertar el header una sola vez en `generarAnatomyConNested`**

En `generarAnatomyConNested`, hoy:

```ts
  const specifications = frameVertical("Specifications", 128, 64);
  specifications.appendChild(await specDeAnatomy(seleccionado, elementos, tabla));
  for (const n of nested) {
    specifications.appendChild(await specDeAnatomy(n.nodo, n.elementos, tabla));
  }
  figma.currentPage.appendChild(specifications);
  return specifications;
```

Agregá el header como primer hijo (una sola vez, antes del loop):

```ts
  const specifications = frameVertical("Specifications", 128, 64);
  const header = await headerPagina("Anatomy");
  specifications.appendChild(header);
  header.layoutSizingHorizontal = "FILL";
  specifications.appendChild(await specDeAnatomy(seleccionado, elementos, tabla));
  for (const n of nested) {
    specifications.appendChild(await specDeAnatomy(n.nodo, n.elementos, tabla));
  }
  figma.currentPage.appendChild(specifications);
  return specifications;
```

- [ ] **Step 5: Build + tests**

Run: `npm run build && npm test`
Expected: build OK; tests pasan sin regresiones.

- [ ] **Step 6: Commit**

```bash
git add src/plugin/generadores/anatomy.ts
git commit -m "feat: Anatomy como página de documento (header + título + tag)"
```

---

## Verificación final (manual, por PDF)

Después de Task 4: abrir el plugin en Figma, generar Anatomy de un elemento con
anidados, exportar a PDF y comparar contra `Specifications-redesign 2.pdf`:
- Header "BLUEPRINT SPECS & HANDOFF" / "ANATOMY" con línea divisoria, una sola vez arriba.
- Título 40px + descripción placeholder gris debajo.
- Tag "ANATOMY" con borde antes de cada Display.
- Artwork + cards sin cambios.
