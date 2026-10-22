import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAccesibilidad } from '../context/AccesibilidadContext.jsx';
import { configurarAlertas } from '../utils/alertas.js';
import './accesibilidad.css';

// Modo accesible (botón ♿): un interruptor maestro y opciones individuales que se
// reflejan como clases en <html>. La lectura por voz y el micrófono reutilizan el
// AccesibilidadContext existente (voz) en vez de duplicar speechSynthesis.
//
// Clases que aplica en <html>:
//   modo-accesible            interruptor maestro
//   a11y-contraste            alto contraste (también si el SO pide prefers-contrast: more)
//   a11y-botones              objetivos táctiles de 48px
//   a11y-foco                 foco reforzado
//   a11y-enlaces              enlaces subrayados
//   a11y-sin-animacion        sin transiciones (también con prefers-reduced-motion)
//   a11y-fuente               Atkinson Hyperlegible + interlineado
//   a11y-leer                 lectura en voz alta activa (primer toque lee, segundo abre)
//   a11y-mas-tiempo           avisos sin cierre automático, tiempos de espera duplicados
//   style.fontSize = 125% / 150% cuando el modo está activo

export const CLAVE_A11Y = 'terra_a11y';
export const TAMANOS_TEXTO = [100, 125, 150];

// Valores por defecto al activar el modo (tabla de la especificación).
export const OPCIONES_POR_DEFECTO = Object.freeze({
  textoGrande: 125,
  altoContraste: true,
  botonesGrandes: true,
  focoReforzado: true,
  subrayarEnlaces: true,
  sinAnimaciones: true,
  leerEnVoz: true,
  navegacionVoz: true,
  fuenteLegible: false,
  masTiempo: true,
});

export const ESTADO_INICIAL = Object.freeze({ activo: false, ...OPCIONES_POR_DEFECTO });

// Etiquetas que usan el panel y los anuncios por voz.
export const OPCIONES = [
  { clave: 'altoContraste', etiqueta: 'Alto contraste', ayuda: 'Fondo negro, texto blanco y botones con borde.' },
  { clave: 'botonesGrandes', etiqueta: 'Botones grandes', ayuda: 'Zonas de toque de al menos 48 píxeles.' },
  { clave: 'focoReforzado', etiqueta: 'Foco reforzado', ayuda: 'Contorno amarillo grueso en el elemento activo.' },
  { clave: 'subrayarEnlaces', etiqueta: 'Subrayar enlaces', ayuda: 'Todos los enlaces se muestran subrayados.' },
  { clave: 'sinAnimaciones', etiqueta: 'Sin animaciones', ayuda: 'Detiene transiciones y carruseles automáticos.' },
  { clave: 'leerEnVoz', etiqueta: 'Leer en voz alta', ayuda: 'Lee lo que tocás o enfocás. En productos: nombre, medida y precio.' },
  { clave: 'navegacionVoz', etiqueta: 'Navegación por voz', ayuda: 'Muestra los comandos del micrófono para moverte hablando.' },
  { clave: 'fuenteLegible', etiqueta: 'Fuente legible', ayuda: 'Tipografía Atkinson Hyperlegible con más espacio entre letras.' },
  { clave: 'masTiempo', etiqueta: 'Más tiempo', ayuda: 'Los avisos no se cierran solos y las esperas duran el doble.' },
];

const ModoAccesibleContext = createContext(null);

function leerGuardado() {
  try {
    const crudo = localStorage.getItem(CLAVE_A11Y);
    if (!crudo) return null;
    const datos = JSON.parse(crudo);
    if (!datos || typeof datos !== 'object') return null;
    const estado = { ...ESTADO_INICIAL };
    for (const clave of Object.keys(ESTADO_INICIAL)) {
      if (clave === 'textoGrande') { if (TAMANOS_TEXTO.includes(Number(datos.textoGrande))) estado.textoGrande = Number(datos.textoGrande); }
      else if (typeof datos[clave] === 'boolean') estado[clave] = datos[clave];
    }
    return estado;
  } catch {
    return null;
  }
}

function guardar(estado) {
  try { localStorage.setItem(CLAVE_A11Y, JSON.stringify(estado)); } catch { /* almacenamiento bloqueado: sólo esta sesión */ }
}

function preferenciaSistema(consulta) {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  try { return window.matchMedia(consulta).matches; } catch { return false; }
}

const soportaLectura = typeof window !== 'undefined' && 'speechSynthesis' in window;

// Hoja de Atkinson Hyperlegible: se inyecta como <link> la primera vez que se enciende
// "Fuente legible" (no va en el CSS del bundle para no bloquear la carga del kiosco).
const ID_FUENTE_LEGIBLE = 'terra-fuente-legible';
const URL_FUENTE_LEGIBLE = 'https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&display=swap';
function cargarFuenteLegible() {
  if (typeof document === 'undefined' || document.getElementById(ID_FUENTE_LEGIBLE)) return;
  const enlace = document.createElement('link');
  enlace.id = ID_FUENTE_LEGIBLE;
  enlace.rel = 'stylesheet';
  enlace.href = URL_FUENTE_LEGIBLE;
  document.head.appendChild(enlace);
}

export function ModoAccesibleProvider({ children }) {
  const { anunciar, cambiarVoz, vozActiva, detener } = useAccesibilidad();
  const [estado, setEstado] = useState(() => leerGuardado() || ESTADO_INICIAL);
  const [reduceMotionSO, setReduceMotionSO] = useState(() => preferenciaSistema('(prefers-reduced-motion: reduce)'));
  const [contrasteSO, setContrasteSO] = useState(() => preferenciaSistema('(prefers-contrast: more)'));
  // Para apagar la lectura por voz al salir del modo sólo si fue el modo quien la encendió.
  const vozEncendidaPorModoRef = useRef(false);
  // Cada activación incrementa este contador: BotonesVoz lo usa para abrir el panel de comandos.
  const [solicitudPanelVoz, setSolicitudPanelVoz] = useState(0);

  // Preferencias del sistema operativo (se respetan aunque el modo esté apagado).
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mqMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mqContraste = window.matchMedia('(prefers-contrast: more)');
    const alCambiarMotion = (e) => setReduceMotionSO(e.matches);
    const alCambiarContraste = (e) => setContrasteSO(e.matches);
    mqMotion.addEventListener?.('change', alCambiarMotion);
    mqContraste.addEventListener?.('change', alCambiarContraste);
    return () => {
      mqMotion.removeEventListener?.('change', alCambiarMotion);
      mqContraste.removeEventListener?.('change', alCambiarContraste);
    };
  }, []);

  // Reflejo del estado en <html>.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const raiz = document.documentElement;
    const { activo } = estado;
    const clases = {
      'modo-accesible': activo,
      'a11y-contraste': (activo && estado.altoContraste) || contrasteSO,
      'a11y-botones': activo && estado.botonesGrandes,
      'a11y-foco': activo && estado.focoReforzado,
      'a11y-enlaces': activo && estado.subrayarEnlaces,
      'a11y-sin-animacion': (activo && estado.sinAnimaciones) || reduceMotionSO,
      'a11y-fuente': activo && estado.fuenteLegible,
      'a11y-leer': activo && estado.leerEnVoz && soportaLectura,
      'a11y-mas-tiempo': activo && estado.masTiempo,
    };
    for (const [clase, encendida] of Object.entries(clases)) raiz.classList.toggle(clase, Boolean(encendida));
    if (clases['a11y-fuente']) cargarFuenteLegible();
    if (activo && estado.textoGrande !== 100) raiz.style.fontSize = `${estado.textoGrande}%`;
    else raiz.style.removeProperty('font-size');
    configurarAlertas({ masTiempo: activo && estado.masTiempo });
    guardar(estado);
  }, [estado, reduceMotionSO, contrasteSO]);

  // Lectura en voz alta: reutiliza la voz del AccesibilidadContext.
  useEffect(() => {
    if (!soportaLectura) return;
    const debeLeer = estado.activo && estado.leerEnVoz;
    if (debeLeer && !vozActiva) { vozEncendidaPorModoRef.current = true; cambiarVoz(true); }
    else if (!debeLeer && vozActiva && vozEncendidaPorModoRef.current) { vozEncendidaPorModoRef.current = false; cambiarVoz(false); }
    // vozActiva se omite a propósito: sólo reaccionamos a cambios del modo, no a que el
    // usuario apague el altavoz a mano.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado.activo, estado.leerEnVoz, cambiarVoz]);

  const activar = useCallback(() => {
    setEstado((previo) => ({ ...previo, ...OPCIONES_POR_DEFECTO, activo: true }));
    setSolicitudPanelVoz((n) => n + 1);
    anunciar('Modo accesible activado. Texto grande, alto contraste, botones grandes y lectura en voz alta encendidos. Decí "ayuda" en el micrófono para conocer los comandos.', { forzar: true });
  }, [anunciar]);

  const desactivar = useCallback(() => {
    setEstado((previo) => ({ ...previo, activo: false }));
    detener();
    anunciar('Modo accesible desactivado.', { forzar: true });
  }, [anunciar, detener]);

  const alternar = useCallback(() => {
    setEstado((previo) => {
      if (previo.activo) { detener(); anunciar('Modo accesible desactivado.', { forzar: true }); return { ...previo, activo: false }; }
      anunciar('Modo accesible activado. Decí "ayuda" en el micrófono para conocer los comandos.', { forzar: true });
      return { ...previo, ...OPCIONES_POR_DEFECTO, activo: true };
    });
    setSolicitudPanelVoz((n) => n + 1);
  }, [anunciar, detener]);

  const cambiarOpcion = useCallback((clave, valor) => {
    if (!(clave in ESTADO_INICIAL) || clave === 'activo') return;
    setEstado((previo) => {
      if (clave === 'textoGrande') return { ...previo, textoGrande: TAMANOS_TEXTO.includes(Number(valor)) ? Number(valor) : previo.textoGrande };
      return { ...previo, [clave]: Boolean(valor) };
    });
    const opcion = OPCIONES.find((o) => o.clave === clave);
    if (opcion) anunciar(`${opcion.etiqueta} ${valor ? 'activado' : 'desactivado'}.`, { forzar: true });
    else if (clave === 'textoGrande') anunciar(`Tamaño de texto ${valor} por ciento.`, { forzar: true });
  }, [anunciar]);

  const restablecer = useCallback(() => {
    setEstado({ ...ESTADO_INICIAL });
    detener();
    anunciar('Accesibilidad restablecida. Modo accesible desactivado.', { forzar: true });
  }, [anunciar, detener]);

  // Acciones que dispara la navegación por voz (registroNavegacion: accion 'a11y:...').
  const ejecutarAccionVoz = useCallback((accion) => {
    switch (accion) {
      case 'a11y:alternar': alternar(); return true;
      case 'a11y:activar': if (!estado.activo) activar(); else anunciar('El modo accesible ya está activado.', { forzar: true }); return true;
      case 'a11y:desactivar': if (estado.activo) desactivar(); else anunciar('El modo accesible ya está desactivado.', { forzar: true }); return true;
      case 'a11y:letraMasGrande': {
        const idx = TAMANOS_TEXTO.indexOf(estado.textoGrande);
        const nuevo = TAMANOS_TEXTO[Math.min(TAMANOS_TEXTO.length - 1, idx + 1)];
        setEstado((previo) => ({ ...previo, activo: true, textoGrande: nuevo }));
        anunciar(nuevo === estado.textoGrande ? 'El texto ya está en el tamaño máximo.' : `Texto al ${nuevo} por ciento.`, { forzar: true });
        return true;
      }
      case 'a11y:letraMasPequena': {
        const idx = TAMANOS_TEXTO.indexOf(estado.textoGrande);
        const nuevo = TAMANOS_TEXTO[Math.max(0, idx - 1)];
        setEstado((previo) => ({ ...previo, textoGrande: nuevo }));
        anunciar(nuevo === estado.textoGrande ? 'El texto ya está en el tamaño mínimo.' : `Texto al ${nuevo} por ciento.`, { forzar: true });
        return true;
      }
      case 'a11y:altoContraste': {
        const nuevo = !(estado.activo && estado.altoContraste);
        setEstado((previo) => ({ ...previo, activo: true, altoContraste: nuevo }));
        anunciar(nuevo ? 'Alto contraste activado.' : 'Alto contraste desactivado.', { forzar: true });
        return true;
      }
      default: return false;
    }
  }, [estado, activar, desactivar, alternar, anunciar]);

  const valor = useMemo(() => ({
    estado,
    soportaLectura,
    activar,
    desactivar,
    alternar,
    cambiarOpcion,
    restablecer,
    ejecutarAccionVoz,
    solicitudPanelVoz,
  }), [estado, activar, desactivar, alternar, cambiarOpcion, restablecer, ejecutarAccionVoz, solicitudPanelVoz]);

  return <ModoAccesibleContext.Provider value={valor}>{children}</ModoAccesibleContext.Provider>;
}

export function useModoAccesible() {
  const contexto = useContext(ModoAccesibleContext);
  if (!contexto) throw new Error('useModoAccesible debe usarse dentro de <ModoAccesibleProvider>.');
  return contexto;
}

// Variante segura para componentes que pueden renderizarse sin el provider (tests, páginas sueltas).
export function useModoAccesibleOpcional() {
  return useContext(ModoAccesibleContext);
}
