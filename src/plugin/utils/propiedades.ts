// Saca el sufijo "#id" de la clave de una propiedad de componente.
export function nombrePropiedad(clave: string): string {
  const i = clave.indexOf("#");
  return i >= 0 ? clave.slice(0, i) : clave;
}
