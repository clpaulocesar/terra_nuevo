import { useEffect, useState } from 'react';
import { usarPaginadorCompacto } from '../utils/paginacion.js';

function calcular() {
  if (typeof window === 'undefined') return false;
  const fuente = parseFloat(window.getComputedStyle(document.documentElement).fontSize);
  return usarPaginadorCompacto(window.innerWidth, fuente);
}

// Indica si el paginador debe mostrar la versión compacta. Se recalcula al cambiar
// el ancho de la ventana o el tamaño de texto del modo accesible (estilo de <html>).
export function usePaginadorCompacto() {
  const [compacto, setCompacto] = useState(calcular);

  useEffect(() => {
    const actualizar = () => setCompacto(calcular());
    window.addEventListener('resize', actualizar);
    const observador = new MutationObserver(actualizar);
    observador.observe(document.documentElement, { attributes: true, attributeFilter: ['style', 'class'] });
    return () => {
      window.removeEventListener('resize', actualizar);
      observador.disconnect();
    };
  }, []);

  return compacto;
}
