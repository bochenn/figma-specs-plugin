# Diseño — Columna de atributos en Tabular Anatomy — Rebanada 26

**Fecha:** 2026-06-12
**Proyecto:** Specs Plugin para Figma — plugin de documentación de specs para handoff (una sola versión, sin tiers)
**Alcance de este spec:** Sumar una columna "Attributes" a la tabla de Tabular Anatomy, con los atributos de cada elemento aplanados. Refina la Rebanada 20.

---

## Contexto y estrategia

La Rebanada 20 agregó Tabular Anatomy: una tabla `# / Name / Type` (`filaAnatomy` + `tablaDe`). Como
`tablaDe` ya es genérica (N columnas) y `specDeAnatomy` pasa `HEADERS_ANATOMY` + `elementos.map(filaAnatomy)`,
sumar una columna se reduce a cambiar `HEADERS_ANATOMY` y `filaAnatomy`. El generador no cambia.

**Decisiones tomadas en el brainstorming:**
- Los atributos se aplanan como `clave: valor` separados por `, ` en una sola celda (todos los del elemento).
- Elemento sin atributos → celda vacía.

---

## Sección 1 — Columna "Attributes"

**`utils/tabla-anatomy.ts`:**

```typescript
export const HEADERS_ANATOMY = ["#", "Name", "Type", "Attributes"];

export function filaAnatomy(numero: number, elemento: ElementoAnatomy): string[] {
  const attrs = elemento.atributos.map((a) => `${a.clave}: ${a.valor}`).join(", ");
  return [String(numero), elemento.nombre, elemento.tipo, attrs];
}
```

`tablaDe` (`generadores/frames.ts`) alinea la nueva columna por su ancho máximo, sin cambios. `specDeAnatomy`
sigue igual (pasa los headers y las filas).

---

## Sección 2 — Errores y casos límite

| Caso | Comportamiento |
|------|----------------|
| Elemento con atributos | Celda `clave: valor, …`. |
| Elemento sin atributos | Celda vacía. |
| Tabular off | Sin cambios (la lista no usa la tabla). |
| Atributos largos | La columna se ensancha (la fija `tablaDe` al ancho máximo). |

---

## Sección 3 — Estrategia de testing

**1. Tests unitarios de lógica pura (`node --test`):**
- `HEADERS_ANATOMY` es `["#", "Name", "Type", "Attributes"]`.
- `filaAnatomy(1, { …, atributos: [] })` → `["1", "Label", "TEXT", ""]`.
- `filaAnatomy(1, { …, atributos: [{clave:"width", valor:"120", …}, {clave:"opacity", valor:"50%", …}] })` →
  `["1", "Box", "FRAME", "width: 120, opacity: 50%"]`.

**2. Verificación manual en Figma:** componente con elementos que tengan atributos → "Tabular anatomy" ON →
"Anatomy" → la tabla muestra la columna **Attributes** con `clave: valor, …` por fila.

**3. Componente de prueba fijo.**

**Lo que NO se hace:** mock de figma; `tablaDe`/`specDeAnatomy` se validan a ojo.

---

## Fuera de alcance de esta rebanada (futuras rebanadas)

- Swatches/pills de color dentro de la celda (hoy es texto plano).
- Una columna por tipo de atributo (hoy van todos juntos).
