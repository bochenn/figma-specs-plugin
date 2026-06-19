# Encabezado "Title & Heading" en todas las secciones — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que cada sección que genera el plugin arranque con un encabezado de documento ("Title & Heading": barra plugin/sección + título + descripción).

**Architecture:** Nuevo generador compartido `src/plugin/generadores/encabezado.ts` (`tituloYEncabezado`), cableado en `src/plugin/main.ts` antes de cada sección del loop. Se limpia el dead-code del header que había quedado en `anatomy.ts`.

**Tech Stack:** TypeScript, Figma Plugin API, esbuild, `node --test` vía `npm test`.

---

## Nota de testing

Todo es impuro (toca `figma.*`) y se verifica por PDF; **no lleva tests unitarios nuevos**
(mismo patrón que el resto de generadores). La verificación de cada tarea es
`npm run build && npm test` sin errores y sin cambios en el conteo de tests (205).

Helpers existentes en `src/plugin/generadores/frames.ts`: `frameVertical(nombre, gap, padding?)`,
`frameHorizontal(nombre, gap)`, `texto(contenido, fontSize, font?)` (acepta `FontName | FontName[]`
y cae a Inter si la fuente no está; ya setea el color de tema `texto` en el TextNode).

---

## Task 1: Generador `encabezado.ts`

**Files:**
- Create: `src/plugin/generadores/encabezado.ts`

- [ ] **Step 1: Crear el archivo con el generador completo**

Creá `src/plugin/generadores/encabezado.ts` con este contenido exacto:

```ts
// Encabezado de documento "Title & Heading": barra con nombre del plugin + sección,
// más el título del elemento y una descripción placeholder. Va arriba de cada sección.

import { frameVertical, frameHorizontal, texto } from "./frames.ts";

const NOMBRE_PLUGIN = "BLUEPRINT SPECS & HANDOFF";
const DESCRIPCION_PLACEHOLDER =
  "This a placeholder text to add a brief description of what this element does in the project.";
const GRIS_OSCURO: RGB = { r: 0.216, g: 0.255, b: 0.318 }; // #374151
const GRIS_DESC: RGB = { r: 0.420, g: 0.447, b: 0.502 };   // #6B7280
const BORDE_HEADER: RGB = { r: 0.819, g: 0.835, b: 0.859 }; // #D1D5DB

// SF Pro (fuentes de sistema macOS) con fallback a Inter si no están en el archivo.
const FONT_BARRA: FontName[] = [{ family: "SF Pro Text", style: "Medium" }, { family: "Inter", style: "Semi Bold" }];
const FONT_TITULO: FontName[] = [{ family: "SF Pro Display", style: "Regular" }, { family: "Inter", style: "Bold" }];

// Barra superior: nombre del plugin (izq) + nombre de sección (der), con divisor inferior.
async function barraStatus(etiquetaSeccion: string): Promise<FrameNode> {
  const barra = frameHorizontal("_Status", 0);
  barra.primaryAxisAlignItems = "SPACE_BETWEEN";
  barra.counterAxisAlignItems = "CENTER";
  barra.paddingBottom = 12;
  barra.strokes = [{ type: "SOLID", color: BORDE_HEADER }];
  barra.strokeTopWeight = 0;
  barra.strokeLeftWeight = 0;
  barra.strokeRightWeight = 0;
  barra.strokeBottomWeight = 1;

  const izq = await texto(NOMBRE_PLUGIN, 13, FONT_BARRA);
  izq.fills = [{ type: "SOLID", color: GRIS_OSCURO }];
  const der = await texto(etiquetaSeccion.toUpperCase(), 13, FONT_BARRA);
  der.fills = [{ type: "SOLID", color: GRIS_OSCURO }];

  barra.appendChild(izq);
  barra.appendChild(der);
  return barra;
}

// Bloque título + descripción, indentado con padding lateral 64.
async function docHeading(nombreElemento: string): Promise<FrameNode> {
  const doc = frameVertical("_Doc/Heading", 24);
  doc.paddingLeft = doc.paddingRight = 64;
  doc.appendChild(await texto(nombreElemento, 36, FONT_TITULO));
  const desc = await texto(DESCRIPCION_PLACEHOLDER, 16);
  desc.fills = [{ type: "SOLID", color: GRIS_DESC }];
  doc.appendChild(desc);
  return doc;
}

// Encabezado "Title & Heading" completo. Se estira a FILL al appendearlo a su contenedor.
export async function tituloYEncabezado(nombreElemento: string, etiquetaSeccion: string): Promise<FrameNode> {
  const cont = frameVertical("Title & Heading", 64);

  const barra = await barraStatus(etiquetaSeccion);
  cont.appendChild(barra);
  barra.layoutSizingHorizontal = "FILL";

  const doc = await docHeading(nombreElemento);
  cont.appendChild(doc);
  doc.layoutSizingHorizontal = "FILL";

  return cont;
}
```

- [ ] **Step 2: Build + tests**

Run: `npm run build && npm test`
Expected: build OK (sin errores de tipos); 205 tests pasan. (El archivo todavía no se usa,
pero debe compilar.)

- [ ] **Step 3: Commit**

```bash
git add src/plugin/generadores/encabezado.ts
git commit -m "feat: generador tituloYEncabezado (Title & Heading) compartido"
```

---

## Task 2: Cablear el encabezado por sección en `main.ts`

**Files:**
- Modify: `src/plugin/main.ts`

- [ ] **Step 1: Importar `tituloYEncabezado`**

En `src/plugin/main.ts`, después de la línea
`import { seccionDeComplete } from "./generadores/complete.ts";` agregá:

```ts
import { tituloYEncabezado } from "./generadores/encabezado.ts";
```

- [ ] **Step 2: Agregar el mapa sección → etiqueta**

Justo después de la línea que define `const ORDEN: Seccion[] = [...]`, agregá:

```ts
// Etiqueta (mayúsculas) que muestra la barra del encabezado por cada sección.
const ETIQUETA_SECCION: Record<Seccion, string> = {
  anatomy: "ANATOMY",
  properties: "PROPERTIES",
  layout: "LAYOUT AND SPACING",
  data: "DATA",
  styling: "STYLING INVENTORY",
  modes: "MODES",
  twoway: "TWO-WAY",
  complete: "COMPLETE",
};
```

- [ ] **Step 3: Quitar el título global y agregar el header por sección en el loop**

En `figma.ui.onmessage`, el bloque actual es:

```ts
    const specifications = frameVertical("Specifications", 128, 64);
    const spec = frameVertical(`${nodo.name} Spec`, 48);
    specifications.appendChild(spec);
    if (msg.leyenda) spec.appendChild(await seccionLeyenda());
    spec.appendChild(await texto(nodo.name, 64));
    for (const seccion of ORDEN) {
      if (!msg.secciones.includes(seccion)) continue;
      for (const f of await seccionPara(nodo, seccion, opts)) spec.appendChild(f);
    }
    figma.currentPage.appendChild(specifications);
    finalizar(specifications, nodo);
```

Reemplazalo por (se elimina `spec.appendChild(await texto(nodo.name, 64));` y se inserta
el header antes de cada sección):

```ts
    const specifications = frameVertical("Specifications", 128, 64);
    const spec = frameVertical(`${nodo.name} Spec`, 48);
    specifications.appendChild(spec);
    if (msg.leyenda) spec.appendChild(await seccionLeyenda());
    for (const seccion of ORDEN) {
      if (!msg.secciones.includes(seccion)) continue;
      const header = await tituloYEncabezado(nodo.name, ETIQUETA_SECCION[seccion]);
      spec.appendChild(header);
      header.layoutSizingHorizontal = "FILL";
      for (const f of await seccionPara(nodo, seccion, opts)) spec.appendChild(f);
    }
    figma.currentPage.appendChild(specifications);
    finalizar(specifications, nodo);
```

Nota: el import de `texto` en `main.ts` SE MANTIENE (lo sigue usando la función `aviso`).

- [ ] **Step 4: Build + tests**

Run: `npm run build && npm test`
Expected: build OK; 205 tests pasan sin regresiones.

- [ ] **Step 5: Commit**

```bash
git add src/plugin/main.ts
git commit -m "feat: encabezado Title & Heading por sección en main.ts"
```

---

## Task 3: Limpiar el dead-code del header en `anatomy.ts`

**Files:**
- Modify: `src/plugin/generadores/anatomy.ts`

Contexto: la iteración anterior agregó en `anatomy.ts` un header que `main.ts` nunca llama
(tree-shakeado). Hay que revertir esas adiciones. SE CONSERVA `tagSeccion` (el chip
`[ANATOMY]`, sí usado por `seccionDeAnatomy`), y por lo tanto `GRIS_OSCURO` y el import de
`FONT_SEMI` que `tagSeccion` usa.

- [ ] **Step 1: Borrar las funciones `tituloYDescripcion` y `headerPagina`**

En `anatomy.ts`, eliminá COMPLETAS estas dos funciones (con sus comentarios):

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

- [ ] **Step 2: Revertir `specDeAnatomy` a su forma original**

Reemplazá:

```ts
async function specDeAnatomy(seleccionado: SceneNode, elementos: ElementoAnatomy[], tabla: boolean): Promise<FrameNode> {
  const spec = frameVertical(`${seleccionado.name} Spec`, 24);
  spec.appendChild(await tituloYDescripcion(seleccionado.name));
  spec.appendChild(await seccionDeAnatomy(seleccionado, elementos, tabla));
  return spec;
}
```

por:

```ts
async function specDeAnatomy(seleccionado: SceneNode, elementos: ElementoAnatomy[], tabla: boolean): Promise<FrameNode> {
  const spec = frameVertical(`${seleccionado.name} Spec`, 48);
  spec.appendChild(await texto(seleccionado.name, 64));
  spec.appendChild(await seccionDeAnatomy(seleccionado, elementos, tabla));
  return spec;
}
```

- [ ] **Step 3: Quitar el header de `generarAnatomy`**

Reemplazá:

```ts
export async function generarAnatomy(seleccionado: SceneNode, elementos: ElementoAnatomy[], tabla: boolean): Promise<FrameNode> {
  const specifications = frameVertical("Specifications", 128, 64);
  const header = await headerPagina("Anatomy");
  specifications.appendChild(header);
  header.layoutSizingHorizontal = "FILL";
  specifications.appendChild(await specDeAnatomy(seleccionado, elementos, tabla));
  figma.currentPage.appendChild(specifications);
  return specifications;
}
```

por:

```ts
export async function generarAnatomy(seleccionado: SceneNode, elementos: ElementoAnatomy[], tabla: boolean): Promise<FrameNode> {
  const specifications = frameVertical("Specifications", 128, 64);
  specifications.appendChild(await specDeAnatomy(seleccionado, elementos, tabla));
  figma.currentPage.appendChild(specifications);
  return specifications;
}
```

- [ ] **Step 4: Quitar el header de `generarAnatomyConNested`**

Reemplazá:

```ts
  const specifications = frameVertical("Specifications", 128, 64);
  const header = await headerPagina("Anatomy");
  specifications.appendChild(header);
  header.layoutSizingHorizontal = "FILL";
  specifications.appendChild(await specDeAnatomy(seleccionado, elementos, tabla));
  for (const n of nested) {
```

por:

```ts
  const specifications = frameVertical("Specifications", 128, 64);
  specifications.appendChild(await specDeAnatomy(seleccionado, elementos, tabla));
  for (const n of nested) {
```

- [ ] **Step 5: Quitar las constantes que quedan sin uso**

En el bloque de constantes del tope del archivo, eliminá `NOMBRE_PLUGIN`, `BORDE_HEADER`,
`DESCRIPCION_PLACEHOLDER` y `GRIS_DESC`, dejando solo `GRIS_OSCURO` (lo usa `tagSeccion`).
Reemplazá:

```ts
// Nombre del plugin para el header de página (coincide con manifest.json "name").
const NOMBRE_PLUGIN = "BLUEPRINT SPECS & HANDOFF";
// Gris oscuro del header/tag (#374151) y borde del header (#D1D5DB).
const GRIS_OSCURO: RGB = { r: 0.216, g: 0.255, b: 0.318 };
const BORDE_HEADER: RGB = { r: 0.819, g: 0.835, b: 0.859 };
// Texto placeholder de la descripción (el usuario lo edita a mano en Figma).
const DESCRIPCION_PLACEHOLDER =
  "This a placeholder text to add a brief description of what this element does in the project.";
// Gris de la descripción (#6B7280).
const GRIS_DESC: RGB = { r: 0.420, g: 0.447, b: 0.502 };
```

por:

```ts
// Gris oscuro del chip de sección (#374151).
const GRIS_OSCURO: RGB = { r: 0.216, g: 0.255, b: 0.318 };
```

Nota: NO toques el import de `./frames.ts` (sigue usando `FONT_SEMI` y `FONT_BOLD`:
`FONT_SEMI` lo usa `tagSeccion`, `FONT_BOLD` lo usa `entradaLista`).

- [ ] **Step 6: Build + tests**

Run: `npm run build && npm test`
Expected: build OK (sin variables/funciones sin uso que rompan el build); 205 tests pasan.

- [ ] **Step 7: Commit**

```bash
git add src/plugin/generadores/anatomy.ts
git commit -m "refactor: quitar dead-code del header en anatomy.ts"
```

---

## Verificación final (manual, por PDF)

Generar Anatomy + Layout juntas, exportar PDF y confirmar:
- Cada sección arranca con su barra `BLUEPRINT SPECS & HANDOFF` ···· `<SECCIÓN>` + divisor.
- Debajo, el título del elemento (36px) + la descripción gris.
- En Anatomy sigue apareciendo el chip `[ANATOMY]` bajo el header.
- Ya no hay un único título de 64px arriba de todo.
