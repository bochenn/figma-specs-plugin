import { frameVertical, texto } from "./frames.ts";

export async function generarData(nombre: string, jsonString: string): Promise<FrameNode> {
  const specifications = frameVertical("Specifications", 128, 64);
  const spec = frameVertical(`${nombre} Spec`, 48);
  const seccion = frameVertical("Data", 64);

  specifications.appendChild(spec);
  spec.appendChild(await texto(nombre, 64));
  spec.appendChild(seccion);
  seccion.appendChild(await texto("Data", 48));

  const jsonFrame = figma.createFrame();
  jsonFrame.name = "JSON";
  jsonFrame.layoutMode = "VERTICAL";
  jsonFrame.paddingLeft = jsonFrame.paddingRight = 16;
  jsonFrame.paddingTop = jsonFrame.paddingBottom = 16;
  jsonFrame.primaryAxisSizingMode = "AUTO";
  jsonFrame.counterAxisSizingMode = "AUTO";
  jsonFrame.fills = [{ type: "SOLID", color: { r: 0.95, g: 0.95, b: 0.96 } }];
  seccion.appendChild(jsonFrame);

  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  const t = figma.createText();
  t.fontName = { family: "Inter", style: "Regular" };
  t.fontSize = 11;
  t.characters = jsonString;
  jsonFrame.appendChild(t);

  figma.currentPage.appendChild(specifications);
  return specifications;
}
