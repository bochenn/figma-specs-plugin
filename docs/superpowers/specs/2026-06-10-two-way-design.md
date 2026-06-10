# Diseño — Two-Way Comparison — Rebanada 13

**Fecha:** 2026-06-10
**Proyecto:** Specs Plugin para Figma — plugin de documentación de specs para handoff (una sola versión, sin tiers)
**Alcance de este spec:** Comparar todas las combinaciones de las **dos primeras** propiedades de variante (producto cartesiano), cada una contra el default, con artwork + cambios. Séptimo botón "Two-Way".

---

## Contexto y estrategia

Properties compara el default contra cada opción de **una** propiedad a la vez. Two-Way compara todas las
combinaciones de **dos** propiedades simultáneamente (compound props). Reutiliza `buscarVariante` y
`compararVariante` (el motor de comparación) — solo cambia que se itera el producto cartesiano de dos props.

Esta rebanada toma automáticamente las **dos primeras** propiedades de variante. Tiene lógica pura
testeable (`extraerDosWay`).

**Decisiones tomadas en el brainstorming:**
- Alcance: las dos primeras props de variante, séptimo botón "Two-Way".
- Si el set tiene < 2 props de variante, no aplica (aviso).
- Reusa `displayOpcion` de Properties (DRY) para el artwork + cambios por combinación.

---

## Sección 1 — Modelo y extracción (pura)

**Modelo** (`modelo/tipos.ts`):

```typescript
export interface CombinacionSpec {
  valor1: string;        // ej. "Small"
  valor2: string;        // ej. "Primary"
  cambios: ElementoCambiado[];
}

export interface DosWaySpec {
  prop1: string;
  prop2: string;
  combinaciones: CombinacionSpec[];
}
```

**`extraerDosWay(set: SetNorm): DosWaySpec | null`** (pura, en `extraccion/properties.ts`, reusa
`buscarVariante` y `compararVariante`):

```
props = Object.keys(set.propiedades)
si props.length < 2 → null
p1, p2 = props[0], props[1]
varianteDefault = buscarVariante(set, set.defaultProps); si no → null
por cada v1 en set.propiedades[p1]:
  por cada v2 en set.propiedades[p2]:
    target = { ...set.defaultProps, [p1]: v1, [p2]: v2 }
    variante = buscarVariante(set, target); si no existe → saltear
    cambios = compararVariante(varianteDefault.raiz, variante.raiz)
    combinaciones.push({ valor1: v1, valor2: v2, cambios })
devolver { prop1: p1, prop2: p2, combinaciones }
```

---

## Sección 2 — Generador y séptimo botón

**`generarDosWay(componentSet, dosway, defaultProps)`** (en `generadores/properties.ts`, reusa
`displayOpcion`):

```
Two-Way (sección)
├── Heading "Two-Way"
├── "prop1 × prop2"
├── valor1 + valor2                       (bloque por combinación)
│   ├── "valor1 + valor2"
│   └── displayOpcion(componentSet, target, cambios)  ← artwork + cambios
└── ...
```

Por cada combinación: `target = { ...defaultProps, [prop1]: valor1, [prop2]: valor2 }` → `displayOpcion`
(la misma helper de Properties; artwork del variante + cambios con pills). Nombre del bloque =
`"valor1 + valor2"`.

**Disparador (UI):** séptimo botón "Two-Way". `Seccion` suma `"twoway"`. `main.ts`:

```
seccion === "twoway":
  componentSet = resolverComponentSet(nodo)  → si null: "Two-Way necesita un componente con variantes."
  setNorm = normalizarSet(componentSet)
  dosway = extraerDosWay(setNorm)            → si null: "Two-Way necesita al menos dos propiedades de variante."
  frame = await generarDosWay(componentSet, dosway, setNorm.defaultProps)
```

Se sube el alto del panel a 300 por el séptimo botón.

**Decisión de diseño:** `generarDosWay` reutiliza `displayOpcion` (DRY con Properties); la lógica de qué
combinaciones está en `extraerDosWay` (pura).

---

## Sección 3 — Errores y casos límite

| Caso | Comportamiento |
|------|----------------|
| Nodo sin variantes | "Two-Way necesita un componente con variantes." |
| Set con < 2 props de variante | "Two-Way necesita al menos dos propiedades de variante." |
| Combinación inexistente | Se saltea. |
| Combinación sin cambios | "Sin cambios respecto al default" (vía `displayOpcion`). |
| Falla en generación | `try/catch` en `main.ts` (ya existe). |

---

## Sección 4 — Estrategia de testing

**1. Tests unitarios de lógica pura (`node --test`):**
- `extraerDosWay`: set 2 props × 2 valores con 4 variantes → 4 combinaciones con `valor1`/`valor2`; set con 1 propiedad → `null`; combinación cuyo variante no existe → se saltea.

**2. Verificación manual en Figma:** Component Set con dos props de variante (Size × Type) donde el color
cambie según la combinación → "Two-Way" → verificar las combinaciones con su artwork y cambios. Comparar
contra `prd-images/2. properties/`. Verificar que el resto sigue andando.

**3. Componente de prueba fijo** con dos propiedades.

**Lo que NO se hace:** mock de figma.

---

## Fuera de alcance de esta rebanada (futuras rebanadas)

- Selector de qué dos propiedades (UI).
- Grid 2D (filas × columnas) en vez de lista.
- Two-Way con más de dos propiedades.
- Two-Way en JSON (Data).
