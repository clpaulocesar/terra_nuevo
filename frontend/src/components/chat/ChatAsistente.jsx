import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Mic, Send, Square, X } from 'lucide-react';
import {
  CHAT_HABILITADO,
  EVENTO_ABRIR_CHAT,
  crearSessionId,
  enviarAudioChat,
  enviarMensajeChat,
} from '../../services/chatService.js';
import { useAccesibilidad } from '../../context/AccesibilidadContext.jsx';
import MensajeMarkdown from './MensajeMarkdown.jsx';
import { useNavegacion } from '../../navegacion/NavegacionContext.jsx';
import { CLAVES_CHAT } from '../../navegacion/registroNavegacion.js';
import { convertirAudioAWav } from '../../utils/audioWav.js';
import { BOTON_FLOTANTE, OCULTO_EN_CARRITO, POSICION_ASISTENTE } from '../flotantes/estilosFlotantes.js';
import './ChatAsistente.css';

const BIENVENIDA = {
  id: 'bienvenida',
  rol: 'asistente',
  texto: '¡Hola! Soy el asistente de TERRA. ¿En qué puedo ayudarte?',
};

const MAX_SEGUNDOS_AUDIO = 60;

// Grabar requiere getUserMedia + MediaRecorder y un contexto seguro (https o localhost).
const SOPORTA_AUDIO =
  typeof navigator !== 'undefined' &&
  Boolean(navigator.mediaDevices?.getUserMedia) &&
  typeof MediaRecorder !== 'undefined';

// Cada navegador graba en contenedores distintos (Chrome/Firefox: webm/ogg; Safari: mp4).
// Antes de enviar se convierte siempre a WAV, que es el formato que exige el modelo de voz.
const FORMATOS_AUDIO = [
  { mime: 'audio/webm;codecs=opus' },
  { mime: 'audio/webm' },
  { mime: 'audio/ogg;codecs=opus' },
  { mime: 'audio/mp4' },
];

function elegirFormatoAudio() {
  if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) return null;
  return FORMATOS_AUDIO.find((f) => MediaRecorder.isTypeSupported(f.mime)) || null;
}

function formatearDuracion(segundos) {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function ChatAsistente() {
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState([BIENVENIDA]);
  const { ejecutarIntencion } = useNavegacion();
  const { vozActiva, hablar } = useAccesibilidad();

  // El agente (n8n) puede terminar su respuesta con [[NAVEGAR:clave]]. Se quita del
  // texto y, si la clave está en la lista blanca del chat, se navega. El backoffice
  // nunca es alcanzable desde el chat aunque el modelo lo pida.
  const procesarRespuesta = (texto) => {
    const original = String(texto || '');
    const coincidencia = original.match(/\[\[NAVEGAR:([a-zA-Z]+)\]\]/);
    const limpio = original.replace(/\[\[NAVEGAR:[^\]]*\]\]/g, '').trim();
    if (coincidencia && CLAVES_CHAT.includes(coincidencia[1])) {
      window.setTimeout(() => ejecutarIntencion({ destino: coincidencia[1] }, { origen: 'chat' }), 0);
    }
    return limpio;
  };
  const [entrada, setEntrada] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [grabando, setGrabando] = useState(false);
  const [segundosGrabados, setSegundosGrabados] = useState(0);
  // La sesión vive solo en memoria: la tablet es compartida y no persistimos nada.
  const [sessionId] = useState(crearSessionId);
  const listaRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);
  // Grabación de audio (MediaRecorder). Se guardan en refs porque los callbacks
  // de la grabadora y del intervalo deben leer el valor actual, no el del render.
  const grabadorRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const segundosRef = useRef(0);
  const cancelarGrabacionRef = useRef(false);
  const urlsAudioRef = useRef([]);

  useEffect(() => {
    if (listaRef.current) listaRef.current.scrollTop = listaRef.current.scrollHeight;
  }, [mensajes, abierto, grabando]);

  useEffect(() => {
    if (abierto) inputRef.current?.focus();
  }, [abierto]);

  // La cabecera del portal abre el asistente sin duplicar su estado.
  useEffect(() => {
    const abrir = () => setAbierto(true);
    window.addEventListener(EVENTO_ABRIR_CHAT, abrir);
    return () => window.removeEventListener(EVENTO_ABRIR_CHAT, abrir);
  }, []);

  // Limpieza al desmontar: petición en curso, micrófono y URLs de audio en memoria.
  useEffect(
    () => () => {
      abortRef.current?.abort();
      clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      urlsAudioRef.current.forEach((url) => URL.revokeObjectURL(url));
    },
    [],
  );

  if (!CHAT_HABILITADO) return null;

  function agregarMensaje(mensaje) {
    setMensajes((prev) => [...prev, mensaje]);
  }

  function agregarError(texto) {
    agregarMensaje({ id: `e-${Date.now()}`, rol: 'error', texto });
  }

  async function enviarAlAsistente(peticion) {
    setEnviando(true);
    abortRef.current = new AbortController();
    try {
      const respuesta = await peticion(abortRef.current.signal);
      const textoLimpio = procesarRespuesta(respuesta);
      const textoFinal = textoLimpio || 'No recibí respuesta del asistente.';
      agregarMensaje({
        id: `a-${Date.now()}`,
        rol: 'asistente',
        texto: textoFinal,
      });
      // Si la lectura por voz está activa, el altavoz de la cabecera también lee al asistente.
      if (vozActiva) hablar(textoFinal);
    } catch (err) {
      if (err.name === 'AbortError') return;
      agregarError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  async function enviar(e) {
    e.preventDefault();
    const texto = entrada.trim();
    if (!texto || enviando || grabando) return;

    setEntrada('');
    agregarMensaje({ id: `u-${Date.now()}`, rol: 'usuario', texto });
    await enviarAlAsistente((signal) => enviarMensajeChat({ mensaje: texto, sessionId, signal }));
  }

  function liberarMicrofono() {
    clearInterval(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    grabadorRef.current = null;
    setGrabando(false);
  }

  function detenerGrabacion() {
    const grabador = grabadorRef.current;
    if (!grabador) return;
    if (grabador.state !== 'inactive') grabador.stop();
    else liberarMicrofono();
  }

  function cancelarGrabacion() {
    cancelarGrabacionRef.current = true;
    detenerGrabacion();
  }

  async function iniciarGrabacion() {
    if (enviando || grabando) return;

    if (!SOPORTA_AUDIO) {
      agregarError('Este navegador no permite grabar audio. Escribe tu consulta.');
      return;
    }
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      agregarError('El micrófono solo funciona con conexión segura (https). Escribe tu consulta.');
      return;
    }

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      agregarError('No se pudo acceder al micrófono. Revisa los permisos del navegador.');
      return;
    }

    const formato = elegirFormatoAudio();
    let grabador;
    try {
      grabador = formato ? new MediaRecorder(stream, { mimeType: formato.mime }) : new MediaRecorder(stream);
    } catch {
      stream.getTracks().forEach((t) => t.stop());
      agregarError('No se pudo iniciar la grabación en este navegador.');
      return;
    }

    chunksRef.current = [];
    cancelarGrabacionRef.current = false;
    streamRef.current = stream;
    grabadorRef.current = grabador;

    grabador.ondataavailable = (ev) => {
      if (ev.data && ev.data.size > 0) chunksRef.current.push(ev.data);
    };

    grabador.onstop = () => {
      const mime = grabador.mimeType || formato?.mime || 'audio/webm';
      const blob = new Blob(chunksRef.current, { type: mime });
      const cancelado = cancelarGrabacionRef.current;
      const duracion = segundosRef.current;
      chunksRef.current = [];
      liberarMicrofono();

      if (cancelado || blob.size === 0) return;

      const url = URL.createObjectURL(blob);
      urlsAudioRef.current.push(url);
      agregarMensaje({
        id: `u-${Date.now()}`,
        rol: 'usuario',
        texto: `Nota de voz (${formatearDuracion(duracion)})`,
        audioUrl: url,
      });

      void enviarAlAsistente(async (signal) => {
        let wav;
        try {
          wav = await convertirAudioAWav(blob);
        } catch {
          throw new Error('No se pudo procesar el audio grabado. Intenta de nuevo o escribe tu consulta.');
        }
        return enviarAudioChat({
          audio: wav,
          nombreArchivo: `nota-de-voz-${Date.now()}.wav`,
          sessionId,
          signal,
        });
      });
    };

    segundosRef.current = 0;
    setSegundosGrabados(0);
    setGrabando(true);
    grabador.start();

    timerRef.current = setInterval(() => {
      segundosRef.current += 1;
      setSegundosGrabados(segundosRef.current);
      if (segundosRef.current >= MAX_SEGUNDOS_AUDIO) detenerGrabacion();
    }, 1000);
  }

  return (
    <div
      className={`chat-widget z-70 flex flex-col items-end gap-3 font-terra ${abierto ? 'abierto' : ''}
        ${POSICION_ASISTENTE} ${OCULTO_EN_CARRITO}`}
    >
      {abierto && (
        <section className="chat-panel" aria-label="Asistente virtual">
          <header className="chat-panel-header">
            <div>
              <strong>Asistente TERRA</strong>
              <small>Responde en segundos</small>
            </div>
            <button type="button" className="chat-cerrar" onClick={() => setAbierto(false)} aria-label="Cerrar chat">
              <X size={18} />
            </button>
          </header>

          <div className="chat-mensajes" ref={listaRef} role="log" aria-live="polite">
            {mensajes.map((m) => (
              <div key={m.id} className={`chat-burbuja chat-msg-${m.rol}`}>
                {m.rol === 'asistente' ? <MensajeMarkdown texto={m.texto} /> : m.texto}
                {m.audioUrl && (
                  <audio
                    className="chat-audio"
                    controls
                    preload="metadata"
                    src={m.audioUrl}
                    aria-label="Nota de voz enviada"
                  />
                )}
              </div>
            ))}
            {enviando && <div className="chat-burbuja chat-msg-asistente chat-escribiendo">Escribiendo...</div>}
          </div>

          {grabando ? (
            <div className="chat-form chat-grabando" role="status" aria-live="assertive">
              <button
                type="button"
                className="chat-cancelar-grabacion"
                onClick={cancelarGrabacion}
                aria-label="Cancelar grabación"
                title="Cancelar"
              >
                <X size={18} />
              </button>
              <div className="chat-grabando-info">
                <span className="chat-grabando-punto" aria-hidden="true" />
                <span>Grabando… {formatearDuracion(segundosGrabados)}</span>
                <small>máx. {formatearDuracion(MAX_SEGUNDOS_AUDIO)}</small>
              </div>
              <button
                type="button"
                className="chat-enviar"
                onClick={detenerGrabacion}
                aria-label="Detener y enviar audio"
                title="Enviar"
              >
                <Square size={16} fill="currentColor" />
              </button>
            </div>
          ) : (
            <form className="chat-form" onSubmit={enviar}>
              <input
                ref={inputRef}
                type="text"
                value={entrada}
                onChange={(e) => setEntrada(e.target.value)}
                placeholder="Escribe o graba tu consulta..."
                maxLength={1000}
                disabled={enviando}
                aria-label="Mensaje"
              />
              {SOPORTA_AUDIO && !entrada.trim() ? (
                <button
                  type="button"
                  className="chat-enviar chat-mic"
                  onClick={iniciarGrabacion}
                  disabled={enviando}
                  aria-label="Grabar nota de voz"
                  title="Grabar nota de voz"
                >
                  <Mic size={18} />
                </button>
              ) : (
                <button type="submit" className="chat-enviar" disabled={enviando || !entrada.trim()} aria-label="Enviar">
                  <Send size={18} />
                </button>
              )}
            </form>
          )}
        </section>
      )}

      <button
        type="button"
        className={`inline-flex ${BOTON_FLOTANTE}`}
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        aria-label={abierto ? 'Cerrar asistente' : 'Abrir asistente'}
      >
        {abierto ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </div>
  );
}
