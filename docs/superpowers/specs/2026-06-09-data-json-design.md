# Diseño — Data (JSON export) — Rebanada 4

**Fecha:** 2026-06-09
**Proyecto:** Specs Plugin para Figma — plugin de documentación de specs para handoff
**Alcance de este spec:** Feature **Data** del PRD, limitada a exportar el **JSON de Anatomy** en un text frame. Reutiliza `extraerAnatomy` de la Rebanada 1.

---

## Contexto y estrategia

Data (feature #4 del PRD) produce las specs en formato JSON alineadas con Anatomy y Properties, y las
exporta en un text frame de Figma. Como las extracciones de Anatomy y Properties ya existen y están
testeadas, lo nuevo de esta feature es un **serializador** (modelo interno → JSON con la forma del PRD) y
un **generador** que vuelca el JSON en un text frame.

Esta rebanada implementa **solo el JSON de Anatomy**. Valida la tubería nueva (serializar → text frame).
El JSON de Properties y el toggle "excluir attributes" quedan para rebanadas posteriores.

**Decisiones tomadas en el brainstorming:**
- Alcance: solo JSON de Anatomy (reusa `extraerAnatomy`).
- Fidelidad: se **omiten** los campos `systemId`/`rawValue`/`propertyName` del PRD (dependen de
  variables/styles/propiedades que aún no extraemos). El JSON sale con `value`/`format`/`key`.
- Disparo: cuarto botón "Data (JSON)" en la UI; `Seccion` suma `"data"`; `main.ts` agrega su rama.
- Fuente del text node: Inter (la ya cargada); monoespaciada queda como pulido.

---

## Sección 1 — Serializador (lógica pura, `serializacion/anatomy-json.ts`)

`serializarAnatomy(elementos: ElementoAnatomy[]): AnatomyJson` mapea el modelo interno a la forma del PRD.
Devuelve un objeto JS (no el string), para poder testear con `deepEqual`.

**Tipos** (en `modelo/tipos.ts`):

```typescript
export interface AtributoJson {
  value: string;
  format: string;   // "HARDCODED" | "VARIABLE" | "STYLE"
  key: string;      // "background-color", etc.
}

export interface ElementoJson {
  name: string;
  type: string;
  instanceOf?: string;        // solo en instancias
  attributes: AtributoJson[];
}

export interface AnatomyJson {
  anatomy: ElementoJson[];
}
```

**Mapeo:**
- `name` ← `nombre`; `type` ← `tipo`
- `instanceOf` ← `dependeDe` (solo si `esInstancia` y existe; si no, se omite)
- `attributes` ← cada `Atributo` → `{ value: valor, format: formato, key: clave }`
- Se omiten `systemId`/`rawValue`/`propertyName` (no disponibles aún).

**Decisión de diseño:** el serializador es puro y testeado; no hace `stringify` (eso es formato de salida,
queda en el generador).

---

## Sección 2 — Generación del text frame y disparador

**Generador** (`generadores/data.ts`, toca `figma.*`):

```
Specifications                       (frame, Auto Layout vertical)
└── [Nombre] Spec
    └── Data (JSON)                  (sección)
        ├── Heading "Data (JSON)"
        └── [text node con el JSON]
```

`generarData(nombre: string, json: AnatomyJson): Promise<FrameNode>`:
1. Arma los frames contenedores (reusa `frames.ts`).
2. `JSON.stringify(json, null, 2)` → string.
3. Crea un text node con ese string; **ancho fijo ~600px** y `textAutoResize = "HEIGHT"` (wrap, no se
   estira horizontalmente).
4. Lo cuelga del frame y agrega `specifications` a la página.

**Disparador (UI):** cuarto botón "Data (JSON)". `Seccion` pasa a `"anatomy" | "properties" | "layout" | "data"`.
`main.ts` agrega la rama:

```
seccion === "data":
  validar tipo (mismos contenedores que Anatomy)
  elementos = extraerAnatomy(aNodoLike(nodo))
  json = serializarAnatomy(elementos)
  frame = await generarData(nodo.name, json)
```

**Decisión de diseño:** el `stringify` vive en el generador (formato de salida); el mapeo de datos en el
serializador puro.

---

## Sección 3 — Errores y casos límite

| Caso | Comportamiento |
|------|----------------|
| Nada seleccionado | "Seleccioná algo para generar specs." |
| Tipo inválido | "Data necesita un FRAME, COMPONENT, INSTANCE o COMPONENT_SET." |
| Nodo sin elementos | JSON con `{ "anatomy": [] }`. |
| Falla en generación | `try/catch` → `{ ok:false, error }` a la UI. |

Reusa la validación de tipo de Anatomy y el manejo de errores común.

---

## Sección 4 — Estrategia de testing

**1. Tests unitarios de lógica pura (`node --test`):**
- `serializacion/anatomy-json.ts`:
  - texto simple → `{ anatomy: [{ name, type, attributes: [] }] }` (sin `instanceOf`).
  - instancia → incluye `instanceOf`.
  - elemento con atributos → `attributes` con `value`/`format`/`key`, sin `systemId`/`rawValue`/`propertyName`.
  - lista vacía → `{ anatomy: [] }`.

**2. Verificación manual en Figma:** componente seleccionado → botón "Data (JSON)" → text frame con JSON
bien formado, valores coincidentes con Anatomy. Comparar contra `prd-images/4. Data/`. Verificar que los
otros tres botones siguen andando.

**3. Componente de prueba fijo** para regresiones a ojo.

**Lo que NO se hace:** mock de la Figma API ni tests del canvas.

---

## Fuera de alcance de esta rebanada (futuras rebanadas)

- JSON de Properties.
- Toggle "excluir attributes".
- Campos `systemId`/`rawValue`/`propertyName` (dependen de variables/styles/propiedades).
- Fuente monoespaciada en el text node.
- Layout and Spacing en JSON (el PRD lo deja fuera de la beta inicial).
- Two-way comparison en JSON (no planeado por el PRD).
