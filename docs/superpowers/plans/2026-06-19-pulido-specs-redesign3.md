# Pulido del output de specs (redesign 3) — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cuatro mejoras al output de specs: typography con nombre de estilo, caja gris del artwork más grande y centrada, estructura de página según `Specifications-structure.pdf`, y colores de badges/cotas según las paletas provistas.

**Architecture:** Cambios acotados por archivo: `atributos.ts` (typography, puro + test), `anatomy.ts` (caja gris + paleta de badges), `encabezado.ts` + `main.ts` (estructura de página), `layout.ts` (colores de cotas). Hex estimados, se afinan por PDF.

**Tech Stack:** TypeScript, Figma Plugin API, esbuild, `npm test` (node --test sobre `tests/*.test.ts`).

---

## Nota de testing

Solo la Task 1 es lógica pura y lleva test unitario (en `tests/`). El resto toca `figma.*`
y se verifica por PDF. Verificación de cada tarea: `npm run build && npm test` sin errores y
sin regresiones (los tests existentes deben seguir pasando; la Task 1 suma 2 tests nuevos).

---

## Task 1: Typography muestra el nombre del estilo de texto

**Files:**
- Modify: `src/plugin/utils/atributos.ts`
- Test: `tests/atributos.test.ts`

- [ ] **Step 1: Escribir los tests que fallan**

En `tests/atributos.test.ts`, agregá al final:

```ts
test("typography con estilo aplicado → usa el nombre del estilo (con grupo)", () => {
  const nodo: NodoLike = {
    id: "x", name: "x", type: "TEXT",
    fontFamily: "Inter", fontStyle: "Medium", fontSize: 14,
    textStyleName: "Text SM/Medium",
  };
  assert.deepEqual(
    leerAtributos(nodo).find((a) => a.clave === "typography"),
    { clave: "typography", valor: "Text SM/Medium", formato: "HARDCODED" },
  );
});

test("typography sin estilo → usa el raw de la fuente", () => {
  const nodo: NodoLike = {
    id: "x", name: "x", type: "TEXT",
    fontFamily: "Inter", fontStyle: "Medium", fontSize: 14,
  };
  const attr = leerAtributos(nodo).find((a) => a.clave === "typography");
  assert.equal(attr?.formato, "HARDCODED");
  assert.match(attr?.valor ?? "", /Inter/);
});
```

- [ ] **Step 2: Correr los tests y verificar que fallan**

Run: `npm test`
Expected: FALLA el primer test nuevo (hoy `valor` es el raw `Inter Medium 14 / 20`, no
`"Text SM/Medium"`).

- [ ] **Step 3: Usar `textStyleName` en `leerAtributos`**

En `src/plugin/utils/atributos.ts`, reemplazá el bloque de typography (cerca de la línea 82):

```ts
  if (nodo.fontFamily && typeof nodo.fontSize === "number") {
    atributos.push({
      clave: "typography",
      valor: formatearTipografia({ family: nodo.fontFamily, style: nodo.fontStyle ?? "", size: nodo.fontSize, lineHeight: nodo.lineHeight, letterSpacing: nodo.letterSpacing }, formatoTipoActual()),
      formato: "HARDCODED",
    });
  }
```

por:

```ts
  if (nodo.fontFamily && typeof nodo.fontSize === "number") {
    const valorTipo = nodo.textStyleName ??
      formatearTipografia({ family: nodo.fontFamily, style: nodo.fontStyle ?? "", size: nodo.fontSize, lineHeight: nodo.lineHeight, letterSpacing: nodo.letterSpacing }, formatoTipoActual());
    atributos.push({ clave: "typography", valor: valorTipo, formato: "HARDCODED" });
  }
```

- [ ] **Step 4: Correr los tests y verificar que pasan**

Run: `npm test`
Expected: PASAN los dos tests nuevos y todos los existentes.

- [ ] **Step 5: Commit**

```bash
git add src/plugin/utils/atributos.ts tests/atributos.test.ts
git commit -m "feat: typography usa el nombre del estilo de texto cuando hay estilo aplicado"
```

---

## Task 2: Paleta de 8 colores para los badges (marcadores)

**Files:**
- Modify: `src/plugin/generadores/anatomy.ts`

- [ ] **Step 1: Reemplazar `COLORES_MARCA`**

En `src/plugin/generadores/anatomy.ts`, reemplazá la definición actual:

```ts
// Paleta de colores de marcador (badge + borde), cicla por índice.
const COLORES_MARCA: RGB[] = [
  { r: 0.05, g: 0.4, b: 0.85 }, { r: 0.9, g: 0.2, b: 0.5 }, { r: 0.45, g: 0.3, b: 0.8 },
  { r: 0.95, g: 0.45, b: 0.1 }, { r: 0.1, g: 0.6, b: 0.4 },
];
```

por (paleta de 8, orden que valida redesign 3: azul, magenta, violeta…; texto blanco ya):

```ts
// Paleta de colores de marcador (badge + borde), cicla por índice. Texto blanco.
const COLORES_MARCA: RGB[] = [
  hexARgb("#0D80FF"), // azul
  hexARgb("#FF2D9C"), // magenta
  hexARgb("#9747FF"), // violeta
  hexARgb("#F0411E"), // rojo
  hexARgb("#F5C518"), // amarillo
  hexARgb("#1FA855"), // verde
  hexARgb("#5E6B8A"), // slate
  hexARgb("#F5921E"), // naranja
];
```

(`hexARgb` ya se importa en `anatomy.ts` desde `../utils/color.ts`.)

- [ ] **Step 2: Build + tests**

Run: `npm run build && npm test`
Expected: build OK; tests pasan sin regresiones.

- [ ] **Step 3: Commit**

```bash
git add src/plugin/generadores/anatomy.ts
git commit -m "feat: paleta de 8 colores para los badges de Anatomy"
```

---

## Task 3: Caja gris del artwork con tamaño mínimo y elemento centrado

**Files:**
- Modify: `src/plugin/generadores/anatomy.ts` (`seccionDeAnatomy`)

- [ ] **Step 1: Cambiar el dimensionado del artwork y centrar el clon**

En `seccionDeAnatomy`, reemplazá este bloque:

```ts
  // Margen para que los badges de las capas pegadas al borde no se corten.
  const MARGEN_ARTWORK = 20;
  const clon = seleccionado.clone();
  artwork.appendChild(clon);
  clon.x = MARGEN_ARTWORK;
  clon.y = MARGEN_ARTWORK;
  artwork.resize(clon.width + 2 * MARGEN_ARTWORK, clon.height + 2 * MARGEN_ARTWORK);

  // Un marcador por elemento, posicionado sobre la caja real de la capa.
  const cajas = cajasRelativas(seleccionado);
  for (let i = 0; i < elementos.length; i++) {
    const caja = cajas.get(elementos[i].id);
    if (!caja) continue;
    const color = COLORES_MARCA[i % COLORES_MARCA.length];
    const x = caja.x + MARGEN_ARTWORK;
    const y = caja.y + MARGEN_ARTWORK;
    bordeMarca({ x, y, width: caja.width, height: caja.height }, color, artwork);
    artwork.appendChild(await marcador(i + 1, x - 8, y - 8, color));
  }
```

por (canvas con mínimo `ARTWORK_MIN` y clon centrado; marcadores usan el offset real):

```ts
  // Margen para que los badges de las capas pegadas al borde no se corten.
  const MARGEN_ARTWORK = 20;
  // Tamaño mínimo del canvas gris: un elemento chico queda centrado en una caja amplia.
  const ARTWORK_MIN = 440;
  const clon = seleccionado.clone();
  artwork.appendChild(clon);
  const canvasW = Math.max(ARTWORK_MIN, clon.width + 2 * MARGEN_ARTWORK);
  const canvasH = Math.max(ARTWORK_MIN, clon.height + 2 * MARGEN_ARTWORK);
  artwork.resize(canvasW, canvasH);
  const offsetX = (canvasW - clon.width) / 2;
  const offsetY = (canvasH - clon.height) / 2;
  clon.x = offsetX;
  clon.y = offsetY;

  // Un marcador por elemento, posicionado sobre la caja real de la capa (clon centrado).
  const cajas = cajasRelativas(seleccionado);
  for (let i = 0; i < elementos.length; i++) {
    const caja = cajas.get(elementos[i].id);
    if (!caja) continue;
    const color = COLORES_MARCA[i % COLORES_MARCA.length];
    const x = caja.x + offsetX;
    const y = caja.y + offsetY;
    bordeMarca({ x, y, width: caja.width, height: caja.height }, color, artwork);
    artwork.appendChild(await marcador(i + 1, x - 8, y - 8, color));
  }
```

- [ ] **Step 2: Build + tests**

Run: `npm run build && npm test`
Expected: build OK; tests pasan sin regresiones.

- [ ] **Step 3: Commit**

```bash
git add src/plugin/generadores/anatomy.ts
git commit -m "feat: caja gris del artwork con tamaño mínimo y elemento centrado"
```

---

## Task 4: Reestructurar el encabezado (`encabezado.ts`)

**Files:**
- Modify: `src/plugin/generadores/encabezado.ts` (reescritura completa)

- [ ] **Step 1: Reescribir el archivo con la estructura `title-header`**

Reemplazá TODO el contenido de `src/plugin/generadores/encabezado.ts` por:

```ts
// Encabezado de documento "title-header": barra (_Status) con nombre del plugin + sección,
// más el bloque de título (_Doc/Heading) con título y descripción. Va arriba de cada sección.

import { frameVertical, frameHorizontal, texto } from "./frames.ts";

const NOMBRE_PLUGIN = "BLUEPRINT SPECS & HANDOFF";
const DESCRIPCION_PLACEHOLDER =
  "This a placeholder text to add a brief description of what this element does in the project.";
const GRIS_OSCURO: RGB = { r: 0.216, g: 0.255, b: 0.318 }; // #374151
const GRIS_DESC: RGB = { r: 0.420, g: 0.447, b: 0.502 };   // #6B7280
const BORDE_HEADER: RGB = { r: 0.819, g: 0.835, b: 0.859 }; // #D1D5DB

// SF Pro (fuentes de sistema macOS) con fallback a Inter si no están en el archivo.
const FONT_BARRA: FontName[] = [{ family: "SF Pro Text", style: "Medium" }, { family: "Inter", style: "Semi Bold" }];
const FONT_TITULO: FontName[] = [{ family: "SF Pro Display", style: "Regular" }, { family: "Inter", style: "Bold" }];

// Texto de la barra (plugin o sección): SF Pro Text Medium 13, gris #374151.
async function textoBarra(contenido: string): Promise<TextNode> {
  const t = await texto(contenido, 13, FONT_BARRA);
  t.fills = [{ type: "SOLID", color: GRIS_OSCURO }];
  return t;
}

// Una mitad de la barra (Right/Left Side): se estira a FILL, con su alineación horizontal.
async function ladoBarra(nombre: string, align: "MIN" | "MAX", contenido: string): Promise<FrameNode> {
  const lado = frameHorizontal(nombre, 8);
  lado.primaryAxisAlignItems = align;
  lado.appendChild(await textoBarra(contenido));
  return lado;
}

// Barra superior _Status: plugin (izq) + sección (der) + divisor inferior.
async function barraStatus(etiquetaSeccion: string): Promise<FrameNode> {
  const barra = frameHorizontal("_Status", 0);
  barra.counterAxisAlignItems = "CENTER";
  barra.paddingBottom = 12;
  barra.strokes = [{ type: "SOLID", color: BORDE_HEADER }];
  barra.strokeTopWeight = 0;
  barra.strokeLeftWeight = 0;
  barra.strokeRightWeight = 0;
  barra.strokeBottomWeight = 1;

  const right = await ladoBarra("Right Side", "MIN", NOMBRE_PLUGIN);
  barra.appendChild(right);
  right.layoutSizingHorizontal = "FILL";

  const left = await ladoBarra("Left Side", "MAX", etiquetaSeccion.toUpperCase());
  barra.appendChild(left);
  left.layoutSizingHorizontal = "FILL";

  return barra;
}

// Bloque _Doc/Heading: Description (título 36 + descripción 16), con padding lateral 64.
async function docHeading(nombreElemento: string): Promise<FrameNode> {
  const doc = frameVertical("_Doc/Heading", 10);
  doc.paddingLeft = doc.paddingRight = 64;

  const desc = frameVertical("Description", 24);
  desc.appendChild(await texto(nombreElemento, 36, FONT_TITULO));
  const sub = await texto(DESCRIPCION_PLACEHOLDER, 16);
  sub.fills = [{ type: "SOLID", color: GRIS_DESC }];
  desc.appendChild(sub);

  doc.appendChild(desc);
  return doc;
}

// Encabezado "title-header" completo. Se estira a FILL al appendearlo a su contenedor.
export async function tituloYEncabezado(nombreElemento: string, etiquetaSeccion: string): Promise<FrameNode> {
  const cont = frameVertical("title-header", 64);

  const wrapper = frameVertical("wrapper", 8);
  wrapper.paddingLeft = wrapper.paddingRight = 64;
  const barra = await barraStatus(etiquetaSeccion);
  wrapper.appendChild(barra);
  barra.layoutSizingHorizontal = "FILL";
  cont.appendChild(wrapper);
  wrapper.layoutSizingHorizontal = "FILL";

  const doc = await docHeading(nombreElemento);
  cont.appendChild(doc);
  doc.layoutSizingHorizontal = "FILL";

  return cont;
}
```

- [ ] **Step 2: Build + tests**

Run: `npm run build && npm test`
Expected: build OK; tests pasan sin regresiones.

- [ ] **Step 3: Commit**

```bash
git add src/plugin/generadores/encabezado.ts
git commit -m "refactor: encabezado con estructura title-header / wrapper / _Status"
```

---

## Task 5: Estructura de página en `main.ts`

**Files:**
- Modify: `src/plugin/main.ts`

- [ ] **Step 1: Reescribir el armado de `Specifications`**

En `figma.ui.onmessage`, reemplazá este bloque:

```ts
    const specifications = frameVertical("Specifications", 128, 64);
    const spec = frameVertical(`${nodo.name} Spec`, 48);
    specifications.appendChild(spec);
    if (msg.leyenda) spec.appendChild(await seccionLeyenda());
    for (const seccion of ORDEN) {
      if (!msg.secciones.includes(seccion)) continue;
      const header = await tituloYEncabezado(nodo.name, ETIQUETA_SECCION[seccion]);
      spec.appendChild(header);
      header.layoutSizingHorizontal = "FILL";
      for (const f of await seccionPara(nodo, seccion, opts)) spec.appendChild(f);
    }
    figma.currentPage.appendChild(specifications);
    finalizar(specifications, nodo);
```

por (Specifications padding 0 / gap 64; por sección: header + cuerpo `<name> Spec`
con padding 0/64/64/64):

```ts
    const specifications = frameVertical("Specifications", 64, 0);
    let primeraSeccion = true;
    for (const seccion of ORDEN) {
      if (!msg.secciones.includes(seccion)) continue;
      const header = await tituloYEncabezado(nodo.name, ETIQUETA_SECCION[seccion]);
      specifications.appendChild(header);
      header.layoutSizingHorizontal = "FILL";

      const cuerpo = frameVertical(`${nodo.name} Spec`, 64);
      cuerpo.paddingLeft = cuerpo.paddingRight = cuerpo.paddingBottom = 64;
      if (primeraSeccion && msg.leyenda) cuerpo.appendChild(await seccionLeyenda());
      for (const f of await seccionPara(nodo, seccion, opts)) cuerpo.appendChild(f);
      specifications.appendChild(cuerpo);
      cuerpo.layoutSizingHorizontal = "FILL";

      primeraSeccion = false;
    }
    figma.currentPage.appendChild(specifications);
    finalizar(specifications, nodo);
```

- [ ] **Step 2: Build + tests**

Run: `npm run build && npm test`
Expected: build OK; tests pasan sin regresiones.

- [ ] **Step 3: Commit**

```bash
git add src/plugin/main.ts
git commit -m "feat: estructura de página Specifications (padding 0 + cuerpo por sección)"
```

---

## Task 6: Colores de cotas (fondo claro + texto oscuro) en `layout.ts`

**Files:**
- Modify: `src/plugin/generadores/layout.ts`

Contexto: hoy las cotas (`cota` / `cotaConNombre`) son fondo saturado + texto blanco. La
paleta de cotas es fondo claro + texto oscuro. Se invierte. Las bandas/overlays
(`PADDING_BANDA`, `GAP_BANDA`, `AZUL`, `VERDE`, `NARANJA`, `ROJO`) NO se tocan.

- [ ] **Step 1: Agregar el tipo `ParCota` y las constantes de color**

En `layout.ts`, después de la línea `const ROJO: RGB = { r: 1, g: 0.1, b: 0.3 };` (línea 16),
agregá:

```ts
// Cotas: fondo claro + texto oscuro (paleta colores-cotas-anotaciones).
interface ParCota { bg: RGB; texto: RGB; }
const COTA_PADDING: ParCota = { bg: hexARgb("#E6F0FB"), texto: hexARgb("#324049") }; // azul claro / slate
const COTA_GAP: ParCota     = { bg: hexARgb("#FBE5F0"), texto: hexARgb("#C71E84") }; // rosa claro / magenta
const COTA_DIM: ParCota     = { bg: hexARgb("#E8F6EC"), texto: hexARgb("#1E6B3A") }; // verde claro / verde
```

`layout.ts` todavía NO importa `hexARgb`, así que agregá este import al tope del archivo
(junto a los otros imports):

```ts
import { hexARgb } from "../utils/color.ts";
```

- [ ] **Step 2: Reescribir `cota` para usar `ParCota`**

Reemplazá la función `cota` completa:

```ts
// Cota simple: pill de color con el valor en blanco. El caller la posiciona.
async function cota(valor: string, color: RGB, artwork: FrameNode): Promise<FrameNode> {
  const c = figma.createFrame();
  c.name = "cota";
  c.layoutMode = "HORIZONTAL";
  c.primaryAxisSizingMode = "AUTO";
  c.counterAxisSizingMode = "AUTO";
  c.counterAxisAlignItems = "CENTER";
  c.paddingTop = c.paddingBottom = 1;
  c.paddingLeft = c.paddingRight = 4;
  c.cornerRadius = 4;
  c.fills = [{ type: "SOLID", color }];
  const t = await texto(valor, 11);
  t.lineHeight = { unit: "PIXELS", value: 16 };
  t.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
  c.appendChild(t);
  artwork.appendChild(c);
  return c;
}
```

por:

```ts
// Cota simple: pill claro con el valor en color oscuro. El caller la posiciona.
async function cota(valor: string, par: ParCota, artwork: FrameNode): Promise<FrameNode> {
  const c = figma.createFrame();
  c.name = "cota";
  c.layoutMode = "HORIZONTAL";
  c.primaryAxisSizingMode = "AUTO";
  c.counterAxisSizingMode = "AUTO";
  c.counterAxisAlignItems = "CENTER";
  c.paddingTop = c.paddingBottom = 1;
  c.paddingLeft = c.paddingRight = 4;
  c.cornerRadius = 4;
  c.fills = [{ type: "SOLID", color: par.bg }];
  const t = await texto(valor, 11);
  t.lineHeight = { unit: "PIXELS", value: 16 };
  t.fills = [{ type: "SOLID", color: par.texto }];
  c.appendChild(t);
  artwork.appendChild(c);
  return c;
}
```

- [ ] **Step 3: Reescribir `cotaConNombre` para usar `ParCota`**

Reemplazá la función `cotaConNombre` completa:

```ts
// Cota de dos partes: pill exterior con sub-pill `value` (nombre de variable) +
// el valor numérico, ambos en blanco. Estilo cota.pdf.
async function cotaConNombre(nombre: string, valor: string, color: RGB, artwork: FrameNode): Promise<FrameNode> {
  const c = figma.createFrame();
  c.name = "cota";
  c.layoutMode = "HORIZONTAL";
  c.primaryAxisSizingMode = "AUTO";
  c.counterAxisSizingMode = "AUTO";
  c.counterAxisAlignItems = "CENTER";
  c.itemSpacing = 4;
  c.paddingTop = c.paddingBottom = 2;
  c.paddingLeft = 2;
  c.paddingRight = 4;
  c.cornerRadius = 4;
  c.fills = [{ type: "SOLID", color }];
  const sub = figma.createFrame();
  sub.name = "value";
  sub.layoutMode = "HORIZONTAL";
  sub.primaryAxisSizingMode = "AUTO";
  sub.counterAxisSizingMode = "AUTO";
  sub.paddingTop = sub.paddingBottom = 0;
  sub.paddingLeft = sub.paddingRight = 2;
  sub.cornerRadius = 2;
  sub.fills = [{ type: "SOLID", color: aclarar(color, 0.35) }];
  const tn = await texto(nombre, 11);
  tn.lineHeight = { unit: "PIXELS", value: 16 };
  tn.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
  sub.appendChild(tn);
  c.appendChild(sub);
  const tv = await texto(valor, 11);
  tv.lineHeight = { unit: "PIXELS", value: 16 };
  tv.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
  c.appendChild(tv);
  artwork.appendChild(c);
  return c;
}
```

por (exterior claro; sub-pill = color oscuro con texto blanco; valor en color oscuro):

```ts
// Cota de dos partes: pill claro con sub-pill oscura `value` (nombre de variable, texto
// blanco) + el valor numérico en color oscuro. Estilo cota.pdf.
async function cotaConNombre(nombre: string, valor: string, par: ParCota, artwork: FrameNode): Promise<FrameNode> {
  const c = figma.createFrame();
  c.name = "cota";
  c.layoutMode = "HORIZONTAL";
  c.primaryAxisSizingMode = "AUTO";
  c.counterAxisSizingMode = "AUTO";
  c.counterAxisAlignItems = "CENTER";
  c.itemSpacing = 4;
  c.paddingTop = c.paddingBottom = 2;
  c.paddingLeft = 2;
  c.paddingRight = 4;
  c.cornerRadius = 4;
  c.fills = [{ type: "SOLID", color: par.bg }];
  const sub = figma.createFrame();
  sub.name = "value";
  sub.layoutMode = "HORIZONTAL";
  sub.primaryAxisSizingMode = "AUTO";
  sub.counterAxisSizingMode = "AUTO";
  sub.paddingTop = sub.paddingBottom = 0;
  sub.paddingLeft = sub.paddingRight = 2;
  sub.cornerRadius = 2;
  sub.fills = [{ type: "SOLID", color: par.texto }];
  const tn = await texto(nombre, 11);
  tn.lineHeight = { unit: "PIXELS", value: 16 };
  tn.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
  sub.appendChild(tn);
  c.appendChild(sub);
  const tv = await texto(valor, 11);
  tv.lineHeight = { unit: "PIXELS", value: 16 };
  tv.fills = [{ type: "SOLID", color: par.texto }];
  c.appendChild(tv);
  artwork.appendChild(c);
  return c;
}
```

(Tras este cambio, la función `aclarar` queda sin uso —su única referencia era el sub-pill—.
Borrá su definición completa para no dejar dead-code:

```ts
function aclarar(c: RGB, t: number): RGB {
  return { r: c.r + (1 - c.r) * t, g: c.g + (1 - c.g) * t, b: c.b + (1 - c.b) * t };
}
```

junto con su comentario inmediatamente anterior, si lo tiene.)

- [ ] **Step 4: Cambiar la firma de `chipSpacing`**

Reemplazá:

```ts
async function chipSpacing(val: number, color: RGB, artwork: FrameNode, varName?: string): Promise<FrameNode> {
  const t = etiquetaSpacing(val, unidadActual());
  return varName ? await cotaConNombre(nombreCorto(varName), t, color, artwork) : await cota(t, color, artwork);
}
```

por:

```ts
async function chipSpacing(val: number, par: ParCota, artwork: FrameNode, varName?: string): Promise<FrameNode> {
  const t = etiquetaSpacing(val, unidadActual());
  return varName ? await cotaConNombre(nombreCorto(varName), t, par, artwork) : await cota(t, par, artwork);
}
```

- [ ] **Step 5: Actualizar los call sites a las constantes `COTA_*`**

En `dibujarSpacingCallouts` (líneas ~168-176), reemplazá `CHIP_PADDING` por `COTA_PADDING`
y `CHIP_GAP` por `COTA_GAP`. El bloque queda:

```ts
  if (p.top > 0) vertical(p.top, clon.y, LINEA_PADDING, await chipSpacing(p.top, COTA_PADDING, artwork, sv.paddingTop));
  if (p.bottom > 0) vertical(p.bottom, clon.y + clon.height - p.bottom, LINEA_PADDING, await chipSpacing(p.bottom, COTA_PADDING, artwork, sv.paddingBottom));
  if (p.left > 0) horizontal(p.left, clon.x, LINEA_PADDING, await chipSpacing(p.left, COTA_PADDING, artwork, sv.paddingLeft));
  if (p.right > 0) horizontal(p.right, clon.x + clon.width - p.right, LINEA_PADDING, await chipSpacing(p.right, COTA_PADDING, artwork, sv.paddingRight));
  for (const g of gaps) {
    const val = spec.direccion === "VERTICAL" ? g.height : g.width;
    const chip = spec.spacingAuto ? await cota("Auto", COTA_GAP, artwork) : await chipSpacing(val, COTA_GAP, artwork, sv.itemSpacing);
    if (spec.direccion === "VERTICAL") vertical(g.height, g.y, LINEA_GAP, chip);
    else horizontal(g.width, g.x, LINEA_GAP, chip);
  }
```

En `dibujarMarcas` (línea ~189), reemplazá:

```ts
    const color = m.tipo === "padding" ? CHIP_PADDING : CHIP_GAP;
    const c = m.nombre ? await cotaConNombre(m.nombre, m.valor, color, artwork) : await cota(m.valor, color, artwork);
```

por:

```ts
    const par = m.tipo === "padding" ? COTA_PADDING : COTA_GAP;
    const c = m.nombre ? await cotaConNombre(m.nombre, m.valor, par, artwork) : await cota(m.valor, par, artwork);
```

En las cotas de dimensión (medidas de hijos y del elemento), reemplazá las 4 ocurrencias de
`CHIP_DIM` por `COTA_DIM` (líneas ~205, ~206, ~377, ~385). Por ejemplo:

```ts
    top.push({ c: await cota(etiquetaSpacing(h.width, u), COTA_DIM, artwork), centro: ... });
    left.push({ c: await cota(etiquetaSpacing(h.height, u), COTA_DIM, artwork), centro: ... });
```
y
```ts
  const tW = await cota(etiquetaSpacing(spec.width, u), COTA_DIM, artwork);
  ...
  const tH = await cota(etiquetaSpacing(spec.height, u), COTA_DIM, artwork);
```

(No cambies el resto de esas líneas, solo el argumento de color.)

- [ ] **Step 6: Recolorear las líneas de bracket y eliminar las constantes de chip sin uso**

Reemplazá:

```ts
const LINEA_PADDING = "#0D80FF"; // azul, acorde a CHIP_PADDING
const LINEA_GAP = "#E63380";     // rosa, acorde a CHIP_GAP
```

por (acordes a los textos oscuros de las cotas):

```ts
const LINEA_PADDING = "#324049"; // slate, acorde a COTA_PADDING
const LINEA_GAP = "#C71E84";     // magenta, acorde a COTA_GAP
```

Y reemplazá:

```ts
const AZUL_HEX = "#F24026"; // las cotas son de dimensión → rojo (igual que el chip CHIP_DIM)
```

por:

```ts
const AZUL_HEX = "#1E6B3A"; // las cotas de dimensión → verde (acorde a COTA_DIM)
```

Finalmente, eliminá las tres constantes que quedaron sin uso:

```ts
const CHIP_PADDING: RGB = { r: 0.05, g: 0.5, b: 1 };
const CHIP_GAP: RGB = { r: 0.9, g: 0.2, b: 0.5 };
const CHIP_DIM: RGB = { r: 0.95, g: 0.25, b: 0.15 };
```

(Mantené `AZUL`, `VERDE`, `NARANJA`, `ROJO`, `PADDING_BANDA`, `GAP_BANDA`: siguen en uso por
las bandas/overlays.)

- [ ] **Step 7: Build + tests**

Run: `npm run build && npm test`
Expected: build OK (sin referencias a `CHIP_PADDING/CHIP_GAP/CHIP_DIM`); tests sin regresiones.

- [ ] **Step 8: Commit**

```bash
git add src/plugin/generadores/layout.ts
git commit -m "feat: cotas con fondo claro + texto oscuro (paleta de cotas)"
```

---

## Verificación final (manual, por PDF)

Generar Anatomy + Layout y exportar PDF; comparar contra `Specifications-redesign 3.pdf` y
`Specifications-structure.pdf`:
- Header `BLUEPRINT SPECS & HANDOFF` / `<SECCIÓN>` alineado con el título al mismo margen 64.
- Caja gris grande con el elemento centrado (probar con un badge chico).
- `typography:` muestra el nombre del estilo (ej. `Text SM/Medium`) cuando hay estilo.
- Marcadores con la paleta de 8 (1 azul, 2 magenta, 3 violeta…).
- Cotas con fondo claro + texto oscuro.
