import { N8N_CHAT_URL } from './api.js';

// Cliente del nodo "When chat message received" de n8n.
// - Texto: POST JSON { action: 'sendMessage', sessionId, chatInput }.
// - Audio (requiere "Allow File Uploads" en el nodo): POST multipart/form-data con los mismos
//   campos más `files` (el archivo llega al workflow como binario, p. ej. $binary.data0).
// Responde con { output: '...' } (o el JSON del último nodo del workflow).

export const CHAT_HABILITADO = Boolean(N8N_CHAT_URL);
// Permite abrir el asistente desde cualquier botón de ayuda de la interfaz.
export const EVENTO_ABRIR_CHAT = 'terra:abrir-chat';

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

async function llamarWebhook({ body, headers, signal }) {
  if (!CHAT_HABILITADO) {
    throw new Error('El chat no está configurado');
  }

  let respuesta;
  try {
    respuesta = await fetch(N8N_CHAT_URL, { method: 'POST', signal, headers, body });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('No se pudo conectar con el asistente');
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

export async function enviarMensajeChat({ mensaje, sessionId, signal }) {
  return llamarWebhook({
    signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'sendMessage', sessionId, chatInput: mensaje }),
  });
}

// `audio` es un Blob WAV (ver utils/audioWav.js). No se fija Content-Type: el navegador
// añade el boundary del multipart automáticamente.
export async function enviarAudioChat({ audio, nombreArchivo, sessionId, signal, mensaje = '' }) {
  const formData = new FormData();
  formData.append('action', 'sendMessage');
  formData.append('sessionId', sessionId);
  formData.append('chatInput', mensaje);
  formData.append('files', audio, nombreArchivo || 'nota-de-voz.wav');
  return llamarWebhook({ signal, body: formData });
}
