// Quita un prefijo de numeración inicial tipo "N. " del nombre (ej. el de una
// colección de variables: "1. Color modes" → "Color modes").
export function limpiarPrefijoColeccion(nombre: string): string {
  return nombre.replace(/^\d+\.\s*/, "");
}
