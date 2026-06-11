# Diseño — Spec Nested Components — Rebanada 16

**Fecha:** 2026-06-11
**Proyecto:** Specs Plugin para Figma — plugin de documentación de specs para handoff (una sola versión, sin tiers)
**Alcance de este spec:** Toggle "Spec nested subcomponents" que, al correr Anatomy, genera además un spec de Anatomy por cada instancia anidada (de primer nivel) del ítem seleccionado.

---

## Contexto y estrategia

El PRD (feature #8) define un toggle "Spec nested subcomponents": al correr el plugin, detecta las instancias
anidadas y genera specs adicionales (Anatomy + Properties) por cada una. Hoy Anatomy **frena en instancias**
(las trata como elementos sin entrar).

Esta rebanada implementa **el toggle + Anatomy de cada instancia anidada de primer nivel** (no Properties, no
recursivo). Introduce el patrón nuevo de **checkbox de settings** en la UI. Es **casi todo impure** (detección
+ clon + generación); `extraerAnatomy` ya está testeado, así que **no suma tests unitarios**.

**Decisiones tomadas en el brainstorming:**
- Alcance: toggle + Anatomy de instancias anidadas de primer nivel. Sin Properties de las nested, sin recursión.
- El toggle solo afecta la sección Anatomy.

---

## Sección 1 — Toggle en la UI

Checkbox arriba de los botones (`src/ui/index.html`):

```html
<label><input type="checkbox" id="nested" /> Spec nested subcomponents</label>
```

En `src/ui/ui.ts`, `generar(seccion)` lee el checkbox y lo manda:

```typescript
parent.postMessage({ pluginMessage: { tipo: "generar", seccion, nested: nestedCheck.checked } }, "*");
```

`MensajeUI` (`modelo/tipos.ts`) pasa a:

```typescript
export type MensajeUI = { tipo: "generar"; seccion: Seccion; nested?: boolean };
```

Solo la rama Anatomy usa `nested`. Se sube un poco el alto del panel por el checkbox.

---

## Sección 2 — Generación de las nested

**Refactor** (`generadores/anatomy.ts`): se extrae `specDeAnatomy(seleccionado, elementos): Promise<FrameNode>`
que arma el `[Nombre] Spec` (heading + sección Anatomy con lista + artwork) — todo lo que hoy hace
`generarAnatomy` menos el wrapper `Specifications` y el append a la página. `generarAnatomy` queda igual
(envuelve un `specDeAnatomy` en `Specifications`).

**Nueva función** `generarAnatomyConNested(seleccionado, elementos, nested): Promise<FrameNode>`:

```
Specifications
├── [Nombre] Spec            (specDeAnatomy del principal)
├── [Instancia1] Spec        (specDeAnatomy de cada nested)
└── [Instancia2] Spec
```

con `nested: { nodo: SceneNode; elementos: ElementoAnatomy[] }[]`.

**Detección (impure, en `main.ts`):** `instanciasAnidadas(nodo: SceneNode): InstanceNode[]` recorre la
selección y junta los nodos `INSTANCE` **sin entrar** a ellos (instancias de primer nivel):

```
walk(n):
  si no tiene children → return
  por cada hijo c:
    si c.type === "INSTANCE" → push c   (no se recorre adentro)
    si no → walk(c)
```

**`main.ts`** (rama Anatomy, `generarSeccionAnatomy(nodo, nested)`):

```
elementos = extraerAnatomy(aNodoLike(nodo))
si nested:
  nestedSpecs = instanciasAnidadas(nodo).map(inst => ({ nodo: inst, elementos: extraerAnatomy(aNodoLike(inst)) }))
  frame = await generarAnatomyConNested(nodo, elementos, nestedSpecs)
si no:
  frame = await generarAnatomy(nodo, elementos)
finalizar(frame, nodo)
```

`main.ts` pasa `msg.nested ?? false` a `generarSeccionAnatomy`.

---

## Sección 3 — Errores y casos límite

| Caso | Comportamiento |
|------|----------------|
| Toggle off | Anatomy como hoy (un solo spec). |
| Toggle on, sin instancias anidadas | Solo el spec principal. |
| Instancia dentro de instancia | No se incluye (solo primer nivel). |
| Instancia anidada vacía | Spec con "Sin elementos detectados". |
| Toggle on en otra sección | Se ignora. |
| `clone()` falla | `try/catch` en `main.ts` (ya existe). |

---

## Sección 4 — Estrategia de testing

Rebanada casi toda impure; `extraerAnatomy` ya está testeado. **No suma tests unitarios.**

**1. Verificación manual en Figma:** un frame con una o dos instancias de componentes adentro. Checkbox
apagado → "Anatomy" → un solo spec. Checkbox encendido → "Anatomy" → el spec principal + un `[Instancia] Spec`
por cada instancia anidada. Comparar contra `prd-images/8. Spec Nested Components/`. Verificar que el resto
sigue andando (ignora el checkbox).

**2. Componente de prueba fijo** con instancias anidadas.

**Lo que NO se hace:** mock de figma; el refactor de `generarAnatomy` y la detección se validan a ojo + tsc/build.

---

## Fuera de alcance de esta rebanada (futuras rebanadas)

- Properties de las instancias anidadas.
- Nested recursivo (instancias dentro de instancias).
- Aplicar el toggle a otras secciones.
- Variantes adicionales dentro de las nested.
