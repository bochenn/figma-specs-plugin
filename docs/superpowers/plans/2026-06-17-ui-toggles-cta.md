# UI con toggles de sección + CTA (multi-sección apilada) — Plan

> REQUIRED SUB-SKILL: superpowers:executing-plans. Steps con checkbox.

**Goal:** Checkboxes de sección + un CTA que genera las secciones tildadas apiladas en un solo `Specifications`, según `docs/superpowers/specs/2026-06-17-ui-toggles-cta-design.md`.

**Architecture:** Cada `generarX` se separa en `seccionDe<X>(...): Promise<FrameNode>` (solo la sección, sin `Specifications` ni título de nodo) + el wrapper `generarX` (lo arma como hoy, para compat). `main` arma UN `Specifications` con el título del nodo y apila las `seccionDe<X>` elegidas. La UI pasa de 8 botones a 8 checkboxes + un CTA; el mensaje lleva `secciones: Seccion[]`.

**Tech Stack:** TypeScript sin dependencias, `node --test`, esbuild. (Generadores impuros → verificación manual; sin tests nuevos.)

---

### Task 1: Extraer `seccionDe<X>` en cada generador (wrappers intactos)

Patrón por generador: el cuerpo que crea `const specifications = frameVertical("Specifications", 128, 64)`, el `spec = frameVertical(\`${nombre} Spec\`, 48)`, `spec.appendChild(await texto(nombre, 64))` y `figma.currentPage.appendChild(specifications)` se mueve a un wrapper; la **sección** (el `frameVertical("<Título>", 64)` con su contenido) se extrae a `seccionDe<X>` que la devuelve.

**Files:** `src/plugin/generadores/anatomy.ts`, `properties.ts`, `layout.ts`, `data.ts`, `styling.ts`, `modes.ts`, `complete.ts`.

- [ ] **Step 1: anatomy.ts** — `generarAnatomy`/`generarAnatomyConNested` ya usan `specDeAnatomy`.
Exportar una `seccionDeAnatomy(seleccionado, elementos, tabla): Promise<FrameNode>` que devuelve solo
la **sección Anatomy** (el `frameVertical("Anatomy", 64)` con su lista/tabla + artwork) — extraída de
`specDeAnatomy` (que hoy arma `spec` con título + sección; separar el `seccion` y devolverlo).
`generarAnatomy` y `generarAnatomyConNested` se reescriben para usar `seccionDeAnatomy` dentro de su
`spec`. Para nested, `seccionDeAnatomy` se llama por cada subcomponente y se apilan (como hoy).

- [ ] **Step 2: properties.ts** — exportar `seccionDeProperties(componentSet, propiedades, defaultProps, columnas)`
(la sección "Properties" desde `specDeProperties`, sin el `spec`/título) y
`seccionDeDosWay(componentSet, dosway, defaultProps, columnas)` (la sección "Two-Way"). Los wrappers
`generarProperties`/`generarPropertiesConNested`/`generarDosWay` quedan armando su `Specifications`.

- [ ] **Step 3: layout.ts** — exportar `seccionDeLayout(seleccionado, specs, columnas, hideOuter, itemizar, medirHijos)`
que devuelve el `frameVertical("Layout and Spacing", 64)` con su contenido (lo que hoy arma
`generarLayout` dentro de `seccion`). `generarLayout` queda como wrapper.

- [ ] **Step 4: data.ts / styling.ts / modes.ts** — exportar `seccionDeData(nombre, json)`,
`seccionDeStyling(nombre, filas)`, `seccionDeModes(seleccionado, colecciones, columnas)`: cada una
devuelve su sección (`frameVertical("<Título>", 64)` con su contenido). Los `generarX` quedan como
wrappers.

- [ ] **Step 5: complete.ts** — `generarComplete` arma dos secciones (Complete Anatomy + Complete
Layout) dentro de `spec`. Exportar `seccionDeComplete(nombre, anatomy, layout, columnas): Promise<FrameNode[]>`
que devuelve **ambas** secciones como array (para apilarlas). `generarComplete` queda como wrapper
que las mete en su `Specifications`.

- [ ] **Step 6: Build y suite**

Run: `npm run build && node --test`
Expected: build OK, todos PASS (refactor sin cambio de comportamiento; los wrappers producen lo mismo).

- [ ] **Step 7: Commit**

```bash
git add src/plugin/generadores/*.ts
git commit -m "refactor: seccionDe<X> reutilizable en cada generador (UI multi-sección)"
```

---

### Task 2: Mensaje y main multi-sección

**Files:** `src/plugin/modelo/tipos.ts`, `src/plugin/main.ts`.

- [ ] **Step 1: Mensaje** — en `modelo/tipos.ts`, `MensajeUI`: cambiar `seccion: Seccion` por
`secciones: Seccion[]`.

- [ ] **Step 2: main — armar un Specifications y apilar** — reemplazar los `generarSeccionX`
(que hoy crean su propio Specifications + finalizar) y el dispatch por:
  - Una función `seccionPara(nodo, seccion, opts)` que devuelve `Promise<FrameNode | FrameNode[] | null>`:
    valida (tipo de nodo / component set según la sección) y, si aplica, devuelve la(s) `seccionDe<X>`;
    si no aplica, devuelve un `frameVertical` con un `texto` de aviso (ej. "Properties necesita un
    componente con variantes.") — nunca aborta las demás.
  - En `onmessage`: tras aplicar opciones y `asegurarVariablesTema`, crear
    `const specifications = frameVertical("Specifications", 128, 64); const spec = frameVertical(\`${nodo.name} Spec\`, 48); specifications.appendChild(spec); spec.appendChild(await texto(nodo.name, 64));`
    Luego, para cada sección de `msg.secciones` en el orden fijo
    `["anatomy","properties","layout","data","styling","modes","twoway","complete"]`, llamar
    `seccionPara(...)` y `spec.appendChild` (o appendear cada elemento si devuelve array).
    Finalmente `figma.currentPage.appendChild(specifications)` + `finalizar(specifications, nodo)`.
  - Si `msg.secciones` está vacío → `responder({ ok:false, error:"Elegí al menos una sección." })`.

- [ ] **Step 3: Build y suite**

Run: `npm run build && node --test`
Expected: build OK, todos PASS.

- [ ] **Step 4: Commit**

```bash
git add src/plugin/modelo/tipos.ts src/plugin/main.ts
git commit -m "feat: main genera múltiples secciones apiladas en un Specifications"
```

---

### Task 3: UI — checkboxes de sección + CTA

**Files:** `src/ui/index.html`, `src/ui/ui.ts`.

- [ ] **Step 1: index.html** — reemplazar la sección de los 8 `<button>` por un grupo "Specs" con 8
checkboxes (ids `sec-anatomy`, `sec-properties`, `sec-layout`, `sec-data`, `sec-styling`,
`sec-modes`, `sec-twoway`, `sec-complete`; `sec-anatomy` con `checked`) y un CTA
`<button id="crear" class="cta">Create spec</button>` (estilo primario, ancho completo: fondo
`var(--brand)`, texto `var(--on-brand)`, padding 10, radius 6). Los grupos Opciones/Formato quedan.

- [ ] **Step 2: ui.ts** — quitar los 8 `onclick` por botón y `generar(seccion)`. Agregar:
```typescript
const SECCIONES = ["anatomy","properties","layout","data","styling","modes","twoway","complete"] as const;
(document.getElementById("crear") as HTMLButtonElement).onclick = () => {
  const secciones = SECCIONES.filter((s) => (document.getElementById(`sec-${s}`) as HTMLInputElement).checked);
  parent.postMessage({ pluginMessage: { tipo: "generar", secciones, nested: nestedCheck.checked, dark: darkCheck.checked, tabla: tablaCheck.checked, hideOuter: hideOuterCheck.checked, itemizar: itemizarCheck.checked, medirHijos: medirHijosCheck.checked, columnas: parseInt(columnasSelect.value, 10), formatoColor: formatoColorSelect.value, unidad: unidadSelect.value, formatoTipo: formatoTipoSelect.value, formatoRaw: formatoRawSelect.value, mostrarRaw: mostrarRawCheck.checked, preferencia: preferenciaSelect.value } }, "*");
};
```
(El `window.onmessage` de estado queda igual.)

- [ ] **Step 3: Build y suite**

Run: `npm run build && node --test`
Expected: build OK, todos PASS.

- [ ] **Step 4: Commit**

```bash
git add src/ui/index.html src/ui/ui.ts
git commit -m "feat: UI con checkboxes de sección + CTA Create spec"
```

---

### Task 4: Verificación final

- [ ] **Step 1: Build + suite** — verde.
- [ ] **Step 2: Manual (usuario)** — tildar Anatomy + Layout + Styling y Create spec → un solo
`Specifications` con las tres secciones apiladas bajo el título del nodo. Tildar Properties sobre un
frame suelto → aviso en esa sección, las demás generan. Las opciones (Dark, Units, Itemize, etc.)
siguen aplicando. Sin secciones tildadas → mensaje de error.
- [ ] **Step 3: Ajustes** — espaciado entre secciones / estilo del CTA si hace falta.
