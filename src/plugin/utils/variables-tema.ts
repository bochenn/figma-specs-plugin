// Local "Specs" collection with Light/Dark modes and the theme variables.
// Todo idempotente: regenerar no duplica collections, modes ni variables.

export interface ThemeVars {
  collection: VariableCollection;
  lightMode: string;   // modeId
  darkMode: string;
  text: Variable;
  bgSpec: Variable;
  bgArtwork: Variable;
}

const COLORS: Record<string, { light: RGB; dark: RGB }> = {
  "text": { light: { r: 0, g: 0, b: 0 }, dark: { r: 0.95, g: 0.95, b: 0.95 } },
  "bg-spec": { light: { r: 1, g: 1, b: 1 }, dark: { r: 0.12, g: 0.12, b: 0.14 } },
  "bg-artwork": { light: { r: 0.922, g: 0.922, b: 0.922 }, dark: { r: 0.08, g: 0.09, b: 0.1 } },
};

let current: ThemeVars | null = null;

export async function ensureThemeVariables(): Promise<ThemeVars> {
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const collection = collections.find((c) => c.name === "Specs")
    ?? figma.variables.createVariableCollection("Specs");

  let lightMode = collection.modes.find((m) => m.name === "Light")?.modeId;
  if (!lightMode) {
    lightMode = collection.modes[0].modeId;
    collection.renameMode(lightMode, "Light");
  }
  let darkMode = collection.modes.find((m) => m.name === "Dark")?.modeId;
  if (!darkMode) {
    // Some Figma plans limit to 1 mode per collection: if the Dark mode
    // can't be created, it degrades using the same mode (Dark mode doesn't apply, but
    // the plugin generates anyway instead of aborting).
    try {
      darkMode = collection.addMode("Dark");
    } catch {
      darkMode = lightMode;
    }
  }

  const locals = await figma.variables.getLocalVariablesAsync("COLOR");
  const variables: Record<string, Variable> = {};
  for (const name of Object.keys(COLORS)) {
    let v = locals.find((x) => x.variableCollectionId === collection.id && x.name === name);
    if (!v) v = figma.variables.createVariable(name, collection, "COLOR");
    v.setValueForMode(lightMode, COLORS[name].light);
    if (darkMode !== lightMode) v.setValueForMode(darkMode, COLORS[name].dark);
    variables[name] = v;
  }

  current = {
    collection,
    lightMode,
    darkMode,
    text: variables["text"],
    bgSpec: variables["bg-spec"],
    bgArtwork: variables["bg-artwork"],
  };
  return current;
}

// The last ensured variables (throws if nobody called ensureThemeVariables).
export function themeVars(): ThemeVars {
  if (!current) throw new Error("ensureThemeVariables() was not called before generating");
  return current;
}
