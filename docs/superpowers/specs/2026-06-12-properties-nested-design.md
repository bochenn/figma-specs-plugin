# Diseño — Properties de instancias anidadas — Rebanada 29

**Fecha:** 2026-06-12
**Proyecto:** Specs Plugin para Figma — plugin de documentación de specs para handoff (una sola versión, sin tiers)
**Alcance de este spec:** Con el toggle "Spec nested subcomponents" activo, el botón Properties documenta también los component sets de las instancias anidadas: una sección Properties completa por cada set anidado, debajo de la del set seleccionado.

---

## Contexto y estrategia

El toggle "Spec nested" ya existe y funciona para Anatomy: `instanciasAnidadas` (`main.ts`) junta las
instancias de primer nivel y `generarAnatomyConNested` apila un spec por instancia debajo del
principal, componiendo con el helper `specDeAnatomy`.

Properties hoy ignora el toggle: documenta solo el set seleccionado. Esta rebanada replica el patrón
de Anatomy para Properties.

**Decisiones tomadas en el brainstorming:**
- Semántica elegida: documentar los **component sets completos** de las instancias anidadas (misma
  sección Properties que el principal). La vista "qué props setea cada variante del padre sobre sus
  hijos" quedó descartada.
- Disparador: el toggle existente. Sin UI nueva.
- Las instancias se buscan en la **variante default** del set (aparecen repetidas en cada variante;
  con una vez alcanza).

---

## Sección 1 — Recolección (`main.ts`)

`generarSeccionProperties` pasa a recibir `nested: boolean`. Con `nested` activo:

1. `instanciasAnidadas(componentSet.defaultVariant ?? componentSet)` — las instancias de primer
   nivel de la variante default (la función ya existe y frena en instancias).
2. Cada instancia → `resolverComponentSet(instancia)` (ya existe). Se descartan:
   - las que devuelven `null` (main component sin variantes),
   - los sets repetidos (dedupe por `id`: dos instancias del mismo set → una sección),
   - el set seleccionado mismo (auto-referencia).
3. Por cada set anidado: `normalizarSet` + `extraerProperties` (ya existen, sin cambios).

Es orquestación impura, igual que el resto de `main.ts`.

---

## Sección 2 — Generador (`generadores/properties.ts`)

Refactor al estilo Anatomy:

- Se extrae de `generarProperties` el helper
  `specDeProperties(componentSet, propiedades, defaultProps, columnas): Promise<FrameNode>` que
  construye y devuelve el frame `"{nombre} Spec"` completo (título + sección Properties con sus
  subsecciones). `generarProperties` queda: crear `Specifications`, append del helper, append a la
  página.
- Se agrega `generarPropertiesConNested(componentSet, propiedades, defaultProps, columnas, nested)`,
  donde `nested` es `{ set: ComponentSetNode; propiedades: PropiedadSpec[]; defaultProps: Record<string, string> }[]`:
  crea `Specifications` y apila el spec del principal más uno por cada set anidado, en el orden en
  que aparecen las instancias.

El contenido de cada sección Properties no cambia: mismo `displayOpcion`, mismas columnas.

---

## Sección 3 — Testing y verificación

La extracción pura (`extraerProperties`, `compararVariante`) ya está testeada y no se toca. Lo nuevo
es recolección y composición impuras, así que la verificación es manual en Figma:

1. Component set A con variantes que contiene una instancia de un component set B con variantes →
   Properties con nested ON → sección Properties de A y debajo la de B.
2. Nested OFF → solo A (comportamiento actual intacto).
3. Instancia de un componente **sin** variantes dentro de A → no genera sección.
4. Dos instancias del mismo set B dentro de A → una sola sección de B.
5. Multi-column (Columns = 2) → las opciones de cada set se reparten igual que hoy.

`npm run build && node --test` siguen verdes (sin tests nuevos: no hay lógica pura nueva).

---

## Fuera de alcance de esta rebanada

- Instancias anidadas dentro de otras instancias (el walk frena en el primer nivel, como Anatomy).
- La vista "qué variant properties setea cada variante del padre en sus instancias".
- Two-Way y Complete A/L con nested (solo el botón Properties).
