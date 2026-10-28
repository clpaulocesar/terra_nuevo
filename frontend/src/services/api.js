export const API_URL = String(
  // public/config.js (window.TERRA_CONFIG) manda si está definido: así la app
  // y la ficha QR (detalle-qr.html) usan la misma URL sin recompilar.
  (typeof window !== 'undefined' && window.TERRA_CONFIG?.API_URL) ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:3001/api'
).trim().replace(/\/$/, '');

export const MODO_DEMO = import.meta.env.VITE_MODO_DEMO === 'true';

// Conexión al chat de n8n (nodo "When chat message received").
// La URL se define ÚNICAMENTE en public/config.js (window.TERRA_CONFIG),
// que se carga en tiempo de ejecución y se puede editar en el despliegue sin recompilar.
export const N8N_CHAT_URL = String(
  (typeof window !== 'undefined' && window.TERRA_CONFIG?.N8N_CHAT_URL) || ''
).trim().replace(/\/$/, '');

// Número de atención que recibe las solicitudes de comprobante por WhatsApp.
// Se configura en public/config.js para poder cambiarlo sin recompilar la app.
export const WHATSAPP_COMPROBANTES = String(
  (typeof window !== 'undefined' && window.TERRA_CONFIG?.WHATSAPP_COMPROBANTES) || '59175335697'
).replace(/\D/g, '');

export async function apiRequest(ruta, { method = 'GET', body, signal, headers = {}, raw = false } = {}) {
  let respuesta;
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, {
      method,
      signal,
      headers: { 'Content-Type': 'application/json', ...headers },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('No se pudo conectar al backend. Comprueba que esté encendido.');
  }

  const datos = await respuesta.json().catch(() => null);
  if (!respuesta.ok || datos?.success === false) {
    const error = new Error(datos?.mensaje || `Error HTTP ${respuesta.status}`);
    // El backend acompaña algunos errores con `codigo` y datos (p. ej. `pedido_ajustado`
    // trae `cambios` y `pedido`): se conservan para que la pantalla pueda reaccionar.
    error.status = respuesta.status;
    error.codigo = datos?.codigo || null;
    error.datos = datos || null;
    throw error;
  }
  // `raw` devuelve el sobre completo (data + paginacion) en vez de solo `data`.
  return raw ? datos : (datos?.data ?? datos);
}
