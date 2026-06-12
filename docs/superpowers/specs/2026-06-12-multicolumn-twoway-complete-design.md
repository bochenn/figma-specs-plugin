# Diseño — Multi-column en Two-Way y Complete A/L — Rebanada 30

**Fecha:** 2026-06-12
**Proyecto:** Specs Plugin para Figma — plugin de documentación de specs para handoff (una sola versión, sin tiers)
**Alcance de este spec:** Que el selector Columns (1-4, ya existente) funcione también en los botones Two-Way y Complete A/L, que hoy apilan todo en una columna.

---

## Contexto y estrategia

El selector Columns ya gobierna Properties, Layout y Modes vía `enColumnas(items, columnas)`
(`generadores/frames.ts`), que reparte FrameNodes en N columnas. Two-Way y Complete no lo reciben:

- **Two-Way** (`generarDosWay`, `generadores/properties.ts`): un bloque por combinación, apilados.
- **Complete** (`generarComplete`, `generadores/complete.ts`): Complete Anatomy son líneas de texto
  sueltas (`variante: nombre · tipo`); Complete Layout ya tiene un bloque por variante, apilados.

**Decisiones tomadas en el brainstorming:**
- Columns aplica a los tres: combinaciones de Two-Way, bloques de Complete Layout y también
  Complete Anatomy, **agrupando** sus líneas en un bloque por variante (título + una línea
  `nombre · tipo` por elemento).
- Sin UI nueva: el selector ya existe y `main.ts` ya calcula `columnas`.

---

## Sección 1 — Agrupado puro (`utils/agrupar-variante.ts`)

Archivo nuevo con la única lógica pura de la rebanada:

```typescript
export interface GrupoVariante {
  variante: string;
  elementos: ElementoAdicional[];
}

export function agruparPorVariante(elementos: ElementoAdicional[]): GrupoVariante[]
```

Agrupa por `variante` preservando el orden de primera aparición; lista vacía → `[]`.

---

## Sección 2 — Generadores

**`generarDosWay`** gana `columnas: number`: los bloques de combinaciones se acumulan en un array y
se agregan con `enColumnas(bloques, columnas)` si `columnas > 1`, o apilados si no (mismo patrón
que `specDeProperties`).

**`generarComplete`** gana `columnas: number`:
- Complete Anatomy: `agruparPorVariante(anatomy)` → un bloque por variante (título de la variante a
  16, líneas `nombre · tipo` a 12) → `enColumnas` si corresponde. El mensaje de "sin elementos
  adicionales" no cambia.
- Complete Layout: los bloques existentes se acumulan y van a `enColumnas` si corresponde.

Con Columns = 1, Two-Way y Complete Layout quedan idénticos a hoy; Complete Anatomy pasa de líneas
sueltas a bloques por variante (mejora visual decidida en el brainstorming).

---

## Sección 3 — Plumbing (`main.ts`)

`generarSeccionTwoWay` y `generarSeccionComplete` ganan `columnas: number` y se lo pasan a sus
generadores; el dispatch les pasa la variable `columnas` ya calculada.

---

## Sección 4 — Testing y verificación

**Tests (`node --test`, `tests/agrupar-variante.test.ts`):**
- Agrupa elementos de la misma variante y preserva el orden de primera aparición.
- Lista vacía → `[]`.

**Verificación manual en Figma:** component set con 2+ propiedades de variante y elementos/layouts
adicionales → Two-Way y Complete A/L con Columns = 1 (output apilado, anatomy agrupada por
variante) y Columns = 2 (bloques repartidos). Properties/Layout/Modes sin cambios.

---

## Fuera de alcance de esta rebanada

- Columnas dentro de la lista de cambios de cada bloque (siguen verticales).
- Cualquier cambio en el selector Columns o su rango (1-4).
