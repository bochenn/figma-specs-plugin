# Data (JSON)

## What it does
Represents the element as structured data (JSON) to understand its hierarchy and connect it to code.

## What it shows
A code block with the JSON of the element's anatomy (each element with `name`, `type`, `attributes` [`key`, `value`, `format`] and `instanceOf` if it's an instance), serialized with `JSON.stringify(..., 2)`.

The code is:
- In a **mono font**.
- With **syntax highlighting** (via `setRangeFills`): keys in pink `#EA10AC`, strings in green `#1FA855`, numbers/`true`/`false`/`null` in blue `#0D80FF`, punctuation in gray `#6B7280`.
- Inside a **block with a background** (light gray `#F3F4F6`), rounded, with padding (readable with the colors).

## Key files
- `serializacion/anatomy-json.ts` (model → JSON)
- `generadores/data.ts` (tokenizer + colored render)
