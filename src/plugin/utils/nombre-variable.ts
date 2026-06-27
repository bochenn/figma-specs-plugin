// Strips a leading numbering prefix like "N. " from the name (e.g. the one from a
// variable collection: "1. Color modes" → "Color modes").
export function stripCollectionPrefix(name: string): string {
  return name.replace(/^\d+\.\s*/, "");
}
