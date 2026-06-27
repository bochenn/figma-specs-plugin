import type { AnatomyJson } from "../modelo/tipos.ts";
import { verticalFrame, text, FONT_MONO } from "./frames.ts";
import { hexToRgb } from "../utils/color.ts";

const JSON_WIDTH = 720;

// Syntax palette (colors already used in the plugin) and code-block bg.
const COL_PUNCT = hexToRgb("#6B7280"); // base: braces, commas, colons
const COL_KEY = hexToRgb("#EA10AC");        // property names (ChipVar pink)
const COL_STRING = hexToRgb("#1FA855");     // values string (green)
const COL_NUM = hexToRgb("#0D80FF");        // numbers, true/false/null (blue)
const CODE_BG = hexToRgb("#F3F4F6");   // light gray: legible with the colors

// Tokenizes an already-formatted JSON into color ranges (key, string, number/literal).
// Everything else (braces, commas, ":") keeps the base punctuation color.
function tokensJson(s: string): { from: number; to: number; color: RGB }[] {
  const out: { from: number; to: number; color: RGB }[] = [];
  let i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (ch === '"') {
      let j = i + 1;
      while (j < s.length && s[j] !== '"') { if (s[j] === "\\") j++; j++; }
      j = Math.min(j + 1, s.length);
      let k = j;
      while (k < s.length && (s[k] === " " || s[k] === "\n")) k++;
      out.push({ from: i, to: j, color: s[k] === ":" ? COL_KEY : COL_STRING });
      i = j;
    } else if (ch === "-" || (ch >= "0" && ch <= "9")) {
      let j = i + 1;
      while (j < s.length && "0123456789.eE+-".includes(s[j])) j++;
      out.push({ from: i, to: j, color: COL_NUM });
      i = j;
    } else if (s.startsWith("true", i) || s.startsWith("false", i) || s.startsWith("null", i)) {
      const lit = s.startsWith("true", i) ? "true" : s.startsWith("false", i) ? "false" : "null";
      out.push({ from: i, to: i + lit.length, color: COL_NUM });
      i += lit.length;
    } else {
      i++;
    }
  }
  return out;
}

// Generates the Data output: the Anatomy JSON in a text node.
// Returns the created Specifications frame.
export async function generateData(name: string, json: AnatomyJson): Promise<FrameNode> {
  const specifications = verticalFrame("Specifications", 128, 64);
  const spec = verticalFrame(`${name} Spec`, 48);
  specifications.appendChild(spec);
  spec.appendChild(await text(name, 64));
  spec.appendChild(await dataSection(name, json));
  figma.currentPage.appendChild(specifications);
  return specifications;
}

// Builds only the Data (JSON) section (without Specifications or node title).
export async function dataSection(name: string, json: AnatomyJson): Promise<FrameNode> {
  const section = verticalFrame("Data (JSON)", 64);
  section.appendChild(await text("Data (JSON)", 48));

  const codigo = JSON.stringify(json, null, 2);
  const jsonNode = await text(codigo, 14, FONT_MONO);
  jsonNode.fills = [{ type: "SOLID", color: COL_PUNCT }]; // base
  for (const t of tokensJson(codigo)) {
    jsonNode.setRangeFills(t.from, t.to, [{ type: "SOLID", color: t.color }]);
  }
  // Fixed width with wrap: HEIGHT first, then fix the width.
  jsonNode.textAutoResize = "HEIGHT";
  jsonNode.resize(JSON_WIDTH, jsonNode.height);

  // Block with bg so the colored code is legible.
  const block = verticalFrame("codeBlock", 0);
  block.paddingTop = block.paddingBottom = block.paddingLeft = block.paddingRight = 24;
  block.cornerRadius = 8;
  block.fills = [{ type: "SOLID", color: CODE_BG }];
  block.appendChild(jsonNode);
  section.appendChild(block);

  return section;
}
