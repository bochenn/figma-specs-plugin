# Diseño — Modes — Rebanada 6

**Fecha:** 2026-06-10
**Proyecto:** Specs Plugin para Figma — plugin de documentación de specs para handoff (una sola versión, sin tiers)
**Alcance de este spec:** Feature **Modes** del PRD, limitada a la **comparación textual** de variables de **color** (en fill/stroke) entre los modes de una variable collection. Sin artwork con mode aplicado (rebanada posterior).

---

## Contexto y estrategia

Modes (feature #7 del PRD) muestra, para los ítems con variables vinculadas a capas, cómo cambian esos
valores entre los modes de una variable collection (ej. Light/Dark). Por cada collection con ≥2 modes,
una subsección con cada mode y los atributos (variable + valor resuelto en ese mode). El PRD completo
además muestra el artwork del ítem con cada mode aplicado.

Esta rebanada implementa **solo la comparación textual** de **variables de color** vinculadas a fill/stroke.
Es la **primera feature que toca variables** (`boundVariables`, `figma.variables.*`), territorio nuevo y
más figma-heavy que lo anterior: la superficie pura/testeable es más chica, el grueso se valida a mano.

**Decisiones tomadas en el brainstorming:**
- Alcance: textual, variables de color en fill/stroke, collections con ≥2 modes. Sin artwork por mode.
- Aliases: si `valuesByMode` es un alias a otra variable, se muestra **"→ nombre de la variable aliaseada"** sin resolver el color concreto.
- `recolectarModes` recibe el **nodo real** (no `aNodoLike`), porque usa `figma.variables` y `boundVariables`.
- `hexDeColor` es un helper pure propio (no se refactoriza `utils/atributos.ts`).
- Sexto botón "Modes"; `Seccion` suma `"modes"`.

---

## Sección 1 — Lectura de variables y recolección (impure, `variables/recolectar-modes.ts`)

Usa `figma.variables.*`; no testeable sin mockear; se valida a mano.

`recolectarModes(nodo: SceneNode): EntradaModo[]` recorre las capas (frena en instancias) y por cada nodo:
- Lee `boundVariables.fills` y `boundVariables.strokes` (variables de color).
- Por cada variable vinculada:
  - `variable = figma.variables.getVariableById(id)`; si `resolvedType !== "COLOR"` → saltea.
  - `collection = getVariableCollectionById(variable.variableCollectionId)`; si `collection.modes.length < 2` → saltea.
  - `appliedAs`: fill en TEXT → "Text color"; fill en otro → "Background color"; stroke → "Border color".
  - Por cada mode de la collection, resuelve `variable.valuesByMode[modeId]` a texto (color → `hexDeColor`; alias → "→ nombre").

**Modelo de datos** (`modelo/tipos.ts`):

```typescript
export interface ValorModo { modeId: string; valor: string; }   // hex o "→ nombreAlias"

export interface EntradaModo {
  coleccionNombre: string;
  modos: { modeId: string; nombre: string }[];
  capa: string;
  appliedAs: string;
  variableNombre: string;
  valores: ValorModo[];
}

export interface AtributoModo {
  capa: string;
  appliedAs: string;
  variableNombre: string;
  valores: ValorModo[];
}

export interface ColeccionModes {
  coleccionNombre: string;
  modos: { modeId: string; nombre: string }[];
  atributos: AtributoModo[];
}
```

**Recorrido:** raíz + descendientes; frena en instancias (consistente con el resto).

---

## Sección 2 — Agrupación pura y formato de color (`variables/modes.ts`)

**`hexDeColor(rgb: { r: number; g: number; b: number }): string`** → `#RRGGBB` (canales 0..1 → hex en
mayúsculas). Lo usa el recolector para colores directos.

```
hexDeColor({ r:1, g:1, b:1 }) → "#FFFFFF"
hexDeColor({ r:0, g:0, b:0 }) → "#000000"
```

**`agruparModes(entradas: EntradaModo[]): ColeccionModes[]`** → agrupa por `coleccionNombre` (orden de
primera aparición); `modos` de la primera entrada de la collection; `atributos` = las entradas de esa
collection (capa, appliedAs, variableNombre, valores).

**Decisión de diseño:** `hexDeColor` y `agruparModes` concentran lo testeable; el recolector impure arma
las `EntradaModo`; el generador pivotea por mode.

> Nota: `hexDeColor` duplica lógica que ya existe (interna) en `utils/atributos.ts`. No se refactoriza
> ahora; si conviene, se unifican más adelante.

---

## Sección 3 — Generador y disparador (`generadores/modes.ts`)

```
Modes                                    (sección, Auto Layout vertical)
├── Heading "Modes"
└── [Coleccion]                          (subsección por collection)
    ├── Heading nombre de la collection
    ├── [Mode 1]                         (bloque por mode)
    │   ├── nombre del mode
    │   └── por cada atributo: "{appliedAs}: {variableNombre} ({valor en ese mode})"
    └── [Mode 2] ...
```

El generador **pivotea**: por collection → por mode → atributos (buscando en `valores` el `valor` cuyo
`modeId` coincide). Sin artwork.

**Disparador (UI):** sexto botón "Modes". `Seccion` suma `"modes"`. `main.ts`:

```
seccion === "modes":
  validar tipo (mismos contenedores que Anatomy)
  colecciones = agruparModes(recolectarModes(nodo))   // nodo REAL (figma.variables)
  frame = await generarModes(nodo.name, colecciones)
```

> `recolectarModes` recibe el nodo real (no `aNodoLike`): necesita `figma.variables`/`boundVariables`.

---

## Sección 4 — Errores y casos límite

| Caso | Comportamiento |
|------|----------------|
| Nada seleccionado | "Seleccioná algo para generar specs." |
| Tipo inválido | "Modes necesita un FRAME, COMPONENT, INSTANCE o COMPONENT_SET." |
| Sin variables de color en collections con ≥2 modes | Nota "No se detectaron variables con múltiples modes." |
| Variable/collection que no resuelve (borrada/remota) | Se saltea la entrada. |
| `valuesByMode` ausente para un mode | Valor "—". |
| Falla en generación | `try/catch` → `{ ok:false, error }`. |

---

## Sección 5 — Estrategia de testing

**1. Tests unitarios de lógica pura (`node --test`):**
- `variables/modes.ts`:
  - `hexDeColor`: blanco → "#FFFFFF"; negro → "#000000"; un color intermedio.
  - `agruparModes`: dos entradas de la misma collection → una `ColeccionModes` con dos atributos; dos collections → dos; `modos` de la primera entrada; conserva orden.

**2. Verificación manual en Figma (el grueso):** crear una variable collection de color con 2 modes
(Light/Dark), variables de Background y Border, aplicarlas al fill/stroke de capas dentro de un frame;
seleccionar el frame → botón "Modes" → verificar la subsección con ambos modes y los valores hex por mode.
Comparar contra `prd-images/7. Modes/`. Verificar que las otras secciones siguen andando.

**3. Componente de prueba fijo** con variables/modes para regresiones a ojo.

**Lo que NO se hace:** mock de `figma.variables`.

---

## Fuera de alcance de esta rebanada (futuras rebanadas)

- Artwork del ítem con cada mode aplicado (`setExplicitVariableMode` sobre el clon).
- Variables que no son de color (FLOAT, STRING, BOOLEAN) y otros bindings (width, cornerRadius, etc.).
- Resolución de aliases en cadena hasta el color concreto.
- Variable Formatting (pills con collection/nombre/raw value) — feature aparte.
- Unificación de Modes con las otras secciones en un mismo Spec.
