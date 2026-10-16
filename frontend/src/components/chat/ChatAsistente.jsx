import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import { CHAT_HABILITADO, crearSessionId, enviarMensajeChat } from '../../services/chatService.js';
import MensajeMarkdown from './MensajeMarkdown.jsx';
import './ChatAsistente.css';

const BIENVENIDA = {
  id: 'bienvenida',
  rol: 'asistente',
  texto: '¡Hola! Soy el asistente de TERRA. ¿En qué puedo ayudarte?',
};

export default function ChatAsistente() {
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState([BIENVENIDA]);
  const [entrada, setEntrada] = useState('');
  const [enviando, setEnviando] = useState(false);
  // La sesión vive solo en memoria: la tablet es compartida y no persistimos nada.
  const [sessionId] = useState(crearSessionId);
  const listaRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    if (listaRef.current) listaRef.current.scrollTop = listaRef.current.scrollHeight;
  }, [mensajes, abierto]);

  useEffect(() => {
    if (abierto) inputRef.current?.focus();
  }, [abierto]);

  useEffect(() => () => abortRef.current?.abort(), []);

  if (!CHAT_HABILITADO) return null;

  async function enviar(e) {
    e.preventDefault();
    const texto = entrada.trim();
    if (!texto || enviando) return;

    setEntrada('');
    setMensajes((prev) => [...prev, { id: `u-${Date.now()}`, rol: 'usuario', texto }]);
    setEnviando(true);
    abortRef.current = new AbortController();

    try {
      const respuesta = await enviarMensajeChat({ mensaje: texto, sessionId, signal: abortRef.current.signal });
      setMensajes((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, rol: 'asistente', texto: respuesta || 'No recibí respuesta del asistente.' },
      ]);
    } catch (err) {
      if (err.name === 'AbortError') return;
      setMensajes((prev) => [...prev, { id: `e-${Date.now()}`, rol: 'error', texto: err.message }]);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className={`chat-widget ${abierto ? 'abierto' : ''}`}>
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
              </div>
            ))}
            {enviando && <div className="chat-burbuja chat-msg-asistente chat-escribiendo">Escribiendo...</div>}
          </div>

          <form className="chat-form" onSubmit={enviar}>
            <input
              ref={inputRef}
              type="text"
              value={entrada}
              onChange={(e) => setEntrada(e.target.value)}
              placeholder="Escribe tu consulta..."
              maxLength={1000}
              disabled={enviando}
              aria-label="Mensaje"
            />
            <button type="submit" className="chat-enviar" disabled={enviando || !entrada.trim()} aria-label="Enviar">
              <Send size={18} />
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        className="chat-fab"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        aria-label={abierto ? 'Cerrar asistente' : 'Abrir asistente'}
      >
        {abierto ? <X size={24} /> : <MessageCircle size={24} />}
        {!abierto && <span>Asistente</span>}
      </button>
    </div>
  );
}
