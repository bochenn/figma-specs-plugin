# Hide outer layout annotations — Plan de Implementación (Rebanada 33)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Toggle "Hide outer layout" que omite la fila del contenedor raíz en Layout and Spacing, según `docs/superpowers/specs/2026-06-12-hide-outer-layout-design.md`.

**Architecture:** Un checkbox nuevo viaja como `hideOuter` por `MensajeUI` hasta `generarLayout`, que arranca el bucle de filas en 1 cuando el primer contenedor es la selección misma (igualdad de referencia). El mensaje de vacío pasa a depender de las filas construidas. Sin lógica pura nueva; verificación manual.

**Tech Stack:** TypeScript sin dependencias, API de plugins de Figma, `node --test`, esbuild.

---

## Estructura de archivos

- **Modificar** `src/ui/index.html`, `src/ui/ui.ts`, `src/plugin/modelo/tipos.ts` (plumbing).
- **Modificar** `src/plugin/generadores/layout.ts:173-205` y `src/plugin/main.ts:137,229`.

---

### Task 1: Plumbing — checkbox, mensaje y main

**Files:**
- Modify: `src/ui/index.html` (toggles), `src/ui/ui.ts`, `src/plugin/modelo/tipos.ts` (`MensajeUI`), `src/plugin/main.ts:137,229`

- [ ] **Step 1: Checkbox en la UI**

En `src/ui/index.html`, después de la línea del checkbox `tabla` (`Tabular anatomy`), agregar:

```html
    <label><input type="checkbox" id="hideOuter" /> Hide outer layout</label>
```

En `src/ui/ui.ts`, junto a las demás referencias, agregar:

```typescript
const hideOuterCheck = document.getElementById("hideOuter") as HTMLInputElement;
```

y en el `postMessage`, agregar al objeto `pluginMessage` el campo:

```typescript
hideOuter: hideOuterCheck.checked,
```

(va junto a `tabla: tablaCheck.checked`, el orden no importa).

- [ ] **Step 2: Campo en `MensajeUI`**

En `src/plugin/modelo/tipos.ts`, dentro del type `MensajeUI`, agregar después de `tabla?: boolean;`:

```typescript
hideOuter?: boolean;
```

(es un type de una línea: insertar `hideOuter?: boolean; ` en la posición equivalente).

- [ ] **Step 3: `main.ts`**

Reemplazar la firma (línea 137):

```typescript
async function generarSeccionLayout(nodo: SceneNode, columnas: number): Promise<void> {
```

por:

```typescript
async function generarSeccionLayout(nodo: SceneNode, columnas: number, hideOuter: boolean): Promise<void> {
```

la llamada interna:

```typescript
  const frame = await generarLayout(nodo, specs, columnas);
```

por:

```typescript
  const frame = await generarLayout(nodo, specs, columnas, hideOuter);
```

y el dispatch (línea 229):

```typescript
    else if (msg.seccion === "layout") await generarSeccionLayout(nodo, columnas);
```

por:

```typescript
    else if (msg.seccion === "layout") await generarSeccionLayout(nodo, columnas, msg.hideOuter ?? false);
```

- [ ] **Step 4: Commit (el build falla hasta la Task 2: generarLayout aún no acepta el parámetro — hacer las dos tasks seguidas y buildear al final de la Task 2)**

```bash
git add src/ui/index.html src/ui/ui.ts src/plugin/modelo/tipos.ts src/plugin/main.ts
git commit -m "feat: toggle Hide outer layout en la UI y plumbing"
```

---

### Task 2: `generarLayout` salta la fila del raíz

**Files:**
- Modify: `src/plugin/generadores/layout.ts:173-201`

- [ ] **Step 1: Parámetro y salto**

Reemplazar la firma:

```typescript
export async function generarLayout(seleccionado: SceneNode, specs: LayoutSpec[], columnas: number): Promise<FrameNode> {
```

por:

```typescript
export async function generarLayout(seleccionado: SceneNode, specs: LayoutSpec[], columnas: number, hideOuter: boolean): Promise<FrameNode> {
```

y reemplazar el bloque `if (specs.length === 0) { ... } else { ... }` completo (líneas 185-201) por:

```typescript
  // Con hideOuter, se omite la fila del raíz (solo si la selección misma es el
  // primer contenedor; recorrerAutoLayout devuelve los nodos reales).
  const inicio = hideOuter && contenedores.length > 0 && (contenedores[0] as SceneNode) === seleccionado ? 1 : 0;
  const filas: FrameNode[] = [];
  const n = Math.min(contenedores.length, specs.length);
  for (let i = inicio; i < n; i++) {
    const fila = frameHorizontal(`Layout ${specs[i].elementoNombre}`, 48);
    fila.appendChild(await artworkDe(contenedores[i], specs[i]));
    fila.appendChild(await exhibit(specs[i]));
    filas.push(fila);
  }
  if (filas.length === 0) {
    seccion.appendChild(await texto("No se detectaron capas con Auto Layout.", 16));
  } else if (columnas > 1) {
    seccion.appendChild(enColumnas(filas, columnas));
  } else {
    for (const f of filas) seccion.appendChild(f);
  }
```

(Nota: el mensaje de vacío ahora depende de `filas.length`, lo que cubre tanto `specs.length === 0`
como el caso "raíz único + hideOuter".)

- [ ] **Step 2: Build y suite**

Run: `npm run build && node --test`
Expected: build OK, 243 tests PASS.

- [ ] **Step 3: Commit**

```bash
git add src/plugin/generadores/layout.ts
git commit -m "feat: Hide outer layout omite la fila del contenedor raíz"
```

---

### Task 3: Verificación final

- [ ] **Step 1: Suite completa + build**

Run: `npm run build && node --test`
Expected: build OK, 243 tests PASS (sin tests nuevos).

- [ ] **Step 2: Verificación manual en Figma (la hace el usuario)**

1. Componente anidado → `Hide outer layout` ON → Layout & Spacing sin la fila del raíz, solo los
   anidados.
2. Frame raíz único con Auto Layout → ON → "No se detectaron capas con Auto Layout."
3. Toggle OFF → output idéntico al actual.
4. El toggle no afecta a las demás secciones.

- [ ] **Step 3: Ajustes si hacen falta**

```bash
git add -A
git commit -m "fix: ajustes de Hide outer layout"
```
