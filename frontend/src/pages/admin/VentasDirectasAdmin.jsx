import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Download,
  Flame,
  Home,
  Minus,
  Package,
  Plus,
  QrCode,
  ScanBarcode,
  Search,
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
  Tag,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { listarCategorias, listarProductosPaginado, obtenerProducto } from '../../services/productoService.js';
import { listarClientes } from '../../services/clienteService.js';
import { crearVentaDirecta } from '../../services/pedidoService.js';
import { descargarTicket } from '../../utils/descargarTicket.js';
import { formatoMoneda } from '../../utils/formatoMoneda.js';
import { imagenDeProducto, usarImagenFallback } from '../../utils/imagenProducto.js';
import './VentasDirectasAdmin.css';

const TODAS = 'Todas';
const PAGINAS_VISTAS = [12, 18, 24, 36, 48];

const VISTAS = [
  { id: 'recomendados', etiqueta: 'Todos los productos', icono: Package },
  { id: 'mas-vendidos', etiqueta: 'Más vendidos', icono: Flame },
  { id: 'nuevos', etiqueta: 'Nuevos', icono: Sparkles },
];

const ORDENES = [
  { id: 'recomendados', etiqueta: 'Más relevantes' },
  { id: 'mas-vendidos', etiqueta: 'Más vendidos' },
  { id: 'nuevos', etiqueta: 'Novedades' },
  { id: 'precio-asc', etiqueta: 'Precio: menor a mayor' },
  { id: 'precio-desc', etiqueta: 'Precio: mayor a menor' },
  { id: 'nombre', etiqueta: 'Nombre (A-Z)' },
];

function paginasVisibles(pagina, totalPaginas) {
  if (totalPaginas <= 7) return Array.from({ length: totalPaginas }, (_, indice) => indice + 1);
  const set = new Set([1, totalPaginas, pagina, pagina - 1, pagina + 1]);
  const lista = [...set].filter((numero) => numero >= 1 && numero <= totalPaginas).sort((a, b) => a - b);
  return lista.reduce((acc, numero, indice) => {
    if (indice > 0 && numero - acc[acc.length - 1] > 1) acc.push('...');
    acc.push(numero);
    return acc;
  }, []);
}

export default function VentasDirectasAdmin() {
  const [productos, setProductos] = useState([]);
  const [paginacion, setPaginacion] = useState({ pagina: 1, limite: 18, total: 0, totalPaginas: 1 });
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCatalogo, setErrorCatalogo] = useState('');

  const [buscar, setBuscar] = useState('');
  const [buscarAplicado, setBuscarAplicado] = useState('');
  const [categoria, setCategoria] = useState(TODAS);
  const [orden, setOrden] = useState('recomendados');
  const [soloPromos, setSoloPromos] = useState(false);
  const [conStock, setConStock] = useState(false);
  const [precioMin, setPrecioMin] = useState('');
  const [precioMax, setPrecioMax] = useState('');
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(18);

  const [clientes, setClientes] = useState([]);
  const [buscaCliente, setBuscaCliente] = useState('');
  const [listaClientesAbierta, setListaClientesAbierta] = useState(false);
  const [clienteId, setClienteId] = useState('');
  const [tipoNuevo, setTipoNuevo] = useState('minorista');
  const [carrito, setCarrito] = useState([]);
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [ultimaVenta, setUltimaVenta] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const [escanerAbierto, setEscanerAbierto] = useState(false);
  const [estadoEscaner, setEstadoEscaner] = useState('');
  const [errorEscaner, setErrorEscaner] = useState(false);
  const [codigoManual, setCodigoManual] = useState('');
  const videoEscanerRef = useRef(null);
  const escanerProcesandoRef = useRef(false);
  const chipsRef = useRef(null);

  useEffect(() => {
    listarCategorias({ todas: true }).then(setCategorias).catch(() => setCategorias([]));
    listarClientes({ limite: 200 }).then(setClientes).catch(() => setClientes([]));
  }, []);

  // Búsqueda con rebote: no se dispara una consulta por cada tecla.
  useEffect(() => {
    const temporizador = window.setTimeout(() => setBuscarAplicado(buscar.trim()), 350);
    return () => window.clearTimeout(temporizador);
  }, [buscar]);

  useEffect(() => {
    const controlador = new AbortController();
    let vigente = true;
    setCargando(true);
    setErrorCatalogo('');
    listarProductosPaginado({
      buscar: buscarAplicado,
      categoria,
      pagina,
      limite: porPagina,
      todos: true,
      orden,
      promos: soloPromos,
      stock: conStock,
      precioMin: precioMin === '' ? null : Number(precioMin),
      precioMax: precioMax === '' ? null : Number(precioMax),
      signal: controlador.signal,
    })
      .then((resultado) => {
        if (!vigente) return;
        setProductos(resultado.productos);
        setPaginacion(resultado.paginacion);
      })
      .catch((e) => {
        if (e.name === 'AbortError' || !vigente) return;
        setProductos([]);
        setErrorCatalogo(e.message || 'No se pudo cargar el catálogo.');
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });
    return () => {
      vigente = false;
      controlador.abort();
    };
  }, [buscarAplicado, categoria, pagina, porPagina, orden, soloPromos, conStock, precioMin, precioMax]);

  const cliente = clientes.find((item) => item.id === clienteId) || null;
  const esMayorista = cliente ? cliente.rol === 'mayorista' : tipoNuevo === 'mayorista';
  const precio = useCallback((producto) => (esMayorista && producto.precioMayorista !== null ? producto.precioMayorista : producto.precio), [esMayorista]);
  const total = useMemo(() => carrito.reduce((suma, item) => suma + precio(item) * item.cantidad, 0), [carrito, precio]);

  const clientesFiltrados = useMemo(() => {
    const texto = buscaCliente.trim().toLowerCase();
    const lista = texto
      ? clientes.filter((item) => `${item.nombre || ''} ${item.email || ''} ${item.nit || ''} ${item.telefono || ''}`.toLowerCase().includes(texto))
      : clientes;
    return lista.slice(0, 8);
  }, [clientes, buscaCliente]);

  const filtrosActivos = useMemo(() => {
    const lista = [];
    if (buscarAplicado) lista.push({ id: 'busqueda', etiqueta: `"${buscarAplicado}"`, quitar: () => { setBuscar(''); setBuscarAplicado(''); } });
    if (categoria !== TODAS) lista.push({ id: 'categoria', etiqueta: categoria, quitar: () => setCategoria(TODAS) });
    if (soloPromos) lista.push({ id: 'promos', etiqueta: 'Promociones', quitar: () => setSoloPromos(false) });
    if (conStock) lista.push({ id: 'stock', etiqueta: 'Solo con stock', quitar: () => setConStock(false) });
    if (precioMin !== '' || precioMax !== '') {
      const desde = precioMin === '' ? '0' : precioMin;
      const hasta = precioMax === '' ? 'sin limite' : precioMax;
      lista.push({ id: 'precio', etiqueta: `Bs ${desde} - Bs ${hasta}`, quitar: () => { setPrecioMin(''); setPrecioMax(''); } });
    }
    return lista;
  }, [buscarAplicado, categoria, soloPromos, conStock, precioMin, precioMax]);

  const limpiarFiltros = () => {
    setBuscar('');
    setBuscarAplicado('');
    setCategoria(TODAS);
    setSoloPromos(false);
    setConStock(false);
    setPrecioMin('');
    setPrecioMax('');
    setPagina(1);
  };

  const cambiarFiltro = (cambios) => {
    setPagina(1);
    if ('categoria' in cambios) setCategoria(cambios.categoria);
    if ('orden' in cambios) setOrden(cambios.orden);
    if ('soloPromos' in cambios) setSoloPromos(cambios.soloPromos);
    if ('conStock' in cambios) setConStock(cambios.conStock);
    if ('precioMin' in cambios) setPrecioMin(cambios.precioMin);
    if ('precioMax' in cambios) setPrecioMax(cambios.precioMax);
    if ('porPagina' in cambios) setPorPagina(cambios.porPagina);
  };

  const agregar = (producto) => {
    if (!producto || Number(producto.stock || 0) < 1) {
      setError('El producto no tiene unidades disponibles.');
      return;
    }
    setExito('');
    setCarrito((actual) => {
      const existe = actual.find((item) => item.id === producto.id);
      if (existe) {
        return actual.map((item) => (item.id === producto.id ? { ...item, cantidad: Math.min(Number(producto.stock), item.cantidad + 1) } : item));
      }
      return [...actual, { ...producto, cantidad: 1 }];
    });
  };

  const cambiarCantidad = (id, cambio, producto) => {
    setCarrito((actual) => actual.map((item) => {
      if (item.id !== id) return item;
      const maximo = Number(producto?.stock || item.stock || 0);
      return { ...item, cantidad: Math.max(1, Math.min(maximo, item.cantidad + cambio)) };
    }));
  };

  const quitarProducto = (id) => setCarrito((actual) => actual.filter((item) => item.id !== id));
  const limpiarLista = () => setCarrito([]);

  const seleccionarCliente = (item) => {
    setClienteId(item ? item.id : '');
    setBuscaCliente('');
    setListaClientesAbierta(false);
    if (!item) setTipoNuevo('minorista');
  };

  const guardar = async () => {
    if (!carrito.length) {
      setError('Agrega al menos un producto.');
      return;
    }
    setGuardando(true);
    setError('');
    setExito('');
    setUltimaVenta(null);
    try {
      const venta = await crearVentaDirecta({
        clienteId: clienteId || null,
        metodoPago,
        tipoMayoristaManual: !clienteId && tipoNuevo === 'mayorista',
        items: carrito.map((item) => ({ productoId: item.id, cantidad: item.cantidad })),
      });
      setExito(`Venta ${venta.codigo} registrada por ${formatoMoneda(venta.total)}.`);
      setUltimaVenta(venta);
      setCarrito([]);
      setClienteId('');
      setTipoNuevo('minorista');
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  };

  const buscarPorCodigo = async (valor) => {
    const codigo = String(valor || '').trim();
    if (!codigo) return false;
    try {
      const producto = await obtenerProducto(codigo);
      agregar(producto);
      setEstadoEscaner(`${producto.nombre} agregado a la venta.`);
      setErrorEscaner(false);
      setCodigoManual('');
      return true;
    } catch (e) {
      setEstadoEscaner(e.message || 'No se encontró ningún producto con ese código.');
      setErrorEscaner(true);
      return false;
    }
  };

  useEffect(() => {
    if (!escanerAbierto || !videoEscanerRef.current) return undefined;
    let cancelado = false;
    let controlesCamara;
    escanerProcesandoRef.current = false;
    setEstadoEscaner('Solicitando acceso a la cámara...');
    setErrorEscaner(false);
    const mostrarErrorCamara = (error) => {
      if (cancelado) return;
      const mensaje = error?.name === 'NotAllowedError'
        ? 'Permite el acceso a la cámara para escanear los códigos de producto.'
        : error?.name === 'NotFoundError'
          ? 'No se encontró una cámara disponible en este dispositivo.'
          : 'No se pudo iniciar la cámara. Verificá los permisos del navegador.';
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
            const texto = String(resultado.getText() || '');
            const id = texto.includes('?')
              ? new URL(texto, window.location.origin).searchParams.get('id') || texto
              : texto;
            const encontrado = await buscarPorCodigo(id);
            window.setTimeout(() => { escanerProcesandoRef.current = false; }, encontrado ? 1500 : 1200);
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

  const moverChips = (direccion) => {
    chipsRef.current?.scrollBy({ left: direccion * 240, behavior: 'smooth' });
  };

  const totalPaginas = Math.max(1, Number(paginacion.totalPaginas || 1));
  const paginaActual = Math.min(pagina, totalPaginas);
  const desde = (paginaActual - 1) * porPagina + (productos.length ? 1 : 0);
  const hasta = (paginaActual - 1) * porPagina + productos.length;

  return (
    <main className="direct-sales">
      <header className="direct-heading">
        <span><Home size={14} /> CAJA ADMINISTRATIVA</span>
        <h1>Ventas directas</h1>
        <p>Registra una venta cobrada con varios productos y el precio correspondiente al cliente.</p>
      </header>

      <section className="direct-sales-grid">
        <section className="direct-panel direct-catalogo">
          <div className="direct-toolbar">
            <div className="direct-search-wrap">
              <Search size={18} />
              <input
                className="direct-search"
                value={buscar}
                onChange={(e) => { setBuscar(e.target.value); setPagina(1); }}
                placeholder="Buscar por nombre, código o SKU..."
                aria-label="Buscar productos"
              />
            </div>
            <button type="button" className="direct-scan-btn" onClick={() => setEscanerAbierto(true)}>
              <ScanBarcode size={18} /> Escanear código
            </button>
          </div>

          <nav className="direct-chips" aria-label="Categorías">
            <button type="button" className="direct-chips__nav" onClick={() => moverChips(-1)} aria-label="Categorías anteriores">
              <ChevronLeft size={18} />
            </button>
            <div className="direct-chips__track" ref={chipsRef}>
              <button type="button" className={`direct-chip${categoria === TODAS ? ' is-active' : ''}`} onClick={() => cambiarFiltro({ categoria: TODAS })}>
                {TODAS}
              </button>
              {categorias.map((item) => (
                <button
                  type="button"
                  key={item.id || item.nombre}
                  className={`direct-chip${categoria === item.nombre ? ' is-active' : ''}`}
                  onClick={() => cambiarFiltro({ categoria: item.nombre })}
                >
                  {item.nombre}
                  {item.total ? <span className="direct-chip__count">{item.total}</span> : null}
                </button>
              ))}
            </div>
            <button type="button" className="direct-chips__nav" onClick={() => moverChips(1)} aria-label="Más categorías">
              <ChevronRight size={18} />
            </button>
          </nav>

          <div className="direct-tabs">
            {VISTAS.map((vista) => {
              const Icono = vista.icono;
              return (
                <button
                  type="button"
                  key={vista.id}
                  className={`direct-tab${orden === vista.id ? ' is-active' : ''}`}
                  onClick={() => cambiarFiltro({ orden: vista.id })}
                >
                  <Icono size={17} /> {vista.etiqueta}
                </button>
              );
            })}
            <span className="direct-tabs__spacer" />
            <button
              type="button"
              className={`direct-promo-btn${soloPromos ? ' is-active' : ''}`}
              onClick={() => cambiarFiltro({ soloPromos: !soloPromos })}
              aria-pressed={soloPromos}
            >
              <Tag size={16} /> Filtrar promociones
            </button>
            <button
              type="button"
              className={`direct-filter-btn${filtrosAbiertos ? ' is-active' : ''}`}
              onClick={() => setFiltrosAbiertos((abierto) => !abierto)}
              aria-expanded={filtrosAbiertos}
            >
              <SlidersHorizontal size={16} /> Filtros
            </button>
            <label className="direct-sort">
              <span>Ordenar:</span>
              <select value={orden} onChange={(e) => cambiarFiltro({ orden: e.target.value })} aria-label="Ordenar productos">
                {ORDENES.map((opcion) => (
                  <option key={opcion.id} value={opcion.id}>{opcion.etiqueta}</option>
                ))}
              </select>
            </label>
          </div>

          {filtrosAbiertos && (
            <div className="direct-filters-panel">
              <div className="direct-filters-panel__field">
                <label htmlFor="filtro-precio-min">Precio mínimo (Bs)</label>
                <input id="filtro-precio-min" type="number" min="0" value={precioMin} onChange={(e) => cambiarFiltro({ precioMin: e.target.value })} placeholder="0" />
              </div>
              <div className="direct-filters-panel__field">
                <label htmlFor="filtro-precio-max">Precio máximo (Bs)</label>
                <input id="filtro-precio-max" type="number" min="0" value={precioMax} onChange={(e) => cambiarFiltro({ precioMax: e.target.value })} placeholder="Sin límite" />
              </div>
              <label className="direct-switch">
                <input type="checkbox" checked={conStock} onChange={(e) => cambiarFiltro({ conStock: e.target.checked })} />
                <span>Solo productos con stock</span>
              </label>
              <div className="direct-filters-panel__field direct-filters-panel__field--categoria">
                <label htmlFor="filtro-categoria">Categoría</label>
                <select id="filtro-categoria" value={categoria} onChange={(e) => cambiarFiltro({ categoria: e.target.value })}>
                  <option value={TODAS}>{TODAS}</option>
                  {categorias.map((item) => (
                    <option key={item.id || item.nombre} value={item.nombre}>{item.nombre}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="direct-summary">
            <b>{Number(paginacion.total || 0).toLocaleString('es-BO')} productos</b>
            {filtrosActivos.length > 0 && (
              <>
                <span>Filtros activos:</span>
                <div className="direct-filter-chips">
                  {filtrosActivos.map((filtro) => (
                    <span className="direct-fchip" key={filtro.id}>
                      {filtro.etiqueta}
                      <button type="button" onClick={filtro.quitar} aria-label={`Quitar filtro ${filtro.etiqueta}`}>
                        <X size={13} />
                      </button>
                    </span>
                  ))}
                  <button type="button" className="direct-clear" onClick={limpiarFiltros}>Limpiar filtros</button>
                </div>
              </>
            )}
          </div>

          {errorCatalogo && <p className="error-box">{errorCatalogo}</p>}

          {cargando ? (
            <div className="direct-loading">Cargando productos...</div>
          ) : productos.length === 0 ? (
            <div className="direct-empty-catalog">
              {soloPromos ? <Tag size={40} /> : <Package size={40} />}
              <b>{soloPromos ? 'No hay promociones activas' : 'No hay productos para mostrar'}</b>
              <p>{soloPromos ? 'Cuando registres promociones para tus productos, aparecerán aquí.' : 'Probá con otra búsqueda o quitá los filtros activos.'}</p>
            </div>
          ) : (
            <div className="direct-grid">
              {productos.map((producto) => (
                <article className="direct-card" key={producto.id}>
                  <div className="direct-card__media">
                    <img
                      className="direct-card__img"
                      alt={producto.nombre}
                      src={imagenDeProducto(producto.imagen_url)}
                      onError={usarImagenFallback}
                      loading="lazy"
                    />
                    {producto.promocion && <span className="direct-badge direct-badge--promo">PROMO</span>}
                    {!producto.promocion && Number(producto.ventas || 0) > 0 && <span className="direct-badge direct-badge--vendido">MÁS VENDIDO</span>}
                  </div>
                  <b className="direct-card__name">{producto.nombre}</b>
                  <small className="direct-card__sku">SKU: {producto.sku}</small>
                  <span className="direct-card__stock">
                    <i className={Number(producto.stock || 0) > 0 ? 'is-ok' : 'is-out'} /> Stock: {producto.stock}
                  </span>
                  <div className="direct-card__foot">
                    <strong className="direct-card__price">{formatoMoneda(precio(producto))}</strong>
                    <button type="button" className="direct-add" onClick={() => agregar(producto)} disabled={Number(producto.stock || 0) < 1}>
                      <Plus size={14} /> Agregar
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          <footer className="direct-pager">
            <span className="direct-pager__info">
              Mostrando {desde}-{hasta} de {Number(paginacion.total || 0).toLocaleString('es-BO')} productos
            </span>
            <div className="direct-pager__controls">
              <button type="button" onClick={() => setPagina(Math.max(1, paginaActual - 1))} disabled={paginaActual <= 1} aria-label="Página anterior">
                <ChevronLeft size={16} />
              </button>
              {paginasVisibles(paginaActual, totalPaginas).map((numero, indice) => (
                numero === '...'
                  ? <span className="direct-pager__dots" key={`dots-${indice}`}>...</span>
                  : (
                    <button
                      type="button"
                      key={numero}
                      className={numero === paginaActual ? 'is-active' : ''}
                      onClick={() => setPagina(numero)}
                      aria-current={numero === paginaActual ? 'page' : undefined}
                    >
                      {numero}
                    </button>
                  )
              ))}
              <button type="button" onClick={() => setPagina(Math.min(totalPaginas, paginaActual + 1))} disabled={paginaActual >= totalPaginas} aria-label="Página siguiente">
                <ChevronRight size={16} />
              </button>
            </div>
            <label className="direct-page-size">
              <select value={porPagina} onChange={(e) => cambiarFiltro({ porPagina: Number(e.target.value) })} aria-label="Productos por página">
                {PAGINAS_VISTAS.map((cantidad) => (
                  <option key={cantidad} value={cantidad}>{cantidad} por página</option>
                ))}
              </select>
            </label>
          </footer>
        </section>

        <aside className="direct-panel direct-checkout">
          <div className="direct-checkout__head">
            <ShoppingCart size={24} />
            <h2>Venta actual</h2>
          </div>
          <span className="direct-checkout__rule" />

          <div className="direct-field">
            <span className="direct-field__label"><User size={15} /> Cliente</span>
            <div className="direct-combo">
              <div className="direct-combo__control">
                <Search size={16} />
                <input
                  value={buscaCliente}
                  onChange={(e) => { setBuscaCliente(e.target.value); setListaClientesAbierta(true); }}
                  onFocus={() => setListaClientesAbierta(true)}
                  onBlur={() => window.setTimeout(() => setListaClientesAbierta(false), 150)}
                  placeholder="Selecciona un cliente o busca por nombre o cédula..."
                  aria-label="Buscar cliente"
                />
              </div>
              {listaClientesAbierta && (
                <div className="direct-combo__list" role="listbox">
                  <button type="button" className="direct-combo__option" onMouseDown={(e) => e.preventDefault()} onClick={() => seleccionarCliente(null)}>
                    <span>Cliente nuevo / sin cuenta</span>
                  </button>
                  {clientesFiltrados.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      className="direct-combo__option"
                      role="option"
                      aria-selected={item.id === clienteId}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => seleccionarCliente(item)}
                    >
                      <span>{item.nombre}</span>
                      {item.rol === 'mayorista'
                        ? <span className="direct-combo__role">Mayorista</span>
                        : <span className="direct-combo__role is-minorista">Minorista</span>}
                    </button>
                  ))}
                  {!clientesFiltrados.length && <p className="direct-combo__empty">Sin resultados para "{buscaCliente}".</p>}
                </div>
              )}
            </div>
            {cliente && (
              <small className="direct-field__hint">
                {cliente.nombre} · {cliente.email || cliente.nit || cliente.telefono || 'Sin datos de contacto'}
              </small>
            )}
          </div>

          <div className="direct-field">
            <span className="direct-field__label"><Tag size={15} /> Tarifa / Precio</span>
            <select
              className="direct-select"
              value={esMayorista ? 'mayorista' : 'minorista'}
              disabled={Boolean(cliente)}
              onChange={(e) => setTipoNuevo(e.target.value)}
              aria-label="Tarifa de precio"
            >
              <option value="minorista">Precio minorista</option>
              <option value="mayorista">Precio mayorista</option>
            </select>
            <p className={`direct-type${esMayorista ? ' wholesale' : ''}`}>
              Tipo de precio: <b>{esMayorista ? 'Mayorista' : 'Minorista'}</b>
            </p>
          </div>

          <div className="direct-cart-head">
            <span className="direct-field__label"><Package size={15} /> Artículos de la venta ({carrito.length})</span>
            {carrito.length > 0 && (
              <button type="button" className="direct-clear-list" onClick={limpiarLista}>
                <Trash2 size={14} /> Limpiar lista
              </button>
            )}
          </div>

          {carrito.length === 0 ? (
            <div className="direct-empty">
              <span className="direct-empty__icon">
                <ShoppingCart size={34} />
                <i><Plus size={13} /></i>
              </span>
              <b>Agrega productos desde el catálogo</b>
              <p>Los artículos seleccionados aparecerán aquí para que puedas completar la venta.</p>
            </div>
          ) : (
            <div className="direct-cart-items">
              {carrito.map((item) => (
                <div className="direct-cart-item" key={item.id}>
                  {item.imagen_url ? <img src={item.imagen_url} alt={item.nombre} /> : <span className="direct-cart-item__empty" />}
                  <div className="direct-cart-item__info">
                    <b>{item.nombre}</b>
                    <small>{formatoMoneda(precio(item))} c/u · SKU {item.sku}</small>
                  </div>
                  <span className="direct-qty">
                    <button type="button" onClick={() => cambiarCantidad(item.id, -1, item)} aria-label="Restar"><Minus size={13} /></button>
                    <b>{item.cantidad}</b>
                    <button type="button" onClick={() => cambiarCantidad(item.id, 1, item)} aria-label="Sumar"><Plus size={13} /></button>
                  </span>
                  <button type="button" className="direct-cart-item__remove" onClick={() => quitarProducto(item.id)} aria-label={`Quitar ${item.nombre}`}>
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="direct-field">
            <span className="direct-field__label"><CreditCard size={15} /> Método de pago</span>
            <select className="direct-select" value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)} aria-label="Método de pago">
              <option value="efectivo">Efectivo</option>
              <option value="qr">QR</option>
              <option value="tarjeta">Tarjeta</option>
            </select>
          </div>

          <div className="direct-total">
            <span>Total cobrado</span>
            <b>{formatoMoneda(total)}</b>
          </div>

          {error && <p className="error-box">{error}</p>}
          {exito && <p className="direct-success">{exito}</p>}
          {ultimaVenta && (
            <button
              type="button"
              className="direct-ticket"
              onClick={() => descargarTicket(ultimaVenta, ultimaVenta.cliente || {}, ultimaVenta.items || [])}
            >
              <Download size={16} /> Descargar ticket de la venta
            </button>
          )}

          <button type="button" className="direct-save" disabled={guardando || !carrito.length} onClick={guardar}>
            {metodoPago === 'qr' ? <QrCode size={19} /> : <CreditCard size={19} />}
            {guardando ? 'Registrando...' : 'Cobrar y registrar venta'}
          </button>
        </aside>
      </section>

      {escanerAbierto && (
        <div className="direct-scan-modal" onClick={() => setEscanerAbierto(false)}>
          <div className="direct-scan-modal__box" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Escanear código de producto">
            <button type="button" className="direct-scan-modal__close" onClick={() => setEscanerAbierto(false)} aria-label="Cerrar cámara">
              <X size={18} />
            </button>
            <h3>Escanear código de producto</h3>
            <p>Apuntá la cámara al código QR del producto o escribí su SKU.</p>
            <video ref={videoEscanerRef} autoPlay muted playsInline aria-label="Vista de cámara para escanear códigos QR" />
            <p className={`direct-scan-modal__status${errorEscaner ? ' is-error' : ''}`} role="status" aria-live="polite">
              {estadoEscaner || 'La cámara se activará para leer el código.'}
            </p>
            <form
              className="direct-scan-modal__manual"
              onSubmit={(e) => { e.preventDefault(); buscarPorCodigo(codigoManual); }}
            >
              <input value={codigoManual} onChange={(e) => setCodigoManual(e.target.value)} placeholder="SKU o código del producto" aria-label="Código del producto" />
              <button type="submit">Agregar</button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
