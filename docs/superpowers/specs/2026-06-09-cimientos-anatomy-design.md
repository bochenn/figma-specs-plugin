# Diseño — Cimientos + Anatomy (Rebanada 0 + 1)

**Fecha:** 2026-06-09
**Proyecto:** Specs Plugin para Figma — plugin de documentación de specs para handoff
**Alcance de este spec:** Infraestructura compartida del plugin + primera feature real (Anatomy), de punta a punta.

---

## Contexto y estrategia

El objetivo a largo plazo es implementar el plugin completo descrito en el PRD lo más fiel posible
(18 features en 3 niveles: gratis / Pro / Pro Formatting). Eso es demasiado para un solo spec, así que el
proyecto se **descompone en rebanadas**, cada una con su propio ciclo *spec → plan → implementación*.

**Orden de rebanadas:**
- **Rebanada 0 — Cimientos:** esqueleto del plugin, build, comunicación UI↔código, helpers base de traversal.
- **Rebanada 1 — Anatomy:** feature #1 del PRD, end-to-end. Define los patrones ("lista + artwork anotado")
  que reutilizan Properties, Layout y Modes.
- **Siguientes (orden del roadmap del PRD):** Properties → Layout and Spacing → Data → Styling Inventory
  → (Pro) → (Pro Formatting).

Regla: **terminar y validar cada rebanada de punta a punta** (corre en Figma, genera output, se compara
contra las referencias del PRD) antes de pasar a la siguiente.

**Decisiones tomadas en el brainstorming:**
- Objetivo: implementación fiel del PRD a largo plazo.
- Entorno listo: Figma Desktop + Node.js + sabe cargar plugins en dev.
- Referencia de fidelidad: las `prd-images` y la especificación del PRD.
- Setup técnico: **Opción A** — setup mínimo con esbuild + UI en HTML/TS plano (sin framework).
  Razón: simple, legible, sin magia, encaja con las preferencias de soluciones nativas y sin dependencias innecesarias.
- Íconos de tipo de capa: **etiqueta de texto ahora**, íconos vectoriales como pulido posterior.

---

## Sección 1 — Estructura del proyecto y build

```
figma-specs-plugin/
├── manifest.json          # metadata del plugin (nombre, permisos, entry points)
├── package.json
├── tsconfig.json
├── esbuild.config.mjs     # compila plugin + UI
├── src/
│   ├── plugin/            # corre en el "sandbox" de Figma (acceso a figma.*)
│   │   ├── main.ts        # punto de entrada: orquestador delgado, escucha mensajes de la UI
│   │   ├── traversal/
│   │   │   └── recorrer.ts        # recorre la selección, frena en nested components
│   │   ├── modelo/
│   │   │   └── tipos.ts           # interfaces: ElementoAnatomy, Atributo, mensajes UI↔plugin
│   │   ├── extraccion/
│   │   │   └── anatomy.ts         # de nodos Figma → datos de Anatomy (lógica pura)
│   │   ├── generadores/
│   │   │   └── anatomy.ts         # de datos → frames en el canvas
│   │   └── utils/
│   │       ├── atributos.ts       # leer color, width, opacity de un nodo
│   │       └── marcadores.ts      # colocar marcadores numerados en el artwork
│   └── ui/
│       ├── index.html     # panel: botón "Generate" + (luego) toggles
│       └── ui.ts          # lógica del panel, manda mensajes al plugin
└── dist/                  # salida compilada (code.js + ui.html)
```

**Dos mundos separados (lo impone Figma):**
- `src/plugin/` corre en el sandbox de Figma; único con acceso a `figma.*`. **No** tiene DOM.
- `src/ui/` es un iframe HTML normal; tiene DOM, no tiene `figma.*`.
- Se comunican **solo por mensajes** (`postMessage`).

**Decisión de diseño clave:** separar **extracción** (nodos Figma → datos planos) de **generación**
(datos → frames). Permite testear la extracción con lógica pura sin necesitar Figma, y mantiene cada
archivo con un único propósito.

---

## Sección 2 — Flujo de comunicación

```
┌─────────────┐   1. postMessage           ┌──────────────────┐
│   UI (iframe)│ ──── { tipo: "generar" } ──▶│  plugin (sandbox)│
│  index.html  │                             │     main.ts      │
│   + ui.ts    │                             │                  │
│  [Generate]  │◀── { tipo: "resultado" } ───│                  │
└─────────────┘   4. postMessage             └──────────────────┘
                                                      │
                  2. lee figma.currentPage.selection  │
                  3. orquesta: recorrer → extraer →   │
                     generar frames en el canvas      ▼
                                              [ Specifications ]
```

**Paso a paso de un "Generate":**
1. **UI → plugin:** manda `{ tipo: "generar" }` (más adelante incluirá opciones/toggles).
2. **Validación:** `main.ts` lee `figma.currentPage.selection`. Si hay 0 elementos, o el tipo no es
   válido, corta y avisa (ver Sección 5).
3. **Orquestación:** para el nodo seleccionado: `recorrer()` → `extraerAnatomy()` → `generarAnatomy()`.
   Crea el frame `Specifications` en el canvas y hace `figma.viewport.scrollAndZoomIntoView`.
4. **Plugin → UI:** manda `{ tipo: "resultado", ok: true }` (o error) para feedback en el panel.

**Decisiones de diseño:**
- `main.ts` es solo **orquestador delgado**: recibe, valida, llama módulos en orden, responde.
  Toda la lógica pesada vive en `traversal/`, `extraccion/`, `generadores/`.
- **Mensajes tipados:** `MensajeUI` y `MensajePlugin` definidos en `modelo/tipos.ts`.

---

## Sección 3 — Modelo de datos y recorrido de capas

**Modelo de datos** (`modelo/tipos.ts`):

```typescript
interface ElementoAnatomy {
  id: string;              // id del nodo en Figma (para vincular con el marcador)
  nombre: string;          // node.name
  tipo: NodeType;          // "FRAME" | "TEXT" | "INSTANCE" | "RECTANGLE" | ...
  esInstancia: boolean;    // si es una nested instance
  dependeDe?: string;      // "Depends on": nombre del componente de origen
  atributos: Atributo[];   // background color, width, opacity, etc.
}

interface Atributo {
  clave: string;           // "background-color", "width", "opacity"
  valor: string;           // valor legible: "#0E68D4", "240", "80%"
  formato: "HARDCODED" | "VARIABLE" | "STYLE";  // en esta rebanada: casi todo HARDCODED
}
```

> En la Rebanada 1, variables/styles se detectan a nivel básico. El formateo rico (pills, prioridades
> de tokens) es trabajo de rebanadas Pro posteriores. Acá guardamos el dato; el lujo viene después.

**Recorrido** (`traversal/recorrer.ts`) — regla central del PRD:

```
recorrer(nodo):
  para cada hijo de nodo:
    - si es TEXT / shape (RECTANGLE, LINE, POLYGON, STAR, etc.)  → ELEMENTO (hoja)
    - si es INSTANCE (nested component)  → ELEMENTO, y NO se recorren sus hijos ⛔
    - si es FRAME / GROUP                → ELEMENTO y además se sigue recorriendo hacia adentro
```

Reglas literales del PRD:
1. Las nested instances cuentan como un elemento, pero **NO se itemizan sus children** (el recorrido
   frena ahí). Para specs internas, se corre el plugin sobre esa instancia (o, futuro, toggle
   "Spec nested subcomponents").
2. El **orden** de los elementos sigue el orden del árbol de Figma (lo que después numeran los marcadores).

**Decisión de diseño:** `recorrer()` devuelve una **lista plana** de nodos-elemento. La conversión
nodo→`ElementoAnatomy` (leer atributos, resolver `dependeDe`) la hace `extraccion/anatomy.ts`.
Recorrido y extracción separados, cada uno testeable y con un propósito.

---

## Sección 4 — Generación del output visual

El generador (`generadores/anatomy.ts`) construye, con **Auto Layout**, esta jerarquía:

```
Specifications                         (frame, Auto Layout vertical)
└── [Nombre] Spec                      (frame, Auto Layout vertical)
    ├── Título: "[Nombre]"             (texto grande)
    └── Anatomy                        (sección, Auto Layout vertical)
        ├── Heading "Anatomy"
        └── Display                    (Auto Layout HORIZONTAL — "List beside artwork")
            ├── Content (lista)        (Auto Layout vertical, izquierda)
            │   ├── ① Nombre elemento · TYPE
            │   │      └── atributos (background color #..., width 240, ...)
            │   ├── ② Otro elemento · INSTANCE
            │   │      └── Depends on: [Componente]
            │   └── ...
            └── Artwork                (frame, derecha)
                ├── [clon del nodo seleccionado]   (node.clone())
                └── marcadores ①②③... sobre el perímetro
```

**El artwork:**
- Se clona el nodo seleccionado (`node.clone()`) dentro de un frame contenedor.
- Por cada elemento de la lista, un **marcador numerado** (círculo con número) cerca del elemento
  correspondiente. La numeración coincide con la de la lista (vínculo visual).
- **Posicionamiento** (`utils/marcadores.ts`): proyectar la posición del elemento al **perímetro,
  priorizando el borde izquierdo** (regla del PRD). Primera versión con algoritmo simple
  (proyectar al borde más cercano con preferencia izquierda); anti-solapamiento fino = pulido posterior.

**Íconos de tipo de capa:** en esta rebanada, **etiqueta de texto del tipo** (`TEXT`, `INSTANCE`).
Íconos vectoriales = pulido posterior.

**Decisión de diseño:** todo con **Auto Layout** (no coordenadas x/y manuales), salvo los marcadores,
que sí se posicionan a mano sobre el artwork. El output del PRD es 100% Auto Layout.

---

## Sección 5 — Manejo de errores y casos límite

**Validación de la selección** (en `main.ts`, antes de generar):

| Caso | Comportamiento |
|------|----------------|
| Nada seleccionado | "Seleccioná un componente, instancia o frame para generar specs." No genera. |
| Tipo no soportable (texto suelto, línea) | Avisa que Anatomy necesita un contenedor (FRAME / COMPONENT / INSTANCE / COMPONENT_SET). |
| Múltiples seleccionados | Procesa **el primero** y avisa "Se generó para el primer elemento; la selección múltiple llega después." |
| Nodo sin hijos (contenedor vacío) | Genera spec con artwork pero lista vacía + nota "Sin elementos detectados". |

**Casos límite del recorrido:**
- **Muchísimos elementos:** los marcadores pueden saturarse (PRD lo advierte). No se bloquea; se genera
  igual y se mejora con anti-solapamiento más adelante.
- **`node.clone()` falla o nodo enorme:** generación envuelta en `try/catch`; devuelve
  `{ tipo: "resultado", ok: false, error: "..." }` para mostrar el problema en la UI (nada de fallar mudo).

**Feedback al usuario:** todo error o éxito vuelve a la UI por mensaje y se muestra como texto en el panel.
Para depurar, además `console.log` (visible en la consola de dev de Figma).

**Decisión de diseño:** la validación vive en **un solo lugar** (`main.ts`), antes de la lógica pesada.
Los módulos de extracción/generación asumen un nodo válido y no repiten chequeos defensivos.

---

## Sección 6 — Estrategia de testing

El código que usa `figma.*` no corre fuera de Figma. La separación *extracción* (pura) / *generación*
(toca `figma.*`) es lo que hace testeable el proyecto.

**Tres niveles:**

1. **Tests unitarios de lógica pura (automáticos, sin Figma)** — con `node --test` (nativo, sin
   dependencias extra):
   - `traversal/recorrer.ts`: árbol de nodos *falso* → verificar que frena en instancias, itemiza
     shapes/textos, orden correcto.
   - `extraccion/anatomy.ts`: nodo falso → `ElementoAnatomy` esperado.
   - `utils/marcadores.ts`: posición dada → ¿proyecta al borde correcto?

   Para esto se define una **interfaz mínima de nodo** (solo props que leemos: `type`, `name`,
   `children`, etc.), así los módulos puros no dependen de los tipos globales de Figma.

2. **Verificación manual en Figma (test de aceptación real):** cargar el plugin en Figma Desktop,
   correrlo sobre un componente de prueba y **comparar contra las referencias del PRD** (`prd-images`).
   Fuente de verdad de la fidelidad.

3. **Componente de prueba fijo:** un componente de referencia (ej. Alert o Button con texto + ícono +
   shapes) para detectar regresiones a ojo.

**Lo que NO se hace:** no se monta un mock pesado de toda la Figma API ni tests de integración del
canvas (frágil y poco valor). La generación visual se valida con ojos humanos contra la referencia.

**Decisión de diseño:** toda la lógica de decisión (qué es un elemento, qué atributos, dónde va un
marcador) vive en módulos puros testeados; los generadores son lo más "tontos" posible (solo traducen
datos a frames).

---

## Fuera de alcance de esta rebanada (futuras rebanadas)

- Properties, Layout and Spacing, Data, Styling Inventory.
- Todas las features Pro y Pro Formatting.
- Íconos vectoriales de tipo de capa.
- Selección múltiple.
- Formateo rico de variables/tokens/styles (pills, prioridades).
- Anti-solapamiento avanzado de marcadores.
- Toggle "Spec nested subcomponents".
