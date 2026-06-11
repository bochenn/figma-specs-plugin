# Specs Plugin para Figma

Plugin de Figma que genera **specs visuales para handoff** de diseño: documenta automáticamente la anatomía, las propiedades, el layout, las variables y los estilos de los componentes y frames seleccionados, directo en el canvas.

La idea es reducir el trabajo manual de documentar componentes y mejorar la claridad del handoff entre diseño, design systems y desarrollo.

---

## ✨ Features

El plugin tiene un botón por cada sección. Seleccionás un nodo y apretás el botón:

| Sección | Qué hace |
|---------|----------|
| **Anatomy** | Lista los elementos del componente (nombre, tipo, atributos) + artwork clonado con marcadores numerados. Los colores se muestran como **pills** con swatch y, si aplica, el nombre de la **variable** o **style** (prioridad variable > style > hardcoded). |
| **Properties** | Compara el default contra cada opción de cada propiedad de **variante**, mostrando solo los atributos que cambian (con pills). Incluye las propiedades **Boolean** con resaltado azul de las capas afectadas. |
| **Layout & Spacing** | Por cada capa con Auto Layout: dirección, alineación, resizing, padding e item spacing. Suma un artwork con **overlays de color** (azul = elemento, verde = padding, naranja = spacing). |
| **Data (JSON)** | Exporta el JSON de Anatomy en un text frame. |
| **Styling Inventory** | Tres tablas (Variables con chip de color, Color styles, Text styles) con columnas Name / Applied as / Applied to. |
| **Modes** | Por cada variable collection con ≥2 modes (ej. Light/Dark): el artwork del ítem con cada mode aplicado + la comparación de valores por mode. |
| **Two-Way** | Compara todas las combinaciones de las dos primeras propiedades de variante (producto cartesiano), para los *compound props*. |
| **Complete Anatomy** | Lista los elementos que aparecen en otras variantes pero no en el default. |

---

## 🚀 Desarrollo

Requiere **Figma Desktop** (la versión web no permite cargar plugins en desarrollo) y **Node.js**.

```bash
npm install        # instala dependencias
npm run build      # compila a dist/code.js + dist/ui.html
npm run watch      # recompila en cada cambio
npm test           # corre los tests de lógica pura (node --test)
```

**Cargar el plugin en Figma:**
1. Figma Desktop → menú **Plugins → Development → Import plugin from manifest…**
2. Elegir `manifest.json` de este repo.
3. Correr el plugin: **Plugins → Development → Specs Plugin**.

Tras cada `npm run build`, volvé a correr el plugin para tomar los cambios.

---

## 🧱 Arquitectura

TypeScript + [esbuild](https://esbuild.github.io/), sin frameworks de UI. El plugin tiene dos mundos que se comunican por `postMessage` (lo impone Figma):

- `src/plugin/` — corre en el sandbox de Figma (único con acceso a `figma.*`).
- `src/ui/` — el panel (iframe HTML).

La lógica se separa en:

- **extracción** (`extraccion/`, `traversal/`, `comparacion/`, `inventario/`, `variables/`): nodos de Figma → datos planos. Lógica **pura**, testeable sin Figma contra una interfaz mínima `NodoLike`.
- **generación** (`generadores/`): datos → frames con Auto Layout. Toca `figma.*`; se valida a mano.
- **orquestación** (`main.ts`): valida la selección, ramifica por sección, posiciona el output.

Esta separación pura/impure es lo que permite tener ~90 tests unitarios sin mockear la API de Figma.

```
src/plugin/
├── main.ts              # orquestador (un branch por sección)
├── modelo/tipos.ts      # interfaces del dominio
├── traversal/           # recorrido de capas
├── extraccion/          # nodos → datos (Anatomy, Properties, Layout…)
├── comparacion/         # diff de variantes
├── inventario/          # Styling Inventory
├── variables/           # Modes, formato de color
├── serializacion/       # Data (JSON)
├── generadores/         # datos → frames
└── utils/               # helpers puros (atributos, color, overlays…)
```

---

## 🧪 Tests

```bash
npm test
```

Los tests cubren toda la lógica de decisión (qué es un elemento, qué atributos, qué cambia entre variantes, dónde van los overlays, etc.) sobre datos de prueba. La generación visual se valida a ojo dentro de Figma contra las referencias del PRD.

---

## 📐 Documentación de diseño

Cada feature se construyó con su ciclo *spec → plan → implementación*, documentado en `docs/superpowers/`:

- `specs/` — el diseño de cada rebanada.
- `plans/` — el plan de implementación tarea por tarea (TDD).

El PRD original está en `PRD.md`.

---

## 📦 Estado

En desarrollo activo. Ya están implementadas las features Standard y varias Pro; quedan pendientes Complete Layout, Spec Nested Components, parte del Pro Formatting y la integración con Token Studio.
