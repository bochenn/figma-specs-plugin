
***

# PRD COMPLETO — SPECS PLUGIN PARA FIGMA

**Versión:** 1.0
**Fecha:** Junio 2026
**Fuente:** https://specsplugin.com
**Para uso con:** Claude Code / Implementación de plugin Figma

***

## 📋 ÍNDICE

1. [Resumen ejecutivo](#resumen-ejecutivo)
2. [Objetivo del producto](#objetivo-del-producto)
3. [Usuarios objetivo](#usuarios-objetivo)
4. [Problema a resolver](#problema-a-resolver)
5. [Modelo de negocio](#modelo-de-negocio)
6. [Arquitectura del output](#arquitectura-del-output)
7. [Standard Features](#standard-features)
8. [Pro Features](#pro-features)
9. [Pro Formatting](#pro-formatting)
10. [Requerimientos técnicos](#requerimientos-t%C3%A9cnicos)
11. [Referencias visuales](#referencias-visuales)

***

## RESUMEN EJECUTIVO

**Specs Plugin** (anteriormente EightShapes Specs) es un plugin de Figma que genera automáticamente especificaciones visuales completas de componentes, instancias y frames seleccionados.

**Creado por:** Nathan Curtis (con ayuda de Kevin Powell)
**Distribución:** Figma Community
**Soporte:**

- GitHub Issues: https://github.com/EightShapes/specs-plugin/issues
- Slack: https://join.slack.com/t/eightshapes-specs/shared_invite/zt-1w4k19pj7-viPHKW8045zak64u~lH4yA

**Propuesta de valor:** Transformar diseños de Figma en documentación visual utilizable para comunicación, claridad de implementación y mejora de calidad entre equipos de diseño y desarrollo, sin esfuerzo manual tedioso.

***

## OBJETIVO DEL PRODUCTO

Reducir el esfuerzo manual de documentación dentro de Figma y mejorar la claridad del handoff entre diseño, design systems y desarrollo mediante salidas visuales estructuradas generadas automáticamente.

***

## USUARIOS OBJETIVO

1. **Diseñadores de producto, UX y UI** que documentan componentes y variantes dentro de Figma
2. **Equipos de design systems** que necesitan documentar anatomía, propiedades, layout, spacing, estilos, variables y tokens con consistencia
3. **Equipos de desarrollo** o stakeholders que consumen documentación visual y comparativas de componentes para implementación o revisión

***

## PROBLEMA A RESOLVER

La documentación manual de especificaciones visuales es:

- **Lenta y tediosa**
- **Propensa a inconsistencias** cuando hay variantes, propiedades booleanas, nested components, Auto Layout y variables de diseño
- **Difícil de mantener actualizada** cuando los componentes evolucionan

***

## MODELO DE NEGOCIO

| Plan | Contenido | Precio |
| :-- | :-- | :-- |
| **Gratuito** | Anatomy, Properties, Layout and Spacing, Data (beta), Styling Inventory (beta) | Free |
| **Pro** | Complete Anatomy+Layout, Modes, Spec Nested Components, Token Studio Tokens, Two Way Comparison, Variable Formatting + todo Pro Formatting | Pago vía Figma Community |
| **Conversión** | Upgrade mediante botón "Upgrade" en el plugin → Figma Community checkout | - |


***

## ARQUITECTURA DEL OUTPUT

El plugin genera un frame `Specifications` que contiene uno o más frames de `Spec`, cada uno con secciones apiladas:

```
Specifications
└── [Component Name] Spec
    ├── Anatomy
    ├── Properties
    │   ├── [Variant Property 1]
    │   │   ├── Option 1
    │   │   ├── Option 2
    │   │   └── ...
    │   └── [Boolean Property 1]
    ├── Layout and Spacing
    ├── Complete Anatomy (Pro)
    ├── Complete Layout (Pro)
    ├── Modes (Pro)
    │   └── [Variable Collection Name]
    │       ├── Mode 1
    │       └── Mode 2
    ├── Data (JSON)
    └── Styling Inventory
        ├── Variables
        ├── Token Studio Tokens
        ├── Text styles
        └── Color styles
```


***

## STANDARD FEATURES

### 1. ANATOMY

**📸 Página con imágenes:** https://specsplugin.com/anatomy/

**Referencia visual:**

- Simple anatomy example → ver página (sección "Simple anatomy")
- Complete anatomy example → ver página (sección "Complete anatomy")
- Extreme anatomy example → ver página (sección "Extreme example")

**Descripción:**
Permite anotar y mostrar atributos visuales de cada elemento dentro de una sección de anatomía.

**Qué incluye:**

1. **Content (lista itemizada de elementos):**
    - Todos los layers de texto, línea, polígono, estrella, rectángulo y similares
    - Todos los frame layers con atributos relevantes
    - Todas las nested component instances (pero NO sus children layers)
2. **Artwork (frame anotado):**
    - Versión clonada del ítem seleccionado
    - Marcadores numerados anotados vinculando cada elemento con su entrada en la lista

**Contenido por elemento:**

- Nombre del elemento
- Tipo de layer de Figma (indicado con ícono: FRAME, TEXT, INSTANCE, etc.)
- **Dependency ("Depends on"):** vincula nested instance con su componente de origen
- **Atributos visuales:** background color, width, opacity, etc. (limitados a los que NO varían entre opciones de propiedades si Properties también se produce)
- **Valores configurados** de propiedades de nested instances

**Cómo funciona:**

1. El plugin recorre las layers del nodo seleccionado
2. Itemiza y marca textos, instancias y shapes como elementos
3. En el artwork, coloca **marcadores** en el perímetro priorizando el borde izquierdo
4. El recorrido se **detiene al encontrar nested components**

**Límites:**

- En casos con nested components, ejecutar el plugin nuevamente sobre cada uno relevante
- En casos extremos con gran densidad de elementos, los marcadores pueden saturarse

***

### 2. PROPERTIES

**📸 Página con imágenes:** https://specsplugin.com/properties/

**Referencia visual:**

- Properties comparison example → ver página (comparativa con highlight de capas)

**Descripción:**
Enumera y muestra diferencias de atributos visuales entre opciones de variantes y propiedades booleanas.

**Qué incluye:**

- **Subsecciones para cada Variant property** con todas sus opciones
- **Subsecciones para cada Boolean property** presente
- **Resaltado visual** de capas impactadas (highlight azul para Boolean props)

**Cómo funciona:**

- Compara un **default** contra cada opción alternativa
- Recorre layers y evalúa atributos visuales
- Muestra solo atributos que **cambian** entre opciones

**Casos especiales:**

- **Compound props:** cuando dos propiedades deben combinarse para explicar diferencias → usar **Two-Way Comparisons (Pro)**
- **"Variant unavailable":** aparece cuando el plugin intenta configurar una variante inexistente en el component set

***

### 3. LAYOUT AND SPACING

**📸 Página con imágenes:** https://specsplugin.com/layout-and-spacing/

**Referencia visual:**

- Layout and spacing example con overlays de color → ver página (azul = elemento, verde = padding, naranja = item spacing)

**Descripción:**
Anota padding, item spacing y otros atributos de layout para cada layer con Figma Auto Layout.

**Qué incluye:**

**Content (lista):**

- Nombre del elemento
- Tipo de layer (ícono)
- Dirección de layout y alineación
- Resizing vertical y horizontal
- Padding (general + direccional: left, top, right, bottom)
- Item spacing ("gap")

**Artwork (anotaciones visuales):**

- **Overlay azul:** elemento
- **Overlay verde:** padding
- **Overlay naranja:** item spacing
- Marcadores de padding y spacing
- Íconos de dirección y alineación
- Marcadores de resizing (Fill, Fixed, Hug)

**Cómo funciona:**

- Detecta layers con Figma Auto Layout
- Crea un exhibit por cada layer detectada
- Combina contenido textual + artwork anotado

**Ajuste disponible:**

- **"Hide outer layout annotations"**: simplifica la vista omitiendo marcadores de dirección, alineación y resizing

***

### 4. DATA (Beta)

**📸 Página:** https://specsplugin.com/features/data/

**Estado:** Beta para todos. Se espera limitar a suscriptores pagos al salir de beta.

**Descripción:**
Produce specs en formato JSON alineadas con Anatomy y Properties.

**Modelo JSON — Anatomy:**

```json
{
  "anatomy": [
    {
      "name": "string",
      "type": "FRAME | TEXT | INSTANCE | ...",
      "instanceOf": "string (solo instancias)",
      "attributes": [
        {
          "value": "collection/name | style name | hardcoded",
          "format": "PROPERTY | HARDCODED | VARIABLE | STYLE",
          "key": "string (solo visuales)",
          "systemId": "Figma id (solo visuales)",
          "rawValue": "string (solo visuales)",
          "propertyName": "string (solo propiedades)"
        }
      ]
    }
  ]
}
```

**Modelo JSON — Properties:**

```json
{
  "properties": [
    {
      "name": "string",
      "type": "VARIANT | BOOLEAN | TEXT | INSTANCE_SWAP",
      "default": "string",
      "options": [
        {"name": "string", "elements": []}
      ]
    }
  ]
}
```

**Funcionalidad:**

- Durante el traversal, agrega valores a estructura JSON
- Limpia y exporta en Figma text frame
- Usuario puede **excluir `attributes`**

**Límites:**

- Layout and Spacing no incluido en beta inicial
- Two-way comparison en JSON no planeado

***

### 5. STYLING INVENTORY (Beta)

**📸 Página con imágenes:** https://specsplugin.com/features/styling-inventory/

**Referencia visual:**

- Styling inventory overview → ver página (tablas Variables, Text styles, Color styles)

**Estado:** Beta para todos. Variables y Token Studio token detection requiere upgrade.

**Descripción:**
Genera inventarios de estilos, variables y Token Studio tokens descubiertos durante inspección.

**Qué incluye:**

Cuatro subsecciones en formato tabla con columnas **Name / Applied as / Applied to**:

1. **Variables** (chip de color + nombre `Colección/Nombre`)
2. **Token Studio Tokens**
3. **Text styles**
4. **Color styles**

Donde:

- **Applied as** = atributo receptor (Background color, Border color, Text style, etc.)
- **Applied to** = nombres de layers donde fue aplicado (separados por coma, con cantidad entre paréntesis si múltiple)

**Ejemplo visual (Variables):**

```
Name                              | Applied as       | Applied to
----------------------------------|------------------|---------------------------
M3/Schemes/Error                  | Background color | ESDSV Alert
M3/Schemes/Error                  | Border color     | Active indicator, Caret
M3/Schemes/On Surface             | Background color | disabled-safe-color, label-text
```


***

## PRO FEATURES

### 6. COMPLETE ANATOMY AND LAYOUT

**📸 Página con imágenes:** https://specsplugin.com/features/complete-anatomy/

**Referencia visual:**

- Complete anatomy overview → ver página (columnas Anatomy + Layout con filas adicionales por variante)

**Descripción:**
Detecta elementos y layouts adicionales a través de variantes, más allá del componente seleccionado.

**Qué incluye:**

- **Filas adicionales de Anatomy:** una por cada variante con elementos adicionales detectados
- **Filas adicionales de Layout and Spacing:** una por cada variante con configs de Auto Layout distintas

**Ejemplo:**

```
Anatomy
├── [Default variant]
├── actions: buttons (2)  ← fila adicional
└── actions: icons (object)  ← fila adicional

Layout and Spacing
├── [Default variant]
├── actions: buttons (2)  ← fila adicional
└── actions: icons (object)  ← fila adicional
```

**Criterios de distinción:**
Un elemento es "distinto" si esta combinación es única:

1. Layer type (TEXT, INSTANCE, etc.)
2. Layer name
3. Layer parent hierarchy (ej: Card / Title Lockup / Title)
4. Child position de layers del mismo tipo/nombre en ese nivel

***

### 7. MODES

**📸 Página con imágenes:** https://specsplugin.com/features/modes/

**Referencia visual:**

- Modes overview → ver página (comparativa Light/Dark de Color variable collection con componente Alert)
- Modes example → ver página (artwork anotado de Card con containers)

**Descripción:**
Produce una sección Modes para ítems con variables vinculadas a layers que tienen múltiples modes con valores diferentes.

**Qué incluye:**
Subsecciones por cada **variable collection** con:

- Artwork del ítem con ese mode aplicado
- Comparación de variables relevantes entre modes
- Specs atributo por atributo mostrando cambios de valor

**Ejemplo visual:**

```
Color variable collection
├── Light
│   ├── Artwork (fondo blanco)
│   └── Attributes
│       ├── Background color: ESDS Color Alert/Info/Background #EDF0F8
│       └── Border color: ESDS Color Alert/Info/Element #8E98D4
└── Dark
    ├── Artwork (fondo oscuro)
    └── Attributes
        ├── Background color: ESDS Color Alert/Info/Background #1A2332
        └── Border color: ESDS Color Alert/Info/Element #4A5C7E
```

**Límites:**

- Solo crea subsecciones para collections con **≥2 modes**
- Variables que no varían aparecen en Anatomy o Properties
- No superpone anotaciones de spacing (el artwork es global)

***

### 8. SPEC NESTED COMPONENTS

**📸 Página con imágenes:** https://specsplugin.com/features/spec-nested-components/

**Referencia visual:**

- Spec nested components overview → ver página (comparativa NOT included vs included)

**Descripción:**
El toggle "Spec nested subcomponents" agrega specs para instancias encontradas dentro de ítems seleccionados.

**Cómo funciona:**

1. En plugin Settings, activar **"Spec nested subcomponents"**
2. Al ejecutar el plugin, detecta nested instances
3. Genera specs adicionales (Anatomy + Properties) para cada una en el mismo run

**Ejemplo visual:**

```
SIN nested components:
└── ESDSV Button (Anatomy + Properties)

CON nested components:
├── ESDSV Button (Anatomy + Properties)
├── Icon (Anatomy + Properties con Size: 16×16, 20×20, 24×24)
└── ESDS Icon asset / Plus (Anatomy)
```

**Límites:**

- Solo nested instances del ítem seleccionado original reciben specs
- Variantes adicionales dentro de nested instances pueden no incluirse

***

### 9. TOKEN STUDIO TOKENS

**📸 Página:** https://specsplugin.com/features/tokens-studio/

**Descripción:**
Detecta y formatea atributos como tokens gestionados por el plugin Tokens Studio for Figma.

**Qué incluye:**

- Reemplazo de valores hardcoded con tokens detectados en Anatomy, Properties y Layout and Spacing
- Tokens Studio tokens tienen **prioridad** sobre hardcoded values y Figma styles (excepto variables)

**Prioridad de formatos:**

1. **Figma variable** (mayor prioridad)
2. **Figma style** (color, text, effects)
3. **Tokens Studio token**
4. **Hardcoded value** (menor prioridad)

***

### 10. TWO-WAY COMPARISON

**📸 Página:** https://specsplugin.com/features/two-way/

**Descripción:**
Compara atributos usando todas las combinaciones de **dos propiedades** simultáneamente.

**Problema que resuelve:**
Cuando las diferencias no pueden explicarse correctamente con una sola propiedad a la vez (compound props).

**Ejemplo:**

```
Properties tradicional:
Size: Small → compara default vs Small
Type: Primary → compara default vs Primary

Two-way comparison:
Size × Type → compara todas las combinaciones:
├── Small + Primary
├── Small + Secondary
├── Medium + Primary
├── Medium + Secondary
etc.
```


***

### 11. VARIABLE FORMATTING

**📸 Página con imágenes:** https://specsplugin.com/features/variables/

**Referencia visual:**

- Variable formatting overview → ver página (comparativa Basic vs Informational con pills de variables)
- Variable formatting example → ver página (ESDSV Button y Label con pills)

**Descripción:**
Detecta, formatea y compara valores de atributos mapeados a variables de Figma.

**Qué incluye:**
Variables se muestran en **formato pill** con:

- Nombre de variable collection
- Nombre de variable
- Raw value

Para colores: pill incluye **square swatch** con hex value

**Ejemplo visual:**

```
ESDSV Button
└── Background color: [🔵] ESDS Color Action/Initial #0E68D4

Label
└── Text color: [⬜] ESDS Color Text/Primary #FFFFFF
```

**Prioridad de formatos** (ver Token Studio Tokens arriba)

***

## PRO FORMATTING

### 12. CUSTOM COLOR FORMATS

**📸 Página con imágenes:** https://specsplugin.com/features/format-color/

**Referencia visual:**

- Color format settings → ver página (panel EightShapes Specs con variables)
- Color format applied → ver página (Marker fill aplicado)
- Color format result → ver página (tabla Light/Dark)

**Descripción:**
Genera, personaliza y aplica variables personalizadas para formatear colores de especificaciones.

**Cómo funciona:**

1. En Settings → Format, seleccionar **Color**
2. Plugin busca/crea variables en collection **`EightShapes Specs`**
3. Aplica colores a frames y textos relevantes en el output

**Variables gestionadas:**

```
EightShapes Specs
├── Text
│   ├── Background
│   ├── Artwork background
│   └── Artwork stroke
├── Text / Text
│   ├── Primary
│   └── Secondary
├── Text / Attributes
│   ├── Icon stroke
│   ├── Style fill
│   ├── Style stroke
│   ├── Style text
│   └── Variable stroke
├── Change
│   ├── Addition (verde)
│   ├── Removal (rojo)
│   └── Update (naranja)
└── Annotation
    ├── Marker fill
    ├── Marker text
    └── Local color
```

Cada variable tiene valores separados para modes **light** y **dark**.

***

### 13. DARK MODE

**📸 Página con imágenes:** https://specsplugin.com/features/dark-mode/

**Referencia visual:**

- Dark mode overview → ver página (comparativa global Light vs Dark)
- Page-level dark mode → ver página (selector en panel Design)
- Specification-level dark mode → ver página (spec ESDSV Alert en oscuro)
- Artwork frame dark mode → ver página (comparativa DS Color Light/Dark)

**Descripción:**
Permite cambiar el output del plugin al modo oscuro de EightShapes Specs.

**Tres niveles de aplicación:**

**1. Page-level (toda la página):**

- Deseleccionar todo
- Click en Mode icon en sección Page del panel Design
- Elegir Light o Dark para EightShapes Specs

**2. Specification-level (frame Specifications o spec individual):**

- Seleccionar frame Specifications o spec
- Click en Mode icon en header de sección Layer
- Configurar preferencia de mode

**3. Artwork frame level (frames de artwork individuales):**

- Seleccionar Artwork frame (CMD/CTRL + hover)
- Click en Mode icon en header de sección Layer
- Alternar entre Light/Dark

**Comportamiento:**

- Marcadores y anotaciones ajustan colores
- Artwork en sí permanece sin cambios

***

### 14. MULTI-COLUMN LAYOUT

**📸 Página con imágenes:** https://specsplugin.com/features/multi-column-layout/

**Referencia visual:**

- Multi-column layout overview → ver página (3 columnas por defecto)
- Three column layout example → ver página (grilla de 5 columnas)
- Beyond four columns example → ver página (comparativa 1, 2, 4 columnas)

**Descripción:**
Organiza artwork y contenido de Properties, Modes y Layout en formato apilado vertical o multi-columna (2, 3 o 4 columnas).

**Qué incluye:**

- Layout por defecto: 1 columna (contenido izquierda, artwork derecha)
- Alternativas: 2, 3 o 4 columnas automáticas
- Redimensionamiento manual del frame Specification → reflow automático

**Cómo funciona:**

1. Genera displays como layout de 1 columna
2. Identifica ancho máximo de artwork y content frames
3. Establece ancho mínimo de todos los artwork frames
4. Establece ancho de section/subsection para cantidad de columnas
5. Agrega exhibits "spacer" en blanco (técnica flexbox) para mantener anchos iguales

**Ejemplo visual:**

```
1 columna (default):
Properties
├── Basic (apilado verticalmente)
├── Informational
├── Success
└── Error

3 columnas:
Properties
├── Basic      Informational   Success
└── Error      Warning
```


***

### 15. CUSTOM SPACING

**📸 Página con imágenes:** https://specsplugin.com/features/format-spacing/

**Referencia visual:**

- Spacing format settings → ver página (variable collection Specs Layout con 38 variables)
- Spacing format applied → ver página (Auto Layout con itemSpacing aplicado)

**Descripción:**
Genera, personaliza y aplica variables personalizadas para formatear spacing de especificaciones.

**Cómo funciona:**

1. En Settings → Format, seleccionar **Layout and Spacing**
2. Plugin busca/crea variables en collection **`Specs Layout`**
3. Aplica variables de layout a frames relevantes en el output

**Variables gestionadas (38 total):**

```
Specs Layout (mode: Default)
├── Specs
│   └── itemSpacing: 128
├── Spec
│   └── itemSpacing: 48
├── Title
│   ├── itemSpacing: 48
│   └── padding: 64
├── Section
│   ├── itemSpacing: 64
│   └── padding: 64
├── Subsection
│   └── itemSpacing: 40
├── Table
│   ├── Column Header
│   └── Row
├── Element
│   ├── Horizontal
│   ├── Vertical
│   ├── Anatomy
│   └── Name
└── Attribute
    ├── Horizontal
    ├── Vertical
    └── Layer
```


***

### 16. TABULAR ANATOMY

**📸 Página con imágenes:** https://specsplugin.com/features/tabular-anatomy/

**Referencia visual:**

- Tabular anatomy overview → ver página (comparativa List beside artwork vs Table below artwork)

**Descripción:**
Ofrece dos formatos para Anatomy: **List beside artwork** (default) y **Table below artwork** (alternativo).

**Qué incluye:**

**Formato "List beside artwork" (default):**

- Lista de elementos a la izquierda
- Artwork anotado a la derecha

**Formato "Table below artwork" (alternativo):**

- Artwork anotado arriba
- Dos tablas debajo:

1. **"Nested components"** con columnas:
        - Dependency
        - Properties
        - Resources
2. **"Elements with attributes"** con columnas:
        - Nombre del elemento
        - Atributos visuales

**Ejemplo visual:**

```
Table below artwork:

Artwork
[componente anotado con marcadores]

Nested components
| Dependency        | Properties           | Resources |
|-------------------|----------------------|-----------|
| ESDS Icon         | Size: 16×16          | Link      |
| ESDS Details      | Color: Mode Light    | -         |

Elements with attributes
| Element     | Attributes                                    |
|-------------|-----------------------------------------------|
| ESDS Alert  | Background color, Border color, Border weight |
| Title       | Text color, Text style                        |
| Details     | Text color, Text style                        |
```


***

### 17. CUSTOM TYPOGRAPHY

**📸 Página con imágenes:** https://specsplugin.com/features/format-typography/

**Referencia visual:**

- Custom typography overview → ver página (spec Lightning Button con tipografía personalizada)
- Typography format settings → ver página (panel Text styles con EightShapes Spec seleccionado)
- Typography format example → ver página (diálogo Edit text style con IBM Plex Sans)
- Typography format result → ver página (Local styles completo con jerarquía)

**Descripción:**
Genera, personaliza y aplica text styles personalizados para formatear tipografía de especificaciones.

**Cómo funciona:**

1. En Settings → Format, seleccionar **Typography**
2. Plugin busca/crea text styles locales que comienzan con **`EightShapes Spec`**
3. Aplica text styles a frames relevantes en el output

**Text styles gestionados:**

```
EightShapes Spec
├── Annotations
│   ├── Marker · 14/Auto
│   ├── Marker small · 12/Auto
│   └── Space size · 12/Auto
├── Heading
│   ├── Title · 64/Auto
│   ├── Section · 48/Auto
│   ├── Subsection · 36/Auto
│   └── SubsectionMe... · 16/Auto
├── Table
│   └── Column header · 12/Auto
└── Text
    ├── Label · 24/Auto
    ├── Element · 16/Auto
    ├── Element type · 16/Auto
    ├── Attribute property · 12/Auto
    ├── Attribute value · 12/Auto
    ├── Token value · 12/Auto
    ├── Style value · 12/Auto
    ├── Variable value · 12/Auto
    ├── Variable collec... · 12/Auto
    ├── Dependency v... · 12/Auto
    └── Label metadata · 18/Auto
```

**Personalización:**
Los text styles pueden editarse directamente en Figma. Ejemplo: cambiar `Font name` de todos los estilos a `IBM Plex Sans` para alinear con el design system.

**Ocultación de publicación:**

- Text styles con prefijo `.` se ocultan automáticamente
- El plugin detecta ambos: `EightShapes Specs/...` y `.EightShapes Specs/...`

***

### 18. CUSTOM VALUE FORMATS

**📸 Página con imágenes:** https://specsplugin.com/features/format-values/

**Referencia visual:**

- Custom value formats overview → ver página (panel Settings con tres controles)

**Descripción:**
Controla cómo se muestran algunos valores en outputs de especificación.

**Ajustes disponibles:**

**1. Preferred value if both detected:**
Cuando se detectan Figma variable + Tokens Studio token para el mismo atributo:

- **Variable** (default)
- **Tokens Studio token**

Solo uno se muestra (no ambos simultáneamente).

**2. Color raw value format:**
Los valores crudos de color pueden mostrarse como:

- **Hex** (default): `#FFFFFF`
- **HSLA**: `hsla(20, 45%, 74%, 1)`

**3. Show raw value after variable, token or style:**
Toggle (activado por default) que muestra raw values entre paréntesis después del nombre del estilo/variable/token.

**Ejemplo:**

```
Sin raw value:
Background color: ESDS Color Action/Initial

Con raw value:
Background color: ESDS Color Action/Initial (#0E68D4)
```


***

## REQUERIMIENTOS TÉCNICOS

### Arquitectura del plugin

**Lenguaje:** TypeScript
**Framework:** Figma Plugin API
**Estructura:**

```
specs-plugin/
├── manifest.json
├── src/
│   ├── plugin/
│   │   ├── traversal/
│   │   │   ├── anatomy.ts
│   │   │   ├── properties.ts
│   │   │   ├── layout.ts
│   │   │   └── modes.ts
│   │   ├── formatting/
│   │   │   ├── colors.ts
│   │   │   ├── typography.ts
│   │   │   ├── spacing.ts
│   │   │   └── values.ts
│   │   ├── generators/
│   │   │   ├── anatomy-generator.ts
│   │   │   ├── properties-generator.ts
│   │   │   ├── layout-generator.ts
│   │   │   └── json-generator.ts
│   │   ├── utils/
│   │   │   ├── layer-detector.ts
│   │   │   ├── attribute-comparator.ts
│   │   │   └── marker-placer.ts
│   │   └── main.ts
│   └── ui/
│       ├── settings.tsx
│       └── upgrade.tsx
└── package.json
```


### Funcionalidades principales a implementar

**Core (gratuito):**

1. **Traversal de layers:** recorrer nodos seleccionados e identificar elementos
2. **Anatomy generator:** crear lista + artwork anotado con marcadores
3. **Properties comparator:** comparar variantes y resaltar diferencias
4. **Layout detector:** detectar Auto Layout y anotar padding/spacing
5. **Data exporter:** generar JSON de anatomy + properties
6. **Styling inventory:** inventariar variables, tokens, text styles, color styles

**Pro (pago):**

1. **Complete anatomy/layout:** detectar elementos/layouts adicionales por variante
2. **Modes detector:** detectar variables con múltiples modes y valores diferentes
3. **Nested specs:** especificar nested components recursivamente
4. **Token Studio integration:** detectar y formatear tokens
5. **Two-way comparison:** comparar combinaciones de dos propiedades
6. **Variable formatting:** formatear como pills con collection/nombre/raw value

**Pro Formatting (pago):**

1. **Color formatter:** aplicar variable collection EightShapes Specs
2. **Dark mode:** aplicar mode dark de EightShapes Specs
3. **Multi-column layout:** reorganizar en 2/3/4 columnas con spacers
4. **Spacing formatter:** aplicar variable collection Specs Layout
5. **Tabular anatomy:** formatear como tabla debajo de artwork
6. **Typography formatter:** aplicar text styles EightShapes Spec
7. **Value formatter:** configurar preferencias de display de valores

### APIs de Figma requeridas

```typescript
// Traversal
figma.currentPage.selection
node.children
node.type
node.layoutMode // Auto Layout detection

// Variables
node.boundVariables
figma.variables.getVariableById()
figma.variables.getVariableCollectionById()
variableCollection.modes

// Styles
node.fillStyleId
node.textStyleId
figma.getStyleById()

// Cloning & annotation
node.clone()
figma.createFrame()
figma.createText()
figma.createRectangle()

// Export
figma.createFrame() // para specifications container
```


### Modelo de datos

**Anatomy element:**

```typescript
interface AnatomyElement {
  name: string;
  type: NodeType; // "FRAME" | "TEXT" | "INSTANCE" | etc.
  instanceOf?: string; // para nested instances
  attributes: Attribute[];
}

interface Attribute {
  key: string; // "background-color", "width", etc.
  value: string; // puede ser variable, style, token o hardcoded
  format: "PROPERTY" | "HARDCODED" | "VARIABLE" | "STYLE";
  systemId?: string; // Figma ID para variables/styles
  rawValue?: string;
  propertyName?: string; // para atributos de propiedad
}
```

**Properties option:**

```typescript
interface Property {
  name: string;
  type: "VARIANT" | "BOOLEAN" | "TEXT" | "INSTANCE_SWAP";
  default: string;
  options: PropertyOption[];
}

interface PropertyOption {
  name: string;
  changedElements: {
    elementName: string;
    changedAttributes: Attribute[];
  }[];
}
```

**Layout spec:**

```typescript
interface LayoutSpec {
  elementName: string;
  layoutMode: "HORIZONTAL" | "VERTICAL" | "NONE";
  primaryAxisAlignItems: AlignItems;
  counterAxisAlignItems: AlignItems;
  paddingLeft: number;
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  itemSpacing: number;
  primaryAxisSizingMode: "FIXED" | "AUTO";
  counterAxisSizingMode: "FIXED" | "AUTO";
}
```


***

## REFERENCIAS VISUALES

### URLs de páginas con imágenes embebidas

Para que Claude Code pueda scrapear y ver las imágenes, visitar estas URLs:

**Standard Features:**

- Anatomy: https://specsplugin.com/anatomy/
- Properties: https://specsplugin.com/properties/
- Layout and Spacing: https://specsplugin.com/layout-and-spacing/
- Data: https://specsplugin.com/features/data/
- Styling Inventory: https://specsplugin.com/features/styling-inventory/

**Pro Features:**

- Complete Anatomy and Layout: https://specsplugin.com/features/complete-anatomy/
- Modes: https://specsplugin.com/features/modes/
- Spec Nested Components: https://specsplugin.com/features/spec-nested-components/
- Token Studio Tokens: https://specsplugin.com/features/tokens-studio/
- Two Way Comparison: https://specsplugin.com/features/two-way/
- Variable Formatting: https://specsplugin.com/features/variables/

**Pro Formatting:**

- Custom Color Formats: https://specsplugin.com/features/format-color/
- Dark Mode: https://specsplugin.com/features/dark-mode/
- Multi-Column Layout: https://specsplugin.com/features/multi-column-layout/
- Custom Spacing: https://specsplugin.com/features/format-spacing/
- Tabular Anatomy: https://specsplugin.com/features/tabular-anatomy/
- Custom Typography: https://specsplugin.com/features/format-typography/
- Custom Value Formats: https://specsplugin.com/features/format-values/

***

## ROADMAP Y PRÓXIMOS PASOS

**Para Claude Code:**

1. **Fase 1 — Core gratuito:**
    - Implementar traversal de layers
    - Implementar Anatomy generator
    - Implementar Properties comparator
    - Implementar Layout detector
2. **Fase 2 — Standard features:**
    - Completar Data exporter (JSON)
    - Completar Styling Inventory
3. **Fase 3 — Pro features:**
    - Implementar Complete Anatomy/Layout
    - Implementar Modes
    - Implementar Spec Nested Components
    - Implementar Variable formatting
4. **Fase 4 — Pro formatting:**
    - Implementar Color formatter
    - Implementar Dark mode
    - Implementar Multi-column layout
    - Implementar restantes formatters
5. **Fase 5 — Polish:**
    - Settings UI
    - Upgrade flow
    - Testing exhaustivo

***

**FIN DEL PRD**

***

## 📥 CÓMO CONVERTIR A PDF

Para convertir este markdown a PDF:

**Opción 1 - Usando VS Code:**

1. Instalar extensión "Markdown PDF"
2. Copiar todo el contenido arriba
3. Crear archivo `specs-plugin-PRD.md`
4. Click derecho → "Markdown PDF: Export (pdf)"

**Opción 2 - Usando Pandoc (línea de comandos):**

```bash
pandoc specs-plugin-PRD.md -o specs-plugin-PRD.pdf --pdf-engine=xelatex
```

**Opción 3 - Online:**

1. Visitar https://www.markdowntopdf.com/
2. Pegar el contenido markdown
3. Click "Convert"
4. Descargar PDF

**Opción 4 - Usar este HTML (copiar y abrir en navegador, luego Imprimir → Guardar como PDF):**

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>PRD — Specs Plugin para Figma</title>
<style>
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 900px; margin: 40px auto; padding: 0 20px; line-height: 1.6; }
h1 { color: #0066cc; border-bottom: 3px solid #0066cc; padding-bottom: 10px; }
h2 { color: #333; border-bottom: 2px solid #eee; padding-bottom: 8px; margin-top: 40px; }
h3 { color: #555; margin-top: 30px; }
code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; font-size: 0.9em; }
pre { background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; }
table { border-collapse: collapse; width: 100%; margin: 20px 0; }
th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
th { background: #f8f8f8; font-weight: bold; }
blockquote { border-left: 4px solid #0066cc; padding-left: 20px; margin: 20px 0; color: #666; }
a { color: #0066cc; }
</style>
</head>
<body>
<!-- Pegar aquí el contenido markdown convertido a HTML -->
</body>
</html>
```

¿Necesitás que te ayude con alguno de estos métodos o querés que ajuste algo del PRD?

