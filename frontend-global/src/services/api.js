export const API_URL = String(
  (typeof window !== 'undefined' && window.TERRA_CONFIG?.API_URL) ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:3001/api'
).trim().replace(/\/$/, '');

// Webhook del nodo "When chat message received" de n8n
export const N8N_CHAT_URL = String(
  (typeof window !== 'undefined' && window.TERRA_CONFIG?.N8N_CHAT_URL) || ''
).trim().replace(/\/$/, '');

export const WHATSAPP_COMPROBANTES = String(
  (typeof window !== 'undefined' && window.TERRA_CONFIG?.WHATSAPP_COMPROBANTES) || '59175335697'
).replace(/\D/g, '');

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
