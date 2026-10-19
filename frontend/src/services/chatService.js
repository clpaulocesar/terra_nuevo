import { N8N_CHAT_URL } from './api.js';

// Cliente del nodo "When chat message received" de n8n.
// El webhook espera POST { action: 'sendMessage', sessionId, chatInput }
// y responde con { output: '...' } (o el JSON del último nodo del workflow).

export const CHAT_HABILITADO = Boolean(N8N_CHAT_URL);

export function crearSessionId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `sess-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function extraerTexto(datos) {
  if (datos == null) return '';
  if (typeof datos === 'string') return datos;
  if (Array.isArray(datos)) return extraerTexto(datos[0]);
  return (
    datos.output ?? datos.text ?? datos.message ?? datos.respuesta ?? datos.answer ??
    (datos.json ? extraerTexto(datos.json) : JSON.stringify(datos))
  );
}

export async function enviarMensajeChat({ mensaje, sessionId, signal }) {
  if (!CHAT_HABILITADO) {
    throw new Error('El chat no está configurado. Define N8N_CHAT_URL en public/config.js.');
  }

  let respuesta;
  try {
    respuesta = await fetch(N8N_CHAT_URL, {
      method: 'POST',
      signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'sendMessage', sessionId, chatInput: mensaje }),
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('No se pudo conectar con el asistente. Comprueba que n8n esté activo.');
  }

  const texto = await respuesta.text();
  let datos = null;
  try { datos = texto ? JSON.parse(texto) : null; } catch { datos = texto; }

  if (!respuesta.ok) {
    const detalle = typeof datos === 'object' && datos?.message ? datos.message : `Error HTTP ${respuesta.status}`;
    throw new Error(detalle);
  }

  return String(extraerTexto(datos) || '').trim();
}
