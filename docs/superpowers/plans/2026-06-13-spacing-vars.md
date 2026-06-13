# Variables de spacing resueltas — Plan de Implementación (Rebanada 35)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mostrar el nombre de la variable atada a padding e item-spacing junto a su valor resuelto en Layout and Spacing, según `docs/superpowers/specs/2026-06-13-spacing-vars-design.md`.

**Architecture:** `etiquetaSpacing` (puro, en `espaciado.ts`) combina nombre + valor. `spacingVars` viaja por `NodoLike`/`LayoutSpec`; el adaptador lo llena desde `boundVariables`. El exhibit usa el helper. Sin cambios de UI.

**Tech Stack:** TypeScript sin dependencias, `node --test`, esbuild.

---

### Task 1: `etiquetaSpacing` — TDD

**Files:** Modify `src/plugin/utils/espaciado.ts`; Test `tests/espaciado.test.ts`.

- [ ] Tests que fallan:

```typescript
import { etiquetaSpacing } from "../src/plugin/utils/espaciado.ts";

test("etiquetaSpacing: sin variable es solo el valor", () => {
  assert.equal(etiquetaSpacing(8, "px"), "8");
  assert.equal(etiquetaSpacing(16, "rem"), "1rem");
});

test("etiquetaSpacing: con variable es nombre + valor", () => {
  assert.equal(etiquetaSpacing(8, "px", "DS Space/item-spacing/0_5x"), "DS Space/item-spacing/0_5x (8)");
  assert.equal(etiquetaSpacing(16, "rem", "DS Space/padding/1x"), "DS Space/padding/1x (1rem)");
});
```

- [ ] Implementar en `espaciado.ts` (después de `formatearEspaciado`):

```typescript
// "16" / "1rem" sin variable; "DS Space/padding/1x (16)" con variable.
export function etiquetaSpacing(px: number, unidad: Unidad, nombreVar?: string): string {
  const v = formatearEspaciado(px, unidad);
  return nombreVar ? `${nombreVar} (${v})` : v;
}
```

- [ ] Suite verde → commit `feat: etiquetaSpacing para variables de spacing`.

### Task 2: Modelo y extracción — TDD

**Files:** Modify `modelo/tipos.ts` (`NodoLike`, `LayoutSpec`), `extraccion/layout.ts`, `extraccion/adaptador.ts`; Test `tests/layout-extraccion.test.ts`.

- [ ] Test que falla (passthrough): nodo con `spacingVars: { paddingLeft: "DS/p", itemSpacing: "DS/g" }` → `extraerLayout(raiz)[0].spacingVars` igual; y el `deepEqual` del primer test suma `spacingVars: {}`.

```typescript
test("spacingVars del nodo pasan al spec", () => {
  const raiz: NodoLike = {
    id: "r", name: "Row", type: "FRAME", layoutMode: "HORIZONTAL",
    spacingVars: { paddingLeft: "DS Space/padding/1x", itemSpacing: "DS Space/gap" },
    children: [],
  };
  assert.deepEqual(extraerLayout(raiz)[0].spacingVars, {
    paddingLeft: "DS Space/padding/1x", itemSpacing: "DS Space/gap",
  });
});
```

- [ ] `NodoLike` += `spacingVars?: { paddingLeft?: string; paddingTop?: string; paddingRight?: string; paddingBottom?: string; itemSpacing?: string };`
- [ ] `LayoutSpec` += `spacingVars: { paddingLeft?: string; paddingTop?: string; paddingRight?: string; paddingBottom?: string; itemSpacing?: string };`
- [ ] `layoutSpecDe` += `spacingVars: nodo.spacingVars ?? {},` y actualizar el `deepEqual` del test existente con `spacingVars: {}`.
- [ ] Adaptador: dentro del bloque Auto Layout, antes de cerrar, agregar:

```typescript
    const bvLayout = (nodo.boundVariables ?? {}) as Record<string, VariableAlias | undefined>;
    const sv: NonNullable<NodoLike["spacingVars"]> = {};
    for (const campo of ["paddingLeft", "paddingTop", "paddingRight", "paddingBottom", "itemSpacing"] as const) {
      const alias = bvLayout[campo];
      if (alias) {
        const nombre = nombreVariable(alias.id);
        if (nombre) sv[campo] = nombre;
      }
    }
    if (Object.keys(sv).length > 0) base.spacingVars = sv;
```

- [ ] Suite verde + build → commit `feat: extraer variables de spacing del nodo`.

### Task 3: Generador — exhibit con etiquetas

**Files:** Modify `src/plugin/generadores/layout.ts` (función `exhibit`).

- [ ] Importar `etiquetaSpacing` de `../utils/espaciado.ts` (junto a `formatearEspaciado, unidadActual`).
- [ ] En `exhibit`, reemplazar las líneas de Padding e Item spacing por:

```typescript
  const sv = spec.spacingVars;
  const Et = (n: number, nombre?: string) => etiquetaSpacing(n, unidadActual(), nombre);
  fila.appendChild(await texto(`Padding: L${Et(p.left, sv.paddingLeft)} T${Et(p.top, sv.paddingTop)} R${Et(p.right, sv.paddingRight)} B${Et(p.bottom, sv.paddingBottom)}`, 12));
  fila.appendChild(await texto(`Item spacing: ${Et(spec.itemSpacing, sv.itemSpacing)}`, 12));
```

(La constante `E` previa puede quedar si la usa otra línea; si no, se elimina.)

- [ ] Build + suite → commit `feat: exhibit de Layout muestra variables de padding e item-spacing`.

### Task 4: Verificación

`npm run build && node --test` verdes. Manual: frame con padding/item-spacing atados a variables →
nombre + valor; sin variable → solo el valor; con Units = rem.
