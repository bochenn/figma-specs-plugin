# Nueva estructura de Specifications — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generar un frame `Specifications` por cada sección (Header / Hero / Feature / anatomyItem / Footer, ancho 1980, radius 40) apilados dentro de un contenedor `Specs`.

**Architecture:** Un módulo nuevo `pagina.ts` arma la cáscara (header/hero/feature/footer/badge/envolverItem). Los generadores de sección dejan de incluir tag+párrafo (se mueven al Hero). `main.ts` arma, por sección, un `Specifications` con la cáscara + el contenido envuelto en `anatomyItem`.

**Tech Stack:** TypeScript, Figma Plugin API, esbuild (bundle, sin type-check), node:test. El código que toca `figma.*` se verifica por PDF; no se agregan tests unitarios.

---

## Notas para quien ejecuta

- **Build/test:** `npm run build` (bundlea `src/plugin/main.ts` → `dist/code.js`) y `npm test` (corre los 214 tests existentes). esbuild NO chequea tipos: el build pasa aunque haya errores de tipo, así que leé los errores de `tsc` si los hubiera, pero la verificación real es `npm run build && npm test` sin fallos.
- **Sin tests nuevos:** todo este cambio es impuro (crea nodos `figma.*`). La verificación final es por PDF. Cada tarea debe dejar los 214 tests en verde (no romper nada).
- **Helpers existentes** en `src/plugin/generadores/frames.ts`: `frameVertical(nombre, gap, padding=0)`, `frameHorizontal(nombre, gap)`, `texto(contenido, fontSize, font?)`, `fillTematizado(variable)`, `FONT_MEDIUM`, `FONT_REG`. `varsTema()` (de `../utils/variables-tema.ts`) devuelve `{ fondoSpec, ... }`.
- **Patrón de FILL:** `layoutSizingHorizontal = "FILL"` solo se puede setear cuando el nodo YA está dentro de un padre con Auto Layout cuyo eje correspondiente NO sea hug ambiguo. En frames sueltos se fija el ancho con `primaryAxisSizingMode`/`counterAxisSizingMode = "FIXED"` + `resize(1980, f.height)`.

---

## Task 1: Renombrar el frame de pill a `itemValue`

**Files:**
- Modify: `src/plugin/generadores/frames.ts` (función `filaPill`, línea ~144)

- [ ] **Step 1: Cambiar el nombre del frame**

En `filaPill`, cambiar la línea:

```ts
  const fila = frameHorizontal("Fila", 6);
```

por:

```ts
  const fila = frameHorizontal("itemValue", 6);
```

(Solo cambia el nombre del frame; el resto de `filaPill` queda igual.)

- [ ] **Step 2: Build y tests**

Run: `npm run build && npm test`
Expected: build OK, 214 tests passing.

- [ ] **Step 3: Commit**

```bash
git add src/plugin/generadores/frames.ts
git commit -m "refactor: renombra el frame de pill a itemValue"
```

---

## Task 2: Crear el módulo `pagina.ts` (cáscara de página)

**Files:**
- Create: `src/plugin/generadores/pagina.ts`

- [ ] **Step 1: Crear el archivo con todos los constructores**

Crear `src/plugin/generadores/pagina.ts` con este contenido completo:

```ts
// Cáscara de página de cada sección: Header, Hero, Feature, Footer, el Badge
// "specifications" y el wrapper anatomyItem. Tocan figma.*. Reemplaza al viejo encabezado.ts.

import { frameVertical, frameHorizontal, texto, fillTematizado, FONT_MEDIUM, FONT_REG } from "./frames.ts";
import { varsTema } from "../utils/variables-tema.ts";

const NOMBRE_PLUGIN = "BLUEPRINT SPECS & HANDOFF";
const BORDE_SHELL: RGB = { r: 0.882, g: 0.882, b: 0.882 }; // #E1E1E1
const GRIS_DESC: RGB = { r: 0.420, g: 0.447, b: 0.502 };   // #6B7280
const DESCRIPCION_ELEMENTO =
  "This is a placeholder description of what this element does in the project.";
const ANCHO_PAGINA = 1980;

// Borde completo #E1E1E1, weight 1.
function bordeShell(f: FrameNode): void {
  f.strokes = [{ type: "SOLID", color: BORDE_SHELL }];
  f.strokeWeight = 1;
}

// Texto gris de descripción (Inter Regular), preparado para FILL con wrap.
async function textoDesc(contenido: string, fontSize: number): Promise<TextNode> {
  const t = await texto(contenido, fontSize, FONT_REG);
  t.fills = [{ type: "SOLID", color: GRIS_DESC }];
  t.textAutoResize = "HEIGHT";
  return t;
}

// Barra horizontal de 1980 con fill de tema y borde shell.
function barraShell(nombre: string, gap: number): FrameNode {
  const barra = frameHorizontal(nombre, gap);
  barra.counterAxisAlignItems = "CENTER";
  barra.paddingTop = barra.paddingBottom = 32;
  barra.paddingLeft = barra.paddingRight = 100;
  barra.fills = fillTematizado(varsTema().fondoSpec);
  bordeShell(barra);
  barra.primaryAxisSizingMode = "FIXED";
  return barra;
}

// Header: nombre del plugin (FILL a la izquierda) + etiqueta de sección a la derecha.
export async function header(etiquetaSeccion: string): Promise<FrameNode> {
  const barra = barraShell("Header", 32);

  const izq = await texto(NOMBRE_PLUGIN, 16, FONT_MEDIUM);
  barra.appendChild(izq);
  izq.layoutSizingHorizontal = "FILL"; // empuja la etiqueta hacia la derecha

  barra.appendChild(await texto(etiquetaSeccion.toUpperCase(), 16, FONT_MEDIUM));
  barra.resize(ANCHO_PAGINA, barra.height);
  return barra;
}

// Footer: nombre del plugin centrado.
export async function footer(): Promise<FrameNode> {
  const barra = barraShell("Footer", 32);
  barra.primaryAxisAlignItems = "CENTER";
  barra.appendChild(await texto(NOMBRE_PLUGIN, 16, FONT_MEDIUM));
  barra.resize(ANCHO_PAGINA, barra.height);
  return barra;
}

// Badge "specifications": caja con borde, radius 8, Inter Medium 14.
export async function badgeSpecifications(): Promise<FrameNode> {
  const badge = frameHorizontal("Badge", 8);
  badge.counterAxisAlignItems = "CENTER";
  badge.paddingTop = badge.paddingBottom = 6;
  badge.paddingLeft = badge.paddingRight = 12;
  badge.cornerRadius = 8;
  badge.fills = fillTematizado(varsTema().fondoSpec);
  bordeShell(badge);
  badge.appendChild(await texto("specifications", 14, FONT_MEDIUM));
  return badge;
}

// Hero: Badge + título de sección (Inter Medium 56) + descripción (Inter Regular 18).
export async function hero(titulo: string, descripcion: string): Promise<FrameNode> {
  const cont = frameVertical("Hero", 56);
  cont.paddingTop = cont.paddingBottom = cont.paddingLeft = cont.paddingRight = 100;
  cont.fills = fillTematizado(varsTema().fondoSpec);
  bordeShell(cont);
  cont.counterAxisSizingMode = "FIXED";
  cont.resize(ANCHO_PAGINA, cont.height);

  const heroHeader = frameVertical("heroHeader", 24);
  cont.appendChild(heroHeader);
  heroHeader.layoutSizingHorizontal = "FILL";

  const title = frameVertical("Title", 12);
  heroHeader.appendChild(title);
  title.layoutSizingHorizontal = "FILL";
  title.appendChild(await badgeSpecifications());
  title.appendChild(await texto(titulo, 56, FONT_MEDIUM));

  const desc = await textoDesc(descripcion, 18);
  heroHeader.appendChild(desc);
  desc.layoutSizingHorizontal = "FILL";
  return cont;
}

// Feature: nombre del elemento (Inter Medium 32) + descripción placeholder (Inter Regular 16).
export async function feature(nombreElemento: string): Promise<FrameNode> {
  const cont = frameVertical("Feature", 56);
  cont.paddingTop = 72;
  cont.paddingBottom = 0;
  cont.paddingLeft = cont.paddingRight = 100;
  cont.fills = fillTematizado(varsTema().fondoSpec);
  bordeShell(cont);
  cont.counterAxisSizingMode = "FIXED";
  cont.resize(ANCHO_PAGINA, cont.height);

  const title = frameVertical("Title", 8);
  cont.appendChild(title);
  title.layoutSizingHorizontal = "FILL";
  title.appendChild(await texto(nombreElemento, 32, FONT_MEDIUM));

  const desc = await textoDesc(DESCRIPCION_ELEMENTO, 16);
  title.appendChild(desc);
  desc.layoutSizingHorizontal = "FILL";
  return cont;
}

// Envuelve el contenido de una sección en un anatomyItem (padding 72/100, gap 48).
// El contenido queda hug a la izquierda; el anatomyItem se estira a FILL desde main.ts.
export function envolverItem(contenido: FrameNode): FrameNode {
  const item = frameVertical("anatomyItem", 48);
  item.paddingTop = item.paddingBottom = 72;
  item.paddingLeft = item.paddingRight = 100;
  item.fills = fillTematizado(varsTema().fondoSpec);
  item.appendChild(contenido);
  return item;
}
```

- [ ] **Step 2: Build y tests**

Run: `npm run build && npm test`
Expected: build OK (el módulo todavía no se importa en `main.ts`; el bundler lo deja fuera por tree-shaking, no falla), 214 tests passing.

- [ ] **Step 3: Commit**

```bash
git add src/plugin/generadores/pagina.ts
git commit -m "feat: módulo pagina.ts con la cáscara de Specifications"
```

---

## Task 3: Quitar tag + párrafo de los generadores de Anatomy y Layout

**Files:**
- Modify: `src/plugin/generadores/anatomy.ts` (líneas ~3, ~164-165)
- Modify: `src/plugin/generadores/layout.ts` (líneas ~3, ~546-547)

- [ ] **Step 1: Quitar las líneas en anatomy.ts**

En `seccionDeAnatomy`, borrar estas dos líneas (van justo después de `const seccion = frameVertical("Anatomy", 24);`):

```ts
  seccion.appendChild(await tagSeccion("Anatomy"));
  seccion.appendChild(await parrafoSeccion("Desglosa el elemento en sus capas. Cada capa se numera sobre el diseño (a la izquierda) y se detalla a la derecha con su tipo y sus atributos —color, dimensiones, tipografía y las variables aplicadas—. Úsalo para entender de qué está compuesto el elemento y qué tokens del sistema usa cada parte."));
```

En el import de la línea 3, quitar `tagSeccion` y `parrafoSeccion` de la lista (dejar el resto igual):

```ts
import { frameVertical, frameHorizontal, texto, tablaDe, fillTematizado, tarjeta, filaPill, chipVariable, FONT_BOLD, textoClave, textoValor, FONT_MEDIUM } from "./frames.ts";
```

- [ ] **Step 2: Quitar las líneas en layout.ts**

En `seccionDeLayout`, borrar estas dos líneas (van después de `seccion.clipsContent = false;`):

```ts
  seccion.appendChild(await tagSeccion("Layout and Spacing"));
  seccion.appendChild(await parrafoSeccion("Muestra cómo se organiza el contenido: dirección, alineación, padding, espaciado entre ítems (gap) y dimensiones de cada frame con Auto Layout. Las cotas sobre el diseño marcan las medidas en su lugar; el panel de la derecha las detalla con sus variables. Úsalo para reproducir el espaciado y el comportamiento de redimensionado."));
```

En el import de la línea 3, quitar `tagSeccion` y `parrafoSeccion`:

```ts
import { frameVertical, frameHorizontal, texto, enColumnas, fillTematizado, chipVariable, tarjeta, filaPill, FONT_BOLD, textoClave, textoValor, FONT_MEDIUM } from "./frames.ts";
```

- [ ] **Step 3: Build y tests**

Run: `npm run build && npm test`
Expected: build OK, 214 tests passing.

Nota: `tagSeccion` y `parrafoSeccion` siguen exportadas en `frames.ts`; quedan sin uso pero no rompen el build (esbuild no falla por exports sin usar). No hace falta borrarlas en este pase.

- [ ] **Step 4: Commit**

```bash
git add src/plugin/generadores/anatomy.ts src/plugin/generadores/layout.ts
git commit -m "refactor: el tag y el párrafo de sección se mueven al Hero"
```

---

## Task 4: Reescribir main.ts (mapas + loop por sección + finalizar)

**Files:**
- Modify: `src/plugin/main.ts` (import línea 29; mapa ~180-189; `finalizar` ~44-56; loop ~222-244)

- [ ] **Step 1: Cambiar el import del encabezado por el de pagina.ts**

Reemplazar la línea 29:

```ts
import { tituloYEncabezado } from "./generadores/encabezado.ts";
```

por:

```ts
import { header, hero, feature, footer, envolverItem } from "./generadores/pagina.ts";
```

- [ ] **Step 2: Agregar los mapas TITULO_SECCION y DESCRIPCION_SECCION**

Debajo del mapa `ETIQUETA_SECCION` (después de la línea ~189, cerrando con `};`), agregar:

```ts
// Título grande del Hero por sección.
const TITULO_SECCION: Record<Seccion, string> = {
  anatomy: "Anatomy",
  properties: "Properties",
  layout: "Layout & Spacing",
  data: "Data",
  styling: "Styling Inventory",
  modes: "Modes",
  twoway: "Two-Way",
  complete: "Complete",
};

// Párrafo descriptivo del Hero por sección.
const DESCRIPCION_SECCION: Record<Seccion, string> = {
  anatomy: "Desglosa el elemento en sus capas. Cada capa se numera sobre el diseño (a la izquierda) y se detalla a la derecha con su tipo y sus atributos —color, dimensiones, tipografía y las variables aplicadas—. Úsalo para entender de qué está compuesto el elemento y qué tokens del sistema usa cada parte.",
  properties: "Lista las propiedades de variante del componente y sus valores posibles. Úsalo para saber qué se puede configurar y cómo se combinan las variantes.",
  layout: "Muestra cómo se organiza el contenido: dirección, alineación, padding, espaciado entre ítems (gap) y dimensiones de cada frame con Auto Layout. Las cotas sobre el diseño marcan las medidas en su lugar; el panel de la derecha las detalla con sus variables. Úsalo para reproducir el espaciado y el comportamiento de redimensionado.",
  data: "Representa el elemento como datos estructurados (JSON). Úsalo para entender su jerarquía y conectarlo con código.",
  styling: "Inventario de los estilos y variables de color, tipografía y efecto que usa el elemento. Úsalo para auditar qué tokens del sistema aplica.",
  modes: "Muestra los valores de cada variable en sus distintos modos (ej. Light/Dark). Úsalo para ver cómo cambia el elemento entre temas.",
  twoway: "Cruza dos propiedades de variante en una matriz. Úsalo para revisar todas las combinaciones de dos ejes a la vez.",
  complete: "Vista completa que combina anatomía y layout de todas las variantes. Úsalo como referencia integral del componente.",
};
```

- [ ] **Step 3: Quitar el fill del contenedor en `finalizar`**

En la función `finalizar` (líneas ~44-56), borrar la línea:

```ts
  frame.fills = fillTematizado(varsTema().fondoSpec);
```

(El contenedor `Specs` queda sin fill; cada `Specifications` y sus barras ponen su propio fill. El resto de `finalizar` —posición x/y, `setExplicitVariableModeForCollection`, `scrollAndZoomIntoView`— queda igual.)

Nota: tras quitar esa línea, `fillTematizado` puede quedar sin uso en `main.ts`. Si es así, quitarlo del import de la línea 4 (`import { fillTematizado, frameVertical, texto } from "./generadores/frames.ts";` → `import { frameVertical, texto } from "./generadores/frames.ts";`). Verificá si `fillTematizado` se usa en otra parte de `main.ts` antes de quitarlo (buscá `fillTematizado` en el archivo; si solo aparece en el import y en la línea borrada, quitalo).

- [ ] **Step 4: Reescribir el cuerpo del `try`**

Reemplazar el bloque del `try` (líneas ~222-241, desde `const specifications = frameVertical(...)` hasta `finalizar(specifications, nodo);`) por:

```ts
    const specs = frameVertical("Specs", 80, 0);
    let primeraSeccion = true;
    for (const seccion of ORDEN) {
      if (!msg.secciones.includes(seccion)) continue;

      const pagina = frameVertical("Specifications", 0, 0);
      pagina.cornerRadius = 40;

      pagina.appendChild(await header(ETIQUETA_SECCION[seccion]));
      pagina.appendChild(await hero(TITULO_SECCION[seccion], DESCRIPCION_SECCION[seccion]));
      pagina.appendChild(await feature(nodo.name));

      if (primeraSeccion && msg.leyenda) {
        const it = envolverItem(await seccionLeyenda());
        pagina.appendChild(it);
        it.layoutSizingHorizontal = "FILL";
      }
      for (const contenido of await seccionPara(nodo, seccion, opts)) {
        const it = envolverItem(contenido);
        pagina.appendChild(it);
        it.layoutSizingHorizontal = "FILL";
      }

      pagina.appendChild(await footer());

      specs.appendChild(pagina);
      primeraSeccion = false;
    }
    figma.currentPage.appendChild(specs);
    finalizar(specs, nodo);
```

- [ ] **Step 5: Build y tests**

Run: `npm run build && npm test`
Expected: build OK, 214 tests passing.

- [ ] **Step 6: Commit**

```bash
git add src/plugin/main.ts
git commit -m "feat: main arma un Specifications por sección dentro de Specs"
```

---

## Task 5: Borrar el módulo obsoleto encabezado.ts

**Files:**
- Delete: `src/plugin/generadores/encabezado.ts`

- [ ] **Step 1: Confirmar que no quedan imports**

Run: `grep -rn "encabezado" src/`
Expected: sin resultados (Task 4 ya quitó el import de `main.ts`). Si aparece algún import, no borres el archivo: revisá y avisá.

- [ ] **Step 2: Borrar el archivo**

```bash
git rm src/plugin/generadores/encabezado.ts
```

(Borrado de archivo: ya está confirmado por el spec y por el grep del paso 1. `tituloYEncabezado` no se usa más.)

- [ ] **Step 3: Build y tests**

Run: `npm run build && npm test`
Expected: build OK, 214 tests passing.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: borra encabezado.ts obsoleto"
```

---

## Verificación final (por PDF)

Generar el plugin sobre un componente con varias secciones elegidas y exportar a PDF. Confirmar:

1. Un contenedor `Specs` con un frame `Specifications` por cada sección elegida, apilados en vertical.
2. Cada `Specifications`: ancho 1980, radius 40.
3. **Header**: "BLUEPRINT SPECS & HANDOFF" a la izquierda, etiqueta de sección (ej. "ANATOMY") a la derecha; borde #E1E1E1.
4. **Hero**: Badge "specifications" (radius 8, borde) + título grande de la sección (56) + descripción gris.
5. **Feature**: nombre del elemento (32) + descripción placeholder.
6. **anatomyItem(s)**: el contenido de la sección (artwork + cards) con padding generoso; el tag/párrafo viejos YA NO aparecen dentro del contenido (ahora están en el Hero).
7. **Footer**: "BLUEPRINT SPECS & HANDOFF" centrado.
8. Probar el modo Dark: las barras y el contenido siguen tematizados (no quedan blancas fijas).

---

## Self-review (cobertura del spec)

- Frame por sección con Header/Hero/Feature/anatomyItem/Footer → Tasks 2 + 4. ✅
- Contenedor `Specs` apilado vertical → Task 4. ✅
- Badge "specifications", radius 8, borde #E1E1E1, Inter Medium 14 → Task 2 (`badgeSpecifications`). ✅
- Tipografías (Header/Footer 16, título 56, desc 18, Feature 32/16, Badge 14) → Task 2. ✅
- Fills tematizados + bordes #E1E1E1 sólidos → Task 2 + Task 4 (finalizar sin fill). ✅
- Tag/párrafo movidos al Hero → Task 3 + mapas en Task 4. ✅
- `itemValue` (ex `Fila`) → Task 1. ✅
- Borrar `encabezado.ts` → Task 5. ✅
- Ancho 1980 / overflow aceptado → Task 2 (resize 1980) + nota del spec. ✅
- Modo Dark preserva → fills tematizados (Task 2) + setExplicitVariableModeForCollection intacto (Task 4). ✅
