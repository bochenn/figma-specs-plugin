# Diseño — Tabular Anatomy — Rebanada 20

**Fecha:** 2026-06-11
**Proyecto:** Specs Plugin para Figma — plugin de documentación de specs para handoff (una sola versión, sin tiers)
**Alcance de este spec:** Toggle "Tabular anatomy" que renderiza el contenido de Anatomy como tabla `# / Name / Type` en vez de la lista vertical. El artwork queda sin cambios.

---

## Contexto y estrategia

Hoy Anatomy muestra una lista vertical (nombre, tipo, atributos con pills) al lado del artwork. "Tabular
anatomy" presenta los elementos como tabla. Se agrega un toggle (como nested/dark): con el toggle activo, el
contenido sale como tabla.

La lógica pura (qué celdas tiene cada fila) es testeable; el armado de la tabla en Figma es un helper
reusable que alinea columnas por el ancho máximo de cada una (como `enColumnas` pero por columna).

**Decisiones tomadas en el brainstorming:**
- Columnas `# / Name / Type` (sin atributos). Los atributos detallados siguen en la vista de lista.
- Toggle "Tabular anatomy"; el artwork queda igual.

---

## Sección 1 — Toggle y mapeo puro

**UI** (`index.html` + `ui.ts`): checkbox "Tabular anatomy" junto a nested/dark. El mensaje suma `tabla`;
`MensajeUI` (`modelo/tipos.ts`) pasa a `{ ..., tabla?: boolean }`.

**Mapeo puro** (`utils/tabla-anatomy.ts`):

```typescript
import type { ElementoAnatomy } from "../modelo/tipos.ts";

export const HEADERS_ANATOMY = ["#", "Name", "Type"];

export function filaAnatomy(numero: number, elemento: ElementoAnatomy): string[] {
  return [String(numero), elemento.nombre, elemento.tipo];
}
```

---

## Sección 2 — Helper de tabla y aplicación en Anatomy

**Helper genérico** `tablaDe(headers: string[], filas: string[][]): Promise<FrameNode>` (impure, en
`generadores/frames.ts`): crea los text nodes de todas las celdas (header + filas), calcula el ancho máximo
por columna, y arma una fila (frame horizontal) por registro fijando cada celda a ese ancho → columnas
alineadas sin overflow. Devuelve un frame vertical con el header arriba.

**`specDeAnatomy(seleccionado, elementos, tabla)`** (`generadores/anatomy.ts`): dentro del display
(horizontal): si no hay elementos → nota "Sin elementos detectados"; si `tabla` → `tablaDe(HEADERS_ANATOMY,
elementos.map((e, i) => filaAnatomy(i + 1, e)))`; si no → la lista actual. El artwork queda al lado, sin
cambios.

El flag se propaga: `generarAnatomy(seleccionado, elementos, tabla)` y
`generarAnatomyConNested(seleccionado, elementos, nested, tabla)` (las nested también salen tabulares).
`main.ts`: `generarSeccionAnatomy(nodo, nested, tabla)`; el dispatcher pasa `msg.tabla ?? false`.

---

## Sección 3 — Errores y casos límite

| Caso | Comportamiento |
|------|----------------|
| Tabular off | Anatomy como hoy (lista). |
| Tabular on | Tabla `# / Name / Type` + artwork. |
| Sin elementos | Nota "Sin elementos detectados" (ambos modos). |
| Tabular + nested | Cada spec (principal y nested) sale tabular. |
| Tabular + dark/columns | Independientes; conviven. |
| Falla en generación | `try/catch` en `main.ts` (ya existe). |

---

## Sección 4 — Estrategia de testing

**1. Tests unitarios de lógica pura (`node --test`):**
- `filaAnatomy(1, { nombre: "Label", tipo: "TEXT", ... })` → `["1", "Label", "TEXT"]`.

**2. Verificación manual en Figma:** componente → "Tabular anatomy" ON → "Anatomy" → tabla alineada
`# / Name / Type` + artwork; OFF → lista como antes. Probar combinado con dark/columns y con nested.

**3. Componente de prueba fijo.**

**Lo que NO se hace:** mock de figma; `tablaDe`/`specDeAnatomy` se validan a ojo.

---

## Fuera de alcance de esta rebanada (futuras rebanadas)

- Columna de atributos (aplanados) en la tabla.
- Estilos de header (negrita, fondo) y bordes de la tabla.
- Tabla para otras secciones (Properties, etc.).
