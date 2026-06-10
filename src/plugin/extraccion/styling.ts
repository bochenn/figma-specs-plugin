import type { EntradaEstilo, StylingInventorySpec } from "../modelo/tipos.ts";

function recorrerTodo(nodo: SceneNode): SceneNode[] {
  const todos: SceneNode[] = [];
  if ("children" in nodo) {
    for (const hijo of (nodo as ChildrenMixin).children as SceneNode[]) {
      todos.push(hijo, ...recorrerTodo(hijo));
    }
  }
  return todos;
}

function propAAplicadoComo(prop: string): string {
  switch (prop) {
    case "fills": return "Background color";
    case "strokes": return "Border color";
    case "width": return "Width";
    case "height": return "Height";
    case "opacity": return "Opacity";
    case "paddingLeft": return "Left padding";
    case "paddingTop": return "Top padding";
    case "paddingRight": return "Right padding";
    case "paddingBottom": return "Bottom padding";
    case "itemSpacing": return "Item spacing";
    case "cornerRadius": return "Corner radius";
    default: return prop;
  }
}

type EstiloMap = Map<string, Map<string, Set<string>>>;
type TextoEstiloMap = Map<string, Set<string>>;

function estiloMapAEntradas(mapa: EstiloMap): EntradaEstilo[] {
  const result: EntradaEstilo[] = [];
  for (const [nombre, appliedMap] of mapa) {
    for (const [aplicadoComo, capas] of appliedMap) {
      result.push({ nombre, aplicadoComo, aplicadoA: Array.from(capas) });
    }
  }
  return result.sort((a, b) => a.nombre.localeCompare(b.nombre));
}

function textoEstiloMapAEntradas(mapa: TextoEstiloMap, aplicadoComo: string): EntradaEstilo[] {
  const result: EntradaEstilo[] = [];
  for (const [nombre, capas] of mapa) {
    result.push({ nombre, aplicadoComo, aplicadoA: Array.from(capas) });
  }
  return result.sort((a, b) => a.nombre.localeCompare(b.nombre));
}

export function extraerStyling(raiz: SceneNode): StylingInventorySpec {
  const todos: SceneNode[] = [raiz, ...recorrerTodo(raiz)];

  const variables: EstiloMap = new Map();
  const textStyles: TextoEstiloMap = new Map();
  const colorStyles: EstiloMap = new Map();

  for (const nodo of todos) {
    // Variables via boundVariables
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bv = (nodo as any).boundVariables;
    if (bv && typeof bv === "object") {
      for (const [prop, alias] of Object.entries(bv)) {
        const aliases: unknown[] = Array.isArray(alias) ? alias : [alias];
        for (const a of aliases) {
          if (a && typeof a === "object" && (a as { type?: string }).type === "VARIABLE_ALIAS") {
            const varId = (a as { id: string }).id;
            const variable = figma.variables.getVariableById(varId);
            if (variable) {
              const collection = figma.variables.getVariableCollectionById(
                variable.variableCollectionId,
              );
              const fullName = collection
                ? `${collection.name}/${variable.name}`
                : variable.name;
              const aplicadoComo = propAAplicadoComo(prop);
              if (!variables.has(fullName)) variables.set(fullName, new Map());
              const appMap = variables.get(fullName)!;
              if (!appMap.has(aplicadoComo)) appMap.set(aplicadoComo, new Set());
              appMap.get(aplicadoComo)!.add(nodo.name);
            }
          }
        }
      }
    }

    // Text styles
    if (nodo.type === "TEXT") {
      const styleId = (nodo as TextNode).textStyleId;
      if (styleId && styleId !== figma.mixed && typeof styleId === "string") {
        const style = figma.getStyleById(styleId);
        if (style) {
          if (!textStyles.has(style.name)) textStyles.set(style.name, new Set());
          textStyles.get(style.name)!.add(nodo.name);
        }
      }
    }

    // Fill color styles
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fillStyleId = (nodo as any).fillStyleId;
    if (fillStyleId && fillStyleId !== figma.mixed && typeof fillStyleId === "string") {
      const style = figma.getStyleById(fillStyleId);
      if (style) {
        if (!colorStyles.has(style.name)) colorStyles.set(style.name, new Map());
        const appMap = colorStyles.get(style.name)!;
        if (!appMap.has("Background color")) appMap.set("Background color", new Set());
        appMap.get("Background color")!.add(nodo.name);
      }
    }

    // Stroke color styles
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const strokeStyleId = (nodo as any).strokeStyleId;
    if (strokeStyleId && strokeStyleId !== figma.mixed && typeof strokeStyleId === "string") {
      const style = figma.getStyleById(strokeStyleId);
      if (style) {
        if (!colorStyles.has(style.name)) colorStyles.set(style.name, new Map());
        const appMap = colorStyles.get(style.name)!;
        if (!appMap.has("Border color")) appMap.set("Border color", new Set());
        appMap.get("Border color")!.add(nodo.name);
      }
    }
  }

  return {
    variables: estiloMapAEntradas(variables),
    textStyles: textoEstiloMapAEntradas(textStyles, "Text style"),
    colorStyles: estiloMapAEntradas(colorStyles),
  };
}
