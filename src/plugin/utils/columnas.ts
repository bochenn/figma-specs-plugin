// Ancho fijo del contenedor wrap para que entren exactamente `columnas` ítems por fila.
export function anchoContenedor(columnas: number, anchoItem: number, gap: number): number {
  return columnas * anchoItem + (columnas - 1) * gap;
}

// Normaliza el número de columnas del selector al rango 1–4 (1 si viene undefined).
export function clampColumnas(n: number | undefined): number {
  return Math.min(Math.max(n ?? 1, 1), 4);
}
