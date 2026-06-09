# Diseño — Layout and Spacing — Rebanada 3

**Fecha:** 2026-06-09
**Proyecto:** Specs Plugin para Figma — plugin de documentación de specs para handoff
**Alcance de este spec:** Feature **Layout and Spacing** del PRD, limitada a la **lista textual** de atributos de layout por cada capa con Auto Layout. Sin overlays de color ni íconos (rebanada siguiente). Reutiliza la infraestructura de Anatomy/Properties.

---

## Contexto y estrategia

Layout and Spacing (feature #3 del PRD) detecta las capas con **Auto Layout** y anota, por cada una:
dirección y alineación, resizing (Fill/Hug/Fixed), padding (general + por lado) e item spacing. El PRD
completo además dibuja overlays de color (azul=elemento, verde=padding, naranja=spacing), íconos de
dirección/alineación y marcadores de resizing sobre un artwork clonado.

Esta rebanada implementa **solo la lista textual** de atributos por capa. Valida la parte nueva y central:
**detectar Auto Layout y leer sus propiedades**. Los overlays de color y los íconos quedan para una
rebanada posterior, que se construye sobre esta base.

**Decisiones tomadas en el brainstorming:**
- Alcance: solo lista textual (sin artwork ni overlays).
- Capas documentadas: el nodo seleccionado (si tiene Auto Layout) + frames descendientes con Auto Layout, **frenando en nested instances** (igual frontera que Anatomy), pero **incluyendo la raíz**.
- Resizing: se usa la API moderna `layoutSizingHorizontal`/`layoutSizingVertical` (da `FILL`/`HUG`/`FIXED` directo).
- Alineación: texto neutro ("Start"/"Center"/"End"/"Space between"), sin variar por eje (Top/Left) — eso queda como pulido.
- Disparo desde la UI: se reemplaza el botón único por un **selector de sección** (tres botones: Anatomy / Properties / Layout & Spacing). El mensaje pasa a `{ tipo: "generar", seccion }` y `main.ts` ramifica por `seccion`.

---

## Sección 1 — Detección de Auto Layout y modelo de datos

**Nueva traversal** (`traversal/recorrer-autolayout.ts`):

```
recorrerAutoLayout(nodo):
  resultado = []
  si nodo.layoutMode ∈ {HORIZONTAL, VERTICAL} → agregar nodo
  para cada hijo:
    si es INSTANCE → frenar (no entrar)
    si es FRAME/GROUP/COMPONENT/COMPONENT_SET → recorrer hacia adentro (acumular)
  devolver resultado
```

Incluye la raíz si tiene Auto Layout y baja por los contenedores, frenando en instancias.

**Extensión de `NodoLike`** (campos opcionales, leídos del nodo real con el adaptador):

```typescript
layoutMode?: "NONE" | "HORIZONTAL" | "VERTICAL";
primaryAxisAlignItems?: string;     // "MIN" | "CENTER" | "MAX" | "SPACE_BETWEEN"
counterAxisAlignItems?: string;     // "MIN" | "CENTER" | "MAX" | "BASELINE"
paddingLeft?: number; paddingTop?: number; paddingRight?: number; paddingBottom?: number;
itemSpacing?: number;
layoutSizingHorizontal?: "FIXED" | "HUG" | "FILL";
layoutSizingVertical?: "FIXED" | "HUG" | "FILL";
```

**Modelo de datos** (`modelo/tipos.ts`):

```typescript
interface LayoutSpec {
  elementoNombre: string;
  tipo: string;                  // FRAME, COMPONENT, etc.
  direccion: "HORIZONTAL" | "VERTICAL";
  alineacionPrimaria: string;    // "Start" | "Center" | "End" | "Space between"
  alineacionContraria: string;
  resizingHorizontal: string;    // "Fill" | "Hug" | "Fixed"
  resizingVertical: string;
  padding: { left: number; top: number; right: number; bottom: number };
  itemSpacing: number;
}
```

**Decisión de diseño:** se usa `layoutSizingHorizontal`/`Vertical` (API moderna que da `FILL`/`HUG`/`FIXED`)
en vez del viejo `primaryAxisSizingMode`.

---

## Sección 2 — Extracción y traducción (lógica pura, `extraccion/layout.ts`)

`extraerLayout(raiz: NodoLike): LayoutSpec[]` → corre `recorrerAutoLayout` y mapea cada nodo a un
`LayoutSpec`, traduciendo los enums crudos a texto legible.

**Funciones de traducción** (puras, con test):

```
alineacion(valor):
  "MIN" → "Start" | "CENTER" → "Center" | "MAX" → "End"
  "SPACE_BETWEEN" → "Space between" | "BASELINE" → "Baseline"
  otro/undefined → "Start"

resizing(valor):
  "FILL" → "Fill" | "HUG" → "Hug" | "FIXED" → "Fixed" | undefined → "Fixed"
```

**Armado de cada `LayoutSpec`:**
- `direccion` = `layoutMode` (siempre HORIZONTAL/VERTICAL porque la traversal solo trae Auto Layout)
- `alineacionPrimaria` = `alineacion(primaryAxisAlignItems)`; `alineacionContraria` = `alineacion(counterAxisAlignItems)`
- `resizingHorizontal` = `resizing(layoutSizingHorizontal)`; `resizingVertical` = `resizing(layoutSizingVertical)`
- `padding` = los 4 lados (default 0)
- `itemSpacing` = `itemSpacing ?? 0`

**Decisión de diseño:** traducciones como funciones chiquitas separadas (alineación, resizing),
testeables y fáciles de ajustar.

---

## Sección 3 — Output visual y disparador desde la UI

**Estructura de frames** (`generadores/layout.ts`, reutiliza `frames.ts`):

```
Layout and Spacing                       (sección, Auto Layout vertical)
├── Heading "Layout and Spacing"
├── [elementoNombre] · FRAME             (un exhibit por capa con Auto Layout)
│   ├── Direction: Vertical
│   ├── Alignment: Center / Start        (primaria / contraria)
│   ├── Resizing: Fill × Hug             (horizontal × vertical)
│   ├── Padding: L16 T8 R16 B8
│   └── Item spacing: 12
└── ...
```

Un exhibit (bloque de texto) por capa con Auto Layout. **Sin artwork ni overlays** en esta rebanada.
Se genera como su propio frame `Specifications → [Nombre] Spec → Layout and Spacing`.

**Disparador (UI):** se reemplaza el botón único por tres botones (`Anatomy`, `Properties`,
`Layout & Spacing`). El mensaje pasa a `{ tipo: "generar", seccion: "anatomy" | "properties" | "layout" }`.
`main.ts` ramifica por `seccion` (reemplaza la heurística set→Properties/else→Anatomy actual por ramas
explícitas).

**Decisión de diseño:** el generador no tiene lógica de decisión; traduce `LayoutSpec[]` a frames.

---

## Sección 4 — Manejo de errores y casos límite

**Validación por sección** (en `main.ts`):

| Sección | Caso | Comportamiento |
|---------|------|----------------|
| (cualquiera) | Nada seleccionado | "Seleccioná algo para generar specs." |
| Layout | Selección no es contenedor | "Layout and Spacing necesita un FRAME, COMPONENT o INSTANCE." |
| Layout | Sin capas con Auto Layout | Genera la sección con nota "No se detectaron capas con Auto Layout." |
| Properties | Sin variantes | "Properties necesita un componente con variantes." |
| Anatomy | Tipo inválido | "Anatomy necesita un FRAME, COMPONENT, INSTANCE o COMPONENT_SET." |

**Casos límite de Layout:**
- Frame con Auto Layout sin hijos → igual genera su exhibit.
- Modo "Space between" → se muestran alineación primaria `SPACE_BETWEEN` e itemSpacing sin tratamiento especial.
- Toda la generación va en `try/catch` → `{ ok:false, error }` a la UI.

**Decisión de diseño:** cada sección valida lo suyo en su rama; extracción y generador asumen entrada válida.

---

## Sección 5 — Estrategia de testing

**1. Tests unitarios de lógica pura (`node --test`):**
- `traversal/recorrer-autolayout.ts`: raíz con Auto Layout se incluye; raíz sin pero hijo con sí → solo el hijo; frena en instancias; frame anidado con Auto Layout se incluye además de la raíz.
- `extraccion/layout.ts`: traducción de alineación y de resizing; armado completo de un `LayoutSpec`; defaults (padding/itemSpacing ausentes → 0).

**2. Verificación manual en Figma:** frame con Auto Layout (padding, gap, hijos, frame interno con su propio
Auto Layout) → botón "Layout & Spacing" → un exhibit por frame con Auto Layout, valores coincidentes con el
panel de Figma. Comparar contra `prd-images/3. Layout and Spacing/`. Verificar que Anatomy y Properties siguen
funcionando desde sus botones.

**3. Componente de prueba fijo** para regresiones a ojo.

**Lo que NO se hace:** mock de la Figma API ni tests del canvas.

---

## Fuera de alcance de esta rebanada (futuras rebanadas)

- Overlays de color (azul=elemento, verde=padding, naranja=spacing) sobre artwork clonado.
- Íconos de dirección/alineación y marcadores de resizing (Fill/Fixed/Hug visuales).
- "Hide outer layout annotations".
- Alineación variable por eje (Top/Left vs Start).
- Unificación de Anatomy + Properties + Layout en un mismo Spec.
- Formateo rico de variables/tokens en valores de spacing.
