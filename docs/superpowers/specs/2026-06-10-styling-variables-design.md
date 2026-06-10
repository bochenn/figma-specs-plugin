# Diseño — Variables en Styling Inventory — Rebanada 8

**Fecha:** 2026-06-10
**Proyecto:** Specs Plugin para Figma — plugin de documentación de specs para handoff (una sola versión, sin tiers)
**Alcance de este spec:** Agregar la tabla **Variables** (de color, fill + stroke, con color chip) a la sección Styling Inventory. Reutiliza la detección de variables ya hecha en Variable Formatting. Token Studio queda fuera (feature #9).

---

## Contexto y estrategia

Styling Inventory hoy tiene dos tablas: Color styles y Text styles. El PRD suma **Variables** (y Token
Studio, aparte). La detección de variables de color ya existe: el adaptador captura `fillVariableName` y
`strokeVariableName` (Variable Formatting). Esta rebanada las emite en el inventario y dibuja la tercera
tabla con su **color chip**.

**Decisiones tomadas en el brainstorming:**
- Alcance: tabla Variables para variables de color (fill + stroke), con chip. Token Studio fuera.
- Prioridad **variable > style** en el inventario (un fill con variable va a Variables, no a Color styles).
- El hex del chip sale del primer paint SOLID de `fills`/`strokes`, vía `hexDeColor` (de Modes).
- Se extrae `hexARgb` a un util compartido (`utils/color.ts`), hoy local en el generador de Anatomy.

---

## Sección 1 — Modelo y recolección

**Cambios de tipos** (`modelo/tipos.ts`):
- `EntradaEstilo.tabla` y `FilaInventario.tabla` → `"color" | "text" | "variable"`.
- Ambos suman `swatchHex?: string` (color del chip; solo para variables).

**`recolectarEstilos`** (pura) — prioridad variable > style por fill/stroke:

```
emitir(nodo):
  fill:
    si fillVariableName  → { tabla:"variable", nombre: fillVariableName, appliedAs:(tipo==="TEXT"?"Text color":"Background color"), capa: name, swatchHex: hex(fills) }
    si no, fillStyleName  → { tabla:"color", nombre: fillStyleName, appliedAs:(tipo==="TEXT"?"Text color":"Background color"), capa: name }
  stroke:
    si strokeVariableName → { tabla:"variable", nombre: strokeVariableName, appliedAs:"Border color", capa: name, swatchHex: hex(strokes) }
    si no, strokeStyleName → { tabla:"color", nombre: strokeStyleName, appliedAs:"Border color", capa: name }
  textStyleName → { tabla:"text", nombre: textStyleName, appliedAs:"Text style", capa: name }   (sin cambios)
```

`hex(paints)` = `hexDeColor` del primer paint SOLID, o undefined (sin chip).

**`agruparInventario`** (pura): agrupa por (tabla, nombre, appliedAs) y arrastra el `swatchHex` de la
primera entrada del grupo.

---

## Sección 2 — Tabla de Variables, chip y util compartido

**Util compartido** (`utils/color.ts`, nuevo): `hexARgb(hex: string): RGB` (hoy local en `generadores/anatomy.ts`).
Lo importan Anatomy y Styling. Pura, con test.

**Generador `styling.ts`:**
- Tres tablas: `Variables`, `Color styles`, `Text styles` (en ese orden), filtrando `filas` por `tabla`.
- Misma helper `tabla(titulo, filas, vacio)`.
- **Chip:** la celda Name, si la fila tiene `swatchHex`, antepone un swatch 12×12 (rect con el color +
  borde gris) y al lado el nombre. Sin `swatchHex` → solo texto (como hoy). Se implementa con
  `celdaNombre(nombre, ancho, swatchHex?)`.

```
Variables
Name                          | Applied as       | Applied to
[chip] Collection 1/Figma blue| Background color | Frame 14
[chip] Collection 1/Stop foll | Border color     | Frame 16
```

**Decisión de diseño:** el chip se decide por la presencia de `swatchHex` (ya resuelto en la recolección);
el generador solo dibuja.

---

## Sección 3 — Errores y casos límite

| Caso | Comportamiento |
|------|----------------|
| Fill con variable pero no SOLID | Entrada `variable` sin `swatchHex` → fila sin chip. |
| Fill con variable y style | Gana la variable (tabla Variables). |
| Sin variables | Tabla Variables con "Sin variables"; las otras como hoy. |
| Variable que no resuelve | No se setea `fillVariableName` → cae a style/hardcoded. |
| Falla en generación | `try/catch` en `main.ts` (ya existe). |

---

## Sección 4 — Estrategia de testing

**1. Tests unitarios de lógica pura (`node --test`):**
- `recolectarEstilos`: fill con `fillVariableName` → `tabla:"variable"` con `swatchHex`; fill con variable+style → variable; stroke con `strokeVariableName` → variable/"Border color"; los casos de color/text existentes siguen pasando.
- `agruparInventario`: dos capas con la misma variable+appliedAs → una fila con `swatchHex` y ambas capas; separa `variable` de color/text.
- `hexARgb` (`utils/color.ts`): `#FFFFFF`→{1,1,1}; `#000000`→{0,0,0}; un intermedio.

**2. Verificación manual en Figma:** frame con variables de color (fill+stroke), color styles y text styles
→ "Styling Inventory" → verificar las tres tablas, el chip en Variables, y la prioridad variable > style.
Comparar contra `prd-images/5. Styling Inventory/`.

**3. Componente de prueba fijo.**

**Lo que NO se hace:** mock de figma.

---

## Fuera de alcance de esta rebanada (futuras rebanadas)

- Token Studio Tokens (feature #9): la cuarta tabla.
- Chip en Color styles (resolver el hex del style).
- Variables no-color (FLOAT, etc.) en el inventario.
- Aplicar el chip a otras secciones.
