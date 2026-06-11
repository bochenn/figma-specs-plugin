# Diseño — Multi-column Layout — Rebanada 18

**Fecha:** 2026-06-11
**Proyecto:** Specs Plugin para Figma — plugin de documentación de specs para handoff (una sola versión, sin tiers)
**Alcance de este spec:** Selector "Columns" (1–4) que acomoda los exhibits de Layout en N columnas (wrap con ancho fijo). Solo Layout en esta rebanada.

---

## Contexto y estrategia

El PRD (feature #14) organiza el contenido de Properties, Modes y Layout en 1 columna (default) o
multi-columna (2/3/4), con "spacers" para anchos iguales. Figma tiene `layoutWrap = "WRAP"`; fijando cada
ítem al **ancho máximo** del grupo, quedan columnas iguales sin overflow (cada ítem ya era ≤ ese ancho).

Esta rebanada implementa el selector + el helper `enColumnas`, aplicado a **Layout** (sus exhibits). Las
otras secciones lo adoptan después con el mismo helper.

**Decisiones tomadas en el brainstorming:**
- Alcance: Columns 1–4 aplicado a los exhibits de Layout. Sin Properties/Modes, sin reflow manual.
- Mecanismo: wrap con ancho fijo = `columnas × anchoMáx + (columnas-1) × gap`; cada ítem fijado al anchoMáx.

---

## Sección 1 — UI, mensaje y cálculo puro

**UI** (`src/ui/index.html` + `ui.ts`): un `<select id="columnas">` con opciones 1–4 (label "Columns").
`generar` manda `columnas: parseInt(columnasSelect.value)`. `MensajeUI` (`modelo/tipos.ts`) suma
`columnas?: number`.

**Cálculo puro** (`utils/columnas.ts`):

```typescript
export function anchoContenedor(columnas: number, anchoItem: number, gap: number): number {
  return columnas * anchoItem + (columnas - 1) * gap;
}
```

Ej: `anchoContenedor(3, 100, 64)` → 428.

---

## Sección 2 — Helper `enColumnas` y aplicación en Layout

**Helper** `enColumnas(items: SceneNode[], columnas: number): FrameNode` (impure, en
`generadores/frames.ts`):

1. `maxW = max(item.width)` de todos los ítems.
2. Frame con `layoutMode = "HORIZONTAL"`, `layoutWrap = "WRAP"`, `itemSpacing` y `counterAxisSpacing = GAP`,
   `primaryAxisSizingMode = "FIXED"` con ancho = `anchoContenedor(columnas, maxW, GAP)`, `counterAxisSizingMode = "AUTO"`.
3. Por cada ítem: `appendChild` → `layoutSizingHorizontal = "FIXED"` → `resize(maxW, alto)`.

Al fijar cada ítem al ancho máximo (≥ su ancho natural) no hay overflow, y Figma envuelve exactamente
`columnas` por fila. `GAP = 64`.

**Generador de Layout** (`generadores/layout.ts`): `generarLayout(seleccionado, specs, columnas)`. Se juntan
los exhibits en un array; si `columnas > 1`, se agrega `enColumnas(exhibits, columnas)` a la sección; si no,
se apilan como hoy. El artwork queda full-width arriba.

**`main.ts`:** `generarSeccionLayout` pasa `columnas` (clamp 1–4): `generarLayout(nodo, specs, columnas)`.

---

## Sección 3 — Errores y casos límite

| Caso | Comportamiento |
|------|----------------|
| Columns = 1 | Exhibits apilados como hoy. |
| Columns 2–4 | Exhibits en N columnas. |
| Un solo exhibit | Una columna con ese ítem. |
| Valor inválido del select | `main` hace clamp a 1–4. |
| Columns en otra sección | Se ignora (solo Layout lo usa). |
| Falla en generación | `try/catch` en `main.ts` (ya existe). |

---

## Sección 4 — Estrategia de testing

**1. Tests unitarios de lógica pura (`node --test`):**
- `anchoContenedor`: `(3,100,64)` → 428; `(1,100,64)` → 100; `(2,50,10)` → 110.

**2. Verificación manual en Figma:** frame con varios frames con Auto Layout (varios exhibits) → Columns: 3
→ "Layout & Spacing" → verificar 3 columnas parejas, artwork arriba. Probar 1/2/4. Comparar contra
`prd-images/12. Multi-Column Layout/`. Verificar que con 1 columna queda como antes y el resto sigue andando.

**3. Componente de prueba fijo** con varios frames con Auto Layout.

**Lo que NO se hace:** mock de figma; `enColumnas` se valida a ojo.

---

## Fuera de alcance de esta rebanada (futuras rebanadas)

- Multi-column en Properties y Modes (mismo helper).
- Reflow automático al redimensionar el frame.
- Columnas sobre el artwork además de los exhibits.
