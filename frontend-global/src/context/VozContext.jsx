import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

export const CLAVE_VOZ_GLOBAL = 'terra_voz_guia_global';

const VozContext = createContext(null);

const soportaVoz = typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
const Reconocimiento = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition || null) : null;
const soportaReconocimiento = Boolean(Reconocimiento);

function leerPreferenciaVoz() {
  try {
    return localStorage.getItem(CLAVE_VOZ_GLOBAL) === '1';
  } catch {
    return false;
  }
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

export function normalizarTexto(texto) {
  return String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.,;:!?¡¿"'«»()]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function limpiarTerminoBusqueda(texto) {
  const normalizado = normalizarTexto(texto);
  return normalizado
    .replace(/^(?:buscar|busca|buscame|encontrar|encuentra|quiero|ver|mostrar|mostrame|muestrame|dame|pon)\s+/i, '')
    .replace(/^(?:un|una|unos|unas|el|la|los|las|al|del|de)\s+/i, '')
    .trim();
}

export function VozProvider({ children }) {
  const [vozActiva, setVozActiva] = useState(leerPreferenciaVoz);
  const [escuchando, setEscuchando] = useState(false);
  const [textoEscuchado, setTextoEscuchado] = useState('');
  const [mensajeAriaLive, setMensajeAriaLive] = useState('');
  const [modalTutorialAbierto, setModalTutorialAbierto] = useState(false);

  const vozRef = useRef(null);
  const reconocimientoRef = useRef(null);
  const pendienteHablarRef = useRef(null);
  const callbacksAccionesRef = useRef({});
  const vozActivaRef = useRef(vozActiva);

  useEffect(() => {
    vozActivaRef.current = vozActiva;
  }, [vozActiva]);

  // Carga de voces
  useEffect(() => {
    if (!soportaVoz) return undefined;
    const cargarVoces = () => {
      vozRef.current = elegirVozEspanol();
    };
    cargarVoces();
    window.speechSynthesis.addEventListener?.('voiceschanged', cargarVoces);
    return () => {
      window.speechSynthesis.removeEventListener?.('voiceschanged', cargarVoces);
    };
  }, []);

  const detenerHablar = useCallback(() => {
    if (pendienteHablarRef.current) {
      window.clearTimeout(pendienteHablarRef.current);
      pendienteHablarRef.current = null;
    }
    if (soportaVoz) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        /* sin soporte activo */
      }
    }
  }, []);

  const hablar = useCallback((texto, { interrumpir = true, velocidad = 1.05 } = {}) => {
    if (!soportaVoz || !texto) return;
    const decir = () => {
      pendienteHablarRef.current = null;
      try {
        const frase = new SpeechSynthesisUtterance(texto);
        frase.lang = vozRef.current?.lang || 'es-ES';
        if (vozRef.current) frase.voice = vozRef.current;
        frase.rate = velocidad;
        frase.pitch = 1.0;
        window.speechSynthesis.speak(frase);
      } catch {
        /* error en synthesis */
      }
    };

    if (!interrumpir) {
      decir();
      return;
    }

    detenerHablar();
    pendienteHablarRef.current = window.setTimeout(decir, 80);
  }, [detenerHablar]);

  const anunciar = useCallback((texto, { forzar = false } = {}) => {
    const limpio = String(texto || '').replace(/\s+/g, ' ').trim();
    if (!limpio) return;

    // Región viva para lectores de pantalla
    setMensajeAriaLive('');
    window.setTimeout(() => setMensajeAriaLive(limpio), 30);

    // Habla por voz si la voz guía está encendida o si se fuerza
    if (vozActivaRef.current || forzar) {
      hablar(limpio);
    }
  }, [hablar]);

  const cambiarVoz = useCallback((activa) => {
    setVozActiva(activa);
    try {
      localStorage.setItem(CLAVE_VOZ_GLOBAL, activa ? '1' : '0');
    } catch {
      /* sin persistencia */
    }

    if (activa) {
      hablar('Voz guía activada. Te acompañaré durante tu compra. Puedes presionar el micrófono para buscar por voz.');
    } else {
      hablar('Voz guía desactivada.');
    }
  }, [hablar]);

  const alternarVoz = useCallback(() => {
    cambiarVoz(!vozActiva);
  }, [cambiarVoz, vozActiva]);

  // Registro de callbacks de acciones globales (navegar, buscar, abrir carrito, etc.)
  const registrarAcciones = useCallback((acciones) => {
    callbacksAccionesRef.current = { ...callbacksAccionesRef.current, ...acciones };
  }, []);

  const detenerEscucha = useCallback(() => {
    if (reconocimientoRef.current) {
      try {
        reconocimientoRef.current.abort();
      } catch {
        /* ya abortado */
      }
      reconocimientoRef.current = null;
    }
    setEscuchando(false);
  }, []);

  // Intérprete de comandos y búsquedas
  const procesarTextoVoz = useCallback((fraseCruda) => {
    const frase = normalizarTexto(fraseCruda);
    const cb = callbacksAccionesRef.current;
    if (!frase) return;

    // 1. Silencio
    if (frase === 'silencio' || frase === 'callar' || frase === 'detener' || frase === 'parar') {
      detenerHablar();
      return;
    }

    // 2. Ayuda / Tutorial
    if (frase.includes('ayuda') || frase.includes('tutorial') || frase.includes('comandos') || frase.includes('como comprar')) {
      setModalTutorialAbierto(true);
      anunciar('Abriendo guía interactiva de autoservicio y comandos de voz.', { forzar: true });
      return;
    }

    // 3. Carrito
    if (frase.includes('abrir carrito') || frase.includes('ver carrito') || frase === 'carrito' || frase === 'mi carrito' || frase.includes('bolsa de compras')) {
      cb.onAbrirCarrito?.();
      anunciar('Abriendo tu carrito de compras.', { forzar: true });
      return;
    }
    if (frase.includes('cerrar carrito') || frase.includes('ocultar carrito')) {
      cb.onCerrarCarrito?.();
      anunciar('Carrito cerrado.', { forzar: true });
      return;
    }

    // 4. Sucursales
    if (frase.includes('sucursal') || frase.includes('sucursales') || frase.includes('horario') || frase.includes('direccion') || frase.includes('donde estan') || frase.includes('showroom')) {
      cb.onAbrirSucursales?.();
      anunciar('Mostrando sucursales y showrooms en Santa Cruz.', { forzar: true });
      return;
    }

    // 5. Mi Cuenta
    if (frase.includes('mi cuenta') || frase.includes('iniciar sesion') || frase.includes('mi perfil') || frase === 'login' || frase === 'ingresar') {
      cb.onAbrirMiCuenta?.();
      anunciar('Abriendo ventana de Mi Cuenta.', { forzar: true });
      return;
    }

    // 6. Modo Día / Noche
    if (frase.includes('modo noche') || frase.includes('modo oscuro')) {
      cb.onModoOscuro?.(true);
      anunciar('Modo noche activado.', { forzar: true });
      return;
    }
    if (frase.includes('modo dia') || frase.includes('modo claro')) {
      cb.onModoOscuro?.(false);
      anunciar('Modo día activado.', { forzar: true });
      return;
    }

    // 7. Navegación por Secciones / Categorías
    if (frase === 'inicio' || frase === 'ir a inicio' || frase === 'volver a inicio' || frase === 'portada' || frase === 'home') {
      cb.onNavegar?.('inicio');
      anunciar('Mostrando página de inicio.', { forzar: true });
      return;
    }

    if (frase.includes('oferta') || frase.includes('promocion') || frase.includes('descuento') || frase.includes('liquidac')) {
      cb.onNavegar?.('catalogo', 'ofertas');
      anunciar('Mostrando promociones y ofertas especiales de autoservicio.', { forzar: true });
      return;
    }

    if (frase.includes('sofa') || frase.includes('poltrona') || frase.includes('living') || frase.includes('sillon')) {
      cb.onNavegar?.('catalogo', 'sofas');
      anunciar('Mostrando categoría de sofás y poltronas.', { forzar: true });
      return;
    }

    if (frase.includes('colchon') || frase.includes('dormitorio') || frase.includes('cama') || frase.includes('sommier') || frase.includes('box')) {
      cb.onNavegar?.('catalogo', 'colchones');
      anunciar('Mostrando categoría de colchones y dormitorio.', { forzar: true });
      return;
    }

    if (frase.includes('comedor') || frase.includes('mesa') || frase.includes('silla')) {
      cb.onNavegar?.('catalogo', 'comedores');
      anunciar('Mostrando categoría de comedores.', { forzar: true });
      return;
    }

    if (frase.includes('almohada') || frase.includes('accesorio') || frase.includes('sabana') || frase.includes('protector')) {
      cb.onNavegar?.('catalogo', 'almohadas');
      anunciar('Mostrando almohadas y accesorios.', { forzar: true });
      return;
    }

    if (frase.includes('catalogo completo') || frase === 'catalogo' || frase === 'productos' || frase === 'ver todos') {
      cb.onNavegar?.('catalogo', 'todas');
      anunciar('Abriendo el catálogo completo de productos.', { forzar: true });
      return;
    }

    // 8. Búsqueda libre de producto
    const terminoLimpio = limpiarTerminoBusqueda(fraseCruda);
    if (terminoLimpio) {
      cb.onEjecutarBusqueda?.(terminoLimpio);
      anunciar(`Buscando ${terminoLimpio} en el catálogo.`, { forzar: true });
    }
  }, [anunciar, detenerHablar]);

  const iniciarEscucha = useCallback(() => {
    if (!soportaReconocimiento) {
      anunciar('El reconocimiento de voz no está disponible en este navegador. Te recomendamos usar Google Chrome o Microsoft Edge.', { forzar: true });
      return;
    }

    if (reconocimientoRef.current) {
      detenerEscucha();
      return;
    }

    detenerHablar();
    setTextoEscuchado('');

    const rec = new Reconocimiento();
    rec.lang = 'es-BO';
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 3;

    rec.onstart = () => {
      setEscuchando(true);
      setTextoEscuchado('Escuchando tu voz...');
    };

    rec.onresult = (evento) => {
      let textoInterim = '';
      let textoFinal = '';

      for (let i = evento.resultIndex; i < evento.results.length; ++i) {
        const item = evento.results[i];
        if (item.isFinal) {
          textoFinal += item[0].transcript;
        } else {
          textoInterim += item[0].transcript;
        }
      }

      if (textoFinal.trim()) {
        const fraseFinal = textoFinal.trim();
        setTextoEscuchado(fraseFinal);
        procesarTextoVoz(fraseFinal);
      } else if (textoInterim.trim()) {
        setTextoEscuchado(textoInterim.trim());
      }
    };

    rec.onerror = (evento) => {
      const err = evento?.error;
      if (err === 'not-allowed' || err === 'service-not-allowed') {
        anunciar('Permite el acceso al micrófono en tu navegador para realizar búsquedas por voz.', { forzar: true });
      } else if (err === 'no-speech') {
        anunciar('No alcancé a escucharte. Toca el micrófono e inténtalo de nuevo.', { forzar: true });
      } else if (err !== 'aborted') {
        anunciar('No se pudo acceder al micrófono.', { forzar: true });
      }
      setEscuchando(false);
      reconocimientoRef.current = null;
    };

    rec.onend = () => {
      setEscuchando(false);
      reconocimientoRef.current = null;
    };

    reconocimientoRef.current = rec;

    try {
      rec.start();
      hablar('Te escucho.', { velocidad: 1.2 });
    } catch {
      setEscuchando(false);
      reconocimientoRef.current = null;
    }
  }, [anunciar, detenerEscucha, detenerHablar, hablar, procesarTextoVoz]);

  useEffect(() => {
    return () => {
      detenerHablar();
      detenerEscucha();
    };
  }, [detenerHablar, detenerEscucha]);

  const valor = useMemo(() => ({
    soportaVoz,
    soportaReconocimiento,
    vozActiva,
    escuchando,
    textoEscuchado,
    modalTutorialAbierto,
    setModalTutorialAbierto,
    hablar,
    anunciar,
    detenerHablar,
    cambiarVoz,
    alternarVoz,
    iniciarEscucha,
    detenerEscucha,
    procesarTextoVoz,
    registrarAcciones,
  }), [
    vozActiva,
    escuchando,
    textoEscuchado,
    modalTutorialAbierto,
    hablar,
    anunciar,
    detenerHablar,
    cambiarVoz,
    alternarVoz,
    iniciarEscucha,
    detenerEscucha,
    procesarTextoVoz,
    registrarAcciones,
  ]);

  return (
    <VozContext.Provider value={valor}>
      {children}
      {/* Región viva invisible para accesibilidad y lectores de pantalla */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {mensajeAriaLive}
      </div>
    </VozContext.Provider>
  );
}

export function useVoz() {
  const contexto = useContext(VozContext);
  if (!contexto) {
    throw new Error('useVoz debe utilizarse dentro de un <VozProvider>');
  }
  return contexto;
}
