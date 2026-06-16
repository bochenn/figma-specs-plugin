# Diseño — Recorrer dentro de instancias (DesignDoc 2/3) — Rebanada B

**Fecha:** 2026-06-16
**Proyecto:** Specs Plugin para Figma — plugin de documentación de specs para handoff (una sola versión, sin tiers)
**Alcance de este spec:** Segunda de tres rebanadas del rediseño estilo DesignDoc. Un toggle nuevo "Itemize instances" que hace que Anatomy y Layout entren en las instancias y listen sus capas internas en línea (recursivo), con prefijo `↳` + sangría para marcar la jerarquía.

---

## Contexto

Hoy `recorrer` (Anatomy) y `recorrerAutoLayout` (Layout) tratan la instancia como un elemento pero
**no itemizan sus hijos** (regla del PRD). DesignDoc sí entra y documenta el `tag` dentro del `card`.
El toggle existente "Spec nested subcomponents" documenta los subcomponentes como **specs separados
apilados** (rebanadas 8 y 29) — comportamiento distinto que NO se toca.

**Decisiones tomadas en el brainstorming:**
- Toggle **nuevo** "Itemize instances" (independiente de "Spec nested").
- Recorrido **recursivo** (instancias dentro de instancias).
- Presentación: prefijo `↳` + sangría por nivel.
- La **profundidad cuenta instancias atravesadas**: las capas de un FRAME normal mantienen la
  profundidad del contexto; solo al cruzar una INSTANCE sube +1. Así el `↳` marca exactamente "esto
  vino de adentro de una instancia".

---

## Sección 1 — Traversal (cambio de firma)

Ambos recorridos pasan a llevar `itemizar` y a devolver la profundidad por elemento.

`traversal/recorrer.ts`:
```typescript
export interface Recorrido { nodo: NodoLike; profundidad: number; }

export function recorrer(nodo: NodoLike, itemizar = false, prof = 0): Recorrido[] {
  const out: Recorrido[] = [];
  for (const hijo of nodo.children ?? []) {
    out.push({ nodo: hijo, profundidad: prof });
    if (hijo.type === "INSTANCE") {
      if (itemizar) out.push(...recorrer(hijo, itemizar, prof + 1));
    } else if (CONTENEDOR.includes(hijo.type)) {
      out.push(...recorrer(hijo, itemizar, prof)); // frame normal: misma profundidad
    }
  }
  return out;
}
```

`traversal/recorrer-autolayout.ts`: análogo. Devuelve `Recorrido[]`; con `itemizar`, entra en
instancias con `prof + 1`; en contenedores normales mantiene `prof`. La raíz, si tiene Auto Layout,
va con `prof 0`.

Los tests existentes (`recorrer.test.ts`, `recorrer-autolayout.test.ts`) se actualizan al nuevo
shape (`.map(r => r.nodo)` o comparando `{nodo, profundidad}`), más casos nuevos con `itemizar`.

## Sección 2 — Modelo

`ElementoAnatomy` += `profundidad: number;` (0 = capa propia del componente; >0 = dentro de N
instancias).
`LayoutSpec` += `profundidad: number;`.

## Sección 3 — Extracción

- `extraerAnatomy(nodoRaiz, itemizar = false)`: usa `recorrer(nodoRaiz, itemizar)` y setea
  `profundidad` en cada `ElementoAnatomy`.
- `extraerLayout(raiz, itemizar = false)`: usa `recorrerAutoLayout(raiz, itemizar)` y setea
  `profundidad` en cada `LayoutSpec` (vía `layoutSpecDe(nodo, profundidad)`).

## Sección 4 — Generadores (prefijo `↳` + sangría)

Helper compartido `prefijoProfundidad(profundidad)` → `"  ".repeat(profundidad) + "↳ "` cuando
`profundidad > 0`, `""` si es 0. (En `generadores/frames.ts` o un util.)

- **Anatomy lista** (`filaAtributo`/entrada): el nombre del elemento se antepone con el prefijo.
- **Anatomy tabla** (`filaAnatomy`): la celda Name lleva el prefijo.
- **Layout**: el título de cada fila/exhibit (`${nombre} · ${tipo}`) lleva el prefijo.

El recorrido en Layout también debe clonar los artworks de las instancias internas; como
`recorrerAutoLayout` ya devuelve los nodos reales, `generarLayout` los usa igual (ahora incluye los
de dentro de instancias cuando `itemizar`).

## Sección 5 — Plumbing

- `src/ui/index.html`: checkbox `Itemize instances` (sin marcar) en la sección Opciones.
- `src/ui/ui.ts`: leerlo → `itemizar` en el `pluginMessage`.
- `modelo/tipos.ts`: `itemizar?: boolean` en `MensajeUI`.
- `main.ts`: pasar `msg.itemizar ?? false` a `generarSeccionAnatomy` y `generarSeccionLayout`, que lo
  reenvían a `extraerAnatomy`/`extraerLayout`. (Anatomy: combina con el toggle nested existente sin
  conflicto — nested genera specs separados, itemizar afecta el recorrido de cada uno.)

## Sección 6 — Testing y verificación

Tests (`node --test`):
- `recorrer` con `itemizar`: entra en instancias, profundidad correcta (frame normal mantiene, instancia +1), recursivo; sin `itemizar` → comportamiento actual (instancia no itemizada).
- `recorrerAutoLayout` con `itemizar`: idem para nodos con Auto Layout.
- `extraerAnatomy`/`extraerLayout` propagan `profundidad`.
- `prefijoProfundidad`.

Verificación manual: componente `card` con instancia `tag` adentro → Anatomy y Layout con "Itemize
instances" OFF (como hoy, la instancia sin itemizar) y ON (aparecen las capas del `tag` con `↳`).
Comparar contra `designdoc.pdf`.

## Fuera de alcance (rebanada C)

- Marcadores de medidas/cotas con valores sobre el artwork.
- Cambiar el comportamiento del toggle "Spec nested".
