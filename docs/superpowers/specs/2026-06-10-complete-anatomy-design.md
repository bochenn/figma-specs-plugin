# Diseño — Complete Anatomy — Rebanada 14

**Fecha:** 2026-06-10
**Proyecto:** Specs Plugin para Figma — plugin de documentación de specs para handoff (una sola versión, sin tiers)
**Alcance de este spec:** Complete Anatomy limitado a detectar, por cada variante, los elementos que aparecen en ella pero **no** en el default (clave de distinción `tipo|nombre`). Sin Complete Layout, sin artwork.

---

## Contexto y estrategia

El PRD (feature #6) detecta elementos y layouts adicionales a través de las variantes. Esta rebanada
implementa **solo Complete Anatomy** con una clave de distinción simple (`tipo|nombre`): recorre todas las
variantes del set y lista los elementos que cada una tiene y el default no. Reutiliza `extraerAnatomy` y el
`SetNorm`.

**Decisiones tomadas en el brainstorming:**
- Alcance: solo Complete Anatomy, clave `tipo|nombre`, octavo botón. Sin Complete Layout, sin la clave de 4 partes, sin artwork.
- Per-variant: el mismo elemento adicional en varias variantes aparece una fila por variante.

---

## Sección 1 — Modelo y extracción (pura)

**Modelo** (`modelo/tipos.ts`):

```typescript
export interface ElementoAdicional {
  variante: string;   // etiqueta de la variante, ej. "Size=M, Type=Sec"
  nombre: string;
  tipo: string;
}
```

**`extraerCompleteAnatomy(set: SetNorm): ElementoAdicional[]`** (pura, en `extraccion/properties.ts`, reusa
`buscarVariante`, `mismasProps`, `extraerAnatomy`):

```
defaultVariante = buscarVariante(set, set.defaultProps); si no → []
defaultKeys = Set de `${tipo}|${nombre}` de extraerAnatomy(defaultVariante.raiz)
por cada variante del set:
  si mismasProps(variante.variantProperties, set.defaultProps) → saltear (es el default)
  etiqueta = entries de variante.variantProperties como "k=v, k2=v2"
  por cada elemento de extraerAnatomy(variante.raiz):
    si `${tipo}|${nombre}` NO está en defaultKeys → adicionales.push({ variante: etiqueta, nombre, tipo })
devolver adicionales
```

`etiquetaVariante(props)` = `Object.entries(props).map(([k,v]) => `${k}=${v}`).join(", ")` (helper interno).

---

## Sección 2 — Generador y octavo botón

**`generarCompleteAnatomy(nombre, adicionales)`** (en `generadores/complete.ts`, reusa `frames.ts`):

```
Complete Anatomy (sección)
├── Heading "Complete Anatomy"
├── [etiqueta]: [nombre] · [tipo]          (un texto por adicional)
└── ...
```

Si no hay adicionales → "No se detectaron elementos adicionales en otras variantes." (textual, sin artwork).

**Disparador (UI):** octavo botón "Complete Anatomy". `Seccion` suma `"complete"`. `main.ts`:

```
seccion === "complete":
  componentSet = resolverComponentSet(nodo)  → si null: "Complete Anatomy necesita un componente con variantes."
  setNorm = normalizarSet(componentSet)
  adicionales = extraerCompleteAnatomy(setNorm)
  frame = await generarCompleteAnatomy(componentSet.name, adicionales)
```

Se sube el alto del panel a 320 por el octavo botón.

**Decisión de diseño:** generador chico y textual; la lógica de "adicional" en `extraerCompleteAnatomy`
(pura). El motor de extracción de variantes es el mismo.

---

## Sección 3 — Errores y casos límite

| Caso | Comportamiento |
|------|----------------|
| Nodo sin variantes | "Complete Anatomy necesita un componente con variantes." |
| Default no resuelve | `[]` → nota de "sin adicionales". |
| Ninguna variante con extra | "No se detectaron elementos adicionales en otras variantes." |
| Adicional en varias variantes | Una fila por variante. |
| Falla en generación | `try/catch` en `main.ts` (ya existe). |

---

## Sección 4 — Estrategia de testing

**1. Tests unitarios de lógica pura (`node --test`):**
- `extraerCompleteAnatomy`: default con `Label` y una variante con `Label`+`Icon` → un adicional (`Icon`) con la etiqueta de esa variante; todas iguales al default → `[]`.

**2. Verificación manual en Figma:** Component Set donde una variante tenga una capa extra → "Complete
Anatomy" → verificar el elemento adicional con su variante. Comparar contra
`prd-images/6. Complete Anatomy and Layout/`. Verificar que el resto sigue andando.

**3. Componente de prueba fijo** con una variante con elemento extra.

**Lo que NO se hace:** mock de figma.

---

## Fuera de alcance de esta rebanada (futuras rebanadas)

- Clave de distinción completa (tipo + nombre + jerarquía de padres + posición entre hermanos).
- Complete Layout (filas adicionales de Auto Layout por variante).
- Artwork de los elementos adicionales.
- Integración con la sección Anatomy en un mismo Spec.
