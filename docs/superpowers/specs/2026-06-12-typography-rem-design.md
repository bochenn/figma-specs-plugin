# Diseño — Typography en rem — Rebanada 31

**Fecha:** 2026-06-12
**Proyecto:** Specs Plugin para Figma — plugin de documentación de specs para handoff (una sola versión, sin tiers)
**Alcance de este spec:** Que el selector Units (px/rem, ya existente) alcance a los valores en px de typography: font-size, line-height y letter-spacing. Percent y auto no cambian.

---

## Contexto y estrategia

`formatearTipografia` (`utils/tipografia.ts`) concentra todo el formateo de typography y hoy emite
los valores px fijos: número pelado en Plain (`16`), con sufijo en CSS (`16px`). El selector Units
ya gobierna width y spacing vía `formatearEspaciado` + `unidadActual()` (`utils/espaciado.ts`).

**Decisiones tomadas en el brainstorming:**
- Se convierten los **tres** valores px: font-size, line-height y letter-spacing (coherencia CSS:
  `1rem/1.5rem`, sin mezclar px y rem).
- Percent y auto quedan como están (no son px).
- `formatearTipografia` lee `unidadActual()` del estado de módulo (mismo patrón que el resto);
  sin cambios de firma, UI ni mensaje.

---

## Sección 1 — Lógica (`utils/tipografia.ts`)

Helper interno:

```typescript
// Valor en px formateado según la unidad actual:
// px → "16" (Plain) o "16px" (CSS); rem → "1rem" en ambos.
function valorPx(n: number, conSufijo: boolean): string {
  if (unidadActual() === "rem") return formatearEspaciado(n, "rem");
  return conSufijo ? `${n}px` : String(n);
}
```

`formatearTipografia` reemplaza sus emisiones px:
- Plain: `t.size` → `valorPx(t.size, false)`; line-height px → `valorPx(lh.valor, false)`;
  letter-spacing px → `valorPx(ls.valor, false)`.
- CSS: `${t.size}px` → `valorPx(t.size, true)`; `/${lh.valor}px` → `/${valorPx(lh.valor, true)}`;
  `LS ${ls.valor}px` → `LS ${valorPx(ls.valor, true)}`.
- Percent y auto: sin cambios.

Con Units = px el output es idéntico al actual.

---

## Sección 2 — Testing y verificación

**Tests (`node --test`, `tests/tipografia.test.ts`):** con `aplicarUnidad("rem")` (restaurando
`"px"` al final de cada test):
- Plain: size 16, line-height 24px, letter-spacing 4px → `1rem`, `1.5rem`, `0.25rem`.
- CSS: → `1rem/1.5rem` y `LS 0.25rem`.
- Line-height percent y auto, y letter-spacing percent → intactos bajo rem.
- Los tests existentes (px default) siguen pasando sin cambios.

**Verificación manual en Figma:** nodo de texto → Anatomy con Units = rem → typography en rem;
Units = px → idéntico a hoy. El selector Type (Plain/CSS) combinado con ambos.

---

## Fuera de alcance de esta rebanada

- Convertir valores percent o auto.
- Otros lugares con px (width/spacing ya respetan Units desde rebanadas anteriores).
