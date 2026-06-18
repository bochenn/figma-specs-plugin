# Padding DesignDoc + fondo artwork + tipografía de cota — Plan

> REQUIRED SUB-SKILL: superpowers:executing-plans. Steps con checkbox.

**Goal:** Fondo de artwork más oscuro, texto de cota 11/16, y padding left/right alineado a las esquinas (estilo DesignDoc), según `docs/superpowers/specs/2026-06-18-padding-designdoc-fondo-cota-design.md`.

**Architecture:** Tres cambios chicos: el valor light de `fondo-artwork` en variables-tema; `lineHeight` en los textos de `cota`/`cotaConNombre`; y el `centro` de los paddings left/right en `dibujarMarcas`.

**Tech Stack:** TypeScript, esbuild. (Render impuro → sin tests nuevos; verificación manual.)

---

### Task 1: Fondo del artwork a #C9C9C9

**Files:** `src/plugin/utils/variables-tema.ts`

- [ ] **Step 1: Cambiar el valor light** — reemplazar la línea de `"fondo-artwork"`:

```typescript
  "fondo-artwork": { light: { r: 0.96, g: 0.96, b: 0.96 }, dark: { r: 0.08, g: 0.09, b: 0.1 } },
```
por:
```typescript
  "fondo-artwork": { light: { r: 0.788, g: 0.788, b: 0.788 }, dark: { r: 0.08, g: 0.09, b: 0.1 } },
```

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: `build OK → dist/code.js + dist/ui.html`.

- [ ] **Step 3: Commit**

```bash
git add src/plugin/utils/variables-tema.ts
git commit -m "feat: fondo del artwork más oscuro (#C9C9C9) para que se lean objetos blancos

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Cota 11/16 + padding left/right a las esquinas

**Files:** `src/plugin/generadores/layout.ts`

- [ ] **Step 1: lineHeight en `cota`** — en la función `cota`, después de:
```typescript
  const t = await texto(valor, 11);
```
agregar:
```typescript
  t.lineHeight = { unit: "PIXELS", value: 16 };
```

- [ ] **Step 2: lineHeight en `cotaConNombre`** — en `cotaConNombre`, después de `const tn = await texto(nombre, 11);` agregar:
```typescript
  tn.lineHeight = { unit: "PIXELS", value: 16 };
```
y después de `const tv = await texto(valor, 11);` agregar:
```typescript
  tv.lineHeight = { unit: "PIXELS", value: 16 };
```

- [ ] **Step 3: Padding left/right alineado a las esquinas** — en `dibujarMarcas`, reemplazar el bloque `else { ... bottom.push(...) }` (el que calcula `centro` con el ternario para left/right) por:

```typescript
    else {
      let centro = m.centro;
      if (m.tipo === "padding" && m.lado === "left") centro = clon.x + c.width / 2;        // borde izq del chip pegado al borde del elemento
      else if (m.tipo === "padding" && m.lado === "right") centro = clon.x + clon.width - c.width / 2; // borde der del chip pegado al borde
      bottom.push({ c, centro });
    }
```

(Así el chip de left-padding queda alineado a la esquina inferior izquierda y el de right-padding a la inferior derecha, dentro del ancho del elemento, en vez de centrado sobre el borde.)

- [ ] **Step 4: Build y suite**

Run: `npm run build && node --test`
Expected: build OK; todos PASS.

- [ ] **Step 5: Commit**

```bash
git add src/plugin/generadores/layout.ts
git commit -m "feat: cota con line-height 16 y padding left/right alineado a las esquinas

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Verificación final

- [ ] **Step 1: Build + suite** — `npm run build && node --test` verde.
- [ ] **Step 2: Manual (usuario, PDF)**:
  - Los objetos con fill blanco/claro (ej. `variable`) y su texto blanco se distinguen sobre el fondo #C9C9C9.
  - El texto de las cotas se ve a 11px con más alto de línea (16px), más legible.
  - El padding left/right queda alineado a las esquinas inferiores del elemento (estilo DesignDoc).
- [ ] **Step 3: Ajustes** — si el fondo queda muy oscuro/claro, mover el valor; si el padding aún no matchea DesignDoc, afinar posiciones.
