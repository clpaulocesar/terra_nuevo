import React, { useState, useMemo, useEffect, useRef, useContext } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Camera, Check, ExternalLink, QrCode, ShoppingCart, X } from 'lucide-react';
import { useCarrito } from '../hooks/useCarrito.js';
import { obtenerProducto } from '../services/productoService.js';
import { agregarProductoCarritoQr, leerCarritoQr } from '../services/qrCartService.js';
import { formatoMoneda } from '../utils/formatoMoneda.js';
import { obtenerIconoCategoria } from '../data/categorias.js';
import { SesionClienteContext } from '../context/SesionClienteContext.jsx';
import { LIMITE_CATALOGO, useCatalogoPaginado } from '../context/CatalogoContext.jsx';
import { imagenDeProducto, usarImagenFallback } from '../utils/imagenProducto.js';
import { useAccesibilidad } from '../context/AccesibilidadContext.jsx';
import './Catalogo.css';

// Cuántas categorías se muestran como chips sueltos junto al selector "Todos".
// El resto queda disponible dentro del desplegable.
const CATEGORIAS_VISIBLES = 4;

// Rango de botones numerados que se muestran en el paginador (con "…" entre saltos).
const paginasVisibles = (actual, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const conjunto = new Set([1, total, actual - 1, actual, actual + 1]);
  if (actual <= 3) [2, 3, 4].forEach((n) => conjunto.add(n));
  if (actual >= total - 2) [total - 1, total - 2, total - 3].forEach((n) => conjunto.add(n));
  const lista = [...conjunto].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const resultado = [];
  lista.forEach((n, i) => {
    if (i > 0 && n - lista[i - 1] > 1) resultado.push(`gap-${n}`);
    resultado.push(n);
  });
  return resultado;
};

const coloresDeProducto = (producto) => {
  const registros = Array.isArray(producto?.colores) ? producto.colores : [];
  const lista = [];
  const vistos = new Set();
  for (const registro of registros) {
    let nombre = '';
    let valor = '';
    if (registro && typeof registro === 'object') {
      nombre = String(registro.nombre || registro.name || '').trim();
      valor = String(registro.valor || registro.color || '').trim();
    } else {
      const texto = String(registro || '').trim();
      try {
        const dato = JSON.parse(texto);
        nombre = String(dato?.nombre || dato?.name || '').trim();
        valor = String(dato?.valor || dato?.color || '').trim();
      } catch {
        const [parte1, parte2] = texto.split('|');
        nombre = (parte2 ? parte1 : parte1) || 'Color';
        valor = parte2 || parte1;
      }
    }
    const hex = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(valor) ? valor : '';
    if (!hex) continue;
    const clave = (nombre || hex).toLowerCase();
    if (vistos.has(clave)) continue;
    vistos.add(clave);
    lista.push({ nombre: nombre || 'Color', valor: hex });
  }
  return lista;
};

export default function Catalogo() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { cantidadTotal, subtotal, agregarProducto } = useCarrito();
  const { esMayorista } = useContext(SesionClienteContext);

  const abrirCamaraAlEntrar = searchParams.get('abrirQr') === '1';

  const { anunciar } = useAccesibilidad();

  // `?buscar=` permite llegar con una búsqueda ya hecha (por ejemplo desde un comando de voz).
  const [buscar, setBuscar] = useState(() => searchParams.get('buscar') || '');
  // La búsqueda se envía al backend con un pequeño retraso para no pedir una
  // página por cada tecla pulsada en el teclado táctil.
  const [buscarAplicado, setBuscarAplicado] = useState(() => (searchParams.get('buscar') || '').trim());
  useEffect(() => {
    const temporizador = setTimeout(() => setBuscarAplicado(buscar.trim()), 300);
    return () => clearTimeout(temporizador);
  }, [buscar]);

  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(() => {
    const categoria = searchParams.get('categoria') || '';
    const equivalencias = {
      Dormitorio: 'Colchones',
      Living: 'Muebles',
      'Decoración': 'Almohadas',
    };
    return equivalencias[categoria] || categoria;
  });
  const [orden, setOrden] = useState('recomendados');
  const [menuOrdenAbierto, setMenuOrdenAbierto] = useState(false);
  const [menuCategoriasAbierto, setMenuCategoriasAbierto] = useState(false);
  const [pagina, setPagina] = useState(() => {
    const n = Number(searchParams.get('pagina') || 1);
    return Number.isSafeInteger(n) && n > 0 ? n : 1;
  });

  // Cualquier cambio de filtro vuelve a la primera página.
  const cambiarCategoria = (valor) => {
    setCategoriaSeleccionada(valor);
    setPagina(1);
    setMenuCategoriasAbierto(false);
    anunciar(valor ? `Categoría ${valor} seleccionada.` : 'Mostrando todos los productos.');
  };
  const cambiarOrden = (valor) => { setOrden(valor); setPagina(1); setMenuOrdenAbierto(false); };
  const cambiarBusqueda = (valor) => { setBuscar(valor); setPagina(1); };

  const {
    productos,
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
    limite: LIMITE_CATALOGO,
  });

  // Si el backend devuelve menos páginas de las que pide la URL, se corrige.
  useEffect(() => {
    if (!cargando && totalConocido && totalPaginas > 0 && pagina > totalPaginas) setPagina(totalPaginas);
  }, [cargando, totalConocido, totalPaginas, pagina]);

  // Backend viejo sin total: se puede avanzar una página más allá de lo conocido
  // mientras la actual anuncie que hay siguiente.
  const ultimaPaginaPermitida = totalConocido ? totalPaginas : Math.max(totalPaginas, tieneSiguiente ? pagina + 1 : pagina);
  const mostrarPaginador = totalConocido ? totalPaginas > 1 : (pagina > 1 || tieneSiguiente);

  // Orden de respaldo dentro de la página: si el backend ya ordenó, no cambia nada;
  // si es una versión anterior que ignora `orden`, al menos la página se ve ordenada.
  const productosOrdenados = useMemo(() => {
    if (orden === 'recomendados') return productos;
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
    };
    window.addEventListener('terra:voz', alComando);
    return () => window.removeEventListener('terra:voz', alComando);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagina]);

  const [agregados, setAgregados] = useState({});

  const [modalAsesorAbierto, setModalAsesorAbierto] = useState(false);

  const [tecladoAbierto, setTecladoAbierto] = useState(false);
  const [modoNumerico, setModoNumerico] = useState(false);
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

  const [segundosSesion, setSegundosSesion] = useState(180);

  const searchInputRef = useRef(null);

  const [escanerAbierto, setEscanerAbierto] = useState(abrirCamaraAlEntrar);
  const [carritoQr, setCarritoQr] = useState(() => {
    try { return leerCarritoQr(); } catch { return []; }
  });
  const [estadoEscaner, setEstadoEscaner] = useState('');
  const [errorEscaner, setErrorEscaner] = useState(false);
  const [ultimoProductoQrId, setUltimoProductoQrId] = useState('');

  const videoEscanerRef = useRef(null);
  const escanerProcesandoRef = useRef(false);

  useEffect(() => {
    if (abrirCamaraAlEntrar) navigate('/catalogo', { replace: true });
  }, [abrirCamaraAlEntrar, navigate]);

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

  useEffect(() => {
    const timer = setInterval(() => {
      setSegundosSesion((prev) => (prev > 0 ? prev - 1 : 180));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatoTiempo = useMemo(() => {
    const minutos = Math.floor(segundosSesion / 60);
    const segundos = segundosSesion % 60;
    return `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')} min`;
  }, [segundosSesion]);

  // Búsqueda, categoría y orden ya vienen aplicados desde el backend por página.
  const productosFiltrados = productosOrdenados;

  const handleAgregar = (producto) => {
    if (!agregarProducto(producto)) { anunciar(`No se pudo agregar ${producto.nombre}.`); return; }
    anunciar(`${producto.nombre} agregado al carrito.`);
    setAgregados((prev) => ({ ...prev, [producto.id]: true }));
    setTimeout(() => {
      setAgregados((prev) => ({ ...prev, [producto.id]: false }));
    }, 1800);
  };

  const agregarCaracter = (caracter) => {
    setBuscar((prev) => prev + caracter);
    setPagina(1);
  };
  const alternarModoNumerico = () => {
    setModoNumerico((prev) => !prev);
  };
  const borrarCaracter = () => {
    setBuscar((prev) => prev.slice(0, -1));
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

  const nombreOrdenActual = {
    'recomendados': 'Recomendados',
    'precio-asc': 'Menor precio',
    'precio-desc': 'Mayor precio',
    'nombre': 'Nombre A-Z',
  }[orden];

  const unidadesQr = carritoQr.reduce((total, item) => total + Number(item.cantidad), 0);
  const totalQr = carritoQr.reduce((total, item) => total + Number(item.precio) * Number(item.cantidad), 0);

  const obtenerIdDelQr = (texto) => {
    const valor = String(texto || '').trim();
    try {
      const url = new URL(valor, window.location.origin);
      const id = url.searchParams.get('id') || url.searchParams.get('producto') || url.searchParams.get('p');
      if (id) return id.trim();
    } catch {
    }
    return /^[a-zA-Z0-9_-]{1,100}$/.test(valor) ? valor : null;
  };

  const confirmarCompraQr = () => {
    if (!unidadesQr) return;
    setEscanerAbierto(false);
    navigate('/carrito?confirmarQr=1');
  };

  useEffect(() => {
    if (!escanerAbierto || !videoEscanerRef.current) return undefined;
    let cancelado = false;
    let controlesCamara;
    escanerProcesandoRef.current = false;
    setEstadoEscaner('Solicitando acceso a la cámara…');
    setErrorEscaner(false);
    const mostrarErrorCamara = (error) => {
      if (cancelado) return;
      const mensaje = error?.name === 'NotAllowedError'
        ? 'Permite el acceso a la cámara en tu navegador para escanear los productos.'
        : error?.name === 'NotFoundError'
        ? 'No se encontró una cámara disponible en este dispositivo.'
        : 'No se pudo iniciar la cámara. Verificá los permisos del navegador y volvé a intentar.';
      setEstadoEscaner(mensaje);
      setErrorEscaner(true);
    };
    const iniciarEscaner = async () => {
      try {
        const { BrowserQRCodeReader } = await import('@zxing/browser');
        if (cancelado || !videoEscanerRef.current) return;
        const lector = new BrowserQRCodeReader();
        const controles = await lector.decodeFromConstraints(
          { video: { facingMode: { ideal: 'environment' } } },
          videoEscanerRef.current,
          async (resultado) => {
            if (cancelado || !resultado || escanerProcesandoRef.current) return;
            escanerProcesandoRef.current = true;
            const idProducto = obtenerIdDelQr(resultado.getText());
            if (!idProducto) {
              setEstadoEscaner('El código no contiene un QR válido de producto TERRA.');
              setErrorEscaner(true);
              window.setTimeout(() => { escanerProcesandoRef.current = false; }, 1200);
              return;
            }
            setEstadoEscaner('Buscando producto…');
            setErrorEscaner(false);
            try {
              const producto = await obtenerProducto(idProducto);
              if (cancelado) return;
              setUltimoProductoQrId(String(producto.id));
              const resultadoAgregar = agregarProductoCarritoQr(producto);
              setCarritoQr(resultadoAgregar.items);
              if (!resultadoAgregar.agregado) {
                setEstadoEscaner(resultadoAgregar.motivo === 'stock-maximo'
                  ? `Ya agregaste todas las unidades disponibles de ${producto.nombre}.`
                  : `${producto.nombre} no está disponible para la compra.`);
                setErrorEscaner(true);
              } else {
                setEstadoEscaner(`${producto.nombre} agregado. Escaneá otro producto o confirmá la compra.`);
              }
            } catch (err) {
              if (!cancelado) {
                setEstadoEscaner(err.message || 'No se pudo cargar el producto del QR.');
                setErrorEscaner(true);
              }
            } finally {
              window.setTimeout(() => { escanerProcesandoRef.current = false; }, 1200);
            }
          },
        );
        if (cancelado) controles.stop();
        else controlesCamara = controles;
      } catch (error) {
        mostrarErrorCamara(error);
      }
    };
    iniciarEscaner();
    return () => {
      cancelado = true;
      controlesCamara?.stop();
    };
  }, [escanerAbierto]);

  useEffect(() => {
    if (!escanerAbierto) return undefined;
    const cerrarConEscape = (event) => {
      if (event.key === 'Escape') setEscanerAbierto(false);
    };
    document.addEventListener('keydown', cerrarConEscape);
    return () => document.removeEventListener('keydown', cerrarConEscape);
  }, [escanerAbierto]);

  return (
    <div className="terra-catalogo">
      <main className="terra-main">
        <section className="terra-search-bar">
          <div className="terra-search-bar__inner">
            <div className="terra-search-wrapper">
              <span className="terra-search-icon material-symbols-outlined">search</span>
              <input
                ref={searchInputRef}
                className="terra-search-input"
                id="kiosk-search"
                placeholder="Buscar colchones, sommiers, camas…"
                type="text"
                value={buscar}
                readOnly={esTactil}
                inputMode={esTactil ? 'none' : 'text'}
                onClick={abrirTecladoTactil}
                onFocus={abrirTecladoTactil}
                onChange={(e) => cambiarBusqueda(e.target.value)}
              />
              {buscar && (
                <button
                  aria-label="Borrar búsqueda"
                  className="terra-btn-clear"
                  id="clear-search-btn"
                  onClick={() => cambiarBusqueda('')}
                  type="button"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              )}
            </div>

            <div className="terra-search-controls">
              <div className="terra-chip terra-chip--count">
                <span className="terra-chip__dot"></span>
                <span className="terra-chip__text">
                  {cargando
                    ? 'Cargando…'
                    : totalConocido
                      ? `${totalProductos} disponibles${totalPaginas > 1 ? ` · pág. ${pagina}/${totalPaginas}` : ''}`
                      : `${productosFiltrados.length} en esta página · pág. ${pagina}`}
                </span>
              </div>

              <div className="terra-dropdown">
                <button
                  className="terra-btn-dropdown"
                  id="sort-menu-btn"
                  type="button"
                  onClick={() => setMenuOrdenAbierto((prev) => !prev)}
                >
                  <span className="material-symbols-outlined terra-dropdown__icon">swap_vert</span>
                  <span className="terra-dropdown__label">Orden: <strong>{nombreOrdenActual}</strong></span>
                  <span className="material-symbols-outlined terra-dropdown__arrow">
                    {menuOrdenAbierto ? 'expand_less' : 'expand_more'}
                  </span>
                </button>

                {menuOrdenAbierto && (
                  <div className="terra-dropdown-menu">
                    {[
                      { id: 'recomendados', label: 'Recomendados' },
                      { id: 'precio-asc', label: 'Precio menor a mayor' },
                      { id: 'precio-desc', label: 'Precio mayor a menor' },
                      { id: 'nombre', label: 'Nombre A-Z' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        className={`terra-dropdown-item ${orden === opt.id ? 'terra-dropdown-item--active' : ''}`}
                        onClick={() => cambiarOrden(opt.id)}
                      >
                        <span>{opt.label}</span>
                        {orden === opt.id && <span className="material-symbols-outlined terra-dropdown-item__check">done</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {tecladoAbierto && (
          <div className="terra-keyboard" ref={tecladoRef}>
            <div className="terra-keyboard__header">
              <span className="terra-keyboard__title">Teclado Táctil TERRA</span>
              <button
                type="button"
                onClick={() => setTecladoAbierto(false)}
                className="terra-btn-ghost-sm"
              >
                Cerrar teclado
              </button>
            </div>
            {[
              ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
              ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ñ'],
              ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
            ].map((row, i) => (
              <div key={i} className="terra-keyboard__row">
                {row.map((letra) => (
                  <button
                    key={letra}
                    type="button"
                    onClick={() => agregarCaracter(letra)}
                    className="terra-key"
                  >
                    {letra}
                  </button>
                ))}
                {i === 2 && (
                  <button
                    type="button"
                    onClick={borrarCaracter}
                    className="terra-key terra-key--delete"
                  >
                    <span className="material-symbols-outlined">backspace</span>
                  </button>
                )}
              </div>
            ))}
            <div className="terra-keyboard__row terra-keyboard__row--wide">
              <button
                type="button"
                onClick={alternarModoNumerico}
                className="terra-key terra-key--mode"
              >
                {modoNumerico ? 'ABC' : '123'}
              </button>
              <button
                type="button"
                onClick={() => agregarCaracter(' ')}
                className="terra-key terra-key--space"
              >
                Espacio
              </button>
              <button
                type="button"
                onClick={() => cambiarBusqueda('')}
                className="terra-key terra-key--clear"
              >
                Limpiar
              </button>
            </div>
            {modoNumerico && (
              <>
                <div className="terra-keyboard__row">
                  {['1', '2', '3'].map((n) => (
                    <button key={n} type="button" onClick={() => agregarCaracter(n)} className="terra-key">
                      {n}
                    </button>
                  ))}
                </div>
                <div className="terra-keyboard__row">
                  {['4', '5', '6'].map((n) => (
                    <button key={n} type="button" onClick={() => agregarCaracter(n)} className="terra-key">
                      {n}
                    </button>
                  ))}
                </div>
                <div className="terra-keyboard__row">
                  {['7', '8', '9'].map((n) => (
                    <button key={n} type="button" onClick={() => agregarCaracter(n)} className="terra-key">
                      {n}
                    </button>
                  ))}
                </div>
                <div className="terra-keyboard__row terra-keyboard__row--wide">
                  <button
                    type="button"
                    onClick={() => agregarCaracter('0')}
                    className="terra-key terra-key--space"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={() => agregarCaracter('+')}
                    className="terra-key"
                  >
                    +
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        <div className="terra-categories">
          <div className={`terra-categories__inner ${menuCategoriasAbierto ? 'terra-categories__inner--abierto' : ''}`}>
            {!categoriasCargadas && categoriasDinamicas.length === 0 ? (
              [110, 150, 130, 140].map((ancho, i) => (
                <span
                  key={i}
                  aria-hidden="true"
                  style={{ width: ancho }}
                  className="terra-cat-skeleton"
                />
              ))
            ) : (
              <>
                {/* Desplegable con todas las categorías; "Todos los productos" vive dentro. */}
                <div className="terra-cat-dropdown" ref={menuCategoriasRef}>
                  <button
                    type="button"
                    className={`terra-cat terra-cat--selector ${activaFueraDelRiel ? 'terra-cat--active' : ''}`}
                    aria-haspopup="listbox"
                    aria-expanded={menuCategoriasAbierto}
                    onClick={() => setMenuCategoriasAbierto((prev) => !prev)}
                  >
                    <span className="material-symbols-outlined terra-cat__icon">
                      {activaFueraDelRiel ? categoriaActivaObj.icon : 'category'}
                    </span>
                    <span className="terra-cat__label">
                      {activaFueraDelRiel ? categoriaActivaObj.nombre : 'Categorías'}
                    </span>
                    <span className="material-symbols-outlined terra-cat__arrow">
                      {menuCategoriasAbierto ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>

                  {menuCategoriasAbierto && (
                    <>
                      {/* Fondo oscuro: solo visible en móvil, donde el menú es una hoja inferior. */}
                      <div className="terra-cat-backdrop" aria-hidden="true" onClick={() => setMenuCategoriasAbierto(false)} />
                      <div className="terra-cat-menu" role="listbox" aria-label="Elegir categoría">
                        <span className="terra-cat-menu__handle" aria-hidden="true" />
                        <div className="terra-cat-menu__header">
                          <span>Categorías</span>
                          <small>{categoriasDinamicas.length} líneas</small>
                          <button
                            type="button"
                            className="terra-cat-menu__close"
                            aria-label="Cerrar categorías"
                            onClick={() => setMenuCategoriasAbierto(false)}
                          >
                            <span className="material-symbols-outlined">close</span>
                          </button>
                        </div>
                      <button
                        type="button"
                        role="option"
                        aria-selected={!categoriaSeleccionada}
                        className={`terra-cat-menu__item ${!categoriaSeleccionada ? 'terra-cat-menu__item--active' : ''}`}
                        onClick={() => cambiarCategoria('')}
                      >
                        <span className="material-symbols-outlined">apps</span>
                        <span className="terra-cat-menu__name">Todos los productos</span>
                        {totalCategorias > 0 && <span className="terra-cat-menu__count">{totalCategorias}</span>}
                        {!categoriaSeleccionada && <span className="material-symbols-outlined terra-cat-menu__check">done</span>}
                      </button>
                      {categoriasDinamicas.map((cat) => {
                        const activa = esCategoriaActiva(cat.id);
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            role="option"
                            aria-selected={activa}
                            className={`terra-cat-menu__item ${activa ? 'terra-cat-menu__item--active' : ''}`}
                            onClick={() => cambiarCategoria(activa ? '' : cat.id)}
                          >
                            <span className="material-symbols-outlined">{cat.icon}</span>
                            <span className="terra-cat-menu__name">{cat.nombre}</span>
                            {Number.isFinite(Number(cat.total)) && <span className="terra-cat-menu__count">{cat.total}</span>}
                            {activa && <span className="material-symbols-outlined terra-cat-menu__check">done</span>}
                          </button>
                        );
                      })}
                      </div>
                    </>
                  )}
                </div>

                {categoriasEnRiel.map((cat) => {
                  const activa = esCategoriaActiva(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      className={`terra-cat ${activa ? 'terra-cat--active' : ''}`}
                      onClick={() => cambiarCategoria(activa ? '' : cat.id)}
                    >
                      <span className="material-symbols-outlined terra-cat__icon">{cat.icon}</span>
                      <span className="terra-cat__label">{cat.nombre}</span>
                      {activa && <span className="terra-cat__dot"></span>}
                    </button>
                  );
                })}

                {categoriasDinamicas.length > CATEGORIAS_VISIBLES && (
                  <button
                    type="button"
                    className="terra-cat terra-cat--more"
                    onClick={() => setMenuCategoriasAbierto(true)}
                  >
                    <span className="material-symbols-outlined terra-cat__icon">more_horiz</span>
                    <span className="terra-cat__label">+{categoriasDinamicas.length - CATEGORIAS_VISIBLES} más</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        <section className="terra-grid-section" ref={gridRef}>
          <div className="terra-grid__inner">
            {cargando ? (
              <div className="terra-empty terra-empty--loading">
                <div className="terra-loader"></div>
                <p className="terra-empty__text">Cargando productos…</p>
              </div>
            ) : errorProductos ? (
              <div className="terra-empty">
                <span className="material-symbols-outlined terra-empty__icon">cloud_off</span>
                <h3 className="terra-empty__title">No se pudo cargar el catálogo</h3>
                <p className="terra-empty__subtitle">{errorProductos}</p>
                <button type="button" className="terra-btn-primary terra-btn--wide" onClick={reintentarCarga}>
                  Reintentar
                </button>
              </div>
            ) : productosFiltrados.length === 0 ? (
              <div className="terra-empty">
                <span className="material-symbols-outlined terra-empty__icon">search_off</span>
                <h3 className="terra-empty__title">No encontramos productos</h3>
                <p className="terra-empty__subtitle">
                  Probá cambiando los filtros o limpiá la búsqueda.
                </p>
                <button
                  type="button"
                  className="terra-btn-primary terra-btn--wide"
                  onClick={() => {
                    setBuscar('');
                    setCategoriaSeleccionada('');
                    setPagina(1);
                  }}
                >
                  Restablecer filtros
                </button>
              </div>
            ) : (
              <div className="terra-grid">
                {productosFiltrados.map((producto) => {
                  const recienAgregado = Boolean(agregados[producto.id]);
                  const tonosColores = coloresDeProducto(producto);
                  const disponible = producto.stock > 0;

                  return (
                    <article
                      key={producto.id}
                      className={`terra-card ${!disponible ? 'terra-card--agotado' : ''} ${recienAgregado ? 'terra-card--agregado' : ''}`}
                      tabIndex={0}
                      aria-label={`${producto.nombre}, ${formatoMoneda(esMayorista && Number.isFinite(Number(producto.precioMayorista)) ? producto.precioMayorista : producto.precio)}, ${disponible ? 'disponible' : 'agotado'}. Enter para ver el detalle.`}
                      onKeyDown={(event) => {
                        if (event.target !== event.currentTarget) return;
                        if (event.key === 'Enter') navigate(`/productos/${producto.id}`);
                        if (event.key === ' ' && disponible) { event.preventDefault(); handleAgregar(producto); }
                      }}
                      onClick={(event) => {
                        if (!event.target.closest('button, a')) {
                          navigate(`/productos/${producto.id}`);
                        }
                      }}
                    >
                      <div className="terra-card__media">
                        <img
                          className={`terra-card__img ${producto.imagen_url ? '' : 'img-fallback'}`}
                          alt={producto.nombre}
                          src={imagenDeProducto(producto.imagen_url)}
                          onError={usarImagenFallback}
                          loading="lazy"
                        />

                        <div className="terra-card__badges">
                          {producto.descuento && (
                            <span className="terra-badge terra-badge--promo">
                              <span className="material-symbols-outlined terra-badge__icon">local_fire_department</span>
                              {producto.descuento}
                            </span>
                          )}
                          {producto.badgeSecundario && (
                            <span className="terra-badge terra-badge--highlight">
                              {producto.badgeSecundario}
                            </span>
                          )}
                          {producto.badge && !producto.descuento && !producto.badgeSecundario && (
                            <span className={`terra-badge terra-badge--${producto.badge === 'Más Vendido' ? 'bestseller' : producto.badge === 'Nuevo' ? 'nuevo' : 'destacado'}`}>
                              {producto.badgeIcon && <span className="material-symbols-outlined terra-badge__icon">{producto.badgeIcon}</span>}
                              {producto.badge}
                            </span>
                          )}
                        </div>

                        {producto.tagMedida && (
                          <div className="terra-card__measure">
                            <span className="material-symbols-outlined terra-card__measure-icon">
                              {producto.tagMedidaIcon || 'verified'}
                            </span>
                            {producto.tagMedida}
                          </div>
                        )}
                      </div>

                      <div className="terra-card__body">
                        <div className="terra-card__top">
                          <span className="terra-card__reviews">
                            <span className="terra-card__stars">★★★★★</span>
                            <span>(calidad)</span>
                          </span>
                          <span className={`terra-card__stock ${disponible ? 'terra-card__stock--ok' : 'terra-card__stock--no'}`}>
                            {disponible ? '● Disponible' : '○ Agotado'}
                          </span>
                        </div>

                        <Link
                          to={`/productos/${producto.id}`}
                          className="terra-card__title-link"
                        >
                          <h2 className="terra-card__title">{producto.nombre}</h2>
                        </Link>

                        {Boolean(producto.descripcion) && (
                          <p className="terra-card__desc">{producto.descripcion}</p>
                        )}

                        {tonosColores.length > 0 && (
                          <div className="terra-card__colores">
                            {tonosColores.slice(0, 4).map((tono) => (
                              <span
                                key={`${tono.nombre}-${tono.valor}`}
                                title={tono.nombre}
                                style={{ backgroundColor: tono.valor }}
                                className="terra-color"
                              />
                            ))}
                            {tonosColores.length > 4 && (
                              <span className="terra-color-more">+{tonosColores.length - 4}</span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="terra-card__footer">
                        <div className="terra-card__precio">
                          {producto.precioOriginal ? (
                            <span className="terra-card__precio-original">
                              {formatoMoneda(producto.precioOriginal)}
                            </span>
                          ) : null}
                          <span className="terra-card__precio-actual">
                            {formatoMoneda(esMayorista && Number.isFinite(Number(producto.precioMayorista)) ? producto.precioMayorista : producto.precio)}
                          </span>
                        </div>

                        <button
                          className={`terra-btn-agregar ${!disponible ? 'terra-btn-agregar--disabled' : ''} ${recienAgregado ? 'terra-btn-agregar--added' : ''}`}
                          onClick={() => handleAgregar(producto)}
                          type="button"
                          disabled={!disponible}
                        >
                          <span className="material-symbols-outlined terra-btn-agregar__icon">
                            {recienAgregado ? 'done' : 'add_shopping_cart'}
                          </span>
                          <span className="terra-btn-agregar__label">
                            {recienAgregado ? '¡Agregado!' : 'Agregar al carrito'}
                          </span>
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {!cargando && !errorProductos && mostrarPaginador && (
              <nav className="terra-paginador" aria-label="Paginación del catálogo">
                <button
                  type="button"
                  className="terra-paginador__btn terra-paginador__btn--nav"
                  onClick={() => irAPagina(pagina - 1)}
                  disabled={pagina <= 1}
                  aria-label="Página anterior"
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                  <span className="terra-paginador__nav-label">Anterior</span>
                </button>

                <div className="terra-paginador__paginas">
                  {paginasVisibles(pagina, ultimaPaginaPermitida).map((item) =>
                    typeof item === 'string' ? (
                      <span key={item} className="terra-paginador__gap" aria-hidden="true">…</span>
                    ) : (
                      <button
                        key={item}
                        type="button"
                        className={`terra-paginador__btn ${item === pagina ? 'terra-paginador__btn--active' : ''}`}
                        onClick={() => irAPagina(item)}
                        aria-current={item === pagina ? 'page' : undefined}
                        aria-label={`Página ${item}`}
                      >
                        {item}
                      </button>
                    )
                  )}
                </div>

                <button
                  type="button"
                  className="terra-paginador__btn terra-paginador__btn--nav"
                  onClick={() => irAPagina(pagina + 1)}
                  disabled={!tieneSiguiente}
                  aria-label="Página siguiente"
                >
                  <span className="terra-paginador__nav-label">Siguiente</span>
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </nav>
            )}
          </div>
        </section>
      </main>

      {modalAsesorAbierto && (
        <div className="terra-modal-overlay" onClick={() => setModalAsesorAbierto(false)}>
          <div className="terra-modal" onClick={(e) => e.stopPropagation()}>
            <div className="terra-modal__icon">
              <span className="material-symbols-outlined">support_agent</span>
            </div>
            <h3 className="terra-modal__title">¡Asesor TERRA Notificado!</h3>
            <p className="terra-modal__text">
              Un especialista en descanso se está acercando para asistirte con modelos, medidas y pruebas de firmeza.
            </p>
            <button
              type="button"
              className="terra-btn-primary terra-btn--wide"
              onClick={() => setModalAsesorAbierto(false)}
            >
              Entendido, continuar explorando
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        className="catalog-qr-fab"
        onClick={() => setEscanerAbierto(true)}
        aria-label={unidadesQr ? `Comprar por QR, ${unidadesQr} unidades agregadas` : 'Comprar por QR, abrir cámara'}
      >
        <QrCode size={21} />
        <span>Comprar por QR</span>
        {unidadesQr > 0 && <b>{unidadesQr}</b>}
      </button>

      {escanerAbierto && (
        <div className="catalog-qr-overlay" onClick={() => setEscanerAbierto(false)}>
          <section
            className="catalog-qr-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="catalog-qr-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header>
              <div className="catalog-qr-icon"><Camera size={22} /></div>
              <button type="button" onClick={() => setEscanerAbierto(false)} aria-label="Cerrar cámara">
                <X size={20} />
              </button>
            </header>
            <h2 id="catalog-qr-title">Escaneá un producto</h2>
            <p>Apuntá la cámara al código QR de un producto. Podés escanear varios antes de confirmar.</p>
            <div className="catalog-qr-camera">
              <video ref={videoEscanerRef} autoPlay muted playsInline aria-label="Vista de cámara para escanear códigos QR" />
              <span className="catalog-qr-camera-frame" aria-hidden="true" />
            </div>
            <p className={`catalog-qr-status${errorEscaner ? ' is-error' : ''}`} role="status" aria-live="polite">
              {estadoEscaner || 'La cámara se activará para leer el código.'}
            </p>
            <div className="catalog-qr-summary">
              <div>
                <b><ShoppingCart size={16} /> {unidadesQr} {unidadesQr === 1 ? 'unidad' : 'unidades'}</b>
                <small>{carritoQr.length} {carritoQr.length === 1 ? 'producto' : 'productos'} · {formatoMoneda(totalQr)}</small>
              </div>
              <div className="catalog-qr-summary-actions">
                {ultimoProductoQrId && (
                  <a
                    className="catalog-qr-product-link"
                    href={`/detalle-qr.html?id=${encodeURIComponent(ultimoProductoQrId)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink size={16} /> Ver detalle
                  </a>
                )}
                <button type="button" onClick={confirmarCompraQr} disabled={!unidadesQr}>
                  <Check size={17} /> Confirmar compra
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
