# Diseño — Properties (Variant) — Rebanada 2

**Fecha:** 2026-06-09
**Proyecto:** Specs Plugin para Figma — plugin de documentación de specs para handoff
**Alcance de este spec:** Feature **Properties** del PRD, limitada a **propiedades de tipo Variant**, de punta a punta. Reutiliza la infraestructura y los patrones de la Rebanada 1 (Anatomy).

---

## Contexto y estrategia

Properties (feature #2 del PRD) enumera y muestra las diferencias de atributos visuales entre las
opciones de las propiedades de un componente. El PRD cubre propiedades *Variant*, propiedades *Boolean*
(con resaltado azul de capas), manejo de "variant unavailable" y deriva los *compound props* a
Two-Way (Pro).

Esta rebanada implementa **solo Variant properties**: para cada propiedad de variante, comparar el
componente *default* contra cada *opción alternativa* y mostrar solo los atributos que cambian. Es la
rebanada que valida el **motor de comparación de variantes** de forma acotada.

**Decisiones tomadas en el brainstorming:**
- Alcance: solo Variant properties (sin Boolean, sin highlight, sin "variant unavailable" explícito, sin compound/two-way).
- Entrada soportada: **Component Set, instancia y componente suelto** — todos se normalizan al Component Set padre.
- Motor de comparación: **Enfoque A** — comparar directamente los componentes-variante que ya existen en el set (sin instanciar ni mutar el documento). El default es siempre `componentSet.defaultVariant`.
- Integración con Anatomy: **Properties como output propio** por ahora. La unificación de Anatomy + Properties en un mismo `[Componente] Spec` queda como rebanada de integración posterior.
- Reutiliza de Anatomy: `recorrer()`, `leerAtributos()`, el tipo `Atributo`, y los helpers de generación de frames (que se extraen a un módulo compartido).

---

## Sección 1 — Resolución de entrada y modelo de datos

**Resolver la selección → Component Set** (en `main.ts`, helper `resolverComponentSet`):

```
resolver(nodo):
  - COMPONENT_SET            → usar directo
  - COMPONENT (una variante) → usar su padre si es COMPONENT_SET
  - INSTANCE                 → su mainComponent; si el padre es COMPONENT_SET, usarlo
  - cualquier otro / sin set → error "Properties necesita un componente con variantes."
```

De la Figma API se obtienen:
- `componentSet.variantGroupProperties` → propiedades de variante y sus opciones,
  ej. `{ Size: { values: ["Small","Medium","Large"] }, Type: { values: ["Primary","Secondary"] } }`
- `componentSet.defaultVariant` → componente default (base de comparación)
- `componentSet.children` → componentes-variante; cada uno con `variantProperties`
  (ej. `{ Size: "Small", Type: "Primary" }`) para identificarlos

**Modelo de datos** (en `modelo/tipos.ts`), alineado con el PRD:

```typescript
interface PropiedadSpec {
  nombre: string;          // "Size"
  tipo: "VARIANT";
  default: string;         // valor de esta prop en el default, ej "Medium"
  opciones: OpcionSpec[];
}

interface OpcionSpec {
  nombre: string;          // "Small" (una opción distinta del default)
  cambios: ElementoCambiado[];
}

interface ElementoCambiado {
  elementoNombre: string;  // qué layer cambió
  estado: "modificado" | "agregado" | "removido";
  atributos: Atributo[];   // SOLO los atributos que cambian, con el valor de esta opción
}
```

**Cómo se arma:** para cada propiedad `P` y cada opción `O` distinta del valor default de `P`, se busca
el componente-variante con `{...default, P: O}` y se compara contra el default (Sección 2).

---

## Sección 2 — Motor de comparación (lógica pura, `comparacion/variantes.ts`)

Reutiliza `recorrer()` y `leerAtributos()`. Trabaja sobre `NodoLike`, testeable sin Figma.

**Paso 1 — aplanar:** `recorrer()` sobre el componente default y sobre el componente-opción → dos listas planas de elementos.

**Paso 2 — emparejar** (`emparejar(elementosDefault, elementosOpcion)`):
```
para cada elemento del default:
  buscar en la opción uno con el MISMO nombre
  si hay varios con ese nombre → emparejar por orden (1°↔1°, 2°↔2°)
  si no aparece en la opción → par { default, opcion: undefined } (removido)
elementos solo en la opción → par { default: undefined, opcion } (agregado)
```

**Paso 3 — diffear atributos** (`diffAtributos(attrsDefault, attrsOpcion)`):
```
por cada clave (background-color, width, opacity):
  si el valor difiere entre default y opción → incluir (con el valor de la OPCIÓN)
  si está solo en uno → incluir
devolver solo los atributos que cambian
```

**Resultado** (`compararVariante(defaultRaiz, opcionRaiz)`): `ElementoCambiado[]` — solo elementos con
al menos un cambio. Pares modificados → `estado: "modificado"` con sus atributos cambiados; pares sin
contraparte → `"removido"` / `"agregado"` (sin atributos). Los elementos sin cambios no aparecen.

> Emparejar por nombre+orden cubre la mayoría de casos. El emparejado fino por jerarquía/posición
> (los 4 criterios del PRD en Complete Anatomy) queda para pulido.

**Decisión de diseño:** todo el "cerebro" de Properties (qué cambió) vive en estas funciones puras y
testeadas. El generador solo traduce `PropiedadSpec[]` a frames.

---

## Sección 3 — Generación del output visual (`generadores/properties.ts`)

Reutiliza los helpers de frames con Auto Layout de Anatomy, extraídos a un módulo compartido
(`generadores/frames.ts`): `frameVertical`, `texto`, etc.

**Estructura de frames** (sigue el árbol del PRD):

```
Properties                              (sección, Auto Layout vertical)
├── Heading "Properties"
├── Size                                (subsección = una propiedad de variante)
│   ├── Heading "Size"
│   ├── Small                           (display: artwork + lista de cambios)
│   │   ├── Artwork [clon del variante Size=Small]
│   │   └── Cambios:
│   │       └── Label · background-color: #0E68D4 (default: #888888)
│   └── Large
│       └── ...
└── Type
    └── Secondary
        └── ...
```

Por cada **opción**: a la izquierda el **artwork** (clon del componente-variante de esa opción), a la
derecha la **lista de elementos cambiados** con sus atributos. Se muestra el valor de la opción y, entre
paréntesis, el del default: `#0E68D4 (default: #888888)`. Para `"agregado"`/`"removido"` se muestra el
nombre del elemento con esa marca. Si una opción no produce cambios, muestra
"Sin cambios respecto al default".

**Sin marcadores ni highlight** en esta rebanada. El output se genera como su propio frame
`Specifications → [Componente] Spec → Properties`.

**Decisión de diseño:** el generador no tiene lógica de decisión; solo traduce `PropiedadSpec[]` a frames.

---

## Sección 4 — Manejo de errores y casos límite

**Validación de la selección** (en `main.ts` / `resolverComponentSet`):

| Caso | Comportamiento |
|------|----------------|
| Nada seleccionado | "Seleccioná un componente con variantes (o su set) para generar Properties." |
| Nodo sin variantes (frame, texto, componente sin set) | "Properties necesita un componente con variantes." |
| Instancia cuyo main no pertenece a un Component Set | Mismo mensaje. |
| Component Set con una sola variante (sin opciones alternativas) | Genera `Properties` con nota "Sin propiedades de variante para comparar". |

**Casos límite del motor:**
- **Opción sin cambios:** aparece con "Sin cambios respecto al default" (no se oculta).
- **Variante inexistente** para `{default, P: O}`: se saltea esa opción y se sigue ("variant unavailable" explícito queda para pulido).
- **Elemento agregado/removido entre variantes:** se registra como `ElementoCambiado` con su estado, sin romper.
- **`clone()` falla / componente enorme:** generación envuelta en `try/catch`; devuelve `{ ok:false, error }` a la UI.

**Decisión de diseño:** validación y resolución de entrada en un solo lugar. El motor y el generador
asumen un set válido con su default.

---

## Sección 5 — Estrategia de testing

**1. Tests unitarios de lógica pura (`node --test`):**
- `comparacion/variantes.ts`:
  - `emparejar()`: mismos nombres → empareja; duplicados → por orden; solo en default → removido; solo en opción → agregado.
  - `diffAtributos()`: atributo que cambia → incluido con valor de la opción; igual → omitido; presente en uno solo → incluido.
  - `compararVariante()`: dos árboles `NodoLike` → `ElementoCambiado[]` esperado; opción sin cambios → lista vacía.
- `extraccion/properties.ts`: a partir del set adaptado a `NodoLike` (con info de variantes), produce las `PropiedadSpec[]` correctas, salteando el valor default de cada propiedad.

Para la extracción se extiende `NodoLike` con lo mínimo de variantes: `variantProperties?` (mapa
prop→valor en cada componente-variante) y, a nivel set, la lista de variantes + cuál es el default.

**2. Verificación manual en Figma:** crear un Component Set de prueba (ej. Button con `Size` y `Type`
que cambien color/tamaño), correr el plugin, verificar que cada opción liste los atributos que
efectivamente cambian. Comparar contra `prd-images/2. properties/`.

**3. Componente de prueba fijo** para regresiones a ojo.

**Lo que NO se hace:** mock de la Figma API ni tests del canvas.

---

## Fuera de alcance de esta rebanada (futuras rebanadas)

- Propiedades **Boolean** y el resaltado azul de capas afectadas.
- Mensaje explícito "variant unavailable".
- Compound props / Two-Way comparison (Pro).
- Emparejado fino de elementos por jerarquía/posición.
- Unificación de Anatomy + Properties en un mismo `[Componente] Spec`.
- Formateo rico de variables/tokens/styles (pills, prioridades).
- Entrada por instancia honrando su configuración actual como base (acá el default es siempre el del set).
