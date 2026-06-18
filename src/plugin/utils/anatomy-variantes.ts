// Parsea el nombre de variante "Type=A, Orientation=V" en pares clave/valor.
// Si no tiene formato de variante (sin '='), devuelve [] (es un nombre común).
export function parseVariantes(dependeDe: string | undefined): { clave: string; valor: string }[] {
  if (!dependeDe || !dependeDe.includes("=")) return [];
  const out: { clave: string; valor: string }[] = [];
  for (const parte of dependeDe.split(",")) {
    const i = parte.indexOf("=");
    if (i === -1) continue;
    out.push({ clave: parte.slice(0, i).trim(), valor: parte.slice(i + 1).trim() });
  }
  return out;
}
