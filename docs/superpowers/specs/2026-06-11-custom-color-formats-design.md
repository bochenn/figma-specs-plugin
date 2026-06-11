# Diseño — Custom Color Formats — Rebanada 21

**Fecha:** 2026-06-11
**Proyecto:** Specs Plugin para Figma — plugin de documentación de specs para handoff (una sola versión, sin tiers)
**Alcance de este spec:** Selector "Color" (HEX / RGB / HSL) que cambia cómo se muestra el valor de los colores hardcoded. El swatch no cambia; los colores de variable/style siguen mostrando el nombre del token.

---

## Contexto y estrategia

Hoy el valor de un color hardcoded es el hex, producido en extracción (`colorAtributo`); el `swatchHex`
alimenta la pill. "Custom color formats" cambia cómo se muestra ese valor: HEX / RGB / HSL.

La conversión es lógica pura (muy testeable). El formato es una opción de generación, pero el valor se arma
en extracción, así que se usa estado de módulo (igual que `tema`): `main` setea el formato antes de generar y
`colorAtributo` lo lee. Un solo punto de toque tematiza el valor en todas las secciones.

**Decisiones tomadas en el brainstorming:**
- Formatos HEX / RGB / HSL; HEX es el default (output idéntico al de hoy).
- El formato aplica al valor de los colores **hardcoded**; variable/style siguen mostrando el nombre.
- El swatch sigue siendo el hex.

---

## Sección 1 — Selector, tipo y formato puro

**UI** (`index.html` + `ui.ts`): un `<select id="formatoColor">` "Color" (HEX / RGB / HSL) junto al de
Columns. El mensaje suma `formatoColor`; `MensajeUI` (`modelo/tipos.ts`) pasa a
`{ ..., formatoColor?: FormatoColor }`, con:

```typescript
export type FormatoColor = "HEX" | "RGB" | "HSL";
```

**Conversión pura** (`utils/color.ts`):

```typescript
export function formatearColor(hex: string, formato: FormatoColor): string {
  if (formato === "HEX") return hex.toUpperCase();
  const { r, g, b } = hexARgb(hex);
  const R = Math.round(r * 255), G = Math.round(g * 255), B = Math.round(b * 255);
  if (formato === "RGB") return `rgb(${R}, ${G}, ${B})`;
  const { h, s, l } = rgbAHsl(r, g, b);
  return `hsl(${h}, ${s}%, ${l}%)`;
}
```

con un helper `rgbAHsl(r, g, b)` (canales 0..1 → `{ h: 0..360, s: 0..100, l: 0..100 }`, redondeados). Reusa
`hexARgb`.

---

## Sección 2 — Aplicar el formato (estado de módulo)

En `utils/color.ts`:

```typescript
let formato: FormatoColor = "HEX";
export function aplicarFormatoColor(f: FormatoColor): void { formato = f; }
export function formatoColorActual(): FormatoColor { return formato; }
```

- **`colorAtributo`** (`utils/atributos.ts`, rama HARDCODED): `valor: formatearColor(opts.hex, formatoColorActual())`.
  El swatch sigue siendo `opts.hex`. Las ramas VARIABLE/STYLE no cambian (el valor es el nombre del token).
- **`main.ts`:** `aplicarFormatoColor(msg.formatoColor ?? "HEX")` junto a `aplicarTema`, antes de generar.

Con default `HEX`, el output queda idéntico al de hoy (y los tests existentes de `colorAtributo` siguen verdes).

---

## Sección 3 — Errores y casos límite

| Caso | Comportamiento |
|------|----------------|
| Formato HEX (default) | Igual que hoy. |
| RGB / HSL | El valor de los colores hardcoded sale en ese formato; el swatch no cambia. |
| Color de variable/style | El valor sigue siendo el nombre del token. |
| Combinado con dark/columns/tabla | Independientes. |
| Falla en generación | `try/catch` en `main.ts` (ya existe). |

---

## Sección 4 — Estrategia de testing

**1. Tests unitarios de lógica pura (`node --test`):**
- `formatearColor("#FF0000", "HEX")` → `"#FF0000"`.
- `formatearColor("#FF0000", "RGB")` → `"rgb(255, 0, 0)"`.
- `formatearColor("#FF0000", "HSL")` → `"hsl(0, 100%, 50%)"`.
- `formatearColor("#000000", "RGB")` → `"rgb(0, 0, 0)"`; `formatearColor("#FFFFFF", "HSL")` → `"hsl(0, 0%, 100%)"`.

**2. Verificación manual en Figma:** componente con colores hardcoded → Color: RGB → "Anatomy" → los valores
salen `rgb(...)`; HSL → `hsl(...)`; HEX → como antes. Probar también en Properties/Styling.

**3. Componente de prueba fijo.**

**Lo que NO se hace:** mock de figma; `colorAtributo`/`main` se validan a ojo.

---

## Fuera de alcance de esta rebanada (futuras rebanadas)

- Formato configurable para los valores de variable/style (hoy muestran el nombre).
- Más formatos (HSB, CMYK, etc.).
- Formato custom de tipografía / spacing / values (otras features de Pro Formatting).
