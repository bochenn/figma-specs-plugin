import type { ColorFormat, Preference } from "../modelo/tipos.ts";

// Custom Value Formats options: format of the resolved value of
// variables/styles, whether it's shown, and which wins if there's both a variable and a style.

let rawFormat: ColorFormat = "HEX";
let showRaw = true;
let preference: Preference = "VARIABLE";

export function applyRawFormat(f: ColorFormat): void {
  rawFormat = f;
}

export function currentRawFormat(): ColorFormat {
  return rawFormat;
}

export function applyShowRaw(b: boolean): void {
  showRaw = b;
}

export function currentShowRaw(): boolean {
  return showRaw;
}

export function applyPreference(p: Preference): void {
  preference = p;
}

export function currentPreference(): Preference {
  return preference;
}
