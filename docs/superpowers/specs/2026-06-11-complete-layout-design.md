# Diseño — Complete Layout — Rebanada 15

**Fecha:** 2026-06-11
**Proyecto:** Specs Plugin para Figma — plugin de documentación de specs para handoff (una sola versión, sin tiers)
**Alcance de este spec:** Complete Layout limitado a comparar el Auto Layout del **frame raíz** de cada variante contra el del default; las que difieren se listan. Se integra con Complete Anatomy en el mismo botón (feature #6 del PRD).

---

## Contexto y estrategia

Complete Anatomy (Rebanada 14) detecta elementos adicionales por variante. **Complete Layout** es la otra
mitad de la feature #6: detecta las variantes cuyo Auto Layout de la raíz difiere del default.

Esta rebanada compara la config de Auto Layout del **frame raíz** de cada variante contra la del default, y
lista las que difieren. Reutiliza la lectura de Layout (`layoutSpecDe`). Se **integra con Complete Anatomy
en el mismo botón** (renombrado a "Complete A/L"), porque es una sola feature del PRD.

**Decisiones tomadas en el brainstorming:**
- Alcance: comparar el Auto Layout de la **raíz** de cada variante (no las capas internas). Sin artwork.
- Integración: extender el botón Complete existente (genera Anatomy + Layout) en vez de un noveno botón.

---

## Sección 1 — Modelo y extracción (pura)

**Refactor:** extraer de `extraerLayout` un helper `layoutSpecDe(nodo: NodoLike): LayoutSpec` (construye el
`LayoutSpec` de un solo nodo). `extraerLayout` lo reusa; Complete Layout también.

**Modelo** (`modelo/tipos.ts`):

```typescript
export interface VarianteLayout {
  variante: string;   // etiqueta de la variante
  spec: LayoutSpec;
}
```

**`claveLayout(spec: LayoutSpec): string`** (pura, en `extraccion/layout.ts`): serializa la config relevante
para comparar:

```
`${direccion}|${alineacionPrimaria}|${alineacionContraria}|${resizingHorizontal}|${resizingVertical}|L${padding.left}T${padding.top}R${padding.right}B${padding.bottom}|gap${itemSpacing}`
```

**`extraerCompleteLayout(set: SetNorm): VarianteLayout[]`** (pura, en `extraccion/properties.ts`, reusa
`buscarVariante`/`mismasProps`/`layoutSpecDe`/`claveLayout`):

```
defaultVariante = buscarVariante(set, set.defaultProps); si no → []
claveDefault = tieneAutoLayout(default.raiz) ? claveLayout(layoutSpecDe(default.raiz)) : null
por cada variante (salvo el default):
  si su raíz NO tiene Auto Layout → saltear
  spec = layoutSpecDe(variante.raiz)
  si claveDefault == null o claveLayout(spec) != claveDefault → adicionales.push({ variante: etiqueta, spec })
devolver adicionales
```

(`tieneAutoLayout(n)` = `n.layoutMode === "HORIZONTAL" || n.layoutMode === "VERTICAL"`; `etiqueta` reusa
`etiquetaVariante`.)

---

## Sección 2 — Generador e integración

Complete Anatomy y Complete Layout son la misma feature del PRD. Se **extiende el botón Complete** (no se
agrega uno nuevo); se renombra a **"Complete A/L"** en la UI.

**Generador** (`generadores/complete.ts`): se renombra `generarCompleteAnatomy` → `generarComplete(nombre,
anatomy, layout)`:

```
Specifications → [nombre] Spec
├── Complete Anatomy
│   └── [variante]: [nombre] · [tipo]
└── Complete Layout
    └── [variante]: Dir / Align / Resize / Padding / Gap   (un bloque por variante con layout distinto)
```

Cada `VarianteLayout` se dibuja como un bloque con la etiqueta y su config (mismo formato textual que los
exhibits de Layout). Cada lista vacía muestra su nota ("No se detectaron…").

**`main.ts`** (rama `complete` existente):

```
seccion === "complete":
  componentSet = resolverComponentSet(nodo)  → si null: "Complete necesita un componente con variantes."
  setNorm = normalizarSet(componentSet)
  anatomy = extraerCompleteAnatomy(setNorm)
  layout  = extraerCompleteLayout(setNorm)
  frame = await generarComplete(componentSet.name, anatomy, layout)
```

**Decisión de diseño:** un solo botón "Complete A/L" para toda la feature #6; la lógica de "qué layout
difiere" en `extraerCompleteLayout` (pura).

---

## Sección 3 — Errores y casos límite

| Caso | Comportamiento |
|------|----------------|
| Nodo sin variantes | "Complete necesita un componente con variantes." |
| Default no resuelve | Ambas listas vacías → notas de "sin adicionales". |
| Ninguna variante con layout distinto | "No se detectaron layouts adicionales en otras variantes." |
| Raíz de variante sin Auto Layout | Se saltea para Complete Layout. |
| Default sin Auto Layout en la raíz | Cualquier variante con Auto Layout en la raíz cuenta como distinta. |
| Falla en generación | `try/catch` en `main.ts` (ya existe). |

---

## Sección 4 — Estrategia de testing

**1. Tests unitarios de lógica pura (`node --test`):**
- `claveLayout`: misma config → misma clave; padding distinto → claves distintas.
- `extraerCompleteLayout`: default raíz Auto Layout vertical padding 8 y una variante padding 16 → esa
  variante es adicional; variante con misma config → no aparece; variante con raíz sin Auto Layout → no aparece.

**2. Verificación manual en Figma:** Component Set donde una variante cambie el Auto Layout de la raíz →
"Complete A/L" → verificar las secciones Complete Anatomy y Complete Layout con esa variante en Layout.
Comparar contra `prd-images/6. Complete Anatomy and Layout/`. Verificar que el resto sigue andando.

**3. Componente de prueba fijo** con una variante de layout distinto.

**Lo que NO se hace:** mock de figma.

---

## Fuera de alcance de esta rebanada (futuras rebanadas)

- Comparar el Auto Layout de las capas internas (no solo la raíz).
- Artwork con overlays por variante.
- Marcar exactamente qué propiedad de layout cambió (hoy se muestra la config completa).
