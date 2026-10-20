// Imagen de respaldo para productos sin foto: el logo de TERRA que vive en
// public/images/logo (el nombre lleva espacios, por eso va codificado).
export const IMAGEN_PRODUCTO_FALLBACK = '/images/logo/Logo%20Terra%20Autoservicio%20y%20Descanso.png';

export function imagenDeProducto(url) {
  const valor = typeof url === 'string' ? url.trim() : '';
  return valor || IMAGEN_PRODUCTO_FALLBACK;
}

// Para onError de <img>: si la URL real falla, se muestra el logo una sola vez.
export function usarImagenFallback(event) {
  const img = event?.currentTarget;
  if (!img || img.dataset.fallback === '1') return;
  img.dataset.fallback = '1';
  img.src = IMAGEN_PRODUCTO_FALLBACK;
  img.classList.add('img-fallback');
}
