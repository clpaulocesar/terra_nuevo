import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart3, Boxes, Camera, CameraOff, Check, ChevronDown, ChevronRight, Info, Layers, PackagePlus,
  PackageSearch, Plus, QrCode, RefreshCw, ScanLine, Search, TriangleAlert, Warehouse, X,
} from 'lucide-react';
import { agregarStock, listarCategorias, listarProductosPaginado, obtenerProducto } from '../../services/productoService.js';
import { avisoError, avisoExito } from '../../utils/alertas.js';
import './AlmacenAdmin.css';

const texto = (valor) => String(valor ?? '').trim();
const CANTIDAD_MAXIMA = 100000;

// Extrae el id (o SKU) del contenido de un QR TERRA: acepta la URL de la ficha
// (/detalle-qr.html?id=...), la del detalle (/productos/:id) o el id/SKU pelado.
function obtenerIdDelQr(contenido) {
  const valor = texto(contenido);
  if (!valor) return null;
  try {
    const url = new URL(valor, window.location.origin);
    const porParametro = url.searchParams.get('id') || url.searchParams.get('producto') || url.searchParams.get('p');
    if (porParametro) return porParametro.trim();
    const porRuta = url.pathname.match(/\/productos\/([^/?#]+)/);
    if (porRuta) return decodeURIComponent(porRuta[1]);
  } catch { /* no era una URL: se evalúa como id/SKU directo */ }
  return /^[a-zA-Z0-9_-]{1,100}$/.test(valor) ? valor : null;
}

// Trae todas las páginas del catálogo admin (incluye productos ocultos).
async function cargarTodosLosProductos() {
  const acumulado = [];
  for (let pagina = 1; pagina <= 50; pagina += 1) {
    const { productos, paginacion } = await listarProductosPaginado({ todos: true, limite: 200, pagina });
    acumulado.push(...productos);
    const totalPaginas = Number(paginacion?.totalPaginas || 1);
    if (!productos.length || pagina >= totalPaginas) break;
  }
  return acumulado;
}

export default function AlmacenAdmin() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // --- Lector QR
  const [camaraAbierta, setCamaraAbierta] = useState(false);
  const [estadoCamara, setEstadoCamara] = useState('');
  const [errorCamara, setErrorCamara] = useState(false);
  const [buscandoProducto, setBuscandoProducto] = useState(false);
  const [productoLeido, setProductoLeido] = useState(null);
  const [cantidadIngreso, setCantidadIngreso] = useState(1);
  const [registrando, setRegistrando] = useState(false);
  const [codigoManual, setCodigoManual] = useState('');
  const [historial, setHistorial] = useState([]);
  const videoRef = useRef(null);
  const procesandoRef = useRef(false);
  const cantidadRef = useRef(null);

  // --- Stock por categoría
  const [categoriaAbierta, setCategoriaAbierta] = useState('');
  const [filtro, setFiltro] = useState('');
  const [ajuste, setAjuste] = useState(null); // { id, cantidad }
  const [guardandoAjuste, setGuardandoAjuste] = useState(false);

  const cargar = async () => {
    setCargando(true); setError('');
    try {
      const [lista, cats] = await Promise.all([cargarTodosLosProductos(), listarCategorias({ todas: true })]);
      setProductos(lista);
      setCategorias(cats.map((c) => ({ ...c, nombre: texto(c.nombre) })));
    } catch (err) {
      setError(err.message || 'No se pudo cargar el inventario.');
    } finally {
      setCargando(false);
    }
  };
  useEffect(() => { cargar(); }, []);

  const reemplazarProducto = (actualizado) => {
    if (!actualizado?.id) return;
    setProductos((lista) => {
      const existe = lista.some((p) => String(p.id) === String(actualizado.id));
      return existe ? lista.map((p) => (String(p.id) === String(actualizado.id) ? { ...p, ...actualizado } : p)) : [...lista, actualizado];
    });
  };

  // ---------- Cámara: encendida sólo mientras no hay producto leído ----------
  useEffect(() => {
    if (!camaraAbierta || productoLeido || !videoRef.current) return undefined;
    let cancelado = false;
    let controles;
    const video = videoRef.current;
    procesandoRef.current = false;
    setEstadoCamara('Solicitando acceso a la cámara…');
    setErrorCamara(false);

    const iniciar = async () => {
      try {
        const { BrowserQRCodeReader } = await import('@zxing/browser');
        if (cancelado || !videoRef.current) return;
        const lector = new BrowserQRCodeReader();
        const ctrl = await lector.decodeFromConstraints(
          { video: { facingMode: { ideal: 'environment' } } },
          videoRef.current,
          async (resultado) => {
            if (cancelado || !resultado || procesandoRef.current) return;
            procesandoRef.current = true;
            const id = obtenerIdDelQr(resultado.getText());
            if (!id) {
              setEstadoCamara('El código no es un QR de producto TERRA.');
              setErrorCamara(true);
              window.setTimeout(() => { procesandoRef.current = false; }, 1200);
              return;
            }
            await seleccionarProductoPorCodigo(id, 'qr');
            window.setTimeout(() => { procesandoRef.current = false; }, 1200);
          },
        );
        if (cancelado) { ctrl.stop(); return; }
        controles = ctrl;
        setEstadoCamara('Apuntá la cámara al código QR del producto que ingresa.');
      } catch (err) {
        if (cancelado) return;
        setErrorCamara(true);
        setEstadoCamara(err?.name === 'NotAllowedError'
          ? 'Permití el acceso a la cámara en el navegador para escanear.'
          : err?.name === 'NotFoundError'
            ? 'No se encontró una cámara en este dispositivo. Usá el código manual.'
            : 'No se pudo iniciar la cámara. Revisá los permisos e intentá de nuevo.');
      }
    };
    iniciar();
    return () => {
      cancelado = true;
      controles?.stop();
      const stream = video?.srcObject;
      if (stream && typeof stream.getTracks === 'function') stream.getTracks().forEach((pista) => pista.stop());
      if (video) video.srcObject = null;
    };
    // seleccionarProductoPorCodigo sólo usa setters estables.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camaraAbierta, productoLeido]);

  async function seleccionarProductoPorCodigo(codigo, origen = 'manual') {
    setBuscandoProducto(true);
    setErrorCamara(false);
    setEstadoCamara('Buscando producto…');
    try {
      const producto = await obtenerProducto(codigo);
      setProductoLeido(producto);
      setCantidadIngreso(1);
      setEstadoCamara(`${producto.nombre} leído. Indicá la cantidad que ingresa.`);
      window.setTimeout(() => cantidadRef.current?.focus(), 50);
    } catch (err) {
      setErrorCamara(true);
      setEstadoCamara(err.message || (origen === 'qr' ? 'No se encontró el producto del QR.' : 'No se encontró un producto con ese código.'));
    } finally {
      setBuscandoProducto(false);
    }
  }

  const buscarManual = async (event) => {
    event.preventDefault();
    const codigo = texto(codigoManual);
    if (!codigo) return;
    await seleccionarProductoPorCodigo(codigo, 'manual');
  };

  const escanearOtro = () => {
    setProductoLeido(null);
    setCantidadIngreso(1);
    setCodigoManual('');
    setErrorCamara(false);
    setEstadoCamara('');
  };

  const registrarIngreso = async (event) => {
    event.preventDefault();
    if (!productoLeido) return;
    const cantidad = Math.floor(Number(cantidadIngreso));
    if (!Number.isSafeInteger(cantidad) || cantidad < 1 || cantidad > CANTIDAD_MAXIMA) {
      await avisoError(`La cantidad debe ser un entero entre 1 y ${CANTIDAD_MAXIMA}.`);
      return;
    }
    setRegistrando(true);
    try {
      const actualizado = await agregarStock(productoLeido.id, cantidad);
      reemplazarProducto(actualizado);
      setHistorial((lista) => [{ id: `${Date.now()}-${productoLeido.id}`, nombre: productoLeido.nombre, sku: productoLeido.sku, cantidad, stock: actualizado.stock, hora: new Date() }, ...lista].slice(0, 25));
      await avisoExito({ titulo: 'Ingreso registrado', texto: `+${cantidad} de "${productoLeido.nombre}". Stock actual: ${actualizado.stock}.` });
      escanearOtro();
    } catch (err) {
      await avisoError(err.message || 'No se pudo registrar el ingreso.');
    } finally {
      setRegistrando(false);
    }
  };

  // ---------- Stock por categoría ----------
  const porCategoria = useMemo(() => {
    const grupos = new Map();
    for (const c of categorias) grupos.set(c.nombre, { nombre: c.nombre, emoji: c.emoji || '📦', productos: [] });
    for (const p of productos) {
      const nombreCat = texto(p.categoria) || 'Sin categoría';
      if (!grupos.has(nombreCat)) grupos.set(nombreCat, { nombre: nombreCat, emoji: '📦', productos: [] });
      grupos.get(nombreCat).productos.push(p);
    }
    const termino = filtro.trim().toLowerCase();
    return Array.from(grupos.values())
      .map((g) => {
        const lista = g.productos
          .filter((p) => !termino || p.nombre.toLowerCase().includes(termino) || String(p.sku || '').toLowerCase().includes(termino))
          .sort((a, b) => a.nombre.localeCompare(b.nombre));
        return { ...g, productos: lista, unidades: lista.reduce((t, p) => t + Number(p.stock || 0), 0), sinStock: lista.filter((p) => Number(p.stock || 0) <= 0).length };
      })
      .filter((g) => g.productos.length > 0 || !termino)
      .sort((a, b) => b.unidades - a.unidades || a.nombre.localeCompare(b.nombre));
  }, [categorias, productos, filtro]);

  const totales = useMemo(() => ({
    productos: productos.length,
    unidades: productos.reduce((t, p) => t + Number(p.stock || 0), 0),
    categorias: porCategoria.filter((g) => g.productos.length).length,
    sinStock: productos.filter((p) => Number(p.stock || 0) <= 0).length,
  }), [productos, porCategoria]);

  const guardarAjuste = async (producto) => {
    const cantidad = Math.floor(Number(ajuste?.cantidad));
    if (!Number.isSafeInteger(cantidad) || cantidad < 1 || cantidad > CANTIDAD_MAXIMA) {
      await avisoError(`La cantidad debe ser un entero entre 1 y ${CANTIDAD_MAXIMA}.`);
      return;
    }
    setGuardandoAjuste(true);
    try {
      const actualizado = await agregarStock(producto.id, cantidad);
      reemplazarProducto(actualizado);
      setHistorial((lista) => [{ id: `${Date.now()}-${producto.id}`, nombre: producto.nombre, sku: producto.sku, cantidad, stock: actualizado.stock, hora: new Date() }, ...lista].slice(0, 25));
      setAjuste(null);
      await avisoExito({ titulo: 'Stock aumentado', texto: `+${cantidad} de "${producto.nombre}". Stock actual: ${actualizado.stock}.` });
    } catch (err) {
      await avisoError(err.message || 'No se pudo aumentar el stock.');
    } finally {
      setGuardandoAjuste(false);
    }
  };

  const hora = (fecha) => fecha.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });

  return <main className="warehouse-admin">
    <header className="warehouse-heading">
      <div className="warehouse-heading-copy">
        <div className="warehouse-heading-title"><span className="warehouse-heading-icon"><Warehouse size={25} aria-hidden="true" /></span><h1>Almacén</h1><b>{totales.unidades} unidades</b></div>
        <p>Registrá ingresos de mercadería escaneando el QR del producto y controlá el stock por categoría.</p>
      </div>
      <button type="button" className="warehouse-refresh" onClick={cargar} disabled={cargando}><RefreshCw size={16} /> Actualizar</button>
    </header>

    <section className="warehouse-kpis">
      <article className="warehouse-kpi warehouse-kpi--stock"><span className="warehouse-kpi-icon" aria-hidden="true"><Boxes size={28} /></span><div><small>Unidades en stock</small><b>{totales.unidades}</b><span>Sumando todo el catálogo</span></div><BarChart3 className="warehouse-kpi-watermark" size={33} aria-hidden="true" /></article>
      <article className="warehouse-kpi warehouse-kpi--products"><span className="warehouse-kpi-icon" aria-hidden="true"><PackageSearch size={28} /></span><div><small>Productos</small><b>{totales.productos}</b><span>Incluye ocultos del catálogo</span></div><PackageSearch className="warehouse-kpi-watermark" size={33} aria-hidden="true" /></article>
      <article className="warehouse-kpi warehouse-kpi--categories"><span className="warehouse-kpi-icon" aria-hidden="true"><Layers size={28} /></span><div><small>Categorías con productos</small><b>{totales.categorias}</b><span>De {categorias.length} registradas</span></div><BarChart3 className="warehouse-kpi-watermark" size={33} aria-hidden="true" /></article>
      <article className={`warehouse-kpi warehouse-kpi--empty${totales.sinStock ? ' is-alert' : ''}`}><span className="warehouse-kpi-icon" aria-hidden="true"><PackagePlus size={28} /></span><div><small>Sin stock</small><b>{totales.sinStock}</b><span>Productos en cero</span></div><TriangleAlert className="warehouse-kpi-watermark" size={33} aria-hidden="true" /></article>
    </section>

    {error && <p className="warehouse-state warehouse-state--error">{error}</p>}

    <div className="warehouse-layout">
      {/* ---------- Ingreso por QR ---------- */}
      <section className="warehouse-card warehouse-scanner">
        <header>
          <div><h2><ScanLine size={18} /> Ingreso por QR</h2><span>Escaneá el producto y escribí la cantidad que entra al almacén.</span></div>
          {camaraAbierta
            ? <button type="button" className="ghost" onClick={() => { setCamaraAbierta(false); escanearOtro(); }}><CameraOff size={16} /> Cerrar cámara</button>
            : <button type="button" className="primary" onClick={() => setCamaraAbierta(true)}><Camera size={16} /> Abrir cámara</button>}
        </header>

        {camaraAbierta && (
          <div className={`warehouse-camera${productoLeido ? ' is-paused' : ''}`}>
            <video ref={videoRef} autoPlay muted playsInline aria-label="Vista de cámara para escanear códigos QR" />
            <span className="warehouse-camera-frame" aria-hidden="true" />
            {productoLeido && <div className="warehouse-camera-pause" aria-hidden="true"><Check size={26} /><span>Código leído · cámara apagada</span></div>}
          </div>
        )}

        {!camaraAbierta && !productoLeido && !errorCamara && (
          <div className="warehouse-scanner-empty">
            <span><QrCode size={70} aria-hidden="true" /></span>
            <b>Escaneá el código QR del producto</b>
            <p>También podés escribir el código manualmente.</p>
          </div>
        )}

        {(camaraAbierta || productoLeido || errorCamara) && <p className={`warehouse-status${errorCamara ? ' is-error' : ''}`} role="status" aria-live="polite">{estadoCamara || 'La cámara se activará para leer el código.'}</p>}

        {!productoLeido && (
          <div className="warehouse-manual-area">
            <b>O ingresá el código del producto</b>
            <form className="warehouse-manual" onSubmit={buscarManual}>
              <label><Search size={17} /><input value={codigoManual} onChange={(e) => setCodigoManual(e.target.value)} placeholder="Código Terra, SKU o id del producto" aria-label="Código Terra, SKU o id del producto" maxLength="100" /></label>
              <button type="submit" className="ghost" disabled={buscandoProducto || !texto(codigoManual)}>{buscandoProducto ? 'Buscando…' : 'Buscar'}</button>
            </form>
            <p><Info size={18} aria-hidden="true" /> Después de buscar el producto podrás ingresar la cantidad que entra al almacén.</p>
          </div>
        )}

        {productoLeido && (
          <form className="warehouse-entry" onSubmit={registrarIngreso}>
            <div className="warehouse-entry__product">
              <div className="warehouse-entry__img">{productoLeido.imagen_url ? <img src={productoLeido.imagen_url} alt="" /> : <PackageSearch size={28} />}</div>
              <div>
                <b>{productoLeido.nombre}</b>
                <small>{productoLeido.sku} · {productoLeido.categoria}</small>
                <span>Stock actual: <strong>{productoLeido.stock}</strong></span>
              </div>
            </div>
            <label className="warehouse-entry__qty">
              Cantidad que ingresa
              <div>
                <button type="button" aria-label="Restar" onClick={() => setCantidadIngreso((v) => Math.max(1, Number(v) - 1))}>−</button>
                <input ref={cantidadRef} type="number" min="1" max={CANTIDAD_MAXIMA} inputMode="numeric" value={cantidadIngreso} onChange={(e) => setCantidadIngreso(e.target.value)} />
                <button type="button" aria-label="Sumar" onClick={() => setCantidadIngreso((v) => Math.min(CANTIDAD_MAXIMA, Number(v || 0) + 1))}>+</button>
              </div>
            </label>
            <p className="warehouse-entry__result">Quedará en <b>{Number(productoLeido.stock || 0) + (Number(cantidadIngreso) > 0 ? Math.floor(Number(cantidadIngreso)) : 0)}</b> unidades.</p>
            <footer>
              <button type="button" className="ghost" onClick={escanearOtro}><ScanLine size={16} /> Escanear otro</button>
              <button type="submit" className="primary" disabled={registrando}><PackagePlus size={17} /> {registrando ? 'Registrando…' : 'Registrar ingreso'}</button>
            </footer>
          </form>
        )}

        {historial.length > 0 && (
          <div className="warehouse-history">
            <h3>Ingresos de esta sesión</h3>
            <ul>{historial.map((h) => <li key={h.id}><span>{hora(h.hora)}</span><b>+{h.cantidad}</b><div>{h.nombre}<small>{h.sku} · stock {h.stock}</small></div></li>)}</ul>
          </div>
        )}
      </section>

      {/* ---------- Stock por categoría ---------- */}
      <section className="warehouse-card warehouse-categories">
        <header>
          <div><h2><Layers size={18} /> Stock por categoría</h2><span>Tocá una categoría para ver sus productos y aumentar stock.</span></div>
          <label className="warehouse-filter"><Search size={16} /><input value={filtro} onChange={(e) => setFiltro(e.target.value)} placeholder="Filtrar producto o SKU" aria-label="Filtrar producto o SKU" /></label>
        </header>

        {cargando && <p className="warehouse-state">Cargando inventario…</p>}
        {!cargando && !porCategoria.length && <p className="warehouse-state">No hay productos para mostrar.</p>}

        <ul className="warehouse-cat-list">
          {porCategoria.map((g, indice) => {
            const abierta = categoriaAbierta === g.nombre;
            const porcentaje = totales.unidades ? Math.round((g.unidades / totales.unidades) * 100) : 0;
            return <li key={g.nombre} className={abierta ? 'is-open' : ''}>
              <button type="button" className="warehouse-cat-row" aria-expanded={abierta} onClick={() => setCategoriaAbierta(abierta ? '' : g.nombre)}>
                <span className="warehouse-cat-emoji">{g.emoji}</span>
                <div><b>{g.nombre}</b><small>{g.productos.length} {g.productos.length === 1 ? 'producto' : 'productos'}{g.sinStock ? ` · ${g.sinStock} sin stock` : ''}</small></div>
                <strong>{g.unidades} <em>unid.</em></strong>
                <span className={`warehouse-cat-progress warehouse-cat-progress--${indice % 8}`} aria-label={`${porcentaje}% del stock total`}><i style={{ width: `${porcentaje}%` }} /></span>
                <em className="warehouse-cat-percent">{porcentaje}%</em>
                {abierta ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              </button>
              {abierta && (
                <table className="warehouse-products">
                  <thead><tr><th>Producto</th><th>SKU</th><th>Stock</th><th>Aumentar</th></tr></thead>
                  <tbody>
                    {g.productos.map((p) => {
                      const editando = ajuste?.id === p.id;
                      const stock = Number(p.stock || 0);
                      return <tr key={p.id} className={stock <= 0 ? 'is-empty' : ''}>
                        <td><div className="warehouse-product"><b>{p.nombre}</b>{p.visible === false && <small>Oculto en catálogo</small>}</div></td>
                        <td><code>{p.sku}</code></td>
                        <td><span className={`warehouse-stock${stock <= 0 ? ' is-zero' : stock <= 5 ? ' is-low' : ''}`}>{stock}</span></td>
                        <td>
                          {editando
                            ? <div className="warehouse-adjust">
                                <input type="number" min="1" max={CANTIDAD_MAXIMA} inputMode="numeric" autoFocus value={ajuste.cantidad} onChange={(e) => setAjuste({ id: p.id, cantidad: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); guardarAjuste(p); } if (e.key === 'Escape') setAjuste(null); }} />
                                <button type="button" className="primary" disabled={guardandoAjuste} onClick={() => guardarAjuste(p)} title="Confirmar" aria-label="Confirmar"><Check size={15} /></button>
                                <button type="button" className="ghost" onClick={() => setAjuste(null)} title="Cancelar" aria-label="Cancelar"><X size={15} /></button>
                              </div>
                            : <button type="button" className="warehouse-add" onClick={() => setAjuste({ id: p.id, cantidad: 1 })}><Plus size={15} /> Stock</button>}
                        </td>
                      </tr>;
                    })}
                    {!g.productos.length && <tr><td colSpan="4" className="warehouse-empty">Sin productos en esta categoría.</td></tr>}
                  </tbody>
                </table>
              )}
            </li>;
          })}
        </ul>
      </section>
    </div>
  </main>;
}
