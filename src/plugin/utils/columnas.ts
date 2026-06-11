// Ancho fijo del contenedor wrap para que entren exactamente `columnas` ítems por fila.
export function anchoContenedor(columnas: number, anchoItem: number, gap: number): number {
  return columnas * anchoItem + (columnas - 1) * gap;
}
