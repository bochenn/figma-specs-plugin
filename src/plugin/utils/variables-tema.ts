// Colección local "Specs" con modos Light/Dark y las variables de tema.
// Todo idempotente: regenerar no duplica colecciones, modos ni variables.

export interface VarsTema {
  coleccion: VariableCollection;
  modoLight: string;   // modeId
  modoDark: string;
  texto: Variable;
  fondoSpec: Variable;
  fondoArtwork: Variable;
}

const COLORES: Record<string, { light: RGB; dark: RGB }> = {
  "texto": { light: { r: 0, g: 0, b: 0 }, dark: { r: 0.95, g: 0.95, b: 0.95 } },
  "fondo-spec": { light: { r: 1, g: 1, b: 1 }, dark: { r: 0.12, g: 0.12, b: 0.14 } },
  "fondo-artwork": { light: { r: 0.922, g: 0.922, b: 0.922 }, dark: { r: 0.08, g: 0.09, b: 0.1 } },
};

let actual: VarsTema | null = null;

export async function asegurarVariablesTema(): Promise<VarsTema> {
  const colecciones = await figma.variables.getLocalVariableCollectionsAsync();
  const coleccion = colecciones.find((c) => c.name === "Specs")
    ?? figma.variables.createVariableCollection("Specs");

  let modoLight = coleccion.modes.find((m) => m.name === "Light")?.modeId;
  if (!modoLight) {
    modoLight = coleccion.modes[0].modeId;
    coleccion.renameMode(modoLight, "Light");
  }
  let modoDark = coleccion.modes.find((m) => m.name === "Dark")?.modeId;
  if (!modoDark) {
    // Algunos planes de Figma limitan a 1 mode por colección: si no se puede crear
    // el mode Dark, se degrada usando el mismo mode (el Dark mode no aplica, pero
    // el plugin genera igual en vez de abortar).
    try {
      modoDark = coleccion.addMode("Dark");
    } catch {
      modoDark = modoLight;
    }
  }

  const locales = await figma.variables.getLocalVariablesAsync("COLOR");
  const variables: Record<string, Variable> = {};
  for (const nombre of Object.keys(COLORES)) {
    let v = locales.find((x) => x.variableCollectionId === coleccion.id && x.name === nombre);
    if (!v) v = figma.variables.createVariable(nombre, coleccion, "COLOR");
    v.setValueForMode(modoLight, COLORES[nombre].light);
    if (modoDark !== modoLight) v.setValueForMode(modoDark, COLORES[nombre].dark);
    variables[nombre] = v;
  }

  actual = {
    coleccion,
    modoLight,
    modoDark,
    texto: variables["texto"],
    fondoSpec: variables["fondo-spec"],
    fondoArtwork: variables["fondo-artwork"],
  };
  return actual;
}

// Las últimas variables aseguradas (falla si nadie llamó a asegurarVariablesTema).
export function varsTema(): VarsTema {
  if (!actual) throw new Error("asegurarVariablesTema() no fue llamada antes de generar");
  return actual;
}
