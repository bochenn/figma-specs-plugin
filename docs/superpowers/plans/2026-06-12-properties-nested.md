# Properties de instancias anidadas — Plan de Implementación (Rebanada 29)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Con el toggle "Spec nested subcomponents" activo, el botón Properties documenta también los component sets de las instancias anidadas (una sección por set, debajo de la principal), según `docs/superpowers/specs/2026-06-12-properties-nested-design.md`.

**Architecture:** Refactor del generador al patrón de Anatomy: un helper `specDeProperties` que construye el frame `"{nombre} Spec"` reutilizable, `generarProperties` que lo usa para el caso simple y `generarPropertiesConNested` que apila el principal + los anidados. En `main.ts`, un helper `setsAnidados` recolecta los sets de las instancias de la variante default (dedupe por id, descarta sin variantes y auto-referencia). No hay lógica pura nueva: la extracción existente no se toca y la verificación es manual.

**Tech Stack:** TypeScript sin dependencias, API de plugins de Figma, `node --test`, esbuild (`npm run build`).

---

## Estructura de archivos

- **Modificar** `src/plugin/generadores/properties.ts:135-183` — extraer `specDeProperties`, agregar `generarPropertiesConNested`.
- **Modificar** `src/plugin/main.ts` — `setsAnidados`, parámetro `nested` en `generarSeccionProperties`, dispatch.

---

### Task 1: Refactor del generador — `specDeProperties` + `generarPropertiesConNested`

Refactor sin cambio de comportamiento (el output de `generarProperties` queda idéntico) más la
función nueva. Se valida con build + suite completa.

**Files:**
- Modify: `src/plugin/generadores/properties.ts:135-183`

- [ ] **Step 1: Extraer el helper y reescribir `generarProperties`**

Reemplazar la función `generarProperties` completa (líneas 135-183) por:

```typescript
// Construye el frame "{nombre} Spec" completo de un component set: título +
// sección Properties (subsección por propiedad de variante + booleans).
async function specDeProperties(
  componentSet: ComponentSetNode,
  propiedades: PropiedadSpec[],
  defaultProps: Record<string, string>,
  columnas: number,
): Promise<FrameNode> {
  const spec = frameVertical(`${componentSet.name} Spec`, 48);
  const seccion = frameVertical("Properties", 64);

  spec.appendChild(await texto(componentSet.name, 64));
  spec.appendChild(seccion);
  seccion.appendChild(await texto("Properties", 48));

  if (propiedades.length === 0) {
    seccion.appendChild(await texto("Sin propiedades de variante para comparar", 16));
  }

  for (const prop of propiedades) {
    const subseccion = frameVertical(prop.nombre, 40);
    subseccion.appendChild(await texto(prop.nombre, 36));
    const bloques: FrameNode[] = [];
    for (const opcion of prop.opciones) {
      const bloque = frameVertical(opcion.nombre, 16);
      bloque.appendChild(await texto(opcion.nombre, 24));
      const target = { ...defaultProps, [prop.nombre]: opcion.nombre };
      bloque.appendChild(await displayOpcion(componentSet, target, opcion.cambios));
      bloques.push(bloque);
    }
    if (columnas > 1) {
      subseccion.appendChild(enColumnas(bloques, columnas));
    } else {
      for (const b of bloques) subseccion.appendChild(b);
    }
    seccion.appendChild(subseccion);
  }

  const defs = componentSet.componentPropertyDefinitions;
  for (const clave of Object.keys(defs)) {
    if (defs[clave].type === "BOOLEAN") {
      seccion.appendChild(await subseccionBoolean(componentSet, nombrePropiedad(clave), clave));
    }
  }

  return spec;
}

// Genera el output de Properties. Devuelve el frame Specifications creado.
export async function generarProperties(
  componentSet: ComponentSetNode,
  propiedades: PropiedadSpec[],
  defaultProps: Record<string, string>,
  columnas: number,
): Promise<FrameNode> {
  const specifications = frameVertical("Specifications", 128, 64);
  specifications.appendChild(await specDeProperties(componentSet, propiedades, defaultProps, columnas));
  figma.currentPage.appendChild(specifications);
  return specifications;
}

// Properties de un set anidado, ya extraídas.
export interface PropertiesDeSet {
  set: ComponentSetNode;
  propiedades: PropiedadSpec[];
  defaultProps: Record<string, string>;
}

// Genera Properties del set principal + una sección por cada set anidado.
export async function generarPropertiesConNested(
  componentSet: ComponentSetNode,
  propiedades: PropiedadSpec[],
  defaultProps: Record<string, string>,
  columnas: number,
  nested: PropertiesDeSet[],
): Promise<FrameNode> {
  const specifications = frameVertical("Specifications", 128, 64);
  specifications.appendChild(await specDeProperties(componentSet, propiedades, defaultProps, columnas));
  for (const n of nested) {
    specifications.appendChild(await specDeProperties(n.set, n.propiedades, n.defaultProps, columnas));
  }
  figma.currentPage.appendChild(specifications);
  return specifications;
}
```

- [ ] **Step 2: Build y suite**

Run: `npm run build && node --test`
Expected: build OK, 240 tests PASS (es un refactor: nada de la suite depende del generador).

- [ ] **Step 3: Commit**

```bash
git add src/plugin/generadores/properties.ts
git commit -m "refactor: specDeProperties reutilizable + generarPropertiesConNested"
```

---

### Task 2: Recolección y dispatch en `main.ts`

**Files:**
- Modify: `src/plugin/main.ts` (import de generadores, helper `setsAnidados`, `generarSeccionProperties`, dispatch)

- [ ] **Step 1: Import**

En `src/plugin/main.ts`, reemplazar:

```typescript
import { generarProperties } from "./generadores/properties.ts";
```

por:

```typescript
import { generarProperties, generarPropertiesConNested } from "./generadores/properties.ts";
```

(Es la línea 12; el import actual trae solo `generarProperties`.)

- [ ] **Step 2: Helper `setsAnidados`**

Debajo de la función `instanciasAnidadas` (después de `main.ts:77`), agregar:

```typescript
// Component sets de las instancias anidadas (en la variante default), sin
// repetidos, sin el set principal y sin componentes que no tengan variantes.
function setsAnidados(componentSet: ComponentSetNode): ComponentSetNode[] {
  const raiz = componentSet.defaultVariant ?? componentSet;
  const res: ComponentSetNode[] = [];
  const vistos = new Set<string>([componentSet.id]);
  for (const inst of instanciasAnidadas(raiz)) {
    const set = resolverComponentSet(inst);
    if (!set || vistos.has(set.id)) continue;
    vistos.add(set.id);
    res.push(set);
  }
  return res;
}
```

- [ ] **Step 3: `generarSeccionProperties` con `nested`**

Reemplazar la función `generarSeccionProperties` completa por:

```typescript
async function generarSeccionProperties(nodo: SceneNode, columnas: number, nested: boolean): Promise<void> {
  const componentSet = resolverComponentSet(nodo);
  if (!componentSet) {
    responder({ tipo: "resultado", ok: false, error: "Properties necesita un componente con variantes." });
    return;
  }
  const setNorm = normalizarSet(componentSet);
  const specs = extraerProperties(setNorm);
  let frame: FrameNode;
  if (nested) {
    const nestedSpecs = setsAnidados(componentSet).map((set) => {
      const norm = normalizarSet(set);
      return { set, propiedades: extraerProperties(norm), defaultProps: norm.defaultProps };
    });
    frame = await generarPropertiesConNested(componentSet, specs, setNorm.defaultProps, columnas, nestedSpecs);
  } else {
    frame = await generarProperties(componentSet, specs, setNorm.defaultProps, columnas);
  }
  finalizar(frame, nodo);
}
```

- [ ] **Step 4: Dispatch**

En el `figma.ui.onmessage`, reemplazar:

```typescript
    else if (msg.seccion === "properties") await generarSeccionProperties(nodo, columnas);
```

por:

```typescript
    else if (msg.seccion === "properties") await generarSeccionProperties(nodo, columnas, msg.nested ?? false);
```

- [ ] **Step 5: Build y suite**

Run: `npm run build && node --test`
Expected: build OK, 240 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/plugin/main.ts
git commit -m "feat: Properties documenta los sets de instancias anidadas con Spec nested"
```

---

### Task 3: Verificación final

- [ ] **Step 1: Suite completa + build**

Run: `npm run build && node --test`
Expected: build OK, 240 tests PASS (sin tests nuevos: no hay lógica pura nueva).

- [ ] **Step 2: Verificación manual en Figma (la hace el usuario)**

1. Component set A (con variantes) que contiene una instancia de un component set B (con variantes)
   → Properties con `Spec nested` ON → sección Properties de A y debajo la de B completa.
2. `Spec nested` OFF → solo A (output idéntico al actual).
3. Instancia de un componente sin variantes dentro de A → no genera sección.
4. Dos instancias del mismo set B dentro de A → una sola sección de B.
5. Columns = 2 → las opciones de cada set se reparten en columnas como hoy.

- [ ] **Step 3: Ajustes si hacen falta**

```bash
git add -A
git commit -m "fix: ajustes de Properties nested"
```
