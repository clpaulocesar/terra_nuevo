import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAccesibilidad } from '../../context/AccesibilidadContext.jsx';
import { useTema } from '../../context/TemaContext.jsx';
import { elementoInteractivoDesde, nombreAccesible, rolLegible } from '../../utils/nombreAccesible.js';

// Vive dentro del router. Hace tres cosas:
//  1. Anuncia cada cambio de página y mueve el foco al contenido (clave para NVDA).
//  2. Con la lectura por voz activa, lee el elemento que recibe foco o se toca.
//  3. Interpreta los comandos hablados y navega.

const NOMBRES_PAGINA = [
  [/^\/$/, 'Inicio'],
  [/^\/catalogo/, 'Catálogo de productos'],
  [/^\/categorias/, 'Líneas y categorías'],
  [/^\/productos\//, 'Detalle de producto'],
  [/^\/carrito/, 'Carrito de compras'],
  [/^\/identificacion/, 'Identificación del cliente'],
  [/^\/confirmacion/, 'Confirmación del pedido'],
  [/^\/pedido/, 'Pedido generado'],
  [/^\/admin\/login/, 'Acceso de administrador'],
  [/^\/admin/, 'Panel de administración'],
];

export function nombreDePagina(pathname) {
  const par = NOMBRES_PAGINA.find(([re]) => re.test(pathname));
  return par ? par[1] : 'Página';
}

const sinAcentos = (texto) => String(texto || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

export const AYUDA_COMANDOS = 'Podés decir: inicio, catálogo, categorías, carrito, siguiente, anterior, buscar y el nombre del producto, limpiar búsqueda, leer página, modo noche, modo día, volver, silencio o ayuda.';

export default function LectorVoz() {
  const { vozActiva, anunciar, hablar, detener, cambiarVoz, registrarManejadorComando } = useAccesibilidad();
  const { cambiarTema } = useTema();
  const navigate = useNavigate();
  const location = useLocation();
  const primeraRutaRef = useRef(true);

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
      const nombre = nombreAccesible(elemento);
      if (!nombre) return;
      const rol = rolLegible(elemento);
      hablar(rol ? `${nombre}, ${rol}` : nombre);
    };
    // Sólo controles: el foco en <main> tras cambiar de página ya se anuncia aparte.
    const alEnfocar = (evento) => leer(elementoInteractivoDesde(evento.target));
    const alTocar = (evento) => {
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
    const irA = (ruta, nombre) => { navigate(ruta); anunciar(`Abriendo ${nombre}.`, { forzar: true }); };
    const leerPagina = () => {
      const contenido = document.getElementById('contenido') || document.body;
      const titulos = Array.from(contenido.querySelectorAll('h1, h2')).map((el) => el.innerText.trim()).filter(Boolean).slice(0, 6);
      const botones = contenido.querySelectorAll('button, a[href]').length;
      const nombre = nombreDePagina(location.pathname);
      anunciar(`${nombre}. ${titulos.length ? `Secciones: ${titulos.join('. ')}.` : ''} Hay ${botones} controles. Navegá con la tecla Tab o tocando la pantalla.`, { forzar: true });
    };

    const manejar = (fraseOriginal) => {
      const frase = sinAcentos(fraseOriginal);
      const tiene = (...palabras) => palabras.some((p) => frase.includes(p));

      if (tiene('ayuda', 'que puedo decir', 'comandos')) return anunciar(AYUDA_COMANDOS, { forzar: true });
      if (tiene('silencio', 'callate', 'parar', 'detener', 'basta')) { detener(); return; }
      if (tiene('activar lectura', 'activa la lectura', 'leer en voz', 'activar voz')) return cambiarVoz(true);
      if (tiene('desactivar lectura', 'apagar lectura', 'apagar voz', 'desactivar voz')) return cambiarVoz(false);
      if (tiene('modo noche', 'modo oscuro')) { cambiarTema('oscuro'); return anunciar('Modo noche activado.', { forzar: true }); }
      if (tiene('modo dia', 'modo claro')) { cambiarTema('claro'); return anunciar('Modo día activado.', { forzar: true }); }
      if (tiene('leer pagina', 'leer la pagina', 'donde estoy', 'que hay aqui', 'leer')) return leerPagina();

      const busqueda = frase.match(/^(?:buscar|busca|buscame|quiero|encontrar|mostrar|mostrame)\s+(.+)$/);
      if (busqueda) {
        const termino = busqueda[1].replace(/^(un|una|unos|unas|el|la|los|las)\s+/, '').trim();
        if (location.pathname !== '/catalogo') navigate(`/catalogo?buscar=${encodeURIComponent(termino)}`);
        else emitir('buscar', termino);
        return anunciar(`Buscando ${termino}.`, { forzar: true });
      }
      if (tiene('limpiar busqueda', 'borrar busqueda', 'quitar filtros', 'limpiar filtros')) { emitir('limpiar'); return anunciar('Filtros limpiados.', { forzar: true }); }
      if (tiene('siguiente', 'proxima', 'avanzar')) { emitir('siguiente'); return; }
      if (tiene('anterior', 'retroceder', 'pagina previa')) { emitir('anterior'); return; }
      if (tiene('volver', 'atras', 'regresar')) { navigate(-1); return anunciar('Volviendo.', { forzar: true }); }
      if (tiene('inicio', 'principal', 'portada')) return irA('/', 'inicio');
      if (tiene('catalogo', 'productos', 'colchones', 'sommiers', 'camas')) return irA('/catalogo', 'el catálogo de productos');
      if (tiene('categorias', 'lineas')) return irA('/categorias', 'líneas y categorías');
      if (tiene('carrito', 'mi compra', 'mi pedido')) return irA('/carrito', 'el carrito');
      if (tiene('finalizar', 'confirmar compra', 'generar pedido', 'pagar')) return irA('/carrito', 'el carrito para confirmar la compra');
      if (tiene('agregar', 'añadir')) { emitir('agregar', frase); return; }
      if (tiene('escanear', 'qr', 'camara')) return irA('/catalogo?abrirQr=1', 'la cámara para escanear códigos QR');

      anunciar(`No reconocí el comando "${fraseOriginal}". ${AYUDA_COMANDOS}`, { forzar: true });
    };

    return registrarManejadorComando(manejar);
  }, [navigate, location.pathname, anunciar, detener, cambiarVoz, cambiarTema, registrarManejadorComando]);

  return null;
}
