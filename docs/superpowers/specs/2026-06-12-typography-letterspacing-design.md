# Diseño — Letter-spacing en Typography — Rebanada 25

**Fecha:** 2026-06-12
**Proyecto:** Specs Plugin para Figma — plugin de documentación de specs para handoff (una sola versión, sin tiers)
**Alcance de este spec:** Sumar letter-spacing al atributo `typography` (extracción con unidad px/percent + formato Plain/CSS), solo cuando es distinto de 0. Espejo de la Rebanada 24 (line-height).

---

## Contexto y estrategia

La Rebanada 24 sumó line-height al atributo `typography`. Esta rebanada hace lo mismo con el letter-spacing,
con la unidad de Figma (PIXELS / PERCENT; no tiene "auto"). Para no ensuciar todos los textos, solo se
extrae cuando el valor es distinto de 0.

**Decisiones tomadas en el brainstorming:**
- Tipo propio `EspaciadoLetra { unidad: "px" | "percent"; valor }`.
- Solo se extrae/muestra si `valor !== 0`.
- Se agrega al final del string con separador ` · LS `. Plain: número pelado en px; CSS: con `px`.

---

## Sección 1 — Extracción del letter-spacing

**`NodoLike`** (`modelo/tipos.ts`) suma:

```typescript
export interface EspaciadoLetra {
  unidad: "px" | "percent";
  valor: number;
}
```

y el campo `letterSpacing?: EspaciadoLetra;`.

**Adaptador** (`extraccion/adaptador.ts`, dentro del bloque `nodo.type === "TEXT"`): leer
`nodo.letterSpacing`; si viene `figma.mixed` o el valor es 0, no setearlo:

```typescript
const ls = nodo.letterSpacing;
if (ls !== figma.mixed && ls.value !== 0) {
  base.letterSpacing = { unidad: ls.unit === "PERCENT" ? "percent" : "px", valor: ls.value };
}
```

---

## Sección 2 — Formato puro

**`formatearTipografia`** (`utils/tipografia.ts`) gana un `letterSpacing?` opcional; se agrega al final cuando
existe:

- **Plain:** `Inter Regular 16 / 24 · LS 0.5` (px), `… · LS 5%` (percent).
- **CSS:** `16px/24px Regular Inter · LS 0.5px` (px), `… · LS 5%` (percent).

```typescript
export function formatearTipografia(
  t: { family: string; style: string; size: number; lineHeight?: AlturaLinea; letterSpacing?: EspaciadoLetra },
  formato: FormatoTipo,
): string {
  const lh = t.lineHeight;
  const ls = t.letterSpacing;
  if (formato === "CSS") {
    let medida = `${t.size}px`;
    if (lh && lh.unidad === "px") medida += `/${lh.valor}px`;
    else if (lh && lh.unidad === "percent") medida += `/${lh.valor}%`;
    let s = `${medida} ${t.style} ${t.family}`;
    if (ls) s += ` · LS ${ls.unidad === "percent" ? `${ls.valor}%` : `${ls.valor}px`}`;
    return s;
  }
  let s = `${t.family} ${t.style} ${t.size}`;
  if (lh) {
    const lhStr = lh.unidad === "auto" ? "auto" : lh.unidad === "percent" ? `${lh.valor}%` : `${lh.valor}`;
    s += ` / ${lhStr}`;
  }
  if (ls) s += ` · LS ${ls.unidad === "percent" ? `${ls.valor}%` : `${ls.valor}`}`;
  return s;
}
```

---

## Sección 3 — Atributo de tipografía

**`utils/atributos.ts`** (`leerAtributos`): pasar `letterSpacing: nodo.letterSpacing` al formatter (junto a
`lineHeight`).

(La UI, el selector "Type" y `aplicarFormatoTipo` en `main` no cambian.)

---

## Sección 4 — Errores y casos límite

| Caso | Comportamiento |
|------|----------------|
| letter-spacing px | `… · LS 0.5` (Plain) / `… · LS 0.5px` (CSS). |
| letter-spacing percent | `… · LS 5%`. |
| letter-spacing 0 o mixed | No se muestra (como hoy). |
| Combinado con line-height | `Inter Regular 16 / 24 · LS 0.5`. |
| Nodo no-texto | Sin `typography`. |

---

## Sección 5 — Estrategia de testing

**1. Tests unitarios de lógica pura (`node --test`):**
- `formatearTipografia` con `letterSpacing`:
  - `{…, letterSpacing:{unidad:"px",valor:0.5}}` Plain → `"Inter Regular 16 · LS 0.5"`; CSS → `"16px Regular Inter · LS 0.5px"`.
  - `{…, letterSpacing:{unidad:"percent",valor:5}}` Plain → `"Inter Regular 16 · LS 5%"`.
  - `{…, lineHeight:{unidad:"px",valor:24}, letterSpacing:{unidad:"px",valor:0.5}}` Plain → `"Inter Regular 16 / 24 · LS 0.5"`.
- `leerAtributos` de un `NodoLike` con fuente + `letterSpacing` incluye el letter-spacing en `typography`.

**2. Verificación manual en Figma:** texto con letter-spacing fijo (px) → "Anatomy" → `typography` con `· LS …`;
Type: CSS → `· LS 0.5px`. Texto con letter-spacing 0 → sin `· LS`.

**3. Componente de prueba fijo.**

**Lo que NO se hace:** mock de figma; adaptador se valida a ojo.

---

## Fuera de alcance de esta rebanada (futuras rebanadas)

- letter-spacing en rem.
- Más propiedades de texto (text-decoration, case, etc.).
