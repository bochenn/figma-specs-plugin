# Properties

## What it does
Documents the variant properties of a component set: for each value of each property it shows the variant's preview + its full property table (Figma's instance-panel style).

## What it shows
- **Title** = the component's name (key for telling the main one apart from nested subcomponents).
- **Default card** at the top: artwork (instance of the default variant) + property table.
- **One subsection per variant property** (Type, Orientation, Breakpoint, Size…):
  - A **card per value** of the property, with: header = the value, **artwork** (instance of the variant with that value, with a minimum 400×156 artwork and ≥64 padding) and the variant's **full property table**: row `Label  ◆ Value` (gray label, ◆ diamond marker, value).
  - If the "default with only that prop changed" variant doesn't exist (sparse matrix), **any** variant with that value is used.
- **Boolean properties**: a subsection with the artwork (default instance) and the affected layers highlighted in blue.

## Notes
- The artwork uses **`createInstance()`** of the variant (an instance), not `clone()` (which would duplicate the master component).
- It does not show the diff of changes; that's only in **Two-Way**, which shares the comparison code.

## Options that affect it
- **Spec nested subcomponents** — adds a Properties section per nested component set (detected across **all** variants, not just the default).
- **Columns** — cards per row.

## Key files
- `generadores/properties.ts` (`seccionDeProperties`, `cardVariante`, boolean)
- `extraccion/properties.ts` (extraction, value fallback)
- `main.ts` (`setsAnidados` walks every variant)
