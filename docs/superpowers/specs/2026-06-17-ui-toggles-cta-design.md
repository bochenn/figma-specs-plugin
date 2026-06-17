# Diseño — UI con toggles de sección + CTA (multi-sección apilada)

**Fecha:** 2026-06-17
**Proyecto:** Specs Plugin para Figma — plugin de documentación de specs para handoff.
**Alcance:** Rediseñar la interacción del plugin: los 8 botones que hoy generan una sección al toque
pasan a ser **checkboxes de sección** arriba; un único **CTA "Create spec"** genera todas las
secciones tildadas, **apiladas en un solo frame `Specifications`** (estilo DesignDoc / Specs 2).

---

## Estado actual

`ui.ts`: 8 botones (`anatomy`, `properties`, …); cada `onclick` manda `pluginMessage` con
`seccion: <una>` + todas las opciones. `main.ts` (`onmessage`) genera **una** sección según
`msg.seccion`. Cada `generarX` crea su propio `Specifications`, mete su sección y hace
`figma.currentPage.appendChild`. `finalizar(frame, nodo)` posiciona y tematiza.

## Decisiones (brainstorming)

- **Múltiples** secciones por CTA (checkboxes), no una sola.
- Outputs **apilados en un único `Specifications`** (un solo objeto resultante).
- Las opciones de formato (Columns/Color/Units/Type/Raw/Preferred) y los toggles modificadores
  (Spec nested, Dark mode, Tabular anatomy, Hide outer layout, Itemize instances, Element measures)
  **se mantienen** en su grupo; lo que cambia es que las 8 **secciones** pasan a checkboxes + CTA.

## Sección 1 — Separar "sección" de "Specifications" en los generadores

Cada `generarX(...)` se divide:
- **`seccionDe<X>(...): Promise<FrameNode>`** — devuelve el FrameNode de la sección (su título de
  sección + contenido), **sin** crear `Specifications`, sin título de nodo, sin `appendChild`.
- **`generarX(...)`** (wrapper, se conserva para no romper nada): crea `Specifications` + título de
  nodo + `seccionDe<X>` + `appendChild`; igual que hoy.

Afecta: `anatomy.ts` (anatomy y nested), `properties.ts` (properties, nested, dos-way),
`layout.ts`, `data.ts`, `styling.ts`, `modes.ts`, `complete.ts`. El contenido de cada sección no
cambia.

## Sección 2 — main: generación multi-sección

`MensajeUI`: `seccion: Seccion` → `secciones: Seccion[]`.

Nuevo flujo en `onmessage`:
1. Validar selección de nodo (igual que hoy) y que `secciones` no esté vacío.
2. Aplicar las opciones (tema/color/unidad/etc.) y `asegurarVariablesTema()` (igual que hoy).
3. Crear **un** `Specifications` (`frameVertical("Specifications", 128, 64)`) con el título del nodo
   (`texto(nodo.name, 64)`).
4. Por cada sección elegida, en orden fijo (Anatomy, Properties, Layout, Data, Styling, Modes,
   Two-Way, Complete): obtener su `seccionDe<X>` (con la extracción que ya hace cada
   `generarSeccionX`) y `appendChild` al `Specifications`. Las secciones que **requieren component
   set** (Properties/Two-Way/Complete/Modes) y no aplican al nodo: se omiten con una línea de aviso
   en su lugar (no abortan las demás).
5. `figma.currentPage.appendChild(Specifications)` + `finalizar`.

Los `generarSeccionX` actuales de `main.ts` se ajustan para devolver su `seccionDe<X>` (o se
reemplazan por un mapa `seccion → () => Promise<FrameNode>`).

## Sección 3 — UI (`index.html` + `ui.ts`)

- **Grupo "Specs"**: 8 checkboxes (Anatomy, Properties, Layout & Spacing, Data (JSON), Styling
  Inventory, Modes, Two-Way, Complete A/L). Por defecto Anatomy tildado.
- **CTA**: un botón primario `Create spec` (estilo destacado, ancho completo).
- Los grupos **Opciones** y **Formato** (toggles + selects) quedan como están.
- `ui.ts`: leer los checkboxes de sección → `secciones: Seccion[]`; el CTA arma el `pluginMessage`
  con `secciones` + las opciones. Se eliminan los 8 `onclick` por botón.

## Sección 4 — Testing y verificación

Es UI + orquestación impura; la extracción/generadores de cada sección no cambian su lógica (sus
tests siguen). Sin tests nuevos. Verificación manual: tildar varias secciones (ej. Anatomy + Layout)
→ un solo `Specifications` con ambas apiladas; tildar una que requiere component set sobre un frame
suelto → aviso en esa sección, las demás generan; el CTA respeta las opciones (Dark, Units, etc.).

## Fuera de alcance

- Tabs/pestañas (Specs/Settings/Help) — el grupo de opciones queda visible, sin tabs.
- Contador de uso / upgrade (el plugin es una sola versión sin tiers).
- Cambios en el contenido de cada sección (ya cubierto por las rebanadas anteriores).
