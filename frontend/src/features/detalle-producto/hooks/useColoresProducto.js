import { useMemo, useState } from 'react';
import { coloresDeProducto } from '../utils/coloresProducto.js';

// Los colores quedan OCULTOS a propósito (se trabaja solo con las imágenes).
// El código se conserva: pon true para volver a mostrarlos.
export const MOSTRAR_COLORES = false;

export function useColoresProducto(producto) {
  const colores = useMemo(() => (MOSTRAR_COLORES ? coloresDeProducto(producto) : []), [producto]);
  const [elegido, setElegido] = useState(null);
  // Si el color elegido no es de este producto (se abrió otro), vale el primero.
  const color = colores.find((opcion) => opcion === elegido) || colores[0] || null;

  return { colores, color, setColor: setElegido };
}
