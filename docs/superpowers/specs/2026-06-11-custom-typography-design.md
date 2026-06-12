# Diseño — Custom Typography Format — Rebanada 23

**Fecha:** 2026-06-11
**Proyecto:** Specs Plugin para Figma — plugin de documentación de specs para handoff (una sola versión, sin tiers)
**Alcance de este spec:** Extraer la tipografía (family + style + size) de los nodos de texto y mostrarla como atributo `typography` en Anatomy, con un selector "Type" (Plain / CSS).

---

## Contexto y estrategia

Hoy no se muestra la tipografía por elemento (solo el `textStyleName` en el inventario de Styling). Esta
rebanada extrae la tipografía de los nodos `TEXT` y la muestra como atributo, con un formato configurable
(mismo patrón de estado de módulo que color/spacing).

**Decisiones tomadas en el brainstorming:**
- Propiedades: font family + style (peso) + size. Sin line-height (evita el manejo de unidades px/%/auto).
- Formatos: `Plain` (default, `Inter Regular 16`) y `CSS` (`16px Regular Inter`).
- Si la tipografía del nodo viene "mixed", no se extrae (no se agrega el atributo).

---

## Sección 1 — Extracción de tipografía

**`NodoLike`** (`modelo/tipos.ts`) suma:

```typescript
  fontFamily?: string;
  fontStyle?: string;
  fontSize?: number;
```

**Adaptador** (`extraccion/adaptador.ts`): para nodos `TEXT`, leer `fontName` y `fontSize`; si vienen
`figma.mixed`, no setearlos:

```typescript
if (nodo.type === "TEXT") {
  const fn = nodo.fontName;
  if (fn !== figma.mixed) { base.fontFamily = fn.family; base.fontStyle = fn.style; }
  if (nodo.fontSize !== figma.mixed) base.fontSize = nodo.fontSize;
}
```

---

## Sección 2 — Selector, tipo y formato puro

**UI** (`index.html` + `ui.ts`): un `<select id="formatoTipo">` "Type" (Plain / CSS) junto al de Units. El
mensaje suma `formatoTipo`; `MensajeUI` (`modelo/tipos.ts`) pasa a `{ ..., formatoTipo?: FormatoTipo }`, con:

```typescript
export type FormatoTipo = "Plain" | "CSS";
```

**Conversión pura + estado** (`utils/tipografia.ts`):

```typescript
import type { FormatoTipo } from "../modelo/tipos.ts";

export function formatearTipografia(t: { family: string; style: string; size: number }, formato: FormatoTipo): string {
  if (formato === "CSS") return `${t.size}px ${t.style} ${t.family}`;
  return `${t.family} ${t.style} ${t.size}`;
}

let formato: FormatoTipo = "Plain";
export function aplicarFormatoTipo(f: FormatoTipo): void { formato = f; }
export function formatoTipoActual(): FormatoTipo { return formato; }
```

---

## Sección 3 — Atributo de tipografía y main

- **`utils/atributos.ts`** (`leerAtributos`): si `nodo.fontFamily` y `typeof nodo.fontSize === "number"`,
  agrega un atributo:

```typescript
atributos.push({
  clave: "typography",
  valor: formatearTipografia({ family: nodo.fontFamily, style: nodo.fontStyle ?? "", size: nodo.fontSize }, formatoTipoActual()),
  formato: "HARDCODED",
});
```

- **`main.ts`:** `aplicarFormatoTipo(msg.formatoTipo ?? "Plain")` junto a los otros `aplicar*`, antes de generar.

Los nodos sin tipografía (no-texto o mixed) no agregan el atributo, así que el resto del output no cambia.

---

## Sección 4 — Errores y casos límite

| Caso | Comportamiento |
|------|----------------|
| Nodo de texto con tipografía concreta | Atributo `typography` con el formato elegido. |
| Tipografía mixed | No se extrae (sin atributo). |
| Nodo no-texto | Sin atributo de tipografía (como hoy). |
| Plain (default) / CSS | `Inter Regular 16` / `16px Regular Inter`. |
| Combinado con color/spacing/dark/etc. | Independientes. |

---

## Sección 5 — Estrategia de testing

**1. Tests unitarios de lógica pura (`node --test`):**
- `formatearTipografia({ family:"Inter", style:"Regular", size:16 }, "Plain")` → `"Inter Regular 16"`.
- `formatearTipografia({ family:"Inter", style:"Bold", size:24 }, "CSS")` → `"24px Bold Inter"`.
- `leerAtributos` de un `NodoLike` con `fontFamily/fontStyle/fontSize` incluye un atributo `typography`.

**2. Verificación manual en Figma:** componente con texto → "Anatomy" → el elemento de texto muestra
`typography` (Plain). Cambiar Type: CSS → formato CSS. Un texto con estilos mixtos no muestra typography.

**3. Componente de prueba fijo.**

**Lo que NO se hace:** mock de figma; adaptador/main se validan a ojo.

---

## Fuera de alcance de esta rebanada (futuras rebanadas)

- line-height / letter-spacing (manejo de unidades).
- Formato CSS completo (font shorthand con weight numérico).
- Tipografía en otras secciones.
