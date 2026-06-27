import type { NormSet, PropertySpec, OptionSpec, NormVariant, TwoWaySpec, CombinationSpec, ExtraElement, LayoutVariant, NodeLike } from "../modelo/tipos.ts";
import { sameProps, compareVariant } from "../comparacion/variantes.ts";
import { extractAnatomy } from "./anatomy.ts";
import { layoutSpecOf, layoutKey } from "./layout.ts";

// Finds in the set the variant whose props map matches the target exactly.
function findVariant(set: NormSet, target: Record<string, string>): NormVariant | undefined {
  return set.variants.find((v) => sameProps(v.variantProperties, target));
}

// Produces the PropertySpec[]: for each property, compares the default against
// each alternative option (skipping the default value).
export function extractProperties(set: NormSet): PropertySpec[] {
  const varianteDefault = findVariant(set, set.defaultProps);
  if (!varianteDefault) return [];

  const specs: PropertySpec[] = [];

  for (const propName of Object.keys(set.properties)) {
    const defaultValue = set.defaultProps[propName];
    const options: OptionSpec[] = [];

    for (const option of set.properties[propName]) {
      if (option === defaultValue) continue;
      const target = { ...set.defaultProps, [propName]: option };
      // First the "default with only this prop changed" variant; if it doesn't exist
      // (sparse matrix), any with that value, to show each version.
      const varianteOpcion = findVariant(set, target)
        ?? set.variants.find((v) => v.variantProperties[propName] === option);
      if (!varianteOpcion) continue;
      const changes = compareVariant(varianteDefault.root, varianteOpcion.root);
      options.push({ name: option, changes });
    }

    specs.push({ name: propName, type: "VARIANT", default: defaultValue, options });
  }

  return specs;
}

// Compares all combinations of the first two variant properties
// against the default. Returns null if there are fewer than two properties.
export function extractTwoWay(set: NormSet): TwoWaySpec | null {
  const props = Object.keys(set.properties);
  if (props.length < 2) return null;

  const p1 = props[0];
  const p2 = props[1];
  const varianteDefault = findVariant(set, set.defaultProps);
  if (!varianteDefault) return null;

  const combinations: CombinationSpec[] = [];
  for (const v1 of set.properties[p1]) {
    for (const v2 of set.properties[p2]) {
      const target = { ...set.defaultProps, [p1]: v1, [p2]: v2 };
      const variant = findVariant(set, target);
      if (!variant) continue;
      const changes = compareVariant(varianteDefault.root, variant.root);
      combinations.push({ value1: v1, value2: v2, changes });
    }
  }
  return { prop1: p1, prop2: p2, combinations };
}

// Readable label of a variant from its props ("k=v, k2=v2").
function variantLabel(props: Record<string, string>): string {
  return Object.entries(props).map(([k, v]) => `${k}=${v}`).join(", ");
}

// Lists the elements each variant has and the default doesn't (key type|name).
export function extractCompleteAnatomy(set: NormSet): ExtraElement[] {
  const varianteDefault = findVariant(set, set.defaultProps);
  if (!varianteDefault) return [];

  const defaultKeys = new Set(extractAnatomy(varianteDefault.root).map((e) => `${e.type}|${e.name}`));
  const adicionales: ExtraElement[] = [];

  for (const variant of set.variants) {
    if (sameProps(variant.variantProperties, set.defaultProps)) continue;
    const label = variantLabel(variant.variantProperties);
    for (const el of extractAnatomy(variant.root)) {
      if (!defaultKeys.has(`${el.type}|${el.name}`)) {
        adicionales.push({ variant: label, name: el.name, type: el.type });
      }
    }
  }
  return adicionales;
}

// True if the node has Auto Layout (horizontal or vertical).
function tieneAutoLayout(n: NodeLike): boolean {
  return n.layoutMode === "HORIZONTAL" || n.layoutMode === "VERTICAL";
}

// Variants whose root Auto Layout differs from the default.
export function extractCompleteLayout(set: NormSet): LayoutVariant[] {
  const varianteDefault = findVariant(set, set.defaultProps);
  if (!varianteDefault) return [];

  const claveDefault = tieneAutoLayout(varianteDefault.root)
    ? layoutKey(layoutSpecOf(varianteDefault.root))
    : null;

  const adicionales: LayoutVariant[] = [];
  for (const variant of set.variants) {
    if (sameProps(variant.variantProperties, set.defaultProps)) continue;
    if (!tieneAutoLayout(variant.root)) continue;
    const spec = layoutSpecOf(variant.root);
    if (claveDefault === null || layoutKey(spec) !== claveDefault) {
      adicionales.push({ variant: variantLabel(variant.variantProperties), spec });
    }
  }
  return adicionales;
}
