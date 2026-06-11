# Spec Nested Components — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Un checkbox "Spec nested subcomponents" que, al correr Anatomy, genera además un spec de Anatomy por cada instancia anidada de primer nivel del ítem seleccionado.

**Architecture:** Se refactoriza `generarAnatomy` extrayendo `specDeAnatomy` (el `[Nombre] Spec` reutilizable) y se agrega `generarAnatomyConNested`. La UI suma un checkbox; el mensaje lleva `nested`. `main.ts` detecta las instancias anidadas (impure) y arma sus specs. Sin tests unitarios nuevos (la lógica pura ya está cubierta).

**Tech Stack:** TypeScript, esbuild, `@figma/plugin-typings`, `node --test`. Sin frameworks de UI.

---

## Estructura de archivos

| Archivo | Responsabilidad |
|---------|-----------------|
| `src/plugin/modelo/tipos.ts` | **Modificar.** `MensajeUI` suma `nested?`. |
| `src/plugin/generadores/anatomy.ts` | **Modificar.** Extrae `specDeAnatomy`; agrega `generarAnatomyConNested`. |
| `src/ui/index.html` | **Modificar.** Checkbox "Spec nested subcomponents". |
| `src/ui/ui.ts` | **Modificar.** Manda `nested` con el estado del checkbox. |
| `src/plugin/main.ts` | **Modificar.** `instanciasAnidadas` + `generarSeccionAnatomy(nodo, nested)`. |

Sin archivos de test nuevos (rebanada impure).

---

## Task 1: `MensajeUI` con `nested`

**Files:**
- Modify: `src/plugin/modelo/tipos.ts`

- [ ] **Step 1: Agregar `nested?` a `MensajeUI`**

Reemplazar:

```typescript
export type MensajeUI = { tipo: "generar"; seccion: Seccion };
```

por:

```typescript
export type MensajeUI = { tipo: "generar"; seccion: Seccion; nested?: boolean };
```

- [ ] **Step 2: Verificar que compila**

Run: `npx tsc --noEmit`
Expected: `TypeScript compilation completed`.

- [ ] **Step 3: Commit**

```bash
git add src/plugin/modelo/tipos.ts
git commit -m "feat: MensajeUI con flag nested"
```

---

## Task 2: Refactor del generador de Anatomy (specDeAnatomy + generarAnatomyConNested)

**Files:**
- Modify: `src/plugin/generadores/anatomy.ts`

- [ ] **Step 1: Reemplazar la función `generarAnatomy` por `specDeAnatomy` + `generarAnatomy` + `generarAnatomyConNested`**

Reemplazar la función `generarAnatomy` completa (desde `export async function generarAnatomy` hasta su
`}` de cierre) por:

```typescript
// Construye el [Nombre] Spec (heading + sección Anatomy con lista + artwork).
async function specDeAnatomy(seleccionado: SceneNode, elementos: ElementoAnatomy[]): Promise<FrameNode> {
  const spec = frameVertical(`${seleccionado.name} Spec`, 48);
  spec.appendChild(await texto(seleccionado.name, 64));

  const seccion = frameVertical("Anatomy", 64);
  spec.appendChild(seccion);
  seccion.appendChild(await texto("Anatomy", 48));

  // Display horizontal: lista a la izquierda, artwork a la derecha.
  const display = figma.createFrame();
  display.name = "Display";
  display.layoutMode = "HORIZONTAL";
  display.itemSpacing = 64;
  display.primaryAxisSizingMode = "AUTO";
  display.counterAxisSizingMode = "AUTO";
  display.fills = [];
  seccion.appendChild(display);

  // Lista de contenido.
  const lista = frameVertical("Content", 16);
  display.appendChild(lista);
  if (elementos.length === 0) {
    lista.appendChild(await texto("Sin elementos detectados", 16));
  } else {
    for (let i = 0; i < elementos.length; i++) {
      lista.appendChild(await entradaLista(i + 1, elementos[i]));
    }
  }

  // Artwork: clon del seleccionado + marcadores.
  const artwork = figma.createFrame();
  artwork.name = "Artwork";
  artwork.layoutMode = "NONE";
  artwork.clipsContent = false;
  artwork.fills = [{ type: "SOLID", color: GRIS(0.96) }];
  display.appendChild(artwork);

  const clon = seleccionado.clone();
  artwork.appendChild(clon);
  clon.x = 0;
  clon.y = 0;
  artwork.resize(clon.width, clon.height);

  for (let i = 0; i < elementos.length; i++) {
    const altura = elementos.length > 0 ? clon.height / elementos.length : 0;
    const caja = { x: 0, y: i * altura, width: clon.width, height: altura };
    const pos = posicionMarcador(caja);
    artwork.appendChild(await marcador(i + 1, pos.x, pos.y));
  }

  return spec;
}

// Genera el spec de Anatomy de un solo ítem. Devuelve el frame Specifications.
export async function generarAnatomy(seleccionado: SceneNode, elementos: ElementoAnatomy[]): Promise<FrameNode> {
  const specifications = frameVertical("Specifications", 128, 64);
  specifications.appendChild(await specDeAnatomy(seleccionado, elementos));
  figma.currentPage.appendChild(specifications);
  return specifications;
}

// Genera el spec del principal + un spec por cada instancia anidada.
export async function generarAnatomyConNested(
  seleccionado: SceneNode,
  elementos: ElementoAnatomy[],
  nested: { nodo: SceneNode; elementos: ElementoAnatomy[] }[],
): Promise<FrameNode> {
  const specifications = frameVertical("Specifications", 128, 64);
  specifications.appendChild(await specDeAnatomy(seleccionado, elementos));
  for (const n of nested) {
    specifications.appendChild(await specDeAnatomy(n.nodo, n.elementos));
  }
  figma.currentPage.appendChild(specifications);
  return specifications;
}
```

> Nota: si el cuerpo actual de `generarAnatomy` difiere en algún detalle (nombres, orden), adaptar este
> bloque para que `specDeAnatomy` produzca exactamente el mismo `[Nombre] Spec` que hoy. La firma pública
> de `generarAnatomy(seleccionado, elementos)` no cambia.

- [ ] **Step 2: Verificar que compila, buildea y los tests siguen verdes**

Run: `npx tsc --noEmit`
Expected: `TypeScript compilation completed`.

Run: `npm run build`
Expected: `build OK → dist/code.js + dist/ui.html`.

Run: `npm test`
Expected: `pass 92`, `fail 0`.

- [ ] **Step 3: Commit**

```bash
git add src/plugin/generadores/anatomy.ts
git commit -m "refactor: specDeAnatomy + generarAnatomyConNested"
```

---

## Task 3: Checkbox en la UI

**Files:**
- Modify: `src/ui/index.html`
- Modify: `src/ui/ui.ts`

- [ ] **Step 1: Agregar el checkbox en `src/ui/index.html`**

Reemplazar la línea `<button id="anatomy">Anatomy</button>` por:

```html
    <label><input type="checkbox" id="nested" /> Spec nested subcomponents</label>
    <button id="anatomy">Anatomy</button>
```

- [ ] **Step 2: Modificar `src/ui/ui.ts`**

Reemplazar la función `generar` (y el acceso al estado) por:

```typescript
const nestedCheck = document.getElementById("nested") as HTMLInputElement;

function generar(seccion: "anatomy" | "properties" | "layout" | "data" | "styling" | "modes" | "twoway" | "complete"): void {
  parent.postMessage({ pluginMessage: { tipo: "generar", seccion, nested: nestedCheck.checked } }, "*");
}
```

(El resto de `ui.ts` —los `onclick` de los botones y el `window.onmessage`— no cambia.)

- [ ] **Step 3: Verificar que compila y buildea**

Run: `npx tsc --noEmit`
Expected: `TypeScript compilation completed`.

Run: `npm run build`
Expected: `build OK → dist/code.js + dist/ui.html`.

- [ ] **Step 4: Commit**

```bash
git add src/ui/index.html src/ui/ui.ts
git commit -m "feat: checkbox Spec nested subcomponents en la UI"
```

---

## Task 4: Detección de nested + orquestación en main

**Files:**
- Modify: `src/plugin/main.ts`

- [ ] **Step 1: Agregar `generarAnatomyConNested` al import**

Reemplazar:

```typescript
import { generarAnatomy } from "./generadores/anatomy.ts";
```

por:

```typescript
import { generarAnatomy, generarAnatomyConNested } from "./generadores/anatomy.ts";
```

- [ ] **Step 2: Subir el alto del panel**

Reemplazar `figma.showUI(__html__, { width: 280, height: 320 });` por:

```typescript
figma.showUI(__html__, { width: 280, height: 340 });
```

- [ ] **Step 3: Agregar el helper `instanciasAnidadas` y modificar `generarSeccionAnatomy`**

Reemplazar la función `generarSeccionAnatomy` por:

```typescript
// Instancias anidadas de primer nivel (no entra dentro de las instancias).
function instanciasAnidadas(nodo: SceneNode): InstanceNode[] {
  const res: InstanceNode[] = [];
  function walk(n: SceneNode): void {
    if (!("children" in n)) return;
    for (const c of n.children) {
      if (c.type === "INSTANCE") res.push(c);
      else walk(c);
    }
  }
  walk(nodo);
  return res;
}

async function generarSeccionAnatomy(nodo: SceneNode, nested: boolean): Promise<void> {
  if (!TIPOS_VALIDOS.includes(nodo.type)) {
    responder({ tipo: "resultado", ok: false, error: "Anatomy necesita un FRAME, COMPONENT, INSTANCE o COMPONENT_SET." });
    return;
  }
  const elementos = extraerAnatomy(aNodoLike(nodo));
  let frame: FrameNode;
  if (nested) {
    const nestedSpecs = instanciasAnidadas(nodo).map((inst) => ({ nodo: inst, elementos: extraerAnatomy(aNodoLike(inst)) }));
    frame = await generarAnatomyConNested(nodo, elementos, nestedSpecs);
  } else {
    frame = await generarAnatomy(nodo, elementos);
  }
  finalizar(frame, nodo);
}
```

- [ ] **Step 4: Pasar el flag `nested` en el dispatcher**

Reemplazar:

```typescript
    if (msg.seccion === "anatomy") await generarSeccionAnatomy(nodo);
```

por:

```typescript
    if (msg.seccion === "anatomy") await generarSeccionAnatomy(nodo, msg.nested ?? false);
```

- [ ] **Step 5: Verificar que compila, buildea y los tests siguen verdes**

Run: `npx tsc --noEmit`
Expected: `TypeScript compilation completed`.

Run: `npm run build`
Expected: `build OK → dist/code.js + dist/ui.html`.

Run: `npm test`
Expected: `pass 92`, `fail 0`.

- [ ] **Step 6: Commit**

```bash
git add src/plugin/main.ts
git commit -m "feat: instanciasAnidadas y Anatomy con nested en main"
```

---

## Task 5: Verificación manual end-to-end en Figma

**Files:** ninguno (validación manual).

- [ ] **Step 1: Preparar un frame con instancias anidadas**

En Figma: un frame que contenga **una o dos instancias** de componentes adentro (que tengan algunos
elementos propios: texto, shapes).

- [ ] **Step 2: Recargar el plugin**

Run: `npm run build`
En Figma: Plugins → Development → Specs Plugin. Verificar que aparece el **checkbox** "Spec nested
subcomponents" arriba de los botones.

- [ ] **Step 3: Caso feliz (toggle off vs on)**

- Con el checkbox **apagado** → seleccionar el frame → "Anatomy" → un solo `[Nombre] Spec` (la instancia
  aparece como elemento con "Depends on", como hoy).
- Con el checkbox **encendido** → "Anatomy" → el spec principal **+** un `[Instancia] Spec` de Anatomy por
  cada instancia anidada. Panel: "✓ Generado".

- [ ] **Step 4: Comparar contra la referencia del PRD**

Abrir `prd-images/8. Spec Nested Components/` y comparar. Anotar diferencias (Properties de las nested,
recursión) como pulido — NO arreglarlas ahora.

- [ ] **Step 5: Verificar casos límite y que el resto siga funcionando**

- Frame **sin** instancias anidadas, checkbox on → solo el spec principal.
- Checkbox on con Properties/Layout/etc. → se ignora (esas secciones funcionan igual).

- [ ] **Step 6: Commit de cierre (si hubo ajustes menores)**

```bash
git add -A
git commit -m "chore: verificacion end-to-end de Spec Nested Components en Figma"
```

---

## Resumen de cobertura del spec

| Sección del spec | Tarea(s) |
|------------------|----------|
| 1 — Toggle en la UI | Task 1 (MensajeUI), Task 3 (checkbox) |
| 2 — Generación de las nested | Task 2 (refactor + generarAnatomyConNested), Task 4 (instanciasAnidadas + orquestación) |
| 3 — Errores y casos límite | Task 4 (validación, nested off/sin instancias) |
| 4 — Testing | Task 5 (manual; sin unit nuevos) |
