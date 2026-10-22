import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAccesibilidad } from '../../context/AccesibilidadContext.jsx';
import { useTema } from '../../context/TemaContext.jsx';
import { useNavegacion } from '../../navegacion/NavegacionContext.jsx';
import { interpretarAgregar, interpretarIntencion, normalizar } from '../../navegacion/interpretarIntencion.js';
import { destinosDisponibles, nombreDePagina } from '../../navegacion/registroNavegacion.js';
import { apiRequest } from '../../services/api.js';
import { elementoInteractivoDesde, nombreAccesible, rolLegible } from '../../utils/nombreAccesible.js';

// Vive dentro del router (en el Layout público, el admin y el vendedor). Hace tres cosas:
//  1. Anuncia cada cambio de página y mueve el foco al contenido (clave para NVDA).
//  2. Con la lectura por voz activa, lee el elemento que recibe foco o se toca.
//  3. Interpreta los comandos hablados: los de lectura/tema/silencio se resuelven aquí;
//     la navegación se delega a interpretarIntencion + NavegacionContext.

export { nombreDePagina };

// Misma normalización que el intérprete: sin acentos, sin mayúsculas y sin la
// puntuación automática del dictado ("Escanear." -> "escanear").
const sinAcentos = (texto) => normalizar(texto);

const COMANDOS_FIJOS = 'buscar y el nombre del producto, agregar y el nombre del producto, siguiente, anterior, leer página, modo noche, modo día, volver, silencio o ayuda';
export const AYUDA_COMANDOS = `Podés decir: inicio, catálogo, categorías, carrito, ${COMANDOS_FIJOS}.`;
const AYUDA_POR_LECTURA = 6;

export default function LectorVoz() {
  const { vozActiva, anunciar, hablar, detener, cambiarVoz, registrarManejadorComando } = useAccesibilidad();
  const { cambiarTema } = useTema();
  const { ejecutarIntencion, contextoActual, hayConfirmacionPendiente, responderConfirmacion } = useNavegacion();
  const navigate = useNavigate();
  const location = useLocation();
  const primeraRutaRef = useRef(true);
  const ayudaOffsetRef = useRef(0);
  const ultimasInstruccionesRef = useRef('');

  // 1. Cambio de página: título del documento, anuncio y foco al contenido.
  useEffect(() => {
    const nombre = nombreDePagina(location.pathname);
    document.title = `${nombre} · TERRA Autoservicio`;
    const contenido = document.getElementById('contenido');
    if (contenido && !primeraRutaRef.current) {
      contenido.focus({ preventScroll: true });
    }
    anunciar(primeraRutaRef.current ? `${nombre}. TERRA Autoservicio.` : nombre, { interrumpir: true });
    primeraRutaRef.current = false;
    ayudaOffsetRef.current = 0;
  }, [location.pathname, anunciar]);

  // 2. Lectura de lo que recibe foco o se toca.
  useEffect(() => {
    if (!vozActiva) return undefined;
    let ultimoElemento = null;
    let ultimoMomento = 0;
    const leer = (elemento) => {
      if (!elemento) return;
      const ahora = Date.now();
      if (elemento === ultimoElemento && ahora - ultimoMomento < 1000) return;
      ultimoElemento = elemento;
      ultimoMomento = ahora;
      // Tarjetas de producto: texto armado por la página (nombre, medida, precio, oferta).
      const lectura = elemento.closest?.('[data-lectura]')?.dataset?.lectura;
      if (lectura) { hablar(lectura); return; }
      const nombre = nombreAccesible(elemento);
      if (!nombre) return;
      const rol = rolLegible(elemento);
      hablar(rol ? `${nombre}, ${rol}` : nombre);
    };
    // Sólo controles: el foco en <main> tras cambiar de página ya se anuncia aparte.
    const alEnfocar = (evento) => leer(elementoInteractivoDesde(evento.target));
    const alTocar = (evento) => {
      // Bloques marcados con data-sin-lectura (p. ej. el panel de comandos) no se leen.
      if (evento.target?.closest?.('[data-sin-lectura]')) return;
      const interactivo = elementoInteractivoDesde(evento.target);
      if (interactivo) leer(interactivo);
      else {
        // Texto suelto (párrafos, títulos): se lee el bloque más cercano.
        const bloque = evento.target?.closest?.('h1, h2, h3, p, li, label, figcaption, small, strong');
        if (bloque) leer(bloque);
      }
    };
    document.addEventListener('focusin', alEnfocar);
    document.addEventListener('click', alTocar, true);
    return () => {
      document.removeEventListener('focusin', alEnfocar);
      document.removeEventListener('click', alTocar, true);
    };
  }, [vozActiva, hablar]);

  // 3. Comandos de voz.
  useEffect(() => {
    const emitir = (accion, valor) => window.dispatchEvent(new CustomEvent('terra:voz', { detail: { accion, valor } }));

    const leerPagina = () => {
      const contenido = document.getElementById('contenido') || document.body;
      const titulos = Array.from(contenido.querySelectorAll('h1, h2')).map((el) => el.innerText.trim()).filter(Boolean).slice(0, 6);
      const botones = contenido.querySelectorAll('button, a[href]').length;
      const nombre = nombreDePagina(location.pathname);
      anunciar(`${nombre}. ${titulos.length ? `Secciones: ${titulos.join('. ')}.` : ''} Hay ${botones} controles. Navegá con la tecla Tab o tocando la pantalla.`, { forzar: true });
    };

    // Ayuda contextual: sólo los destinos de la zona y el rol actuales, de a 6.
    const leerAyuda = (continuar = false) => {
      const disponibles = destinosDisponibles(contextoActual());
      const nombres = disponibles.map((d) => d.alias[0]);
      if (!continuar) ayudaOffsetRef.current = 0;
      const tramo = nombres.slice(ayudaOffsetRef.current, ayudaOffsetRef.current + AYUDA_POR_LECTURA);
      ayudaOffsetRef.current += AYUDA_POR_LECTURA;
      const quedan = nombres.length - ayudaOffsetRef.current;
      if (!tramo.length) {
        ayudaOffsetRef.current = 0;
        return anunciar(`También podés decir: ${COMANDOS_FIJOS}.`, { forzar: true });
      }
      anunciar(`Podés decir: ${tramo.join(', ')}. ${quedan > 0 ? 'Decí "más" para escuchar el resto.' : `También: ${COMANDOS_FIJOS}.`}`, { forzar: true });
    };

    // Instrucciones de armado/uso leídas en voz alta.
    const leerInstrucciones = async (termino) => {
      anunciar(`Buscando instrucciones de ${termino}.`, { forzar: true });
      try {
        const r = await apiRequest(`/asistente/instrucciones?termino=${encodeURIComponent(termino)}`);
        const lista = Array.isArray(r) ? r : r?.data || [];
        if (!lista.length) {
          ultimasInstruccionesRef.current = '';
          return anunciar(`No encontré instrucciones para ${termino}. Podés consultarlo con un asesor.`, { forzar: true });
        }
        const producto = lista[0];
        const pasos = String(producto.instrucciones || '').split(/\r?\n+/).map((p) => p.trim()).filter(Boolean);
        const texto = `Instrucciones de ${producto.producto}. ${pasos.join('. ')}. ${producto.videos_url ? 'Hay un video de armado disponible en la ficha del producto.' : ''} Decí "repetir" para escucharlas de nuevo.`;
        ultimasInstruccionesRef.current = texto;
        anunciar(texto, { forzar: true });
      } catch (err) {
        anunciar(err?.message || 'No se pudieron cargar las instrucciones.', { forzar: true });
      }
    };

    const manejar = (fraseOriginal) => {
      const frase = sinAcentos(fraseOriginal);
      const tiene = (...palabras) => palabras.some((p) => frase.includes(p));

      // Una confirmación pendiente ("¿cerrar sesión?") captura la siguiente frase.
      if (hayConfirmacionPendiente && responderConfirmacion(frase)) return;

      if (tiene('ayuda', 'que puedo decir', 'comandos')) return leerAyuda(false);
      if (frase === 'mas' || frase === 'mas opciones' || frase === 'mas comandos') return leerAyuda(true);
      if (tiene('silencio', 'callate', 'parar', 'detener', 'basta')) { detener(); return; }
      if (tiene('activar lectura', 'activa la lectura', 'leer en voz', 'activar voz')) return cambiarVoz(true);
      if (tiene('desactivar lectura', 'apagar lectura', 'apagar voz', 'desactivar voz')) return cambiarVoz(false);
      if (tiene('modo noche', 'modo oscuro')) { cambiarTema('oscuro'); return anunciar('Modo noche activado.', { forzar: true }); }
      if (tiene('modo dia', 'modo claro')) { cambiarTema('claro'); return anunciar('Modo día activado.', { forzar: true }); }
      if (tiene('leer pagina', 'leer la pagina', 'donde estoy', 'que hay aqui') || frase === 'leer') return leerPagina();
      if (tiene('repetir', 'repeti', 'otra vez')) {
        if (ultimasInstruccionesRef.current) return anunciar(ultimasInstruccionesRef.current, { forzar: true });
        return leerPagina();
      }

      // Comandos del catálogo que no cambian de página.
      if (tiene('limpiar busqueda', 'borrar busqueda', 'quitar filtros', 'limpiar filtros')) { emitir('limpiar'); return anunciar('Filtros limpiados.', { forzar: true }); }
      if (tiene('siguiente', 'proxima', 'avanzar')) { emitir('siguiente'); return; }
      if (tiene('anterior', 'retroceder', 'pagina previa')) { emitir('anterior'); return; }
      if (tiene('volver', 'atras', 'regresar')) { navigate(-1); return anunciar('Volviendo.', { forzar: true }); }
      const pedidoAgregar = interpretarAgregar(frase);
      if (pedidoAgregar) {
        const enCatalogo = location.pathname === '/catalogo';
        const enDetalle = location.pathname.startsWith('/productos/');
        if (!enCatalogo && !enDetalle) return anunciar('Para agregar al carrito, primero abrí el catálogo o un producto. Decí "catálogo".', { forzar: true });
        emitir('agregar', pedidoAgregar);
        return;
      }

      // Navegación por intención (voz y chat comparten el registro).
      const ctx = contextoActual();
      const { destino, parametros } = interpretarIntencion(frase, ctx);

      if (destino === 'buscar') {
        const termino = parametros.termino;
        // Siempre por URL: el catálogo sincroniza búsqueda y filtro de ofertas desde ahí.
        // Una búsqueda normal quita el filtro de ofertas; "ofertas de X" lo mantiene.
        const url = `/catalogo?buscar=${encodeURIComponent(termino)}${parametros.ofertas ? '&ofertas=1' : ''}`;
        navigate(url);
        return anunciar(parametros.ofertas ? `Buscando ofertas de ${termino}.` : `Buscando ${termino}.`, { forzar: true });
      }
      if (destino === 'categoria') {
        navigate(`/catalogo?categoria=${encodeURIComponent(parametros.categoria)}`);
        return anunciar(`Mostrando la categoría ${parametros.categoria}.`, { forzar: true });
      }
      if (destino === 'instrucciones') { leerInstrucciones(parametros.termino); return; }
      if (destino && ejecutarIntencion({ destino, parametros }, { origen: 'voz' })) return;

      anunciar(`No entendí "${fraseOriginal}". Decí "ayuda" para escuchar las opciones.`, { forzar: true });
    };

    return registrarManejadorComando(manejar);
  }, [navigate, location.pathname, anunciar, detener, cambiarVoz, cambiarTema, registrarManejadorComando, ejecutarIntencion, contextoActual, hayConfirmacionPendiente, responderConfirmacion]);

  return null;
}
