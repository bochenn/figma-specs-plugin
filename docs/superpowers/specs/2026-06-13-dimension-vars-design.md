# Diseño — Variables de width/height resueltas — Rebanada 36

**Fecha:** 2026-06-13
**Proyecto:** Specs Plugin para Figma — plugin de documentación de specs para handoff (una sola versión, sin tiers)
**Alcance de este spec:** Que el atributo `width` de Anatomy muestre la variable atada (nombre + valor), y que se agregue `height` como atributo cuando esté atado a una variable. Cierra la parte numérica del backlog junto a la rebanada 35 (padding/item-spacing).

---

## Contexto y estrategia

`leerAtributos` (`utils/atributos.ts`) hoy agrega `width` siempre como HARDCODED (`width: 240`) y no
extrae `height`. El PRD de Anatomy muestra width atado a variable: `Width: DS Sizing/platform/iOS
default width (343)`. Figma expone `node.boundVariables.width` / `.height` como `VariableAlias`; el
adaptador ya resuelve fills/strokes con `nombreVariable`.

**Decisiones (rebanada autónoma):**
- `width`: si hay variable atada → formato `VARIABLE` con `rawValue` = valor (respeta px/rem); si no
  → HARDCODED con el número (comportamiento actual intacto).
- `height`: se agrega como atributo **solo cuando está atado a una variable** (asimétrico con width
  a propósito: no metemos altura en todos los nodos, solo cuando aporta el token).
- Reusa el modelo `Atributo` existente (`formato` + `rawValue`), que el renderizador ya muestra como
  `clave: valor (raw)`.

---

## Sección 1 — Modelo

`NodoLike` += `widthVariableName?: string; heightVariableName?: string;` (resueltos "Colección/Variable").

## Sección 2 — Lógica (`utils/atributos.ts`)

Helper:

```typescript
// Atributo de dimensión: VARIABLE (nombre + rawValue) si hay variable atada;
// HARDCODED (valor pelado) si no.
function dimensionAtributo(clave: string, px: number, nombreVar?: string): Atributo {
  const valorFmt = formatearEspaciado(px, unidadActual());
  if (nombreVar) return { clave, valor: nombreVar, formato: "VARIABLE", rawValue: valorFmt };
  return { clave, valor: valorFmt, formato: "HARDCODED" };
}
```

`leerAtributos`:
- `width`: `if (typeof nodo.width === "number") atributos.push(dimensionAtributo("width", nodo.width, nodo.widthVariableName));`
- `height`: `if (typeof nodo.height === "number" && nodo.heightVariableName) atributos.push(dimensionAtributo("height", nodo.height, nodo.heightVariableName));`

## Sección 3 — Extracción (`adaptador.ts`)

En el bloque `boundVariables`, sumar `width`/`height` al tipo y resolver:

```typescript
    if (bv.width) { const n = nombreVariable(bv.width.id); if (n) base.widthVariableName = n; }
    if (bv.height) { const n = nombreVariable(bv.height.id); if (n) base.heightVariableName = n; }
```

## Sección 4 — Testing y verificación

Tests (`tests/atributos.test.ts`): width sin variable (igual que hoy); width con variable
(`VARIABLE` + `rawValue`); height sin variable (no aparece); height con variable (aparece).
Verificación manual: frame con width atado a variable → `width: <nombre> (343)`; height atado →
aparece; sin variables → solo width numérico (como hoy); con Units = rem el rawValue en rem.

## Fuera de alcance

- Mostrar height hardcodeado (sin variable); min/max width/height; variables en otras secciones.
