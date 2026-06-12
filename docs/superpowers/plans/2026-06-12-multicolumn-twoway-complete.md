# Multi-column en Two-Way y Complete — Plan de Implementación (Rebanada 30)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que el selector Columns funcione en Two-Way (combinaciones) y Complete A/L (anatomy agrupada por variante + layout por variante), según `docs/superpowers/specs/2026-06-12-multicolumn-twoway-complete-design.md`.

**Architecture:** Una función pura nueva (`agruparPorVariante` en `utils/agrupar-variante.ts`, testeada) agrupa los `ElementoAdicional` por variante. Los generadores `generarDosWay` y `generarComplete` ganan el parámetro `columnas` y reparten sus bloques con el `enColumnas` existente. `main.ts` les pasa la variable `columnas` que ya calcula.

**Tech Stack:** TypeScript sin dependencias, API de plugins de Figma, `node --test`, esbuild (`npm run build`).

---

## Estructura de archivos

- **Crear** `src/plugin/utils/agrupar-variante.ts` — agrupado puro.
- **Modificar** `src/plugin/generadores/properties.ts` (función `generarDosWay`).
- **Modificar** `src/plugin/generadores/complete.ts` (función `generarComplete` completa).
- **Modificar** `src/plugin/main.ts` (dos call sites + dispatch).
- **Crear** `tests/agrupar-variante.test.ts`.

---

### Task 1: Agrupado puro — `agruparPorVariante`

**Files:**
- Create: `src/plugin/utils/agrupar-variante.ts`
- Test: `tests/agrupar-variante.test.ts`

- [ ] **Step 1: Escribir los tests que fallan**

Crear `tests/agrupar-variante.test.ts`:

```typescript
import { test } from "node:test";
import assert from "node:assert";
import { agruparPorVariante } from "../src/plugin/utils/agrupar-variante.ts";

test("agrupa por variante preservando el orden de primera aparición", () => {
  const elementos = [
    { variante: "Size=M", nombre: "Icon", tipo: "INSTANCE" },
    { variante: "Size=L", nombre: "Badge", tipo: "FRAME" },
    { variante: "Size=M", nombre: "Label", tipo: "TEXT" },
  ];
  assert.deepEqual(agruparPorVariante(elementos), [
    {
      variante: "Size=M",
      elementos: [
        { variante: "Size=M", nombre: "Icon", tipo: "INSTANCE" },
        { variante: "Size=M", nombre: "Label", tipo: "TEXT" },
      ],
    },
    {
      variante: "Size=L",
      elementos: [{ variante: "Size=L", nombre: "Badge", tipo: "FRAME" }],
    },
  ]);
});

test("lista vacía → []", () => {
  assert.deepEqual(agruparPorVariante([]), []);
});
```

- [ ] **Step 2: Correr los tests y verificar que fallan**

Run: `node --test tests/agrupar-variante.test.ts`
Expected: FAIL — `Cannot find module .../utils/agrupar-variante.ts`.

- [ ] **Step 3: Implementar**

Crear `src/plugin/utils/agrupar-variante.ts`:

```typescript
import type { ElementoAdicional } from "../modelo/tipos.ts";

export interface GrupoVariante {
  variante: string;
  elementos: ElementoAdicional[];
}

// Agrupa los elementos adicionales por variante, preservando el orden de
// primera aparición.
export function agruparPorVariante(elementos: ElementoAdicional[]): GrupoVariante[] {
  const grupos: GrupoVariante[] = [];
  for (const el of elementos) {
    const grupo = grupos.find((g) => g.variante === el.variante);
    if (grupo) grupo.elementos.push(el);
    else grupos.push({ variante: el.variante, elementos: [el] });
  }
  return grupos;
}
```

- [ ] **Step 4: Correr los tests y verificar que pasan**

Run: `node --test tests/agrupar-variante.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/plugin/utils/agrupar-variante.ts tests/agrupar-variante.test.ts
git commit -m "feat: agruparPorVariante para Complete Anatomy"
```

---

### Task 2: `generarDosWay` con columnas

Generador impuro: se valida con build + suite + verificación manual.

**Files:**
- Modify: `src/plugin/generadores/properties.ts` (función `generarDosWay`)

- [ ] **Step 1: Agregar el parámetro y repartir en columnas**

En `src/plugin/generadores/properties.ts`, reemplazar la función `generarDosWay` completa por:

```typescript
// Genera el output de Two-Way: una combinación por bloque (artwork + cambios).
export async function generarDosWay(
  componentSet: ComponentSetNode,
  dosway: DosWaySpec,
  defaultProps: Record<string, string>,
  columnas: number,
): Promise<FrameNode> {
  const specifications = frameVertical("Specifications", 128, 64);
  const spec = frameVertical(`${componentSet.name} Spec`, 48);
  const seccion = frameVertical("Two-Way", 64);

  specifications.appendChild(spec);
  spec.appendChild(await texto(componentSet.name, 64));
  spec.appendChild(seccion);
  seccion.appendChild(await texto("Two-Way", 48));
  seccion.appendChild(await texto(`${dosway.prop1} × ${dosway.prop2}`, 24));

  const bloques: FrameNode[] = [];
  for (const comb of dosway.combinaciones) {
    const bloque = frameVertical(`${comb.valor1} + ${comb.valor2}`, 16);
    bloque.appendChild(await texto(`${comb.valor1} + ${comb.valor2}`, 24));
    const target = { ...defaultProps, [dosway.prop1]: comb.valor1, [dosway.prop2]: comb.valor2 };
    bloque.appendChild(await displayOpcion(componentSet, target, comb.cambios));
    bloques.push(bloque);
  }
  if (columnas > 1) {
    seccion.appendChild(enColumnas(bloques, columnas));
  } else {
    for (const b of bloques) seccion.appendChild(b);
  }

  figma.currentPage.appendChild(specifications);
  return specifications;
}
```

- [ ] **Step 2: Actualizar el call site en `main.ts`**

En `src/plugin/main.ts`, en `generarSeccionTwoWay`, cambiar la firma y la llamada:

```typescript
async function generarSeccionTwoWay(nodo: SceneNode, columnas: number): Promise<void> {
```

y reemplazar:

```typescript
  const frame = await generarDosWay(componentSet, dosway, setNorm.defaultProps);
```

por:

```typescript
  const frame = await generarDosWay(componentSet, dosway, setNorm.defaultProps, columnas);
```

En el dispatch, reemplazar:

```typescript
    else if (msg.seccion === "twoway") await generarSeccionTwoWay(nodo);
```

por:

```typescript
    else if (msg.seccion === "twoway") await generarSeccionTwoWay(nodo, columnas);
```

- [ ] **Step 3: Build y suite**

Run: `npm run build && node --test`
Expected: build OK, todos PASS.

- [ ] **Step 4: Commit**

```bash
git add src/plugin/generadores/properties.ts src/plugin/main.ts
git commit -m "feat: Two-Way reparte las combinaciones en columnas"
```

---

### Task 3: `generarComplete` con columnas y anatomy agrupada

**Files:**
- Modify: `src/plugin/generadores/complete.ts` (archivo completo)
- Modify: `src/plugin/main.ts` (call site + dispatch)

- [ ] **Step 1: Reescribir `generarComplete`**

Reemplazar el contenido completo de `src/plugin/generadores/complete.ts` por:

```typescript
import type { ElementoAdicional, VarianteLayout } from "../modelo/tipos.ts";
import { frameVertical, texto, enColumnas } from "./frames.ts";
import { agruparPorVariante } from "../utils/agrupar-variante.ts";

// Apila los bloques o los reparte en columnas según el selector.
function agregarBloques(seccion: FrameNode, bloques: FrameNode[], columnas: number): void {
  if (bloques.length === 0) return;
  if (columnas > 1) {
    seccion.appendChild(enColumnas(bloques, columnas));
  } else {
    for (const b of bloques) seccion.appendChild(b);
  }
}

// Genera el output de Complete (Anatomy + Layout): elementos adicionales por
// variante y variantes con Auto Layout de la raíz distinto al default.
export async function generarComplete(
  nombre: string,
  anatomy: ElementoAdicional[],
  layout: VarianteLayout[],
  columnas: number,
): Promise<FrameNode> {
  const specifications = frameVertical("Specifications", 128, 64);
  const spec = frameVertical(`${nombre} Spec`, 48);
  specifications.appendChild(spec);
  spec.appendChild(await texto(nombre, 64));

  // Complete Anatomy: un bloque por variante con sus elementos adicionales.
  const secA = frameVertical("Complete Anatomy", 64);
  spec.appendChild(secA);
  secA.appendChild(await texto("Complete Anatomy", 48));
  if (anatomy.length === 0) {
    secA.appendChild(await texto("No se detectaron elementos adicionales en otras variantes.", 16));
  }
  const bloquesA: FrameNode[] = [];
  for (const grupo of agruparPorVariante(anatomy)) {
    const bloque = frameVertical(grupo.variante, 4);
    bloque.appendChild(await texto(grupo.variante, 16));
    for (const el of grupo.elementos) {
      bloque.appendChild(await texto(`${el.nombre} · ${el.tipo}`, 12));
    }
    bloquesA.push(bloque);
  }
  agregarBloques(secA, bloquesA, columnas);

  // Complete Layout: un bloque por variante.
  const secL = frameVertical("Complete Layout", 64);
  spec.appendChild(secL);
  secL.appendChild(await texto("Complete Layout", 48));
  if (layout.length === 0) {
    secL.appendChild(await texto("No se detectaron layouts adicionales en otras variantes.", 16));
  }
  const bloquesL: FrameNode[] = [];
  for (const v of layout) {
    const s = v.spec;
    const dir = s.direccion === "HORIZONTAL" ? "Horizontal" : "Vertical";
    const bloque = frameVertical(v.variante, 4);
    bloque.appendChild(await texto(v.variante, 16));
    bloque.appendChild(await texto(
      `Direction: ${dir} · Align: ${s.alineacionPrimaria}/${s.alineacionContraria} · Resize: ${s.resizingHorizontal}×${s.resizingVertical} · Padding: L${s.padding.left} T${s.padding.top} R${s.padding.right} B${s.padding.bottom} · Item spacing: ${s.itemSpacing}`,
      12,
    ));
    bloquesL.push(bloque);
  }
  agregarBloques(secL, bloquesL, columnas);

  figma.currentPage.appendChild(specifications);
  return specifications;
}
```

- [ ] **Step 2: Actualizar el call site en `main.ts`**

En `generarSeccionComplete`, cambiar la firma y la llamada:

```typescript
async function generarSeccionComplete(nodo: SceneNode, columnas: number): Promise<void> {
```

y reemplazar:

```typescript
  const frame = await generarComplete(componentSet.name, anatomy, layout);
```

por:

```typescript
  const frame = await generarComplete(componentSet.name, anatomy, layout, columnas);
```

En el dispatch, reemplazar:

```typescript
    else await generarSeccionComplete(nodo);
```

por:

```typescript
    else await generarSeccionComplete(nodo, columnas);
```

- [ ] **Step 3: Build y suite**

Run: `npm run build && node --test`
Expected: build OK, todos PASS.

- [ ] **Step 4: Commit**

```bash
git add src/plugin/generadores/complete.ts src/plugin/main.ts
git commit -m "feat: Complete A/L con columnas y anatomy agrupada por variante"
```

---

### Task 4: Verificación final

- [ ] **Step 1: Suite completa + build**

Run: `npm run build && node --test`
Expected: build OK, ~242 tests PASS (2 nuevos de agrupar-variante).

- [ ] **Step 2: Verificación manual en Figma (la hace el usuario)**

Component set con 2+ propiedades de variante y elementos/layouts adicionales en algunas variantes:

1. Two-Way con Columns = 1 → combinaciones apiladas (igual que hoy); Columns = 2 → repartidas.
2. Complete A/L con Columns = 1 → anatomy en bloques por variante (título + `nombre · tipo`),
   layout apilado como hoy; Columns = 2 → ambos repartidos.
3. Properties, Layout y Modes → sin cambios.

- [ ] **Step 3: Ajustes si hacen falta**

```bash
git add -A
git commit -m "fix: ajustes de multi-column en Two-Way/Complete"
```
