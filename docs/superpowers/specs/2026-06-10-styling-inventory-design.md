# Diseño — Styling Inventory — Rebanada 5

**Fecha:** 2026-06-10
**Proyecto:** Specs Plugin para Figma — plugin de documentación de specs para handoff (una sola versión, sin tiers)
**Alcance de este spec:** Feature **Styling Inventory** del PRD, limitada a las tablas de **Color styles** y **Text styles** (estilos nativos de Figma). Sin Variables ni Token Studio (rebanadas posteriores).

---

## Contexto y estrategia

Styling Inventory (feature #5 del PRD) recorre la selección e inventaria los estilos/variables/tokens
que encuentra, en tablas con columnas **Name / Applied as / Applied to**. El PRD lista cuatro tablas:
Variables, Token Studio Tokens, Text styles, Color styles.

Esta rebanada implementa **solo Color styles y Text styles** (los estilos nativos de Figma). Valida el
mecanismo nuevo: escanear estilos aplicados → agrupar → renderizar tablas. Variables (vía `boundVariables`)
y Token Studio (pluginData de otro plugin) quedan para rebanadas posteriores.

Nota de proyecto: el plugin tiene **una sola versión, sin tiers**. Las marcas del PRD sobre "requiere
upgrade" para variables/tokens no aplican; es solo orden de implementación.

**Decisiones tomadas en el brainstorming:**
- Alcance: Color styles + Text styles.
- `NodoLike` se extiende con los nombres de estilo ya resueltos; el adaptador hace `figma.getStyleById(id).name` (síncrono, no usamos dynamic-page).
- `appliedAs` del fill distingue por tipo: TEXT → "Text color", resto → "Background color". Stroke → "Border color". Text style → "Text style".
- Frontera en instancias (consistente con Anatomy/Layout).
- Sin chip de color (swatch) en esta rebanada.
- Quinto botón "Styling Inventory"; `Seccion` suma `"styling"`.

---

## Sección 1 — Captura de estilos y recolección

**Extensión de `NodoLike`:**

```typescript
fillStyleName?: string;     // nombre del color style del fill
strokeStyleName?: string;   // nombre del color style del stroke
textStyleName?: string;     // nombre del text style
```

El adaptador resuelve `fillStyleId`/`strokeStyleId`/`textStyleId` a nombres con `figma.getStyleById`.
Si el id está vacío o el estilo no se resuelve (null), no setea el nombre.

**Recolección** (pura, `inventario/recolectar.ts`):

```
recolectarEstilos(raiz: NodoLike) → EntradaEstilo[]
  por cada nodo (incluida la raíz; frena en instancias):
    si fillStyleName   → { tabla:"color", nombre: fillStyleName,   appliedAs: (tipo==="TEXT" ? "Text color" : "Background color"), capa: name }
    si strokeStyleName → { tabla:"color", nombre: strokeStyleName, appliedAs: "Border color", capa: name }
    si textStyleName   → { tabla:"text",  nombre: textStyleName,   appliedAs: "Text style",   capa: name }
```

```typescript
interface EntradaEstilo {
  tabla: "color" | "text";
  nombre: string;
  appliedAs: string;
  capa: string;
}
```

**Recorrido:** incluye la raíz y baja por los contenedores (FRAME/GROUP/COMPONENT/COMPONENT_SET),
frena en instancias.

---

## Sección 2 — Agrupación en filas de tabla (`inventario/agrupar.ts`)

`agruparInventario(entradas: EntradaEstilo[]): FilaInventario[]` agrupa por **(tabla, nombre, appliedAs)**;
cada combinación única es una fila; "Applied to" junta las capas con `formatearAplicadoA`.

```typescript
interface FilaInventario {
  tabla: "color" | "text";
  nombre: string;
  appliedAs: string;
  appliedTo: string;
}
```

**`formatearAplicadoA(capas: string[]): string`** (pura, con test):
- nombres separados por coma; en orden de primera aparición.
- nombre repetido → una vez con la cantidad entre paréntesis: `label-text (2)`.

```
["Active indicator", "Caret"]  → "Active indicator, Caret"
["label-text", "label-text"]   → "label-text (2)"
["a", "b", "a"]                → "a (2), b"
```

**Orden de filas:** orden de primera aparición de cada combinación.

**Decisión de diseño:** `agruparInventario` y `formatearAplicadoA` son puras y testeadas; el generador
solo dibuja.

---

## Sección 3 — Tablas en el canvas y disparador (`generadores/styling.ts`)

```
Styling Inventory                        (sección, Auto Layout vertical)
├── Heading "Styling Inventory"
├── Color styles                         (subsección)
│   ├── Heading "Color styles"
│   └── Tabla (Name | Applied as | Applied to)
└── Text styles                          (subsección)
    ├── Heading "Text styles"
    └── Tabla (mismas 3 columnas)
```

**Tabla** = frame vertical de filas; cada **fila** = frame horizontal con **3 celdas de ancho fijo**
(Name 280 / Applied as 160 / Applied to 280). Cada celda es un text node con ancho fijo y wrap
(`textAutoResize = "HEIGHT"`). La primera fila es el header con `Name` / `Applied as` / `Applied to`.

- Tabla sin filas → nota "Sin color styles" / "Sin text styles".
- `generarStyling(nombre, filas)` arma las dos tablas filtrando `filas` por `tabla`; una helper interna
  `tabla(titulo, filas)` evita duplicar el dibujo de filas/celdas.

**Disparador (UI):** quinto botón "Styling Inventory". `Seccion` pasa a incluir `"styling"`. `main.ts`:

```
seccion === "styling":
  validar tipo (mismos contenedores que Anatomy)
  filas = agruparInventario(recolectarEstilos(aNodoLike(nodo)))
  frame = await generarStyling(nodo.name, filas)
```

---

## Sección 4 — Errores y casos límite

| Caso | Comportamiento |
|------|----------------|
| Nada seleccionado | "Seleccioná algo para generar specs." |
| Tipo inválido | "Styling Inventory necesita un FRAME, COMPONENT, INSTANCE o COMPONENT_SET." |
| Sin estilos | Ambas tablas con "Sin color styles" / "Sin text styles". |
| `getStyleById` null (estilo borrado/inaccesible) | El adaptador no setea el nombre → la entrada no se emite. |
| Falla en generación | `try/catch` → `{ ok:false, error }` a la UI. |

---

## Sección 5 — Estrategia de testing

**1. Tests unitarios de lógica pura (`node --test`):**
- `inventario/recolectar.ts`: fill no-TEXT → "Background color"; fill en TEXT → "Text color"; textStyle → "Text style"; stroke → "Border color"; recorre descendientes y frena en instancias.
- `inventario/agrupar.ts`: mismo estilo+appliedAs en dos capas → una fila; mismo estilo distinto appliedAs → dos filas; separación color/text.
- `formatearAplicadoA`: coma; repetidos → "(n)"; orden de primera aparición.

**2. Verificación manual en Figma:** crear un color style y un text style locales, aplicarlos a varias
capas, seleccionar el contenedor → botón "Styling Inventory" → verificar las tablas. Comparar contra
`prd-images/5. Styling Inventory/`. Verificar que los otros cuatro botones siguen andando.

**3. Componente de prueba fijo** para regresiones a ojo.

**Lo que NO se hace:** mock de la Figma API ni tests del canvas.

---

## Fuera de alcance de esta rebanada (futuras rebanadas)

- Tabla de **Variables** (vía `boundVariables`).
- Tabla de **Token Studio Tokens** (pluginData del plugin Tokens Studio).
- Chip/swatch de color al lado del nombre.
- `appliedAs` afinado para todos los casos (effects, etc.).
- Variables/styles aplicados dentro de instancias.
