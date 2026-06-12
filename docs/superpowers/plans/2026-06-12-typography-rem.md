# Typography en rem — Plan de Implementación (Rebanada 31)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que el selector Units (px/rem) alcance a font-size, line-height y letter-spacing en typography, según `docs/superpowers/specs/2026-06-12-typography-rem-design.md`.

**Architecture:** Un helper interno `valorPx(n, conSufijo)` en `utils/tipografia.ts` emite los valores px según `unidadActual()` (estado de módulo de `espaciado.ts`): en px todo queda como hoy; en rem, ÷16 con sufijo `rem`. `formatearTipografia` reemplaza sus seis emisiones px por el helper. Sin cambios de firma, UI ni plumbing.

**Tech Stack:** TypeScript sin dependencias, `node --test`, esbuild (`npm run build`).

---

## Estructura de archivos

- **Modificar** `src/plugin/utils/tipografia.ts` — helper + reemplazos en `formatearTipografia`.
- **Modificar** `tests/tipografia.test.ts` — casos rem.

---

### Task 1: `formatearTipografia` respeta la unidad actual

**Files:**
- Modify: `src/plugin/utils/tipografia.ts:1-25`
- Test: `tests/tipografia.test.ts`

- [ ] **Step 1: Escribir los tests que fallan**

Agregar al final de `tests/tipografia.test.ts` (y el import nuevo junto a los existentes):

```typescript
import { aplicarUnidad } from "../src/plugin/utils/espaciado.ts";
```

```typescript
test("con Units=rem, Plain convierte size, line-height y letter-spacing", () => {
  aplicarUnidad("rem");
  assert.equal(
    formatearTipografia({ family: "Inter", style: "Regular", size: 16, lineHeight: { unidad: "px", valor: 24 }, letterSpacing: { unidad: "px", valor: 4 } }, "Plain"),
    "Inter Regular 1rem / 1.5rem · LS 0.25rem",
  );
  aplicarUnidad("px");
});

test("con Units=rem, CSS convierte size, line-height y letter-spacing", () => {
  aplicarUnidad("rem");
  assert.equal(
    formatearTipografia({ family: "Inter", style: "Regular", size: 16, lineHeight: { unidad: "px", valor: 24 }, letterSpacing: { unidad: "px", valor: 4 } }, "CSS"),
    "1rem/1.5rem Regular Inter · LS 0.25rem",
  );
  aplicarUnidad("px");
});

test("con Units=rem, percent y auto quedan intactos", () => {
  aplicarUnidad("rem");
  assert.equal(
    formatearTipografia({ family: "Inter", style: "Regular", size: 16, lineHeight: { unidad: "percent", valor: 150 } }, "Plain"),
    "Inter Regular 1rem / 150%",
  );
  assert.equal(
    formatearTipografia({ family: "Inter", style: "Regular", size: 16, lineHeight: { unidad: "auto" }, letterSpacing: { unidad: "percent", valor: 5 } }, "CSS"),
    "1rem Regular Inter · LS 5%",
  );
  aplicarUnidad("px");
});
```

- [ ] **Step 2: Correr los tests y verificar que fallan**

Run: `node --test tests/tipografia.test.ts`
Expected: FAIL — los 3 tests nuevos (la función todavía emite px fijos); los 7 existentes PASAN.

- [ ] **Step 3: Implementar**

En `src/plugin/utils/tipografia.ts`, reemplazar las líneas 1-25 por:

```typescript
import type { FormatoTipo, AlturaLinea, EspaciadoLetra } from "../modelo/tipos.ts";
import { formatearEspaciado, unidadActual } from "./espaciado.ts";

// Valor en px formateado según la unidad actual:
// px → "16" (Plain) o "16px" (CSS); rem → "1rem" en ambos.
function valorPx(n: number, conSufijo: boolean): string {
  if (unidadActual() === "rem") return formatearEspaciado(n, "rem");
  return conSufijo ? `${n}px` : String(n);
}

// Formatea la tipografía de un nodo (line-height y letter-spacing incluidos) según el formato elegido.
export function formatearTipografia(
  t: { family: string; style: string; size: number; lineHeight?: AlturaLinea; letterSpacing?: EspaciadoLetra },
  formato: FormatoTipo,
): string {
  const lh = t.lineHeight;
  const ls = t.letterSpacing;
  if (formato === "CSS") {
    let medida = valorPx(t.size, true);
    if (lh && lh.unidad === "px") medida += `/${valorPx(lh.valor, true)}`;
    else if (lh && lh.unidad === "percent") medida += `/${lh.valor}%`;
    let s = `${medida} ${t.style} ${t.family}`;
    if (ls) s += ` · LS ${ls.unidad === "percent" ? `${ls.valor}%` : valorPx(ls.valor, true)}`;
    return s;
  }
  let s = `${t.family} ${t.style} ${valorPx(t.size, false)}`;
  if (lh) {
    const lhStr = lh.unidad === "auto" ? "auto" : lh.unidad === "percent" ? `${lh.valor}%` : valorPx(lh.valor, false);
    s += ` / ${lhStr}`;
  }
  if (ls) s += ` · LS ${ls.unidad === "percent" ? `${ls.valor}%` : valorPx(ls.valor, false)}`;
  return s;
}
```

(El resto del archivo — `aplicarFormatoTipo`/`formatoTipoActual` — queda igual.)

- [ ] **Step 4: Correr la suite completa y verificar que pasa**

Run: `node --test`
Expected: PASS (245 tests: 242 + 3 nuevos; los existentes de px no cambian porque con `px` el
helper emite lo mismo que antes).

- [ ] **Step 5: Commit**

```bash
git add src/plugin/utils/tipografia.ts tests/tipografia.test.ts
git commit -m "feat: typography respeta Units px/rem en size, line-height y letter-spacing"
```

---

### Task 2: Verificación final

- [ ] **Step 1: Build + suite**

Run: `npm run build && node --test`
Expected: build OK, 245 tests PASS.

- [ ] **Step 2: Verificación manual en Figma (la hace el usuario)**

1. Nodo de texto con line-height y letter-spacing en px → Anatomy con Units = rem → typography en
   rem (`1rem / 1.5rem · LS 0.25rem`); con Type = CSS → `1rem/1.5rem …`.
2. Units = px → output idéntico a hoy.
3. Line-height percent o auto → sin conversión bajo rem.

- [ ] **Step 3: Ajustes si hacen falta**

```bash
git add -A
git commit -m "fix: ajustes de typography en rem"
```
