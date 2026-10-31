import { useState, useMemo, useEffect, useRef, useContext, useCallback } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useCarrito } from '../../hooks/useCarrito.js';
import { obtenerIconoCategoria } from '../../data/categorias.js';
import { SesionClienteContext } from '../../context/SesionClienteContext.jsx';
import { useCatalogoPaginado } from '../../context/CatalogoContext.jsx';
import { useAccesibilidad } from '../../context/AccesibilidadContext.jsx';
import { elegirProducto } from '../../navegacion/interpretarIntencion.js';
import TecladoTactil from '../../components/ui/TecladoTactil.jsx';
import IndicadorCarga from '../../components/ui/IndicadorCarga.jsx';
import { useTutorial } from '../../context/TutorialContext.jsx';
import { marcarTutorialVisto, tutorialYaVisto } from '../../tutorial/almacenamiento.js';
import TutorialInvitacion from '../../tutorial/TutorialInvitacion.jsx';
import { useTutorialGuiado } from '../../tutorial/useTutorialGuiado.js';
import { usePaginadorCompacto } from '../../hooks/usePaginadorCompacto.js';
import { separarOfertasDeBusqueda } from './utils/productoCatalogo.js';
import { limitePorColumnas, paginaConProducto } from './utils/limitePagina.js';
import { useEscanerQr } from './hooks/useEscanerQr.js';
import { useColumnasGrilla } from './hooks/useColumnasGrilla.js';
import BuscadorCatalogo from './components/BuscadorCatalogo.jsx';
import ContadorProductos from './components/ContadorProductos.jsx';
import MenuOrden from './components/MenuOrden.jsx';
import RielCategorias from './components/RielCategorias.jsx';
import GrillaProductos from './components/GrillaProductos.jsx';
import EstadoCatalogo from './components/EstadoCatalogo.jsx';
import PaginadorCatalogo from './components/PaginadorCatalogo.jsx';
import EscanerQrModal from './components/EscanerQrModal.jsx';

// Cuántas categorías se muestran como chips sueltos junto al selector "Todos".
// El resto queda disponible dentro del desplegable.
const CATEGORIAS_VISIBLES = 4;

const NOMBRES_ORDEN = {
  'recomendados': 'Recomendados',
  'ofertas': 'En oferta',
  'precio-asc': 'Menor precio',
  'precio-desc': 'Mayor precio',
  'nombre': 'Nombre A-Z',
};

export default function CatalogoPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const contextoCatalogo = location.state?.catalogo;
  const { items, cantidadTotal, subtotal, agregarProducto, actualizarCantidad, quitarProducto } = useCarrito();
  const { esMayorista } = useContext(SesionClienteContext);

  const { anunciar } = useAccesibilidad();
  const { solicitud: solicitudTutorial, consumirSolicitudTutorial } = useTutorial();
  const [invitacionTutorialAbierta, setInvitacionTutorialAbierta] = useState(false);
  const iniciarTutorial = useTutorialGuiado({ esMayorista });

  const omitirInvitacionTutorial = useCallback(() => {
    marcarTutorialVisto();
    setInvitacionTutorialAbierta(false);
  }, []);

  const comenzarTutorial = () => {
    marcarTutorialVisto();
    setInvitacionTutorialAbierta(false);
    window.setTimeout(() => iniciarTutorial(), 150);
  };

  useEffect(() => {
    if (!solicitudTutorial) return;
    setInvitacionTutorialAbierta(false);
    marcarTutorialVisto();
    consumirSolicitudTutorial();
    iniciarTutorial();
  }, [solicitudTutorial, consumirSolicitudTutorial, iniciarTutorial]);

  useEffect(() => {
    if (tutorialYaVisto()) return undefined;
    const temporizador = window.setTimeout(() => {
      if (!tutorialYaVisto()) setInvitacionTutorialAbierta(true);
    }, 900);
    return () => window.clearTimeout(temporizador);
  }, []);

  // `?buscar=` permite llegar con una búsqueda ya hecha (por ejemplo desde un comando de voz).
  const [buscar, setBuscar] = useState(
    () => contextoCatalogo?.buscar ?? searchParams.get('buscar') ?? '',
  );
  const [cantidadesMayorista, setCantidadesMayorista] = useState({});
  // La búsqueda se envía al backend con un pequeño retraso para no pedir una
  // página por cada tecla pulsada en el teclado táctil.
  const [buscarAplicado, setBuscarAplicado] = useState(
    () => contextoCatalogo?.buscarAplicado ?? (searchParams.get('buscar') || '').trim(),
  );
  useEffect(() => {
    const temporizador = setTimeout(() => setBuscarAplicado(separarOfertasDeBusqueda(buscar).termino), 300);
    return () => clearTimeout(temporizador);
  }, [buscar]);

  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(() => {
    const categoria = contextoCatalogo?.categoria ?? searchParams.get('categoria') ?? '';
    const equivalencias = {
      Dormitorio: 'Colchones',
      Living: 'Muebles',
      'Decoración': 'Almohadas',
    };
    return equivalencias[categoria] || categoria;
  });
  const [orden, setOrden] = useState(() => contextoCatalogo?.orden || 'recomendados');
  // Chip "Ofertas": limita el listado a products.en_oferta = true (se combina con categoría y búsqueda).
  const [soloOfertas, setSoloOfertas] = useState(
    () => contextoCatalogo?.soloOfertas ?? searchParams.get('ofertas') === '1',
  );
  // Chip "Nuevos lanzamientos": limita el listado a productos con nuevo_lanzamiento vigente.
  const [soloNuevos, setSoloNuevos] = useState(
    () => contextoCatalogo?.soloNuevos ?? searchParams.get('nuevos') === '1',
  );
  const [menuOrdenAbierto, setMenuOrdenAbierto] = useState(false);
  const [menuCategoriasAbierto, setMenuCategoriasAbierto] = useState(false);
  const [pagina, setPagina] = useState(() => {
    if (contextoCatalogo?.pagina) return contextoCatalogo.pagina;
    const n = Number(searchParams.get('pagina') || 1);
    return Number.isSafeInteger(n) && n > 0 ? n : 1;
  });

  const estadoCatalogo = {
    catalogo: {
      buscar,
      buscarAplicado,
      categoria: categoriaSeleccionada,
      orden,
      soloOfertas,
      soloNuevos,
      pagina,
    },
  };
  const abrirDetalle = (id) => {
    navigate(`/productos/${id}`, {
      state: {
        catalogo: {
          ...estadoCatalogo.catalogo,
          posicionScroll: window.scrollY,
        },
      },
    });
  };

  // Cualquier cambio de filtro vuelve a la primera página.
  // Elegir una categoría arranca de cero: se borra lo escrito en el buscador para que
  // no quede un término viejo filtrando la categoría nueva.
  const cambiarCategoria = (valor) => {
    setCategoriaSeleccionada(valor);
    setBuscar('');
    setBuscarAplicado('');
    setPagina(1);
    setMenuCategoriasAbierto(false);
    anunciar(valor ? `Categoría ${valor} seleccionada.` : 'Mostrando todos los productos.');
  };
  const cambiarOrden = (valor) => { setOrden(valor); setPagina(1); setMenuOrdenAbierto(false); };
  const alternarOfertas = () => {
    const activo = !soloOfertas;
    setSoloOfertas(activo);
    setPagina(1);
    // La URL refleja el filtro para poder compartirlo o volver con "atrás".
    navigate(activo ? '/catalogo?ofertas=1' : '/catalogo', { replace: true });
    anunciar(activo ? 'Mostrando solo productos en oferta.' : 'Mostrando todos los productos.');
  };
  const alternarNuevos = () => {
    const activo = !soloNuevos;
    setSoloNuevos(activo);
    setPagina(1);
    navigate(activo ? '/catalogo?nuevos=1' : '/catalogo', { replace: true });
    anunciar(activo ? 'Mostrando solo nuevos lanzamientos.' : 'Mostrando todos los productos.');
  };

  // Escribir "oferta de toallas" o "toallas en oferta" en el buscador enciende el
  // chip Ofertas (la parte "oferta de" no se manda al backend).
  useEffect(() => {
    if (separarOfertasDeBusqueda(buscar).ofertas && !soloOfertas) { setSoloOfertas(true); setPagina(1); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buscar]);

  // Los estados se inicializan desde la URL al montar. Si la URL cambia con el
  // catálogo ya abierto (voz, chat, enlaces internos: /catalogo?ofertas=1,
  // ?categoria=, ?buscar=), se vuelven a sincronizar aquí.
  const primeraSincronizacionRef = useRef(true);
  useEffect(() => {
    if (primeraSincronizacionRef.current) { primeraSincronizacionRef.current = false; return; }
    const ofertasUrl = searchParams.get('ofertas') === '1';
    const nuevosUrl = searchParams.get('nuevos') === '1';
    const categoriaUrl = (searchParams.get('categoria') || '').trim();
    const buscarUrl = (searchParams.get('buscar') || '').trim();
    let cambio = false;
    if (ofertasUrl !== soloOfertas) { setSoloOfertas(ofertasUrl); cambio = true; }
    if (nuevosUrl !== soloNuevos) { setSoloNuevos(nuevosUrl); cambio = true; }
    if (searchParams.has('categoria') && categoriaUrl !== categoriaSeleccionada) {
      setCategoriaSeleccionada(categoriaUrl);
      // Misma regla que el chip: una categoría nueva (voz, chat, enlace) limpia la búsqueda anterior.
      if (!searchParams.has('buscar')) { setBuscar(''); setBuscarAplicado(''); }
      cambio = true;
    }
    if (searchParams.has('buscar') && buscarUrl !== buscarAplicado) { setBuscar(buscarUrl); setBuscarAplicado(buscarUrl); cambio = true; }
    if (cambio) setPagina(1);
    // Sólo debe correr cuando cambia la navegación, no cuando el usuario toca los chips.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);
  const cambiarBusqueda = (valor) => { setBuscar(valor); setPagina(1); };

  // Tarjetas por página: un múltiplo de las columnas de la grilla, para que las filas queden
  // completas. Es null hasta medir la grilla (no se pide nada antes).
  const [limite, setLimite] = useState(null);
  const grillaRef = useRef(null);

  const {
    productos,
    paginaMostrada,
    indicePrimero,
    recargando,
    cargando,
    error: errorProductos,
    total: totalProductos,
    totalConocido,
    totalPaginas,
    tieneSiguiente,
    categorias: categoriasApi,
    categoriasCargadas,
    reintentar: reintentarCarga,
  } = useCatalogoPaginado({
    buscar: buscarAplicado,
    categoria: categoriaSeleccionada,
    orden,
    pagina,
    limite,
    soloOfertas,
    soloNuevos,
  });

  // Si cambian las columnas (rotar, redimensionar, texto al 150 %) se recalcula el límite y
  // se va a la página que contiene la primera tarjeta que se ve. Página y límite cambian
  // juntos: un solo pedido.
  useColumnasGrilla(grillaRef, (columnas, indiceVisible) => {
    const nuevo = limitePorColumnas(columnas);
    if (nuevo === limite) return;
    if (limite) setPagina(paginaConProducto(indicePrimero + indiceVisible, nuevo));
    setLimite(nuevo);
  });

  // Si el backend devuelve menos páginas de las que pide la URL, se corrige. Mientras se
  // recarga por un cambio de límite, el total es el del límite anterior: no se toca.
  useEffect(() => {
    if (cargando || recargando) return;
    if (totalConocido && totalPaginas > 0 && pagina > totalPaginas) setPagina(totalPaginas);
  }, [cargando, recargando, totalConocido, totalPaginas, pagina]);

  const posicionScroll = Number(contextoCatalogo?.posicionScroll) || 0;
  const scrollRestauradoRef = useRef(false);
  useEffect(() => {
    if (cargando || !posicionScroll || scrollRestauradoRef.current) return undefined;
    const temporizador = window.setTimeout(() => {
      window.scrollTo(0, posicionScroll);
      scrollRestauradoRef.current = true;
    }, 100);
    return () => window.clearTimeout(temporizador);
  }, [cargando, posicionScroll]);

  // Backend viejo sin total: se puede avanzar una página más allá de lo conocido
  // mientras la actual anuncie que hay siguiente.
  const ultimaPaginaPermitida = totalConocido ? totalPaginas : Math.max(totalPaginas, tieneSiguiente ? pagina + 1 : pagina);
  const mostrarPaginador = totalConocido ? totalPaginas > 1 : (pagina > 1 || tieneSiguiente);
  const paginadorCompacto = usePaginadorCompacto();

  // Orden de respaldo dentro de la página: si el backend ya ordenó, no cambia nada;
  // si es una versión anterior que ignora `orden`, al menos la página se ve ordenada.
  const productosOrdenados = useMemo(() => {
    if (orden === 'recomendados' || orden === 'ofertas') return productos;
    const copia = [...productos];
    if (orden === 'precio-asc') copia.sort((a, b) => a.precio - b.precio);
    else if (orden === 'precio-desc') copia.sort((a, b) => b.precio - a.precio);
    else if (orden === 'nombre') copia.sort((a, b) => String(a.nombre).localeCompare(String(b.nombre)));
    return copia;
  }, [productos, orden]);

  const gridRef = useRef(null);
  const irAPagina = (n) => {
    const destino = Math.min(Math.max(1, n), Math.max(1, ultimaPaginaPermitida));
    if (destino === pagina) {
      anunciar(n > pagina ? 'Ya estás en la última página.' : 'Ya estás en la primera página.');
      return;
    }
    setPagina(destino);
    anunciar(totalConocido ? `Página ${destino} de ${totalPaginas}.` : `Página ${destino}.`);
    const tope = gridRef.current?.getBoundingClientRect().top ?? 0;
    window.scrollTo({ top: Math.max(0, window.scrollY + tope - 140), behavior: 'smooth' });
  };

  // Resultado de cada carga, para lectores de pantalla y lectura por voz.
  useEffect(() => {
    if (cargando || errorProductos) return;
    if (productos.length === 0) { anunciar('No encontramos productos con esos filtros.'); return; }
    anunciar(totalConocido
      ? `${totalProductos} productos disponibles. Página ${pagina} de ${totalPaginas}. Se muestran ${productos.length}.`
      : `Página ${pagina}. Se muestran ${productos.length} productos.`, { interrumpir: false });
  // Sólo cuando cambia el resultado cargado, no en cada render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cargando, errorProductos, productos]);

  // "agregar <producto>" por voz: busca en la página actual por nombre (o por
  // posición: "el segundo"); sin nombre, usa la última tarjeta leída en voz alta.
  const agregarPorVoz = ({ termino = '', ordinal = null } = {}) => {
    const lista = productosFiltrados;
    if (!lista.length) { anunciar('No hay productos en pantalla para agregar.'); return; }
    let elegido = null;
    if (ordinal) elegido = lista[ordinal - 1] || null;
    else if (termino) {
      // Tolera cómo lo escribe el reconocedor: "kit lari", "kit larry", "quit lari"...
      elegido = elegirProducto(lista, termino, (p) => p.nombre, (p) => p.categoria || '');
    } else if (ultimaTarjetaLeidaRef.current) {
      elegido = lista.find((p) => p.id === ultimaTarjetaLeidaRef.current.id) || null;
    } else if (lista.length === 1) {
      elegido = lista[0];
    }
    if (!elegido) {
      anunciar(termino
        ? `No encontré ${termino} en esta página. Di "buscar ${termino}" o el nombre completo.`
        : 'Dime qué producto agregar, por ejemplo "agregar confort lya", o toca primero una tarjeta.');
      return;
    }
    const disponible = Number(elegido.stock) >= 1;
    if (!disponible) { anunciar(`${elegido.nombre} está agotado.`); return; }
    handleAgregar(elegido, 1);
  };
  const agregarPorVozRef = useRef(agregarPorVoz);
  agregarPorVozRef.current = agregarPorVoz;

  // Comandos de voz que afectan al catálogo (ver components/accesibilidad/LectorVoz.jsx).
  const irAPaginaRef = useRef(irAPagina);
  irAPaginaRef.current = irAPagina;
  useEffect(() => {
    const alComando = (evento) => {
      const { accion, valor } = evento.detail || {};
      if (accion === 'siguiente') irAPaginaRef.current(pagina + 1);
      else if (accion === 'anterior') irAPaginaRef.current(pagina - 1);
      else if (accion === 'buscar') cambiarBusqueda(String(valor || ''));
      else if (accion === 'limpiar') { setBuscar(''); setCategoriaSeleccionada(''); setPagina(1); }
      else if (accion === 'agregar') agregarPorVozRef.current(valor && typeof valor === 'object' ? valor : { termino: String(valor || '') });
    };
    window.addEventListener('terra:voz', alComando);
    return () => window.removeEventListener('terra:voz', alComando);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagina]);

  const [agregados, setAgregados] = useState({});

  const [tecladoAbierto, setTecladoAbierto] = useState(false);
  const tecladoRef = useRef(null);

  const [esTactil, setEsTactil] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches
  );

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const mq = window.matchMedia('(max-width: 1023px)');
    const actualizar = (e) => setEsTactil(e.matches);
    mq.addEventListener('change', actualizar);
    return () => mq.removeEventListener('change', actualizar);
  }, []);

  const searchInputRef = useRef(null);
  const ultimaTarjetaLeidaRef = useRef(null);

  const { videoEscanerRef, imagenQrInputRef, ...escaner } = useEscanerQr({
    abrirAlEntrar: searchParams.get('abrirQr') === '1',
    items,
    agregarProducto,
    actualizarCantidad,
    navigate,
  });

  // Lista completa de categorías (desde la API, con total de productos por categoría).
  // Si la API aún no respondió, se infieren de la página actual para no dejar el riel vacío.
  const categoriasDinamicas = useMemo(() => {
    const lista = [];
    if (categoriasApi.length > 0) {
      for (const cat of categoriasApi) {
        lista.push({
          id: cat.nombre,
          nombre: cat.nombre,
          icon: cat.icon || obtenerIconoCategoria(cat.nombre),
          total: cat.total,
        });
      }
    } else {
      const conteo = {};
      for (const p of productos) {
        const cat = (p.categoria || '').trim();
        if (cat) conteo[cat] = (conteo[cat] || 0) + 1;
      }
      for (const cat of Object.keys(conteo).sort((a, b) => conteo[b] - conteo[a])) {
        lista.push({ id: cat, nombre: cat, icon: obtenerIconoCategoria(cat), total: conteo[cat] });
      }
    }
    return lista;
  }, [productos, categoriasApi]);

  const esCategoriaActiva = (id) =>
    Boolean(categoriaSeleccionada) && Boolean(id) && categoriaSeleccionada.toLowerCase() === id.toLowerCase();

  // Chips sueltos: las primeras N categorías. Si la seleccionada no está entre ellas,
  // se muestra en el botón desplegable para que siempre se vea qué filtro está activo.
  const categoriasEnRiel = categoriasDinamicas.slice(0, CATEGORIAS_VISIBLES);
  const categoriaActivaObj = categoriasDinamicas.find((cat) => esCategoriaActiva(cat.id));
  const activaFueraDelRiel = Boolean(categoriaActivaObj) && !categoriasEnRiel.some((cat) => esCategoriaActiva(cat.id));
  const totalCategorias = categoriasDinamicas.reduce((suma, cat) => suma + (Number(cat.total) || 0), 0);

  const menuCategoriasRef = useRef(null);
  useEffect(() => {
    if (!menuCategoriasAbierto) return undefined;
    const cerrarFuera = (event) => {
      if (menuCategoriasRef.current && !menuCategoriasRef.current.contains(event.target)) setMenuCategoriasAbierto(false);
    };
    const cerrarEscape = (event) => { if (event.key === 'Escape') setMenuCategoriasAbierto(false); };
    document.addEventListener('mousedown', cerrarFuera);
    document.addEventListener('keydown', cerrarEscape);
    return () => {
      document.removeEventListener('mousedown', cerrarFuera);
      document.removeEventListener('keydown', cerrarEscape);
    };
  }, [menuCategoriasAbierto]);

  // Búsqueda, categoría y orden ya vienen aplicados desde el backend por página.
  const productosFiltrados = productosOrdenados;
  const ventasMaximas = Math.max(0, ...productosFiltrados.map((producto) => Number(producto.ventas || 0)));

  const handleAgregar = (producto, cantidad = 1) => {
    if (!agregarProducto(producto, cantidad)) { anunciar(`No se pudo agregar ${producto.nombre}.`); return; }
    anunciar(cantidad > 1
      ? `${cantidad} unidades de ${producto.nombre} agregadas al carrito.`
      : `${producto.nombre} agregado al carrito.`);
    setAgregados((prev) => ({ ...prev, [producto.id]: true }));
    setTimeout(() => {
      setAgregados((prev) => ({ ...prev, [producto.id]: false }));
    }, 1800);
  };

  const agregarCaracter = (caracter) => {
    setBuscar((prev) => prev + caracter);
    setPagina(1);
  };
  const borrarCaracter = () => {
    setBuscar((prev) => prev.slice(0, -1));
    setPagina(1);
  };
  const pegarCaracteres = (texto) => {
    setBuscar((prev) => prev + texto);
    setPagina(1);
  };
  const abrirTecladoTactil = () => {
    if (esTactil) {
      setTecladoAbierto(true);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!tecladoAbierto || !esTactil) return;
      if (tecladoRef.current && !tecladoRef.current.contains(event.target)) {
        if (!event.target.closest('input')) {
          setTecladoAbierto(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [tecladoAbierto, esTactil]);

  const manejarTeclaTarjeta = (event, producto, disponible) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === 'Enter') abrirDetalle(producto.id);
    if (event.key === ' ' && disponible) { event.preventDefault(); handleAgregar(producto); }
  };

  const manejarClickTarjeta = (event, producto) => {
    if (event.target.closest('button, a')) return;
    // Modo accesible con lectura: el primer toque lee la tarjeta, el segundo la abre.
    const raiz = document.documentElement;
    if (raiz.classList.contains('modo-accesible') && raiz.classList.contains('a11y-leer')) {
      const ahora = Date.now();
      const reciente = ultimaTarjetaLeidaRef.current;
      if (!(reciente && reciente.id === producto.id && ahora - reciente.en < 6000)) {
        ultimaTarjetaLeidaRef.current = { id: producto.id, en: ahora };
        event.currentTarget.classList.add('is-leida');
        window.setTimeout((el) => el?.classList.remove('is-leida'), 6000, event.currentTarget);
        return; // la lectura la hace LectorVoz con data-lectura
      }
      ultimaTarjetaLeidaRef.current = null;
    }
    abrirDetalle(producto.id);
  };

  const restablecerFiltros = () => {
    setBuscar('');
    setCategoriaSeleccionada('');
    setPagina(1);
  };

  const textoContador = cargando
    ? 'Cargando…'
    : totalConocido
      ? `${totalProductos} disponibles${totalPaginas > 1 ? ` · pág. ${paginaMostrada}/${totalPaginas}` : ''}`
      : `${productosFiltrados.length} en esta página · pág. ${paginaMostrada}`;

  const avisoGrilla = cargando
    ? <IndicadorCarga texto="Cargando productos…" />
    : errorProductos
      ? (
        <EstadoCatalogo
          icono="cloud_off"
          titulo="No se pudo cargar el catálogo"
          texto={errorProductos}
          accion="Reintentar"
          onAccion={reintentarCarga}
        />
      )
      : productosFiltrados.length === 0 && (
        <EstadoCatalogo
          icono="search_off"
          titulo="No encontramos productos"
          texto="Prueba cambiando los filtros o limpia la búsqueda."
          accion="Restablecer filtros"
          onAccion={restablecerFiltros}
        />
      );

  return (
    <div
      data-pagina="catalogo"
      className="flex min-h-screen flex-col bg-terra-superficie font-terra text-terra-texto antialiased
        dark:bg-terra-fondo"
    >
      <main className="flex-1 pt-3.75 sm:pt-0">
        <section className="mx-auto max-w-terra px-4 sm:pt-4 sm:pb-3">
          <div className="flex flex-col gap-1 sm:gap-4">
            <BuscadorCatalogo
              ref={searchInputRef}
              valor={buscar}
              esTactil={esTactil}
              onCambiar={cambiarBusqueda}
              onAbrirTeclado={abrirTecladoTactil}
            />
            <div
              className="flex w-full flex-col items-stretch gap-2.5 sm:flex-row sm:flex-wrap sm:items-center
                sm:justify-between sm:gap-4"
            >
              <ContadorProductos texto={textoContador} />
              <MenuOrden
                orden={orden}
                nombreOrden={NOMBRES_ORDEN[orden]}
                abierto={menuOrdenAbierto}
                onAlternar={() => setMenuOrdenAbierto((prev) => !prev)}
                onElegir={cambiarOrden}
              />
            </div>
          </div>
        </section>

        {tecladoAbierto && (
          <TecladoTactil
            ref={tecladoRef}
            onCaracter={agregarCaracter}
            onBorrar={borrarCaracter}
            onCerrar={() => setTecladoAbierto(false)}
            onPegar={pegarCaracteres}
            valorActual={buscar}
          />
        )}

        <RielCategorias
          ref={menuCategoriasRef}
          cargando={!categoriasCargadas && categoriasDinamicas.length === 0}
          categorias={categoriasDinamicas}
          categoriasEnRiel={categoriasEnRiel}
          totalCategorias={totalCategorias}
          categoriaActivaFuera={activaFueraDelRiel ? categoriaActivaObj : null}
          categoriaSeleccionada={categoriaSeleccionada}
          esActiva={esCategoriaActiva}
           soloOfertas={soloOfertas}
           soloNuevos={soloNuevos}
           onAlternarNuevos={alternarNuevos}
           menuAbierto={menuCategoriasAbierto}
          visibles={CATEGORIAS_VISIBLES}
          onAlternarMenu={() => setMenuCategoriasAbierto((prev) => !prev)}
          onCerrarMenu={() => setMenuCategoriasAbierto(false)}
          onAbrirMenu={() => setMenuCategoriasAbierto(true)}
          onElegir={cambiarCategoria}
          onAlternarOfertas={alternarOfertas}
        />

        <section
          ref={gridRef}
          className={`mx-auto px-4 pb-4 md:pr-[max(1rem,calc(var(--terra-flotantes-reserva)-max(1rem,(100vw-1216px)/2)))]
            md:pb-8 md:pl-[max(1rem,calc(var(--terra-a11y-reserva)-max(1rem,(100vw-1216px)/2)))]
            ${esMayorista ? 'max-w-420' : 'max-w-terra'}`}
        >
          <GrillaProductos
            refGrilla={grillaRef}
            aviso={avisoGrilla}
            productos={productosFiltrados}
            esMayorista={esMayorista}
            agregados={agregados}
            ventasMaximas={ventasMaximas}
            cantidadesMayorista={cantidadesMayorista}
            items={items}
            cantidadTotal={cantidadTotal}
            subtotal={subtotal}
            onCambiarCantidad={(id, cantidad) => setCantidadesMayorista((prev) => ({ ...prev, [id]: cantidad }))}
            onAgregar={handleAgregar}
            onQuitar={quitarProducto}
            onClickTarjeta={manejarClickTarjeta}
            onTeclaTarjeta={manejarTeclaTarjeta}
          />

          {!cargando && !errorProductos && mostrarPaginador && (
            <PaginadorCatalogo
              pagina={paginaMostrada}
              ultimaPagina={ultimaPaginaPermitida}
              tieneSiguiente={tieneSiguiente}
              compacto={paginadorCompacto}
              onIr={irAPagina}
            />
          )}
        </section>
      </main>

      <EscanerQrModal escaner={escaner} refVideo={videoEscanerRef} refArchivo={imagenQrInputRef} />

      <TutorialInvitacion
        abierto={invitacionTutorialAbierta}
        onComenzar={comenzarTutorial}
        onOmitir={omitirInvitacionTutorial}
      />
    </div>
  );
}
