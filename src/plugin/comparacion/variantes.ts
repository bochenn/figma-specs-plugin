import type { NodeLike, Attribute, ChangedAttribute, ElementPair, ChangedElement } from "../modelo/tipos.ts";
import { traverse } from "../traversal/recorrer.ts";
import { readAttributes } from "../utils/atributos.ts";

// Indicates whether two prop→value maps are exactly equal.
export function sameProps(a: Record<string, string>, b: Record<string, string>): boolean {
  const clavesA = Object.keys(a);
  const clavesB = Object.keys(b);
  if (clavesA.length !== clavesB.length) return false;
  return clavesA.every((k) => a[k] === b[k]);
}

// Matches default elements with the option's by name; repeated
// names are matched by order of appearance. Those without a counterpart
// are left with a single side.
export function pairUp(a: NodeLike[], b: NodeLike[]): ElementPair[] {
  const pares: ElementPair[] = [];
  const usados = new Set<number>();

  for (const elemA of a) {
    let found = -1;
    for (let i = 0; i < b.length; i++) {
      if (!usados.has(i) && b[i].name === elemA.name) {
        found = i;
        break;
      }
    }
    if (found >= 0) {
      usados.add(found);
      pares.push({ default: elemA, option: b[found] });
    } else {
      pares.push({ default: elemA });
    }
  }

  for (let i = 0; i < b.length; i++) {
    if (!usados.has(i)) pares.push({ option: b[i] });
  }

  return pares;
}

// Returns only the attributes whose value differs between default and option,
// with both values to be able to show the before/after.
export function diffAttributes(attrsDefault: Attribute[], attrsOpcion: Attribute[]): ChangedAttribute[] {
  const claves = new Set<string>();
  for (const a of attrsDefault) claves.add(a.key);
  for (const a of attrsOpcion) claves.add(a.key);

  const changes: ChangedAttribute[] = [];
  for (const key of claves) {
    const aDef = attrsDefault.find((a) => a.key === key);
    const aOpc = attrsOpcion.find((a) => a.key === key);
    if (aDef?.value !== aOpc?.value) {
      const change: ChangedAttribute = { key, defaultValue: aDef?.value, optionValue: aOpc?.value };
      if (aDef?.rawValue) change.rawValueDefault = aDef.rawValue;
      if (aOpc?.rawValue) change.rawValueOption = aOpc.rawValue;
      const swatch = aOpc?.swatchHex ?? aDef?.swatchHex;
      if (swatch) change.swatchHex = swatch;
      // The format is only stored if it's a token (VARIABLE/STYLE): so the generator
      // shows ChipVar only for tokens and plain text for hardcoded values.
      if (aDef && aDef.format !== "HARDCODED") change.formatDefault = aDef.format;
      if (aOpc && aOpc.format !== "HARDCODED") change.formatOption = aOpc.format;
      if (aDef?.prefix) change.prefixDefault = aDef.prefix;
      if (aOpc?.prefix) change.prefixOption = aOpc.prefix;
      changes.push(change);
    }
  }
  return changes;
}

// Compares two variants (default vs option) and returns the elements that change.
export function compareVariant(defaultRaiz: NodeLike, opcionRaiz: NodeLike): ChangedElement[] {
  const changes: ChangedElement[] = [];

  // The variant's root itself can also change (e.g. the component's bg
  // of the component), not just its children.
  const diffRaiz = diffAttributes(readAttributes(defaultRaiz), readAttributes(opcionRaiz));
  if (diffRaiz.length > 0) {
    changes.push({ elementName: defaultRaiz.name, state: "modified", attributes: diffRaiz });
  }

  const pares = pairUp(traverse(defaultRaiz).map((r) => r.node), traverse(opcionRaiz).map((r) => r.node));

  for (const par of pares) {
    if (par.default && par.option) {
      const diff = diffAttributes(readAttributes(par.default), readAttributes(par.option));
      if (diff.length > 0) {
        changes.push({ elementName: par.default.name, state: "modified", attributes: diff });
      }
    } else if (par.default) {
      changes.push({ elementName: par.default.name, state: "removed", attributes: [] });
    } else if (par.option) {
      changes.push({ elementName: par.option.name, state: "added", attributes: [] });
    }
  }

  return changes;
}
