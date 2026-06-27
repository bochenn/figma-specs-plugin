# Complete

## What it does
An all-in-one view of the component: combines the anatomy and layout of **all** variants. Serves as a single reference.

## What it shows
Two parts:
- **Complete Anatomy**: per variant, lists the elements that appear in **that** variant but **not** in the default (e.g. a `Categories` frame, `Badge` instances…). If there are no extras, it says so.
- **Complete Layout**: the same for layout differences (Auto Layout layers that other variants add). If there are none, it says so.

## Options that affect it
- **Columns**.

## Pending
Each card's header still uses the `Type=…, Orientation=…` string (old format) and doesn't consolidate repeats — unlike Properties/Two-Way. Left to unify.

## Key files
- `extraccion/properties.ts` (`extraerCompleteAnatomy`, `extraerCompleteLayout`)
- `generadores/complete.ts`
