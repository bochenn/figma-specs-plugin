# Diseño — Custom Value Formats — Rebanada 28

**Fecha:** 2026-06-12
**Proyecto:** Specs Plugin para Figma — plugin de documentación de specs para handoff (una sola versión, sin tiers)
**Alcance de este spec:** Los tres controles de "Custom Value Formats" del PRD (`prd-images/16. Custom Value Formats/`): formato del valor resuelto de variables/styles (selector propio HEX/RGB/HSL), toggle "Show raw value" y selector "Preferred value if both detected" (Variable/Style).

---

## Contexto y estrategia

Hoy el único lugar donde se muestra un valor resuelto de variable/style es el `(…)` que las listas
de Anatomy agregan después del nombre (`rawValue` del `Atributo`). Ese valor queda siempre en HEX
crudo: `colorAtributo` (`utils/atributos.ts`) solo formatea los colores HARDCODED. Además, cuando un
color tiene variable y style a la vez, la variable gana siempre (prioridad fija).

El PRD define tres controles para esto:

1. **Color raw value format** — dropdown HEX/RGB/HSL para el valor resuelto, independiente del
   selector Color general.
2. **Show raw value after variable, token or style** — toggle (default ON).
3. **Preferred value if both detected** — qué mostrar si el mismo paint tiene variable y style.

**Decisiones tomadas en el brainstorming:**
- Alcance: los tres controles en una rebanada.
- Selector propio para el raw value (fiel al PRD), no se reusa el selector Color.
- Solo color: hoy no extraemos variables numéricas (spacing/width), así que no hay valores
  resueltos en px/rem que formatear. Queda para cuando exista esa extracción.
- Defaults que replican el comportamiento actual: `HEX`, toggle ON, preferencia `VARIABLE`.

---

## Sección 1 — Estado de módulo (`utils/valores.ts`)

Archivo nuevo, mismo patrón que `color.ts`/`espaciado.ts`/`tema.ts`:

```typescript
export type Preferencia = "VARIABLE" | "STYLE";

aplicarFormatoRaw(f: FormatoColor): void   /  formatoRawActual(): FormatoColor   // default "HEX"
aplicarMostrarRaw(b: boolean): void        /  mostrarRawActual(): boolean        // default true
aplicarPreferencia(p: Preferencia): void   /  preferenciaActual(): Preferencia   // default "VARIABLE"
```

---

## Sección 2 — Lógica (`utils/atributos.ts`)

Todo el cambio de comportamiento vive en `colorAtributo`:

- **Preferencia**: el orden de chequeo variable→style se invierte si `preferenciaActual()` es
  `"STYLE"`. Si solo hay una de las dos, se usa esa (la preferencia solo desempata).
- **rawValue**: pasa por `formatearColor(opts.hex, formatoRawActual())`. Si `mostrarRawActual()`
  es `false`, `rawValue` queda `undefined`.
- **swatchHex**: sigue siendo el hex crudo (lo parsea `hexARgb` para pintar el swatch).

Los generadores no se tocan: `filaAtributo` (`generadores/anatomy.ts`) ya muestra el `(…)` solo
cuando `rawValue` existe.

---

## Sección 3 — Plumbing (UI y main)

- `src/ui/index.html`: checkbox `Show raw value` (checked por default) y selects
  `Raw value` (HEX/RGB/HSL) y `Preferred value` (Variable/Style).
- `src/ui/ui.ts`: leer los tres controles y sumarlos al `pluginMessage`
  (`formatoRaw`, `mostrarRaw`, `preferencia`).
- `modelo/tipos.ts`: los tres campos opcionales nuevos en `MensajeUI`.
- `main.ts`: aplicar los tres antes de generar, con los defaults (`HEX`, `true`, `"VARIABLE"`),
  junto a los `aplicarX` existentes.

---

## Sección 4 — Testing y verificación

**Tests (`node --test`, en `tests/color-atributo.test.ts` y `tests/valores.test.ts`):**
- `rawValue` formateado en RGB y HSL según `aplicarFormatoRaw`.
- `aplicarMostrarRaw(false)` → atributo sin `rawValue` (pero con `swatchHex`).
- Preferencia `STYLE` + variable y style presentes → gana el style.
- Preferencia `STYLE` + solo variable → variable (la preferencia solo desempata).
- Defaults: sin aplicar nada, el comportamiento es el actual (los tests existentes de
  `color-atributo.test.ts` siguen pasando).
- Cada test que cambie estado de módulo lo restaura al final (patrón de `espaciado`/`color`).

**Verificación manual en Figma:** nodo con fill atado a variable → Anatomy con Raw value en RGB →
el `(…)` sale en `rgb(…)`; toggle OFF → sin `(…)`; nodo con variable y style en el mismo fill →
alternar Preferred value y ver que cambia el nombre mostrado. Comparar contra
`prd-images/16. Custom Value Formats/`.

---

## Fuera de alcance de esta rebanada

- Valores resueltos numéricos (variables de spacing/width en px/rem).
- "token" del PRD (Tokens Studio): sigue diferido por falta de setup.
