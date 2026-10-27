export const API_URL = String(
  (typeof window !== 'undefined' && window.TERRA_CONFIG?.API_URL) ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:3001/api'
).trim().replace(/\/$/, '');

export async function apiRequest(ruta, { method = 'GET', body, signal, headers = {}, raw = false } = {}) {
  const url = ruta.startsWith('http') ? ruta : `${API_URL}${ruta.startsWith('/') ? ruta : `/${ruta}`}`;
  let respuesta;
  try {
    respuesta = await fetch(url, {
      method,
      signal,
      headers: { 'Content-Type': 'application/json', ...headers },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('No se pudo conectar al backend.');
  }

  const datos = await respuesta.json().catch(() => null);
  if (!respuesta.ok || datos?.success === false) {
    throw new Error(datos?.mensaje || `Error HTTP ${respuesta.status}`);
  }
  return raw ? datos : (datos?.data ?? datos);
}

export {
  normalizarProducto,
  listarProductos,
  listarProductosDestacados,
  obtenerProducto,
  obtenerCategorias,
} from './productoService.js';
