export const API_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
).replace(/\/$/, '');

export const MODO_DEMO = import.meta.env.VITE_MODO_DEMO === 'true';

export async function apiRequest(ruta, { method = 'GET', body, signal } = {}) {
  let respuesta;
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, {
      method,
      signal,
      headers: { 'Content-Type': 'application/json' },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('No se pudo conectar al backend. Comprueba que esté encendido.');
  }

  const datos = await respuesta.json().catch(() => null);
  if (!respuesta.ok || datos?.success === false) {
    throw new Error(datos?.mensaje || `Error HTTP ${respuesta.status}`);
  }
  return datos?.data ?? datos;
}