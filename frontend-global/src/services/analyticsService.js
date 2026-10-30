import { API_URL } from './api.js';

const SESSION_KEY = 'terra_analytics_session';
let sessionIdEnMemoria;

function obtenerIdSesion() {
  try {
    const guardado = window.sessionStorage.getItem(SESSION_KEY);
    if (guardado) return guardado;

    const nuevo = window.crypto.randomUUID();
    window.sessionStorage.setItem(SESSION_KEY, nuevo);
    return nuevo;
  } catch (error) {
    console.warn('No se pudo acceder al almacenamiento de sesión para analítica:', error);
    sessionIdEnMemoria ||= window.crypto.randomUUID();
    return sessionIdEnMemoria;
  }
}

export async function registrarVistaPublica(pagePath) {
  const respuesta = await fetch(`${API_URL}/visitas/publica`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId: obtenerIdSesion(), pagePath }),
    keepalive: true,
  });
  const datos = await respuesta.json().catch(() => null);

  if (!respuesta.ok || datos?.success === false) {
    throw new Error(datos?.mensaje || `Error HTTP ${respuesta.status}`);
  }
}
