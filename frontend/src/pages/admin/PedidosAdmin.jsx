import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Barcode,
  Check,
  CheckCircle2,
  CreditCard,
  Edit3,
  ExternalLink,
  ImagePlus,
  Minus,
  Package,
  Plus,
  Printer,
  QrCode,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useLocation, useSearchParams } from 'react-router-dom';
import {
  actualizarItemsPedido,
  actualizarEstadoPedido,
  listarPedidos,
  obtenerPedido,
  registrarPagoPedido,
} from '../../services/pedidoService.js';
import { listarProductos } from '../../services/productoService.js';
import { getAdminUser } from '../../services/adminService.js';
import { subirComprobantePago } from '../../services/storageService.js';
import { formatoMoneda } from '../../utils/formatoMoneda.js';
import { imprimirTicketPedido } from '../../utils/imprimirTicket.js';
import ReportePedidosVendedor from '../../components/vendedor/ReportePedidosVendedor.jsx';
import './Admin.css';
import './PedidosAdmin.css';

const etiquetas = { pending: 'Pendiente de pago', pendiente_pago: 'Pendiente de pago', paid: 'Cobrado', completed: 'Cobrado', pagado: 'Cobrado', shipped: 'En despacho', delivered: 'Entregado', entregado: 'Entregado', cancelled: 'Cancelado', cancelado: 'Cancelado' };
const POR_COBRAR = ['pending', 'pendiente_pago'];
const esAnulado = (estado) => ['cancelled', 'cancelado'].includes(String(estado || '').toLowerCase());
const EN_DESPACHO = ['ready_for_pickup', 'out_for_delivery', 'shipped', 'entregado', 'delivered'];
const TEXTO_BUSQUEDA = 'Cliente, teléfono, NIT o ticket';

function formatoFechaHora(fecha) {
  if (!fecha) return '—';
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('es-BO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/La_Paz',
  }).format(d);
}

export default function PedidosAdmin() {
  const [params] = useSearchParams();
  const location = useLocation();
  const usuario = getAdminUser();
  const esVendedor = location.pathname.startsWith('/vendedor') || usuario?.rol === 'vendedor';
  const [tab, setTab] = useState('todos');
  const [buscar, setBuscar] = useState(() => params.get('q') || '');
  const [pedidos, setPedidos] = useState([]);
  const [seleccion, setSeleccion] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [error, setError] = useState('');
  const [metodo, setMetodo] = useState('qr');
  const [archivoComprobante, setArchivoComprobante] = useState(null);
  const [subiendoPago, setSubiendoPago] = useState(false);
  const [anulandoId, setAnulandoId] = useState(null);
  const [imprimiendoId, setImprimiendoId] = useState(null);

  // Estados para edición y adición de productos si el cliente cambia de opinión
  const [modoEdicion, setModoEdicion] = useState(false);
  const [cargandoItems, setCargandoItems] = useState(false);
  const [guardandoItems, setGuardandoItems] = useState(false);
  const [itemsEditados, setItemsEditados] = useState([]);
  const [catalogoProductos, setCatalogoProductos] = useState([]);
  const [busquedaCatalogo, setBusquedaCatalogo] = useState('');
  const [mostrarCatalogo, setMostrarCatalogo] = useState(false);
  const [mensajeEdicion, setMensajeEdicion] = useState('');

  const cargarPedidos = useCallback(async ({ silencioso = false } = {}) => {
    if (!silencioso) setCargando(true);
    try {
      const data = await listarPedidos({ buscar: buscar.trim(), limite: 200 });
      setPedidos(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) { setError(err.message || 'No se pudieron cargar los pedidos.'); }
    finally { setCargando(false); setActualizando(false); }
  }, [buscar]);

  useEffect(() => {
    const id = setTimeout(() => cargarPedidos(), buscar.trim() ? 350 : 0);
    return () => clearTimeout(id);
  }, [cargarPedidos, buscar]);
  useEffect(() => {
    const refrescar = () => cargarPedidos({ silencioso: true });
    window.addEventListener('terra:pedidos-nuevos', refrescar);
    return () => window.removeEventListener('terra:pedidos-nuevos', refrescar);
  }, [cargarPedidos]);

  // Escape cierra el modal del pedido (accesibilidad de teclado).
  useEffect(() => {
    if (!seleccion) return undefined;
    const alEscape = (event) => { if (event.key === 'Escape') setSeleccion(null); };
    document.addEventListener('keydown', alEscape);
    return () => document.removeEventListener('keydown', alEscape);
  }, [seleccion]);

  const tabs = useMemo(() => {
    const base = [
      ['todos', 'Todos'],
      ['pending', 'Pendientes de pago'],
      ['completed', 'Cobrados'],
    ];
    if (!esVendedor) {
      base.push(['shipped', 'En despacho']);
    }
    base.push(['cancelled', 'Anulados']);
    return base;
  }, [esVendedor]);

  const vista = useMemo(() => pedidos.filter((pedido) => {
    if (tab === 'todos') return true;
    if (tab === 'pending') return POR_COBRAR.includes(pedido.estado);
    if (tab === 'shipped') return EN_DESPACHO.includes(pedido.estado);
    if (tab === 'cancelled') return ['cancelled', 'cancelado'].includes(String(pedido.estado || '').toLowerCase());
    return pedido.estado === tab;
  }), [pedidos, tab]);
  const pendientes = pedidos.filter((pedido) => POR_COBRAR.includes(pedido.estado)).length;

  const abrirPedido = async (pedido, { iniciarEnEdicion = false } = {}) => {
    setSeleccion(pedido);
    setMetodo(pedido.metodo_pago || 'qr');
    setArchivoComprobante(null);
    setError('');
    setModoEdicion(iniciarEnEdicion);
    setMensajeEdicion('');
    setBusquedaCatalogo('');
    setMostrarCatalogo(false);

    if (iniciarEnEdicion) {
      cargarCatalogo();
      setCargandoItems(true);
    }

    try {
      const completo = await obtenerPedido(pedido.id);
      if (completo && Array.isArray(completo.items)) {
        setItemsEditados(
          completo.items.map((it) => ({
            productoId: it.productoId || it.id,
            nombre: it.nombre || it.product_name,
            sku: it.sku || '',
            cantidad: Number(it.cantidad || 1),
            precioUnitario: Number(it.precioUnitario || 0),
            subtotal: Number(it.subtotal || 0),
          }))
        );
      }
    } catch (err) {
      if (iniciarEnEdicion) {
        setError(err.message || 'No se pudieron cargar los artículos para edición.');
      }
    } finally {
      if (iniciarEnEdicion) {
        setCargandoItems(false);
      }
    }
  };

  const abrirPedidoParaEdicion = (pedido) => {
    abrirPedido(pedido, { iniciarEnEdicion: true });
  };

  const cargarCatalogo = async () => {
    if (catalogoProductos.length > 0) return;
    try {
      const prods = await listarProductos({ limite: 150 });
      setCatalogoProductos(Array.isArray(prods) ? prods : []);
    } catch (e) {
      console.error('Error cargando catálogo para edición:', e);
    }
  };

  const iniciarEdicion = async () => {
    setModoEdicion(true);
    setMensajeEdicion('');
    cargarCatalogo();
    if (!itemsEditados.length && seleccion) {
      setCargandoItems(true);
      try {
        const completo = await obtenerPedido(seleccion.id);
        if (completo && Array.isArray(completo.items)) {
          setItemsEditados(
            completo.items.map((it) => ({
              productoId: it.productoId || it.id,
              nombre: it.nombre || it.product_name,
              sku: it.sku || '',
              cantidad: Number(it.cantidad || 1),
              precioUnitario: Number(it.precioUnitario || 0),
              subtotal: Number(it.subtotal || 0),
            }))
          );
        }
      } catch (err) {
        setError(err.message || 'No se pudieron cargar los artículos para edición.');
      } finally {
        setCargandoItems(false);
      }
    }
  };

  const cambiarCantidadItem = (index, delta) => {
    setItemsEditados((prev) => {
      const copia = [...prev];
      const actual = copia[index];
      const nuevaCantidad = Math.max(1, Math.min(100, (actual.cantidad || 1) + delta));
      copia[index] = {
        ...actual,
        cantidad: nuevaCantidad,
        subtotal: (actual.precioUnitario || 0) * nuevaCantidad,
      };
      return copia;
    });
  };

  const fijarCantidadItem = (index, valor) => {
    const num = parseInt(valor, 10);
    if (Number.isNaN(num)) return;
    const nuevaCantidad = Math.max(1, Math.min(100, num));
    setItemsEditados((prev) => {
      const copia = [...prev];
      const actual = copia[index];
      copia[index] = {
        ...actual,
        cantidad: nuevaCantidad,
        subtotal: (actual.precioUnitario || 0) * nuevaCantidad,
      };
      return copia;
    });
  };

  const eliminarItem = (index) => {
    if (itemsEditados.length <= 1) {
      alert('El pedido debe tener al menos un producto.');
      return;
    }
    setItemsEditados((prev) => prev.filter((_, i) => i !== index));
  };

  const agregarProductoAlPedido = (prod) => {
    setItemsEditados((prev) => {
      const idx = prev.findIndex(
        (it) => String(it.productoId) === String(prod.id) || (prod.sku && it.sku === prod.sku) || it.nombre === prod.nombre
      );
      if (idx >= 0) {
        const copia = [...prev];
        const actual = copia[idx];
        const nuevaCantidad = Math.min(100, (actual.cantidad || 1) + 1);
        copia[idx] = {
          ...actual,
          cantidad: nuevaCantidad,
          subtotal: (actual.precioUnitario || 0) * nuevaCantidad,
        };
        return copia;
      }
      const precio = Number(prod.precio || 0);
      return [
        ...prev,
        {
          productoId: prod.id,
          nombre: prod.nombre,
          sku: prod.sku,
          cantidad: 1,
          precioUnitario: precio,
          subtotal: precio,
        },
      ];
    });
    setBusquedaCatalogo('');
    setMostrarCatalogo(false);
  };

  const totalItemsEditados = useMemo(() => {
    return itemsEditados.reduce((acc, it) => acc + (Number(it.precioUnitario || 0) * Number(it.cantidad || 1)), 0);
  }, [itemsEditados]);

  const productosFiltrados = useMemo(() => {
    const query = busquedaCatalogo.trim().toLowerCase();
    if (!query) return catalogoProductos.slice(0, 8);
    return catalogoProductos.filter(
      (p) =>
        (p.nombre || '').toLowerCase().includes(query) ||
        (p.sku || '').toLowerCase().includes(query) ||
        (p.categoria || '').toLowerCase().includes(query)
    ).slice(0, 8);
  }, [catalogoProductos, busquedaCatalogo]);

  const guardarCambiosItems = async () => {
    if (!itemsEditados.length) {
      alert('El pedido debe contener al menos un producto.');
      return;
    }
    setGuardandoItems(true);
    setError('');
    setMensajeEdicion('');
    try {
      const respuesta = await actualizarItemsPedido(seleccion.id, itemsEditados);
      const pedidoActualizado = respuesta.data || respuesta;

      const nuevoTotal = Number(pedidoActualizado.total || 0);
      const itemsCadena = Array.isArray(pedidoActualizado.items)
        ? pedidoActualizado.items.map((it) => `${it.cantidad}x ${it.nombre}`).join(', ')
        : itemsEditados.map((it) => `${it.cantidad}x ${it.nombre}`).join(', ');

      setSeleccion((prev) => ({
        ...prev,
        total: nuevoTotal,
        items: itemsCadena,
      }));

      if (Array.isArray(pedidoActualizado.items)) {
        setItemsEditados(
          pedidoActualizado.items.map((it) => ({
            productoId: it.productoId || it.id,
            nombre: it.nombre || it.product_name,
            sku: it.sku || '',
            cantidad: Number(it.cantidad || 1),
            precioUnitario: Number(it.precioUnitario || 0),
            subtotal: Number(it.subtotal || 0),
          }))
        );
      }

      setPedidos((lista) =>
        lista.map((p) =>
          p.id === seleccion.id
            ? {
                ...p,
                total: nuevoTotal,
                items: itemsCadena,
              }
            : p
        )
      );

      setModoEdicion(false);
      setMensajeEdicion('¡Productos y total del pedido actualizados con éxito!');
      setTimeout(() => setMensajeEdicion(''), 4000);
    } catch (err) {
      setError(err.message || 'Error al actualizar los productos del pedido.');
    } finally {
      setGuardandoItems(false);
    }
  };

  const actualizar = () => { setActualizando(true); cargarPedidos({ silencioso: true }); };

  const registrarPago = async () => {
    if (!seleccion) return;
    if (esAnulado(seleccion.estado)) { setError('Este pedido fue anulado. No se puede cobrar ni guardar un comprobante.'); return; }
    setSubiendoPago(true); setError('');
    try {
      const comprobanteUrl = archivoComprobante ? await subirComprobantePago(archivoComprobante) : seleccion.comprobante_url || null;
      const actualizado = await registrarPagoPedido(seleccion.id, { metodoPago: metodo, comprobanteUrl });
      const cambios = { estado: actualizado?.estado ?? 'completed', comprobante_url: actualizado?.comprobante_url ?? comprobanteUrl, metodo_pago: actualizado?.metodo_pago ?? metodo };
      setPedidos((lista) => lista.map((pedido) => pedido.id === seleccion.id ? { ...pedido, ...cambios } : pedido));
      setSeleccion(null); setArchivoComprobante(null);
    } catch (err) {
      setError(err.message || 'No se pudo registrar el pago.');
      // El backend rechaza cobrar un pedido anulado: si esta lista estaba desactualizada
      // (lo anularon desde otra pantalla o dispositivo), traer el estado real.
      try {
        const real = await obtenerPedido(seleccion.id);
        if (real?.estado && real.estado !== seleccion.estado) {
          setPedidos((lista) => lista.map((pedido) => pedido.id === seleccion.id ? { ...pedido, estado: real.estado } : pedido));
          setSeleccion((actual) => actual && actual.id === seleccion.id ? { ...actual, estado: real.estado } : actual);
        }
      } catch { /* se mantiene el error original */ }
    }
    finally { setSubiendoPago(false); }
  };

  const anularPedido = async (pedido) => {
    if (!pedido || !POR_COBRAR.includes(pedido.estado)) return;
    const referencia = pedido.numero ? `el pedido #${pedido.numero}` : 'este pedido';
    if (!window.confirm(`¿Anular ${referencia}? La venta quedará registrada como anulada y no se podrá cobrar.`)) return;

    setAnulandoId(pedido.id);
    setError('');
    try {
      const actualizado = await actualizarEstadoPedido(pedido.id, 'cancelled');
      const cambios = { estado: actualizado?.estado || 'cancelled' };
      setPedidos((lista) => lista.map((actual) => actual.id === pedido.id ? { ...actual, ...cambios } : actual));
      setSeleccion(null);
      setModoEdicion(false);
      setArchivoComprobante(null);
    } catch (err) {
      setError(err.message || 'No se pudo anular el pedido.');
    } finally {
      setAnulandoId(null);
    }
  };

  const imprimirTicket = async (pedido) => {
    const ventana = window.open('', '_blank', 'width=430,height=760');
    if (!ventana) { setError('Permite las ventanas emergentes para imprimir el ticket.'); return; }
    ventana.document.write('<title>Generando ticket…</title><p style="font-family:Arial;padding:24px">Generando ticket…</p>');
    ventana.document.close();
    setImprimiendoId(pedido.id);
    try { imprimirTicketPedido(await obtenerPedido(pedido.id), ventana); }
    catch (err) { ventana.close(); setError(err.message || 'No se pudo generar el ticket del pedido.'); }
    finally { setImprimiendoId(null); }
  };

  const contarUnidades = (items) => {
    if (!items) return 0;
    if (Array.isArray(items)) {
      return items.reduce((acc, it) => acc + Number(it.cantidad || it.quantity || 1), 0);
    }
    if (typeof items === 'string') {
      const matches = [...items.matchAll(/(\d+)x\s+/gi)];
      if (matches.length > 0) {
        return matches.reduce((acc, m) => acc + Number(m[1] || 0), 0);
      }
      return items.trim() ? 1 : 0;
    }
    return 0;
  };

  const productosVendidos = useMemo(() => {
    return pedidos
      .filter((pedido) => !['cancelado', 'cancelled'].includes(String(pedido.estado || '').toLowerCase()))
      .reduce((total, pedido) => total + contarUnidades(pedido.items), 0);
  }, [pedidos]);
  const pedidosAnulados = pedidos.filter((pedido) => ['cancelado', 'cancelled'].includes(String(pedido.estado || '').toLowerCase())).length;

  const comprobanteActual = archivoComprobante ? URL.createObjectURL(archivoComprobante) : seleccion?.comprobante_url;
  const pendiente = seleccion && POR_COBRAR.includes(seleccion.estado);
  const anulado = seleccion ? esAnulado(seleccion.estado) : false;

  return <main className="orders">
    <header className="orders-hero"><div><h1>{esVendedor ? 'Pedidos' : 'Recepción y despacho de pedidos'}</h1></div><form onSubmit={(event) => event.preventDefault()}><Barcode size={25} /><input value={buscar} onChange={(event) => setBuscar(event.target.value)} placeholder={TEXTO_BUSQUEDA} aria-label={`Buscar pedido: ${TEXTO_BUSQUEDA}`} /><button>Buscar</button></form></header>
    <section className="orders-metrics">
      <article><b>{pendientes} pedidos</b><span>Por cobrar en caja</span></article>
      <article><b>{productosVendidos} unidades</b><span>Productos vendidos</span></article>
      <article><b>{pedidos.length} pedidos</b><span>Registrados en el sistema</span></article>
      <article><b>{pedidosAnulados} pedidos</b><span>Ventas anuladas por clientes</span></article>
      {!esVendedor && <article><b>{pedidos.filter((pedido) => EN_DESPACHO.includes(pedido.estado)).length} pedidos</b><span>En despacho</span></article>}
    </section>
    <nav className="orders-tabs">{tabs.map(([id, etiqueta]) => <button className={tab === id ? 'active' : ''} onClick={() => setTab(id)} key={id}>{etiqueta}</button>)}</nav>
    <section className="orders-list">
      <header><div><span>Órdenes de autoservicio</span><h2>Pedidos en operación</h2></div><div className="orders-list-tools"><label><Search size={18} /><input value={buscar} onChange={(event) => setBuscar(event.target.value)} placeholder={TEXTO_BUSQUEDA} aria-label={`Filtrar pedidos: ${TEXTO_BUSQUEDA}`} /></label><ReportePedidosVendedor pedidos={pedidos} /><button type="button" className="orders-refresh" onClick={actualizar} disabled={actualizando}><RefreshCw size={16} className={actualizando ? 'is-spinning' : ''} /> Actualizar</button></div></header>
      {cargando && pedidos.length === 0 && <p>Cargando pedidos reales...</p>}{error && <p className="error-box">{error}</p>}
      {!cargando && !error && vista.length === 0 && <p>{buscar.trim() ? `No hay pedidos que coincidan con «${buscar.trim()}».` : 'No hay pedidos registrados todavía.'}</p>}
      {vista.map((pedido) => <article key={pedido.id}><div><b>{pedido.numero ? `Pedido #${pedido.numero}` : ''} {pedido.codigo ? `· #${pedido.codigo}` : ''}</b><small>{formatoFechaHora(pedido.fecha)}</small></div><div><b>{pedido.cliente}</b><small>{pedido.cliente_telefono ? `Tel. ${pedido.cliente_telefono}` : pedido.comprobante_url ? 'Comprobante adjunto' : 'Sin teléfono registrado'}{pedido.cliente_nit ? ` · NIT ${pedido.cliente_nit}` : ''}{pedido.repartidor_nombre ? ` · Conductor: ${pedido.repartidor_nombre}` : ''}</small></div><p>{pedido.items || 'Sin artículos'}</p><strong>{formatoMoneda(pedido.total)}</strong><i className={pedido.estado}>{etiquetas[pedido.estado] || pedido.estado}</i>
        <div className="order-actions">
          <button type="button" className="order-icon-btn" onClick={() => imprimirTicket(pedido)} disabled={imprimiendoId === pedido.id} title="Imprimir ticket térmico" aria-label={`Imprimir ticket del pedido ${pedido.numero || pedido.codigo || ''}`}>
            {imprimiendoId === pedido.id ? <RefreshCw size={15} className="is-spinning" /> : <Printer size={15} />}
          </button>
          {POR_COBRAR.includes(pedido.estado) && (
            <button type="button" className="order-icon-btn" onClick={() => abrirPedidoParaEdicion(pedido)} title="Editar o agregar productos" aria-label="Editar o agregar productos al pedido">
              <Edit3 size={15} />
            </button>
          )}
          {POR_COBRAR.includes(pedido.estado) && (
            <button type="button" className="order-icon-btn" onClick={() => anularPedido(pedido)} disabled={anulandoId === pedido.id} title="Anular venta por cancelación del cliente" aria-label="Anular venta por cancelación del cliente">
              {anulandoId === pedido.id ? <RefreshCw size={15} className="is-spinning" /> : <X size={15} />}
            </button>
          )}
          <button type="button" className="order-primary" onClick={() => abrirPedido(pedido)} title={POR_COBRAR.includes(pedido.estado) ? 'Registrar el pago del pedido' : 'Consultar el detalle del pedido'}>{POR_COBRAR.includes(pedido.estado) ? <><CreditCard size={16} /> Cobrar</> : 'Ver detalle'}</button>
        </div>
      </article>)}
    </section>
    {seleccion && <div className="orders-modal"><section role="dialog" aria-modal="true" aria-labelledby="pedido-modal-titulo"><header><div><span>Caja Equipetrol</span><h2 id="pedido-modal-titulo">{seleccion.numero ? `Pedido #${seleccion.numero} · ` : ''}#{seleccion.codigo}</h2><p>Cliente: {seleccion.cliente}</p>{(seleccion.cliente_telefono || seleccion.cliente_nit) && <p className="orders-client-data">{seleccion.cliente_telefono ? `Tel. ${seleccion.cliente_telefono}` : ''}{seleccion.cliente_telefono && seleccion.cliente_nit ? ' · ' : ''}{seleccion.cliente_nit ? `NIT ${seleccion.cliente_nit}` : ''}</p>}{seleccion.direccion_entrega && <p className="orders-hint"><Package size={16} /> Envío: {seleccion.direccion_entrega}{seleccion.referencia_entrega ? ` · ${seleccion.referencia_entrega}` : ''}</p>}</div><button onClick={() => setSeleccion(null)} aria-label="Cerrar">×</button></header><div className="orders-total"><span>{anulado ? 'Pedido anulado' : 'Monto a liquidar'}</span><b>{formatoMoneda(seleccion.total)}</b></div>{anulado && <p className="orders-alert is-error" role="status"><X size={15} /> Esta venta fue anulada. No se puede cobrar ni guardar un comprobante.</p>}
      <div className="orders-items-section">
        <div className="orders-items-head">
          <h3>Artículos del pedido</h3>
          {pendiente && !modoEdicion && (
            <button type="button" className="orders-edit-toggle-btn" onClick={iniciarEdicion}>
              <Edit3 size={15} /> Editar / Agregar productos
            </button>
          )}
        </div>
        {mensajeEdicion && <p className="orders-edit-success">{mensajeEdicion}</p>}
        {!modoEdicion ? (
          <p className="orders-items-summary">{seleccion.items || 'Sin artículos registrados'}</p>
        ) : (
          <div className="orders-items-editor">
            {cargandoItems ? (
              <p className="orders-items-loading">Cargando productos del pedido...</p>
            ) : (
              <>
                <div className="orders-items-list">
                  {itemsEditados.map((item, idx) => (
                    <div key={item.productoId || idx} className="orders-item-row">
                      <div className="orders-item-info">
                        <b>{item.nombre}</b>
                        <small>{item.sku ? `SKU: ${item.sku} · ` : ''}{formatoMoneda(item.precioUnitario)} c/u</small>
                      </div>
                      <div className="orders-item-qty">
                        <button type="button" onClick={() => cambiarCantidadItem(idx, -1)} disabled={item.cantidad <= 1} aria-label="Quitar una unidad">
                          <Minus size={14} />
                        </button>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={item.cantidad}
                          onChange={(e) => fijarCantidadItem(idx, e.target.value)}
                          aria-label={`Cantidad de ${item.nombre}`}
                        />
                        <button type="button" onClick={() => cambiarCantidadItem(idx, 1)} disabled={item.cantidad >= 100} aria-label="Agregar una unidad">
                          <Plus size={14} />
                        </button>
                      </div>
                      <div className="orders-item-subtotal">
                        {formatoMoneda(Number(item.precioUnitario || 0) * Number(item.cantidad || 1))}
                      </div>
                      <button
                        type="button"
                        className="orders-item-remove"
                        onClick={() => eliminarItem(idx)}
                        title="Eliminar este producto"
                        aria-label="Eliminar este producto"
                        disabled={itemsEditados.length <= 1}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="orders-add-product-box">
                  <label htmlFor="pedido-buscar-producto">Agregar más productos al pedido:</label>
                  <div className="orders-search-input-wrap">
                    <Search size={16} />
                    <input
                      id="pedido-buscar-producto"
                      type="text"
                      placeholder="Buscar por nombre o SKU..."
                      value={busquedaCatalogo}
                      onFocus={() => { cargarCatalogo(); setMostrarCatalogo(true); }}
                      onChange={(e) => { setBusquedaCatalogo(e.target.value); setMostrarCatalogo(true); }}
                    />
                    {busquedaCatalogo && (
                      <button type="button" className="orders-clear-search" onClick={() => setBusquedaCatalogo('')} aria-label="Limpiar búsqueda">
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {mostrarCatalogo && (
                    <div className="orders-catalog-dropdown">
                      {productosFiltrados.length === 0 ? (
                        <div className="orders-catalog-empty">No se encontraron productos coincidentes</div>
                      ) : (
                        productosFiltrados.map((prod) => (
                          <div
                            key={prod.id}
                            className="orders-catalog-item"
                            role="button"
                            tabIndex={0}
                            onClick={() => agregarProductoAlPedido(prod)}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); agregarProductoAlPedido(prod); } }}
                          >
                            <div className="orders-catalog-item-info">
                              <b>{prod.nombre}</b>
                              <small>{prod.categoria} · SKU: {prod.sku}</small>
                            </div>
                            <div className="orders-catalog-item-price">
                              <b>{formatoMoneda(prod.precio)}</b>
                              <span className="orders-add-badge"><Plus size={12} /> Agregar</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                <div className="orders-editor-summary">
                  <div>
                    <span>Nuevo total calculado:</span>
                    <b>{formatoMoneda(totalItemsEditados)}</b>
                  </div>
                  <div className="orders-editor-actions">
                    <button
                      type="button"
                      className="orders-cancel-edit-btn"
                      onClick={() => setModoEdicion(false)}
                      disabled={guardandoItems}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className="orders-save-items-btn"
                      onClick={guardarCambiosItems}
                      disabled={guardandoItems || !itemsEditados.length}
                    >
                      <Check size={16} /> {guardandoItems ? 'Guardando cambios…' : 'Guardar cambios'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
      <div className="orders-methods"><button className={metodo === 'qr' ? 'active' : ''} onClick={() => setMetodo('qr')}><QrCode />QR Simple</button><button className={metodo === 'efectivo' ? 'active' : ''} onClick={() => setMetodo('efectivo')}><Package />Efectivo</button><button className={metodo === 'tarjeta' ? 'active' : ''} onClick={() => setMetodo('tarjeta')}><CreditCard />Tarjeta</button></div>{metodo === 'qr' && <p className="orders-hint">Cobra con el QR oficial de la tienda y luego confirma el pago.</p>}{metodo === 'efectivo' && <p className="orders-hint">Cobra el monto en efectivo en caja y luego confirma el pago.</p>}{metodo === 'tarjeta' && <p className="orders-hint">Pasa la tarjeta por el POS y luego confirma el pago.</p>}
      <section className="orders-receipt"><div className="orders-receipt-head"><div><b><ImagePlus size={17} /> Comprobante de pago</b><span>Opcional · JPG, PNG o WEBP · máximo 8 MB</span></div>{comprobanteActual && <a href={comprobanteActual} target="_blank" rel="noreferrer" aria-label="Ver comprobante en una pestaña nueva"><ExternalLink size={17} /></a>}</div><label className="orders-receipt-btn"><ImagePlus size={17} /> {archivoComprobante ? 'Cambiar imagen' : comprobanteActual ? 'Reemplazar imagen' : 'Cargar comprobante'}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setArchivoComprobante(event.target.files?.[0] || null)} /></label>{comprobanteActual ? <div className="orders-receipt-preview"><img src={comprobanteActual} alt="Comprobante de pago" /><div><p>{archivoComprobante ? archivoComprobante.name : 'Comprobante guardado en Supabase'}</p>{archivoComprobante && <button type="button" className="orders-receipt-remove" onClick={() => setArchivoComprobante(null)}><Trash2 size={14} /> Quitar cambio</button>}</div></div> : <span className="orders-receipt-empty">Aún no se adjuntó una imagen.</span>}</section>
      {error && <p className="orders-alert is-error">{error}</p>}<footer><button onClick={() => setSeleccion(null)}>Cerrar</button><button type="button" className="orders-modal-ticket-btn" onClick={() => imprimirTicket(seleccion)} disabled={imprimiendoId === seleccion.id}>{imprimiendoId === seleccion.id ? 'Generando…' : <><Printer size={16} /> Imprimir ticket</>}</button>{pendiente && !modoEdicion && (<button type="button" className="orders-modal-edit-btn" onClick={iniciarEdicion}><Edit3 size={15} /> Editar / Agregar</button>)}{pendiente && !modoEdicion && (<button type="button" className="orders-modal-edit-btn" onClick={() => anularPedido(seleccion)} disabled={anulandoId === seleccion.id}>{anulandoId === seleccion.id ? 'Anulando…' : <><X size={15} /> Anular venta</>}</button>)}{!anulado && <button onClick={registrarPago} disabled={subiendoPago}>{subiendoPago ? 'Guardando…' : pendiente ? <><CheckCircle2 /> Confirmar pago</> : <><CheckCircle2 /> Guardar comprobante</>}</button>}</footer></section></div>}
  </main>;
}
