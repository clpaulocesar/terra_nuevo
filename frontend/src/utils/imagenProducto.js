// Imagen de respaldo para productos sin foto: el logo de TERRA que vive en
// public/images/logo (el nombre lleva espacios, por eso va codificado).
export const IMAGEN_PRODUCTO_FALLBACK = '/images/logo/Logo%20Terra%20Autoservicio%20y%20Descanso.png';

// Qué muestra components/ui/ImagenProducto.jsx: la foto, o el logo si no hay URL
// o si esa misma URL ya falló. Se compara con la URL fallida (no con un booleano)
// para que, si cambia la foto en la misma <img>, se vuelva a intentar.
export function fuenteImagenProducto(src, urlFallida) {
  const url = typeof src === 'string' ? src.trim() : '';
  const reemplazo = !url || url === urlFallida;
  return { url, src: reemplazo ? IMAGEN_PRODUCTO_FALLBACK : url, reemplazo };
}
