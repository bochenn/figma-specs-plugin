# Diseño — Custom Spacing Format (px/rem) — Rebanada 22

**Fecha:** 2026-06-11
**Proyecto:** Specs Plugin para Figma — plugin de documentación de specs para handoff (una sola versión, sin tiers)
**Alcance de este spec:** Selector "Units" (px / rem) que cambia la unidad de los valores de longitud: padding e item spacing (Layout) y width (Anatomy). Default px = idéntico al de hoy.

---

## Contexto y estrategia

Hoy los valores de spacing/tamaño se muestran como números pelados (px implícito): padding e item spacing
en Layout, width en Anatomy. "Custom spacing format" agrega un selector px/rem que los formatea, con el mismo
patrón de estado de módulo que Custom Color Formats.

Para que el default (px) quede idéntico al de hoy, `px` devuelve el número pelado y `rem` divide por 16
(base 16).

**Decisiones tomadas en el brainstorming:**
- La unidad aplica a spacing (Layout) **y** tamaños (Anatomy width).
- `px` = número pelado (como hoy); `rem` = `n/16`.

---

## Sección 1 — Selector, tipo y formato puro

**UI** (`index.html` + `ui.ts`): un `<select id="unidad">` "Units" (px / rem) junto al de Color. El mensaje
suma `unidad`; `MensajeUI` (`modelo/tipos.ts`) pasa a `{ ..., unidad?: Unidad }`, con:

```typescript
export type Unidad = "px" | "rem";
```

**Conversión pura + estado** (`utils/espaciado.ts`):

```typescript
import type { Unidad } from "../modelo/tipos.ts";

export function formatearEspaciado(n: number, unidad: Unidad): string {
  return unidad === "rem" ? `${n / 16}rem` : String(n);
}

let unidad: Unidad = "px";
export function aplicarUnidad(u: Unidad): void { unidad = u; }
export function unidadActual(): Unidad { return unidad; }
```

Ej: `formatearEspaciado(8, "rem")` → `"0.5rem"`, `formatearEspaciado(24, "rem")` → `"1.5rem"`,
`formatearEspaciado(8, "px")` → `"8"`.

---

## Sección 2 — Aplicar la unidad

- **`utils/atributos.ts`** (`leerAtributos`, atributo `width`): `valor: formatearEspaciado(nodo.width, unidadActual())`.
- **`generadores/layout.ts`** (`exhibit`): el padding (`L8 T8 R8 B8`) y el item spacing pasan por
  `formatearEspaciado` con un helper local `E = (n) => formatearEspaciado(n, unidadActual())`.
- **`main.ts`:** `aplicarUnidad(msg.unidad ?? "px")` junto a `aplicarTema`/`aplicarFormatoColor`, antes de generar.

Con default `px`, el output queda idéntico al de hoy (y los tests de `width` siguen verdes).

---

## Sección 3 — Errores y casos límite

| Caso | Comportamiento |
|------|----------------|
| Units px (default) | Igual que hoy (números pelados). |
| rem | Spacing y width en `Xrem` (n/16). |
| Combinado con color/dark/columns/tabla | Independientes. |
| Falla en generación | `try/catch` en `main.ts` (ya existe). |

---

## Sección 4 — Estrategia de testing

**1. Tests unitarios de lógica pura (`node --test`):**
- `formatearEspaciado`: `(8, "px")` → `"8"`; `(8, "rem")` → `"0.5rem"`; `(16, "rem")` → `"1rem"`; `(24, "rem")` → `"1.5rem"`.

**2. Verificación manual en Figma:** componente/frame con padding y width → Units: rem → "Layout"
(padding/item spacing en rem) y "Anatomy" (width en rem); px → como antes.

**3. Componente de prueba fijo.**

**Lo que NO se hace:** mock de figma; `atributos`/`layout`/`main` se validan a ojo.

---

## Fuera de alcance de esta rebanada (futuras rebanadas)

- Otras unidades (pt, em) o base configurable (distinta de 16).
- Unidad para height u otros tamaños no presentes hoy como atributo.
- Custom typography format.
