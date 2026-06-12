# Diseño — Line-height en Typography — Rebanada 24

**Fecha:** 2026-06-12
**Proyecto:** Specs Plugin para Figma — plugin de documentación de specs para handoff (una sola versión, sin tiers)
**Alcance de este spec:** Sumar line-height al atributo `typography` (extracción con unidad px/percent/auto + formato Plain/CSS). Extiende la Rebanada 23.

---

## Contexto y estrategia

La Rebanada 23 agregó el atributo `typography` (family + style + size) con el selector "Type" (Plain/CSS).
Esta rebanada le suma el line-height, manejando la unidad de Figma (PIXELS / PERCENT / AUTO).

**Decisiones tomadas en el brainstorming:**
- line-height normalizado a `{ unidad: "px" | "percent" | "auto"; valor? }`.
- Plain: `Inter Regular 16 / 24` (px), `… / 150%` (percent), `… / auto`.
- CSS: `16px/24px Regular Inter` (px), `16px/150% Regular Inter` (percent); para `auto` no agrega `/lh`.
- Sin line-height (o mixed) → como hoy.

---

## Sección 1 — Extracción del line-height

**`NodoLike`** (`modelo/tipos.ts`) suma:

```typescript
export interface AlturaLinea {
  unidad: "px" | "percent" | "auto";
  valor?: number;
}
```

y el campo `lineHeight?: AlturaLinea;`.

**Adaptador** (`extraccion/adaptador.ts`, dentro del bloque `nodo.type === "TEXT"`): leer `nodo.lineHeight`;
si viene `figma.mixed`, no setearlo:

```typescript
const lh = nodo.lineHeight;
if (lh !== figma.mixed) {
  if (lh.unit === "AUTO") base.lineHeight = { unidad: "auto" };
  else if (lh.unit === "PERCENT") base.lineHeight = { unidad: "percent", valor: lh.value };
  else base.lineHeight = { unidad: "px", valor: lh.value };
}
```

---

## Sección 2 — Formato puro

**`formatearTipografia`** (`utils/tipografia.ts`) gana un `lineHeight?` opcional:

```typescript
export function formatearTipografia(
  t: { family: string; style: string; size: number; lineHeight?: AlturaLinea },
  formato: FormatoTipo,
): string {
  const lh = t.lineHeight;
  if (formato === "CSS") {
    let medida = `${t.size}px`;
    if (lh && lh.unidad === "px") medida += `/${lh.valor}px`;
    else if (lh && lh.unidad === "percent") medida += `/${lh.valor}%`;
    return `${medida} ${t.style} ${t.family}`;
  }
  let s = `${t.family} ${t.style} ${t.size}`;
  if (lh) {
    const lhStr = lh.unidad === "auto" ? "auto" : lh.unidad === "percent" ? `${lh.valor}%` : `${lh.valor}`;
    s += ` / ${lhStr}`;
  }
  return s;
}
```

(En CSS, `auto` no agrega `/lh` porque no es un valor válido de line-height.)

---

## Sección 3 — Atributo de tipografía

**`utils/atributos.ts`** (`leerAtributos`): pasar `lineHeight: nodo.lineHeight` al formatter:

```typescript
valor: formatearTipografia({ family: nodo.fontFamily, style: nodo.fontStyle ?? "", size: nodo.fontSize, lineHeight: nodo.lineHeight }, formatoTipoActual()),
```

(La UI, el selector "Type" y `aplicarFormatoTipo` en `main` ya existen de la Rebanada 23; no cambian.)

---

## Sección 4 — Errores y casos límite

| Caso | Comportamiento |
|------|----------------|
| line-height px | `… / 24` (Plain) / `16px/24px …` (CSS). |
| line-height percent | `… / 150%` / `16px/150% …`. |
| line-height auto | `… / auto` (Plain) / sin `/lh` (CSS). |
| Sin line-height o mixed | Como hoy (solo family/style/size). |
| Nodo no-texto | Sin `typography`. |

---

## Sección 5 — Estrategia de testing

**1. Tests unitarios de lógica pura (`node --test`):**
- `formatearTipografia` con `lineHeight`:
  - `{…, lineHeight:{unidad:"px",valor:24}}` Plain → `"Inter Regular 16 / 24"`; CSS → `"16px/24px Regular Inter"`.
  - `{…, lineHeight:{unidad:"percent",valor:150}}` Plain → `"Inter Regular 16 / 150%"`.
  - `{…, lineHeight:{unidad:"auto"}}` CSS → `"16px Regular Inter"`.
- `leerAtributos` de un `NodoLike` con fuente + `lineHeight` incluye el line-height en el valor de `typography`.

**2. Verificación manual en Figma:** texto con line-height fijo (px) → "Anatomy" → `typography` con `/ 24`;
Type: CSS → `16px/24px …`. Texto con line-height auto → `/ auto` (Plain) / sin `/lh` (CSS).

**3. Componente de prueba fijo.**

**Lo que NO se hace:** mock de figma; adaptador se valida a ojo.

---

## Fuera de alcance de esta rebanada (futuras rebanadas)

- letter-spacing.
- line-height en rem (hoy px se muestra como número; no usa el selector Units).
