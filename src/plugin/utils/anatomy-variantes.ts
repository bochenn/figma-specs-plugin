// Parses the variant name "Type=A, Orientation=V" into key/value pairs.
// If it has no variant format (no '='), returns [] (it's a plain name).
export function parseVariants(dependsOn: string | undefined): { key: string; value: string }[] {
  if (!dependsOn || !dependsOn.includes("=")) return [];
  const out: { key: string; value: string }[] = [];
  for (const part of dependsOn.split(",")) {
    const i = part.indexOf("=");
    if (i === -1) continue;
    out.push({ key: part.slice(0, i).trim(), value: part.slice(i + 1).trim() });
  }
  return out;
}
