# Diseño — Artwork por mode (Modes) — Rebanada 11

**Fecha:** 2026-06-10
**Proyecto:** Specs Plugin para Figma — plugin de documentación de specs para handoff (una sola versión, sin tiers)
**Alcance de este spec:** Sumar a Modes el artwork del ítem clonado con cada mode aplicado (`setExplicitVariableMode`), además del texto de atributos que ya existe.

---

## Contexto y estrategia

Modes (Rebanada 6) hoy muestra solo la comparación textual (por collection → por mode → atributos con
valores). El PRD además muestra el ítem renderizado con cada mode aplicado (el visual Light vs Dark).

Esta rebanada suma el **artwork por mode**: clon del ítem con `setExplicitVariableMode(collection, modeId)`
aplicado, así las variables resuelven a los valores de ese mode. Es **casi todo impure** (clonar + aplicar
mode + dibujar); la lógica pura ya existe. No suma tests unitarios significativos (se valida a mano).

**Decisiones tomadas en el brainstorming:**
- Alcance: artwork por mode + el texto existente (no se reemplaza).
- Se lleva `coleccionId` en el dato para que el generador resuelva la collection real.
- Solo variables de color → el mode no cambia tamaños; el clon mantiene dimensiones.

---

## Sección 1 — El dato lleva el `coleccionId`

- `EntradaModo` y `ColeccionModes` (`modelo/tipos.ts`) suman `coleccionId: string`.
- `recolectarModes` (impure) setea `coleccionId = collection.id`.
- `agruparModes` (pura) lo arrastra de la primera entrada de cada collection (igual que `modos`).

Se actualiza el test de `agruparModes`: el helper `entrada()` incluye `coleccionId` y se agrega un assert de
que la `ColeccionModes` lo conserva.

---

## Sección 2 — Generador: clon con el mode aplicado (`generadores/modes.ts`)

`generarModes` pasa a recibir el nodo real:

```
generarModes(seleccionado: SceneNode, colecciones: ColeccionModes[])
```

Por cada collection, se resuelve la collection real con
`figma.variables.getVariableCollectionById(coleccion.coleccionId)`. El bloque de cada mode (`bloqueMode`)
pasa a:

```
[nombre del mode]
[Artwork]  ← clon del seleccionado con ese mode aplicado   [NUEVO]
appliedAs: variableNombre (valorEnEseMode)                 (texto, como hoy)
...
```

**Artwork por mode:**
1. `const clon = seleccionado.clone();`
2. Frame `Artwork` (layoutMode NONE, fondo gris), clon en (0,0).
3. `clon.setExplicitVariableMode(collection, modo.modeId)`.
4. `artwork.resize(clon.width, clon.height)`.

Si la collection no resuelve (null), se saltea el artwork (solo texto).

**`main.ts`:** `generarSeccionModes` pasa el nodo real a `generarModes`; el título usa `seleccionado.name`.

**Decisión de diseño:** el generador resuelve la collection y clona; los valores/atributos ya vienen en el
dato. `setExplicitVariableMode` es la pieza nueva; clonar por mode es más simple que los overlays (sin
geometría).

---

## Sección 3 — Errores y casos límite

| Caso | Comportamiento |
|------|----------------|
| Collection no resuelve | Bloque de mode sin artwork, solo texto. |
| `clone()` falla | `try/catch` en `main.ts` (ya existe). |
| Variable de tamaño | No aplica (solo color). |
| Sin collections con ≥2 modes | "No se detectaron variables con múltiples modes." (como hoy). |

---

## Sección 4 — Estrategia de testing

**1. Tests unitarios de lógica pura (`node --test`):**
- `agruparModes`: actualizar el helper para incluir `coleccionId` y agregar un assert de que la
  `ColeccionModes` lo conserva. (Sin tests nuevos del artwork — es impure.)

**2. Verificación manual en Figma (el grueso):** frame con variables de color de una collection con 2 modes
(Light/Dark) → "Modes" → verificar que cada mode muestra el artwork clonado con ese mode aplicado (distinto
entre Light y Dark) además del texto. Comparar contra `prd-images/7. Modes/`. Verificar que el resto sigue
andando.

**3. Componente de prueba fijo** con variables/modes.

**Lo que NO se hace:** mock de `figma.variables`/`setExplicitVariableMode`.

---

## Fuera de alcance de esta rebanada (futuras rebanadas)

- Marcadores/anotaciones sobre el artwork por mode.
- Modes para variables no-color (sizing, etc.).
- Dark mode del propio output del plugin (feature distinta).
