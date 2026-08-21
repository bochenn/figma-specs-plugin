# What's new

## August 21, 2026

### New

- Renamed instances now say where they come from. If a layer is called "encabezado" but
  the component is "page_header", the specs read "encabezado (Instance of: page_header)"
  — in the Layers card, in the element card, in the table and in the section title.
  Instances of a variant report the component set's name, not "Size=M".
- The legend has a second table, "Figma symbols", explaining every icon the specs use:
  layer types, Auto Layout direction and alignment, absolute position, resizing modes,
  border sides, variable modes and hidden fills. It's on by default now, sits right
  under the section title, and shows both tables side by side.
- Create Spec shows a spinner while the spec renders and stays disabled until it's
  done, so a long generation can't be started twice.
- Two options for heavy files (Options → Large files). "Generate sequentially" renders
  one section per run, so Figma settles in between and finished sections survive a
  failure. "Limit to 150 rows per section" stops a huge selection from producing a spec
  Figma can't handle, and the spec says how many layers were left out.

### Changed

- Specs generate about 3× faster and the resulting document is about 3× lighter. On a
  34-layer selection with Anatomy + Layout & Spacing: 58.6s → 20.2s, and 16,834 → 5,677
  nodes. Layout & Spacing was repeating the whole Layers card on every row; it now draws
  it once per section.

### Fixed

- The component icon was the same outline diamond as the instance one, so the two were
  indistinguishable. Components now use Figma's four-diamond symbol. The absolute
  position and grid icons were swapped for the right ones too.

## August 20, 2026

### New

- Variable modes applied to a layer (Figma's "Variable modes" panel) are now documented
  as an attribute row, with the swatch icon — e.g. "Theme: Dark".
- Layer badges, on by default: the numbered badge from the artwork is repeated next to
  its layer in the Layers card, so you can match a marker to its place in the tree at a
  glance. Instances open along the branch that leads to a documented layer, so no badge
  is left without a row.
- The plugin now sizes up your selection when it opens (and whenever you select
  something else). If the sections you picked look slow, it says so before you start —
  "Large selection: 1,240 layers · about 21s".

### Changed

- Specs now cover only the visible layers. Layers with visibility off are left out at
  any depth, including inside component instances.
- Sections are rendered one at a time and land on the canvas as they finish, instead of
  the whole spec appearing at once at the end. Figma stays responsive on large files,
  and the status line reports progress ("Rendering 2/4 — Layout & Spacing").
- Layer icons now tell you what kind of frame you're looking at: Auto Layout frames show
  their direction and alignment, and absolutely positioned frames get their own icon.
  Vector layers use the pen icon instead of the image one.
- The element title of each section now carries its type icon and is bigger (48px). The
  placeholder description under it is gone.

## August 6, 2026

### New

- Anatomy now includes the same Layers card as Layout & Spacing: the full layer tree
  of your selection, with hierarchy guides and a type icon per layer, so readers can
  see where each documented element sits in the structure.

## July 28, 2026

### Fixed

- Plugin failed to run with a "documentAccess: dynamic-page" error. Migrated to
  Figma's async APIs — works everywhere now.

### New

- Hidden fills and strokes are flagged with the closed-eye icon and a "Visibility Off"
  label.
- Borders now show which sides they're applied to (Figma's side icons), stroke weight
  (per side if they differ, px or rem) and a "Dashed" indicator.
