export const TAM_MARCADOR = 24; // diámetro del círculo del marcador, en px
export const OFFSET_MARCADOR = 16; // separación entre el marcador y el borde del artwork

export interface Caja {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Calcula dónde colocar el marcador de un elemento: proyectado al borde
// izquierdo del artwork, centrado verticalmente con el elemento.
export function posicionMarcador(caja: Caja): { x: number; y: number } {
  const centroY = caja.y + caja.height / 2;
  return {
    x: -(OFFSET_MARCADOR + TAM_MARCADOR),
    y: centroY - TAM_MARCADOR / 2,
  };
}
