import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

// Accesibilidad por voz del kiosco:
//  - `anunciar` escribe en una región aria-live (la leen NVDA, JAWS, TalkBack,
//    VoiceOver…) y, si el modo de lectura está activo, también la pronuncia con
//    la voz del navegador (Web Speech API) para quien no tiene lector instalado.
//  - `escuchar` usa el reconocimiento de voz del navegador (Chrome/Edge) para
//    recibir un comando hablado; quien lo ejecuta es LectorVoz.jsx, que vive
//    dentro del router.
// La preferencia del modo lectura se guarda en localStorage: es una preferencia
// del dispositivo, no un dato personal.

export const CLAVE_VOZ = 'terra_voz';

const AccesibilidadContext = createContext(null);

const soportaVoz = typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
const Reconocimiento = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition || null) : null;
const soportaReconocimiento = Boolean(Reconocimiento);

function leerPreferenciaVoz() {
  try { return localStorage.getItem(CLAVE_VOZ) === '1'; } catch { return false; }
}

function elegirVozEspanol() {
  if (!soportaVoz) return null;
  const voces = window.speechSynthesis.getVoices() || [];
  const es = voces.filter((v) => /^es([-_]|$)/i.test(v.lang));
  if (!es.length) return null;
  const preferidas = ['es-BO', 'es-AR', 'es-MX', 'es-US', 'es-ES'];
  for (const lang of preferidas) {
    const voz = es.find((v) => v.lang.replace('_', '-').toLowerCase() === lang.toLowerCase());
    if (voz) return voz;
  }
  return es.find((v) => v.default) || es[0];
}

export function AccesibilidadProvider({ children }) {
  const [vozActiva, setVozActiva] = useState(leerPreferenciaVoz);
  const [escuchando, setEscuchando] = useState(false);
  const [mensajeVivo, setMensajeVivo] = useState('');
  const vozRef = useRef(null);
  const reconocimientoRef = useRef(null);
  const manejadorComandoRef = useRef(null);
  const ultimoRef = useRef({ texto: '', en: 0 });
  const vozActivaRef = useRef(vozActiva);
  useEffect(() => { vozActivaRef.current = vozActiva; }, [vozActiva]);

  // Las voces se cargan de forma asíncrona en Chrome.
  useEffect(() => {
    if (!soportaVoz) return undefined;
    const cargar = () => { vozRef.current = elegirVozEspanol(); };
    cargar();
    window.speechSynthesis.addEventListener?.('voiceschanged', cargar);
    return () => window.speechSynthesis.removeEventListener?.('voiceschanged', cargar);
  }, []);

  // Chrome descarta una frase si speak() llega en el mismo instante que cancel().
  // Por eso la lectura se difiere unos milisegundos y, si en ese lapso llegan varias
  // frases (p. ej. "Categoría X, botón" y enseguida "Categoría X seleccionada"),
  // se lee sólo la última. Así tocar varios botones seguidos no se salta ninguno.
  const pendienteHablarRef = useRef(null);
  const ESPERA_HABLAR_MS = 90;

  const detener = useCallback(() => {
    window.clearTimeout(pendienteHablarRef.current);
    pendienteHablarRef.current = null;
    if (soportaVoz) window.speechSynthesis.cancel();
  }, []);

  const hablar = useCallback((texto, { interrumpir = true } = {}) => {
    if (!soportaVoz || !texto) return;
    const decir = () => {
      pendienteHablarRef.current = null;
      const frase = new SpeechSynthesisUtterance(texto);
      frase.lang = vozRef.current?.lang || 'es-ES';
      if (vozRef.current) frase.voice = vozRef.current;
      frase.rate = 1;
      frase.pitch = 1;
      window.speechSynthesis.speak(frase);
    };
    if (!interrumpir) { decir(); return; }
    window.clearTimeout(pendienteHablarRef.current);
    window.speechSynthesis.cancel();
    pendienteHablarRef.current = window.setTimeout(decir, ESPERA_HABLAR_MS);
  }, []);

  // Anuncia para lectores de pantalla (siempre) y por voz (si el modo está activo).
  const anunciar = useCallback((texto, { interrumpir = true, forzar = false } = {}) => {
    const limpio = String(texto || '').replace(/\s+/g, ' ').trim();
    if (!limpio) return;
    const ahora = Date.now();
    if (ultimoRef.current.texto === limpio && ahora - ultimoRef.current.en < 800) return;
    ultimoRef.current = { texto: limpio, en: ahora };
    // Un cambio de contenido en la región aria-live obliga a los lectores a anunciarla
    // aunque el texto sea igual al anterior.
    setMensajeVivo('');
    window.setTimeout(() => setMensajeVivo(limpio), 30);
    if (vozActivaRef.current || forzar) hablar(limpio, { interrumpir });
  }, [hablar]);

  const cambiarVoz = useCallback((activa) => {
    setVozActiva(activa);
    try { localStorage.setItem(CLAVE_VOZ, activa ? '1' : '0'); } catch { /* sin almacenamiento: sólo esta sesión */ }
    if (activa) {
      hablar('Lectura por voz activada. Toca o navega con el teclado y te leo cada elemento. Di "ayuda" con el micrófono para conocer los comandos.');
    } else {
      hablar('Lectura por voz desactivada.');
    }
  }, [hablar]);

  const alternarVoz = useCallback(() => cambiarVoz(!vozActiva), [cambiarVoz, vozActiva]);

  // LectorVoz.jsx registra aquí la función que interpreta los comandos hablados.
  const registrarManejadorComando = useCallback((fn) => {
    manejadorComandoRef.current = fn;
    return () => { if (manejadorComandoRef.current === fn) manejadorComandoRef.current = null; };
  }, []);

  // Ejecuta una frase como si se hubiera dicho por voz (botones del panel "Puedes decir…").
  const ejecutarComando = useCallback((frase) => {
    const texto = String(frase || '').trim();
    if (!texto) return false;
    const manejador = manejadorComandoRef.current;
    if (!manejador) return false;
    manejador(texto, [texto]);
    return true;
  }, []);

  const detenerEscucha = useCallback(() => {
    try { reconocimientoRef.current?.stop(); } catch { /* ya detenido */ }
    reconocimientoRef.current = null;
    setEscuchando(false);
  }, []);

  // Escucha una sola frase y la entrega al manejador registrado.
  const escuchar = useCallback(() => {
    if (!soportaReconocimiento) {
      anunciar('Este navegador no soporta comandos de voz. Usa Chrome o Edge.', { forzar: true });
      return;
    }
    if (reconocimientoRef.current) { detenerEscucha(); return; }
    detener();
    const rec = new Reconocimiento();
    rec.lang = 'es-ES';
    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = 3;
    rec.onstart = () => setEscuchando(true);
    rec.onresult = (evento) => {
      const alternativas = Array.from(evento.results?.[0] || []).map((r) => String(r.transcript || '').trim()).filter(Boolean);
      const frase = alternativas[0] || '';
      const manejador = manejadorComandoRef.current;
      if (!frase) { anunciar('No entendí. Prueba de nuevo.', { forzar: true }); return; }
      if (manejador) manejador(frase, alternativas);
      else anunciar(`Escuché: ${frase}`, { forzar: true });
    };
    rec.onerror = (evento) => {
      const codigo = evento?.error;
      if (codigo === 'not-allowed' || codigo === 'service-not-allowed') anunciar('Permite el uso del micrófono en el navegador para usar comandos de voz.', { forzar: true });
      else if (codigo === 'no-speech') anunciar('No escuché nada. Toca el micrófono y habla.', { forzar: true });
      else if (codigo !== 'aborted') anunciar('No se pudo usar el micrófono.', { forzar: true });
    };
    rec.onend = () => { reconocimientoRef.current = null; setEscuchando(false); };
    reconocimientoRef.current = rec;
    try {
      rec.start();
      hablar('Te escucho.');
    } catch {
      reconocimientoRef.current = null;
      setEscuchando(false);
    }
  }, [anunciar, detener, detenerEscucha, hablar]);

  useEffect(() => () => { detener(); detenerEscucha(); }, [detener, detenerEscucha]);

  const valor = useMemo(() => ({
    soportaVoz,
    soportaReconocimiento,
    vozActiva,
    escuchando,
    anunciar,
    hablar,
    detener,
    cambiarVoz,
    alternarVoz,
    escuchar,
    detenerEscucha,
    registrarManejadorComando,
    ejecutarComando,
  }), [vozActiva, escuchando, anunciar, hablar, detener, cambiarVoz, alternarVoz, escuchar, detenerEscucha, registrarManejadorComando, ejecutarComando]);

  return (
    <AccesibilidadContext.Provider value={valor}>
      {children}
      {/* Región en vivo para lectores de pantalla (NVDA la lee aunque la voz propia esté apagada). */}
      <div className="terra-sr-only" role="status" aria-live="polite" aria-atomic="true">{mensajeVivo}</div>
    </AccesibilidadContext.Provider>
  );
}

export function useAccesibilidad() {
  const contexto = useContext(AccesibilidadContext);
  if (!contexto) throw new Error('useAccesibilidad debe usarse dentro de <AccesibilidadProvider>.');
  return contexto;
}
