# Complete Anatomy — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generar una sección Complete Anatomy que lista, por cada variante, los elementos que aparecen en ella pero no en el default, disparada por un octavo botón.

**Architecture:** `extraerCompleteAnatomy` (pura, reusa `extraerAnatomy`/`buscarVariante`/`mismasProps`) compara los elementos de cada variante contra los del default por clave `tipo|nombre`. `generarCompleteAnatomy` los dibuja como texto. La UI suma un botón; `main.ts` agrega la rama `complete`.

**Tech Stack:** TypeScript, esbuild, `@figma/plugin-typings`, `node --test`. Sin frameworks de UI.

---

## Estructura de archivos

| Archivo | Responsabilidad |
|---------|-----------------|
| `src/plugin/modelo/tipos.ts` | **Modificar.** `ElementoAdicional`; `Seccion` suma `"complete"`. |
| `src/plugin/extraccion/properties.ts` | **Modificar.** `extraerCompleteAnatomy(set) → ElementoAdicional[]`. |
| `src/plugin/generadores/complete.ts` | **Nuevo.** `generarCompleteAnatomy(nombre, adicionales)`. Toca `figma.*`. |
| `src/ui/index.html` | **Modificar.** Octavo botón "Complete Anatomy". |
| `src/ui/ui.ts` | **Modificar.** Binding del botón complete. |
| `src/plugin/main.ts` | **Modificar.** Rama `complete`. |
| `tests/complete-anatomy-extraccion.test.ts` | **Nuevo.** Tests de `extraerCompleteAnatomy`. |

---

## Task 1: Tipos (ElementoAdicional, sección complete)

**Files:**
- Modify: `src/plugin/modelo/tipos.ts`

- [ ] **Step 1: Sumar `"complete"` a `Seccion`**

Reemplazar la línea de `Seccion` por:

```typescript
export type Seccion = "anatomy" | "properties" | "layout" | "data" | "styling" | "modes" | "twoway" | "complete";
```

- [ ] **Step 2: Agregar `ElementoAdicional`**

Después de la interfaz `DosWaySpec`, agregar:

```typescript
export interface ElementoAdicional {
  variante: string;   // etiqueta de la variante, ej. "Size=M, Type=Sec"
  nombre: string;
  tipo: string;
}
```

- [ ] **Step 3: Verificar que compila**

Run: `npx tsc --noEmit`
Expected: `TypeScript compilation completed`.

- [ ] **Step 4: Commit**

```bash
git add src/plugin/modelo/tipos.ts
git commit -m "feat: tipos de Complete Anatomy (ElementoAdicional, seccion complete)"
```

---

## Task 2: `extraerCompleteAnatomy`

**Files:**
- Create: `tests/complete-anatomy-extraccion.test.ts`
- Modify: `src/plugin/extraccion/properties.ts`

- [ ] **Step 1: Escribir el test que falla**

```typescript
import { test } from "node:test";
import assert from "node:assert";
import { extraerCompleteAnatomy } from "../src/plugin/extraccion/properties.ts";
import type { SetNorm, NodoLike } from "../src/plugin/modelo/tipos.ts";

function variante(props: Record<string, string>, hijos: { id: string; name: string; type: string }[]): {
  variantProperties: Record<string, string>;
  raiz: NodoLike;
} {
  return {
    variantProperties: props,
    raiz: { id: "r", name: "Root", type: "COMPONENT", children: hijos.map((h) => ({ ...h })) },
  };
}

test("una variante con una capa extra → ese elemento es adicional", () => {
  const set: SetNorm = {
    propiedades: { Tone: ["A", "B"] },
    defaultProps: { Tone: "A" },
    variantes: [
      variante({ Tone: "A" }, [{ id: "l", name: "Label", type: "TEXT" }]),
      variante({ Tone: "B" }, [{ id: "l", name: "Label", type: "TEXT" }, { id: "i", name: "Icon", type: "INSTANCE" }]),
    ],
  };
  assert.deepEqual(extraerCompleteAnatomy(set), [
    { variante: "Tone=B", nombre: "Icon", tipo: "INSTANCE" },
  ]);
});

test("todas las variantes iguales al default → []", () => {
  const set: SetNorm = {
    propiedades: { Tone: ["A", "B"] },
    defaultProps: { Tone: "A" },
    variantes: [
      variante({ Tone: "A" }, [{ id: "l", name: "Label", type: "TEXT" }]),
      variante({ Tone: "B" }, [{ id: "l", name: "Label", type: "TEXT" }]),
    ],
  };
  assert.deepEqual(extraerCompleteAnatomy(set), []);
});
```

- [ ] **Step 2: Correr para verificar que falla**

Run: `npm test`
Expected: FALLA — `extraerCompleteAnatomy is not a function` / export no encontrado.

- [ ] **Step 3: Agregar imports y `extraerCompleteAnatomy` a `src/plugin/extraccion/properties.ts`**

Agregar `ElementoAdicional` al import de tipos (la primera línea), por ejemplo:

```typescript
import type { SetNorm, PropiedadSpec, OpcionSpec, VarianteNorm, DosWaySpec, CombinacionSpec, ElementoAdicional } from "../modelo/tipos.ts";
```

Y agregar el import de `extraerAnatomy` después del import de `mismasProps`/`compararVariante`:

```typescript
import { extraerAnatomy } from "./anatomy.ts";
```

Y al final del archivo agregar:

```typescript
// Etiqueta legible de una variante a partir de sus props ("k=v, k2=v2").
function etiquetaVariante(props: Record<string, string>): string {
  return Object.entries(props).map(([k, v]) => `${k}=${v}`).join(", ");
}

// Lista los elementos que cada variante tiene y el default no (clave tipo|nombre).
export function extraerCompleteAnatomy(set: SetNorm): ElementoAdicional[] {
  const varianteDefault = buscarVariante(set, set.defaultProps);
  if (!varianteDefault) return [];

  const defaultKeys = new Set(extraerAnatomy(varianteDefault.raiz).map((e) => `${e.tipo}|${e.nombre}`));
  const adicionales: ElementoAdicional[] = [];

  for (const variante of set.variantes) {
    if (mismasProps(variante.variantProperties, set.defaultProps)) continue;
    const etiqueta = etiquetaVariante(variante.variantProperties);
    for (const el of extraerAnatomy(variante.raiz)) {
      if (!defaultKeys.has(`${el.tipo}|${el.nombre}`)) {
        adicionales.push({ variante: etiqueta, nombre: el.nombre, tipo: el.tipo });
      }
    }
  }
  return adicionales;
}
```

(`buscarVariante` y `mismasProps` ya están disponibles en este archivo.)

- [ ] **Step 4: Correr para verificar que pasa**

Run: `npm test`
Expected: 2 tests nuevos PASAN (88 en total).

- [ ] **Step 5: Commit**

```bash
git add tests/complete-anatomy-extraccion.test.ts src/plugin/extraccion/properties.ts
git commit -m "feat: extraerCompleteAnatomy (elementos adicionales por variante)"
```

---

## Task 3: Generador `generarCompleteAnatomy`

**Files:**
- Create: `src/plugin/generadores/complete.ts`

- [ ] **Step 1: Implementar `src/plugin/generadores/complete.ts`**

```typescript
import type { ElementoAdicional } from "../modelo/tipos.ts";
import { frameVertical, texto } from "./frames.ts";

// Genera el output de Complete Anatomy: una línea por elemento adicional.
export async function generarCompleteAnatomy(nombre: string, adicionales: ElementoAdicional[]): Promise<FrameNode> {
  const specifications = frameVertical("Specifications", 128, 64);
  const spec = frameVertical(`${nombre} Spec`, 48);
  const seccion = frameVertical("Complete Anatomy", 64);

  specifications.appendChild(spec);
  spec.appendChild(await texto(nombre, 64));
  spec.appendChild(seccion);
  seccion.appendChild(await texto("Complete Anatomy", 48));

  if (adicionales.length === 0) {
    seccion.appendChild(await texto("No se detectaron elementos adicionales en otras variantes.", 16));
  }
  for (const a of adicionales) {
    seccion.appendChild(await texto(`${a.variante}: ${a.nombre} · ${a.tipo}`, 12));
  }

  figma.currentPage.appendChild(specifications);
  return specifications;
}
```

- [ ] **Step 2: Verificar que compila**

Run: `npx tsc --noEmit`
Expected: `TypeScript compilation completed`.

- [ ] **Step 3: Commit**

```bash
git add src/plugin/generadores/complete.ts
git commit -m "feat: generador de Complete Anatomy"
```

---

## Task 4: Octavo botón + rama complete en main

**Files:**
- Modify: `src/ui/index.html`
- Modify: `src/ui/ui.ts`
- Modify: `src/plugin/main.ts`

- [ ] **Step 1: Agregar el botón en `src/ui/index.html`**

Reemplazar la línea `<button id="twoway">Two-Way</button>` por:

```html
    <button id="twoway">Two-Way</button>
    <button id="complete">Complete Anatomy</button>
```

- [ ] **Step 2: Modificar `src/ui/ui.ts`**

Cambiar la firma de `generar`:

```typescript
function generar(seccion: "anatomy" | "properties" | "layout" | "data" | "styling" | "modes" | "twoway" | "complete"): void {
```

Y después de la línea `(document.getElementById("twoway") as HTMLButtonElement).onclick = () => generar("twoway");`, agregar:

```typescript
(document.getElementById("complete") as HTMLButtonElement).onclick = () => generar("complete");
```

- [ ] **Step 3: Agregar los imports en `src/plugin/main.ts`**

Después de la línea `import { generarDosWay } from "./generadores/properties.ts";`, agregar:

```typescript
import { extraerCompleteAnatomy } from "./extraccion/properties.ts";
import { generarCompleteAnatomy } from "./generadores/complete.ts";
```

- [ ] **Step 4: Subir el alto del panel**

Reemplazar `figma.showUI(__html__, { width: 280, height: 300 });` por:

```typescript
figma.showUI(__html__, { width: 280, height: 320 });
```

- [ ] **Step 5: Agregar la función `generarSeccionComplete`**

Después de la función `generarSeccionTwoWay` completa (antes de `figma.ui.onmessage`), agregar:

```typescript
async function generarSeccionComplete(nodo: SceneNode): Promise<void> {
  const componentSet = resolverComponentSet(nodo);
  if (!componentSet) {
    responder({ tipo: "resultado", ok: false, error: "Complete Anatomy necesita un componente con variantes." });
    return;
  }
  const setNorm = normalizarSet(componentSet);
  const adicionales = extraerCompleteAnatomy(setNorm);
  const frame = await generarCompleteAnatomy(componentSet.name, adicionales);
  finalizar(frame, nodo);
}
```

- [ ] **Step 6: Agregar la rama en el dispatcher**

Reemplazar:

```typescript
    else await generarSeccionTwoWay(nodo);
```

por:

```typescript
    else if (msg.seccion === "twoway") await generarSeccionTwoWay(nodo);
    else await generarSeccionComplete(nodo);
```

- [ ] **Step 7: Verificar que compila, buildea y los tests siguen verdes**

Run: `npx tsc --noEmit`
Expected: `TypeScript compilation completed`.

Run: `npm run build`
Expected: `build OK → dist/code.js + dist/ui.html`.

Run: `npm test`
Expected: `pass 88`, `fail 0`.

- [ ] **Step 8: Commit**

```bash
git add src/ui/index.html src/ui/ui.ts src/plugin/main.ts
git commit -m "feat: octavo boton Complete Anatomy y rama complete en main"
```

---

## Task 5: Verificación manual end-to-end en Figma

**Files:** ninguno (validación manual).

- [ ] **Step 1: Preparar un Component Set con una variante que tenga una capa extra**

En Figma: un componente con variantes donde **una variante tenga una capa que las otras no** (ej. un icono
que solo aparece en `Type=Secondary`).

- [ ] **Step 2: Recargar el plugin**

Run: `npm run build`
En Figma: Plugins → Development → Specs Plugin. Verificar que el panel muestra **ocho botones**.

- [ ] **Step 3: Caso feliz (Complete Anatomy)**

Seleccionar el Component Set → botón **"Complete Anatomy"**.
Expected: aparece `Specifications → [Nombre] Spec → Complete Anatomy` con una línea por cada elemento que
una variante tiene y el default no: `[variante]: [nombre] · [tipo]`. El output a la derecha. Panel:
"✓ Generado".

- [ ] **Step 4: Comparar contra la referencia del PRD**

Abrir `prd-images/6. Complete Anatomy and Layout/` y comparar. Anotar diferencias (Complete Layout,
artwork) como pulido — NO arreglarlas ahora.

- [ ] **Step 5: Verificar casos límite y que el resto siga funcionando**

- Component Set donde **ninguna** variante tiene capas extra → "No se detectaron elementos adicionales en otras variantes."
- Frame sin variantes → "Complete Anatomy necesita un componente con variantes."
- Los otros siete botones siguen andando.

- [ ] **Step 6: Commit de cierre (si hubo ajustes menores)**

```bash
git add -A
git commit -m "chore: verificacion end-to-end de Complete Anatomy en Figma"
```

---

## Resumen de cobertura del spec

| Sección del spec | Tarea(s) |
|------------------|----------|
| 1 — Modelo y extracción | Task 1 (tipos), Task 2 (extraerCompleteAnatomy) |
| 2 — Generador y botón | Task 3 (generador), Task 4 (UI + main) |
| 3 — Errores y casos límite | Task 2 (default null → []), Task 4 (validación) |
| 4 — Testing | Task 2 (unit), Task 5 (manual) |
