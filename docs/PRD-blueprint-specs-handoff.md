# Product Requirements Document
## Blueprint — Specs & Handoff (Figma Plugin)

**Version:** 1.0
**Status:** Active development, MIT-licensed, open source
**Author:** Leandro Henflen ([crafter.studio](https://crafter.studio) · [@bochenn](https://x.com/bochenn))
**Purpose of this document:** Single source of truth for product positioning, feature scope, and messaging — to be used for the Figma Community listing, the product landing page, and the marketing microsite.

---

## 1. Executive Summary

**Blueprint** is a Figma plugin that turns any selected component or frame into a complete, professional design-spec document — automatically, in seconds, without leaving the canvas.

Instead of a designer manually screenshotting, measuring, and annotating a component for developers, Blueprint inspects the selection and generates ready-to-read spec pages: layer anatomy, variant properties, layout & spacing, a styling inventory, light/dark mode comparisons, structured JSON, and a combined "everything at once" view.

The output isn't a PDF or an external tool — it's native Figma frames, placed right next to the original component, using the same Auto Layout, colors, and variables as the file itself. It looks like documentation a senior design-systems engineer would have built by hand, minus the hours.

**One-line pitch:** *Select a component. Get its spec. Right there on the canvas.*

---

## 2. Problem Statement

Design handoff is one of the most repetitive, error-prone steps in the design-to-development pipeline:

- **Designers** spend hours manually documenting components — measuring paddings, listing color tokens, screenshotting every variant — work that has zero creative value and is redone every time a component changes.
- **Design systems teams** need consistent, up-to-date documentation for every component in the library, but manual docs drift out of sync the moment a component is updated.
- **Developers** receive incomplete handoffs: missing token names, unclear spacing, no visibility into what changes between variants, no idea which color is hardcoded vs. bound to a variable.
- **Existing tools** (Figma's own Inspect panel, third-party redline plugins) show raw values one layer at a time — they don't produce a shareable, structured *document*, and they don't understand variant properties, modes, or component anatomy as a whole.

The result: handoff friction, back-and-forth Slack threads ("what's the spacing here?", "is this a token or hardcoded?"), and documentation that nobody keeps updated because writing it is tedious.

---

## 3. Target Audience

| Persona | Who they are | What they need from Blueprint |
|---|---|---|
| **Product designer** | Designs UI in Figma, hands off to engineering | A one-click way to generate a clear spec without leaving the design file or learning a new tool |
| **Design systems designer/engineer** | Owns and documents a component library | Consistent, always-accurate documentation for every component, including variants, modes, and tokens |
| **Front-end / product engineer** | Implements UI from Figma designs | Exact values (spacing, color, typography), token names, and a clear view of what changes between variants — without pinging the designer |
| **Freelancer / agency** | Delivers design work to external clients or dev teams | A polished, professional-looking handoff artifact that reflects well on their delivery, with zero extra effort |

---

## 4. Value Proposition

- **Zero manual work.** Select a component → click Create Spec → get a complete documentation page, generated as native Figma frames.
- **Always accurate.** Because it's generated from the live component, the spec can never drift from the design the way hand-written docs do.
- **Token-aware.** Every color, spacing value, and typography style is checked against the file's variables and styles — spec pages show the *token name*, not just a raw hex code, closing the #1 communication gap between design and code.
- **Variant-aware.** Understands component sets: it documents every property, every value, and — uniquely — shows exactly *what changes* between a variant and the default (Two-Way comparison), which no built-in Figma feature does.
- **Fits into the existing file.** No exported PDFs, no external app, no context switching. The spec lives in the same Figma file, using the file's own Auto Layout and design system, so it's is easy to share via a normal Figma link.
- **Flexible output.** Eight independent sections can be combined per use case: a quick JSON dump for a developer, a full styling inventory for a design-system audit, or the "Complete" view for full documentation.
- **Free and open source.** MIT-licensed, no account, no paywall, no telemetry — install and use immediately.

---

## 5. Product Overview

Blueprint runs as a Figma plugin panel. The workflow is always the same three steps:

1. **Select** a frame, component, or component set on the canvas.
2. **Choose** which spec sections to generate (and tune their options) from the plugin panel.
3. **Create Spec** — Blueprint places the generated documentation as new frames next to the selection, ready to view, share, or hand off.

### 5.1 The eight spec sections

| Section | What it delivers |
|---|---|
| **Anatomy** | Every layer of the component, numbered on a cloned artwork with callout badges, paired with a card per layer listing its type, color (with token name if bound to a variable/style), dimensions (with Hug/Fixed/Fill indicator), and full typography detail for text layers. |
| **Properties** | For a component set: one card per value of every variant property, each showing the variant's live preview and its complete property table — plus dedicated handling for boolean properties, with affected layers highlighted. |
| **Layout & Spacing** | A row per layer showing direction, alignment, resizing, padding, item spacing, corner radius and grid — visualized directly on the artwork with dimension lines and color overlays, plus an optional legend explaining the visual conventions. |
| **Styling Inventory** | A catalog of every color, typography style, and variable the component uses (or, optionally, the entire document), each with a live swatch or text preview, its resolved value, and where in the component it's applied. |
| **Modes** | For files using Light/Dark (or any multi-mode) variable collections: a side-by-side comparison of every color variable's value across each mode. |
| **Two-Way** | Crosses the first two variant properties and shows, for every combination, exactly what's added, removed, or changed compared to the default variant — the fastest way to audit "compound" variant behavior. |
| **Data (JSON)** | The component's full anatomy serialized as syntax-highlighted JSON — a direct bridge between the design file and code/documentation tooling. |
| **Complete** | An all-in-one summary combining Anatomy and Layout differences across every variant, for a single reference view of the whole component. |

### 5.2 Formatting controls

Every section respects a shared set of formatting preferences, so the whole output stays consistent with the file's conventions:

- **Color format** — HEX / RGB / HSL
- **Units** — px / rem
- **Typography display** — plain properties or CSS-style
- **Token display** — choose whether to show a token's resolved raw value, and whether to prefer showing the variable or the style when both exist
- **Light / Dark mode** for the generated spec itself
- **Columns** — control card density per section

### 5.3 What makes the output trustworthy

- Colors and typography are resolved against the file's actual variables and styles — not guessed.
- Variant previews use real Figma instances (`createInstance()`), not static copies, so they always reflect the true component.
- The underlying extraction logic (data layer) is covered by ~220 automated unit tests, independent of Figma's runtime — the same logic that decides "what's a token," "what changed between variants," and "where does a dimension line go" is verified continuously.

---

## 6. Differentiation

| | Figma's built-in Inspect panel | Generic "redline"/measurement plugins | **Blueprint** |
|---|---|---|---|
| Understands variant properties as a set | ❌ | ❌ | ✅ |
| Shows *diff* between variants | ❌ | ❌ | ✅ (Two-Way) |
| Resolves values to token/variable names | Partial | Rarely | ✅ |
| Produces a shareable, structured document | ❌ (per-layer only) | Sometimes (image/PDF export) | ✅ (native Figma frames) |
| Light/Dark mode value comparison | ❌ | ❌ | ✅ |
| Structured JSON export of anatomy | ❌ | Rarely | ✅ |
| Output lives inside the file, in the file's own style | N/A | ❌ (usually external) | ✅ |
| Price | Free (built-in) | Often paid | Free & open source (MIT) |

**Key differentiator to lead with in marketing:** Blueprint is the only tool that treats component *variants* as first-class citizens — showing not just what a component looks like, but exactly what changes between its states. That's the single hardest thing to communicate in a manual handoff, and the single easiest thing to get wrong.

---

## 7. Technical Notes (for credibility, not for the landing page hero)

- Built with **TypeScript + esbuild**, no UI framework — a lean, fast, dependency-light plugin.
- Clean separation between **pure extraction logic** (Figma nodes → plain data, framework-independent, unit-testable) and **generation logic** (data → Auto Layout frames, the only part that touches the Figma API). This split is what enables a large automated test suite without mocking Figma.
- Plugin panel: fixed-height iframe with tabs for Specs / Options / Format / About, communicating with the sandboxed plugin code over `postMessage` (Figma's required architecture for plugin UIs).
- No external servers, no data collection, no account required — everything runs locally inside Figma.

---

## 8. Licensing & Distribution

- **License:** MIT — free to use, modify, and redistribute (including commercially), with attribution to the copyright holder. Bundled third-party icon assets (Figma's UI3 kit) are excluded from the MIT grant and remain under the Figma Community terms.
- **Distribution:** Figma Community (primary), with the source available on GitHub.
- **Monetization:** Free, with an optional "Buy Me a Coffee" donation link inside the plugin's About tab and in the README.
- **Support channels:** GitHub issues/feature requests, X (@bochenn), LinkedIn (bochenn), crafter.studio.

---

## 9. Goals & Success Metrics

| Goal | Metric |
|---|---|
| Drive adoption via Figma Community | Installs, weekly active use, Community page favorites/rating |
| Reduce handoff friction for design-systems teams | Qualitative feedback (issues, DMs, reviews) referencing time saved |
| Build credibility as an open-source, professional-grade tool | GitHub stars, external mentions, community contributions/issues |
| Convert plugin users into crafter.studio audience | Click-through from the About tab / README to crafter.studio and socials |

*(No in-product analytics/telemetry are collected — success is measured via Figma Community's public stats and community engagement, consistent with the "free and open source" positioning.)*

---

## 10. Marketing & Landing Page / Microsite Brief

This section is written to be lifted directly into landing page copy, ad copy, or the Figma Community listing.

### 10.1 Naming & tagline options

- **Product name:** Blueprint — Specs & Handoff
- **Tagline (short):** *Design specs, generated on the spot.*
- **Tagline (alt):** *Select a component. Get its spec.*
- **Tagline (alt, benefit-led):** *Handoff documentation that writes itself.*

### 10.2 Hero section copy

> **Headline:** Turn any Figma component into a complete design spec — instantly.
> **Subheadline:** Blueprint documents anatomy, variant properties, layout, tokens, and light/dark modes automatically, right on your canvas. No exports, no manual measuring, no drift between design and docs.
> **Primary CTA:** Get Blueprint on Figma Community
> **Secondary CTA:** View on GitHub (open source, MIT)

### 10.3 Problem/solution section

> **Before Blueprint:** Screenshots, manual measurements, guessing which colors are tokens, Slack threads asking "what changed in this variant?"
> **With Blueprint:** Select the component. Choose your sections. Click Create Spec. Done.

### 10.4 Feature grid copy (landing page cards — 8 sections)

Use the table in **§5.1** as the source of truth; landing page card copy should compress each row to a title + one benefit-oriented sentence, e.g.:

- **Anatomy** — See every layer, labeled and measured, with token names — not just hex codes.
- **Properties** — Every variant, every value, documented with its full property table automatically.
- **Layout & Spacing** — Padding, gaps, and alignment visualized directly on the design, with variable bindings called out.
- **Styling Inventory** — A living catalog of every color, type style, and variable — and where each one is used.
- **Modes** — Compare Light/Dark (or any theme) token values side by side, instantly.
- **Two-Way** — The only view that shows exactly what changes between two variant properties combined.
- **Data (JSON)** — Export the component's structure as clean, syntax-highlighted JSON for dev tooling.
- **Complete** — One page, every variant's differences, the whole component at a glance.

### 10.5 "Why Blueprint" / differentiator section

Lead with the Two-Way / variant-diff differentiator (see §6) — it's the feature no competing plugin or Figma-native tool offers. Suggested framing:

> **"The only spec that shows you what changed."**
> Figma shows you what a component looks like. Blueprint shows you what's different between its variants — added layers, removed layers, changed values — the exact information developers actually ask for.

### 10.6 Trust / credibility section

> Open source, MIT-licensed, ~220 automated tests on the core logic, no telemetry, no account required. Built by a working design-systems practitioner, not a growth team.

### 10.7 Social proof placeholders

*(To be filled in as they become available — leave structured slots on the page)*

- [ ] Figma Community rating/install count badge
- [ ] Quote from a design-systems lead or agency using it in production
- [ ] Before/after screenshot: manual redline vs. Blueprint-generated spec
- [ ] Short demo GIF/video: select → generate → result, under 15 seconds

### 10.8 FAQ section (landing page copy)

- **Is it free?** Yes — Blueprint is free and open source under the MIT license. A donation link is available if it saves you time.
- **Does it work with my Figma plan?** It's a standard Figma plugin — works wherever Figma plugins run. (Confirm Figma Desktop is required for *development*, not for using the published plugin.)
- **Does it send my design data anywhere?** No — everything runs locally inside Figma; no external servers or accounts.
- **Does it support Dark mode components?** Yes — the Modes section compares variable values across any multi-mode collection (e.g. Light/Dark), and the generated spec itself can be output in Light or Dark.
- **Can I use it for design systems, not just single components?** Yes — Styling Inventory can catalog either a single selection or the entire document's local styles and variables.
- **Is the output editable?** Yes — the spec is generated as normal, editable Figma frames using Auto Layout, not a static export.

### 10.9 Call-to-action bank

- "Stop screenshotting your components. Start generating specs."
- "Your next handoff, done in one click."
- "Documentation that never goes stale — because it's generated from the real component."

---

## 11. Assets & Branding

- **Icon:** `resources/xBlueprint-icon.png` (used at 128px in README hero, 32px in the plugin's About tab).
- **Primary link:** [crafter.studio](https://crafter.studio)
- **Social:** X [@bochenn](https://x.com/bochenn), LinkedIn [bochenn](https://linkedin.com/in/bochenn)
- **Support:** [buymeacoffee.com/bochenn](https://buymeacoffee.com/bochenn)
- **Repository:** MIT-licensed source, `specs/` folder contains living per-feature documentation suitable as a source for detailed feature pages or a docs subsite.

---

## 12. Open Questions / Not Yet Defined

*(Flagging honestly rather than inventing answers — resolve before finalizing marketing assets)*

- No confirmed install/rating numbers yet for social proof — placeholders included in §10.7.
- No demo video/GIF exists yet — recommended as the highest-leverage landing page asset to produce next.
- Pricing is currently free/donation-based; no paid tier is defined — if a future Pro tier is planned, this PRD would need a pricing section.
- No testimonials collected yet.

---

*End of document.*
