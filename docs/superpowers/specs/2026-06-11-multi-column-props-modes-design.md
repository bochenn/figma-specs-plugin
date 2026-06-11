# Diseño — Multi-column en Properties y Modes — Rebanada 19

**Fecha:** 2026-06-11
**Proyecto:** Specs Plugin para Figma — plugin de documentación de specs para handoff (una sola versión, sin tiers)
**Alcance de este spec:** Extender el selector "Columns" (1–4, ya existente) a Properties y Modes, reusando `enColumnas`. Las opciones (Properties) y los modes (Modes) se acomodan en N columnas dentro de cada subsección.

---

## Contexto y estrategia

La Rebanada 18 agregó el selector "Columns" y `enColumnas`, aplicado a Layout. Esta rebanada extiende lo
mismo a Properties y Modes, reusando el helper. La unidad de columnas es la **lista repetida interna** de
cada subsección: las opciones dentro de cada propiedad, los modes dentro de cada collection.

**Decisiones tomadas en el brainstorming:**
- Columnas sobre los ítems internos (opciones / modes), no sobre las subsecciones enteras.
- Se mueve el clamp a un helper puro `clampColumnas` usado por las tres secciones desde `main`.

---

## Sección 1 — `clampColumnas` y orquestación

**Helper puro** (`utils/columnas.ts`):

```typescript
export function clampColumnas(n: number | undefined): number {
  return Math.min(Math.max(n ?? 1, 1), 4);
}
```

**`main.ts`:** en el dispatcher, una sola vez tras `aplicarTema`: `const columnas = clampColumnas(msg.columnas);`.
Se pasa a las tres secciones: `generarSeccionLayout(nodo, columnas)`, `generarSeccionProperties(nodo, columnas)`,
`generarSeccionModes(nodo, columnas)`. Cada sección recibe `columnas: number` (ya clamprado); se saca el clamp
inline que hoy tiene Layout.

---

## Sección 2 — Properties y Modes usan `enColumnas`

**Properties** (`generarProperties(componentSet, propiedades, defaultProps, columnas)`): dentro de cada
propiedad, se juntan los `bloque`s de opción en un array; si `columnas > 1` →
`subseccion.appendChild(enColumnas(bloques, columnas))`; si no, se apilan como hoy.

**Modes** (`generarModes(seleccionado, colecciones, columnas)` → `subseccionColeccion(seleccionado, coleccion, columnas)`):
dentro de cada collection, se juntan los `bloqueMode` en un array; si `columnas > 1` → `enColumnas`; si no,
apilados.

El título de cada subsección queda arriba; la grilla de ítems abajo. Default 1 = sin cambios.

---

## Sección 3 — Errores y casos límite

| Caso | Comportamiento |
|------|----------------|
| Columns = 1 | Properties/Modes apilados como hoy. |
| Columns 2–4 | Opciones/modes en N columnas dentro de cada subsección. |
| Una sola opción/mode | Una columna con ese ítem. |
| Valor inválido | `clampColumnas` → 1–4. |
| Falla en generación | `try/catch` en `main.ts` (ya existe). |

---

## Sección 4 — Estrategia de testing

**1. Tests unitarios de lógica pura (`node --test`):**
- `clampColumnas`: `undefined` → 1; `0` → 1; `5` → 4; `3` → 3.

**2. Verificación manual en Figma:** Component Set con una propiedad de varias opciones → Columns: 3 →
"Properties" → opciones en 3 columnas. Ítem con ≥2 modes → Columns: 2 → "Modes" → modes en 2 columnas.
Verificar que Layout sigue andando y que con 1 columna todo queda como antes.

**3. Componente de prueba fijo.**

**Lo que NO se hace:** mock de figma; los generadores se validan a ojo.

---

## Fuera de alcance de esta rebanada (futuras rebanadas)

- Columnas sobre el artwork además de los ítems.
- Reflow automático al redimensionar el frame.
- Multi-column en Two-Way / Complete.
