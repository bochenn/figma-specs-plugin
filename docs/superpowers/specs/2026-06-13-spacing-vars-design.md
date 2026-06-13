# Diseño — Variables de spacing resueltas — Rebanada 35

**Fecha:** 2026-06-13
**Proyecto:** Specs Plugin para Figma — plugin de documentación de specs para handoff (una sola versión, sin tiers)
**Alcance de este spec:** Que Layout and Spacing muestre el nombre de la variable atada a padding e item-spacing junto a su valor resuelto, como el PRD (`Item spacing: DS Space/item-spacing/0_5x (8)`).

---

## Contexto y estrategia

El PRD de Layout muestra padding e item-spacing atados a variables: nombre + valor entre paréntesis.
Hoy el exhibit solo muestra el número (`Item spacing: 8`). El adaptador ya resuelve variables de
color vía `node.boundVariables`; Figma expone igual `boundVariables.paddingLeft/Top/Right/Bottom`
e `itemSpacing` (cada uno un `VariableAlias`).

**Decisiones (rebanada autónoma):**
- Solo padding (4 lados) e item-spacing; el resto del backlog numérico (width) queda afuera.
- Formato fiel al patrón de color: `nombre (valor)` con variable, `valor` sin ella. El valor pasa
  por `formatearEspaciado` (respeta px/rem de la rebanada 31).
- `spacingVars` no entra en `claveLayout` (no cambia la comparación entre variantes).

---

## Sección 1 — Modelo

`NodoLike` += `spacingVars?: { paddingLeft?: string; paddingTop?: string; paddingRight?: string; paddingBottom?: string; itemSpacing?: string }` (nombres "Colección/Variable" resueltos).
`LayoutSpec` += `spacingVars: { … mismos opcionales }`.

## Sección 2 — Formato puro (`utils/espaciado.ts`)

```typescript
// "16" / "1rem" sin variable; "DS Space/padding/1x (16)" con variable.
export function etiquetaSpacing(px: number, unidad: Unidad, nombreVar?: string): string {
  const v = formatearEspaciado(px, unidad);
  return nombreVar ? `${nombreVar} (${v})` : v;
}
```

## Sección 3 — Extracción

- `adaptador.ts`: dentro del bloque Auto Layout, leer `nodo.boundVariables` y resolver con
  `nombreVariable` los alias `paddingLeft/Top/Right/Bottom/itemSpacing`; armar `base.spacingVars`.
- `extraccion/layout.ts`: `layoutSpecDe` += `spacingVars: nodo.spacingVars ?? {}`.

## Sección 4 — Generador (`generadores/layout.ts` exhibit)

Las líneas de padding e item-spacing usan `etiquetaSpacing`:

```
Padding: L{etiqueta(left, sv.paddingLeft)} T{…} R{…} B{…}
Item spacing: {etiqueta(itemSpacing, sv.itemSpacing)}
```

## Sección 5 — Testing y verificación

Tests: `etiquetaSpacing` (con/sin var, px/rem) en `tests/espaciado.test.ts`; extracción de
`spacingVars` en `tests/layout-extraccion.test.ts` (passthrough desde `NodoLike`). Verificación
manual: frame con padding/item-spacing atados a variables → nombre + valor en el exhibit; sin
variable → solo el valor; combinado con Units = rem.

## Fuera de alcance

- Variables de width/height; counterAxisSpacing (wrap); variables de grids.
