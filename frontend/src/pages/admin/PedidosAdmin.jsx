import { useCallback, useEffect, useMemo, useState } from 'react';
import { Barcode, CheckCircle2, CreditCard, ExternalLink, ImagePlus, Package, Printer, QrCode, RefreshCw, Search, Trash2 } from 'lucide-react';
import { useLocation, useSearchParams } from 'react-router-dom';
import QRCode from 'react-qr-code';
import { listarPedidos, obtenerPedido, registrarPagoPedido } from '../../services/pedidoService.js';
import { subirComprobantePago } from '../../services/storageService.js';
import { formatoMoneda } from '../../utils/formatoMoneda.js';
import { imprimirTicketPedido } from '../../utils/imprimirTicket.js';
import ReportePedidosVendedor from '../../components/vendedor/ReportePedidosVendedor.jsx';
import './Admin.css';
import './PedidosAdmin.css';

const etiquetas = { pending: 'Pendiente de pago', pendiente_pago: 'Pendiente de pago', paid: 'Cobrado', completed: 'Cobrado', pagado: 'Cobrado', shipped: 'En despacho', delivered: 'Entregado', entregado: 'Entregado', cancelled: 'Cancelado', cancelado: 'Cancelado' };
const POR_COBRAR = ['pending', 'pendiente_pago'];
const EN_DESPACHO = ['ready_for_pickup', 'out_for_delivery', 'shipped', 'entregado', 'delivered'];
const TEXTO_BUSQUEDA = 'Cliente, teléfono, NIT o ticket';

export default function PedidosAdmin() {
  const [params] = useSearchParams();
  const location = useLocation();
  const esVendedor = location.pathname.startsWith('/vendedor');
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
  const [imprimiendoId, setImprimiendoId] = useState(null);

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

  const vista = useMemo(() => pedidos.filter((pedido) => {
    if (tab === 'todos') return true;
    if (tab === 'pending') return POR_COBRAR.includes(pedido.estado);
    if (tab === 'shipped') return EN_DESPACHO.includes(pedido.estado);
    return pedido.estado === tab;
  }), [pedidos, tab]);
  const pendientes = pedidos.filter((pedido) => POR_COBRAR.includes(pedido.estado)).length;
  const abrirPedido = (pedido) => { setSeleccion(pedido); setMetodo(pedido.metodo_pago || 'qr'); setArchivoComprobante(null); setError(''); };
  const actualizar = () => { setActualizando(true); cargarPedidos({ silencioso: true }); };

  const registrarPago = async () => {
    if (!seleccion) return;
    setSubiendoPago(true); setError('');
    try {
      const comprobanteUrl = archivoComprobante ? await subirComprobantePago(archivoComprobante) : seleccion.comprobante_url || null;
      const actualizado = await registrarPagoPedido(seleccion.id, { metodoPago: metodo, comprobanteUrl });
      const cambios = { estado: actualizado?.estado ?? 'completed', comprobante_url: actualizado?.comprobante_url ?? comprobanteUrl, metodo_pago: actualizado?.metodo_pago ?? metodo };
      setPedidos((lista) => lista.map((pedido) => pedido.id === seleccion.id ? { ...pedido, ...cambios } : pedido));
      setSeleccion(null); setArchivoComprobante(null);
    } catch (err) { setError(err.message || 'No se pudo registrar el pago.'); }
    finally { setSubiendoPago(false); }
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

  const comprobanteActual = archivoComprobante ? URL.createObjectURL(archivoComprobante) : seleccion?.comprobante_url;
  const pendiente = seleccion && POR_COBRAR.includes(seleccion.estado);

  return <main className="orders">
    <header className="orders-hero"><div><h1>Recepción y despacho de pedidos</h1></div><form onSubmit={(event) => event.preventDefault()}><Barcode size={25} /><input value={buscar} onChange={(event) => setBuscar(event.target.value)} placeholder={TEXTO_BUSQUEDA} /><button>Buscar</button></form></header>
    <section className="orders-metrics">
      <article><b>{pendientes} pedidos</b><span>Por cobrar en caja</span></article>
      <article><b>{productosVendidos} unidades</b><span>Productos vendidos</span></article>
      <article><b>{pedidos.length} pedidos</b><span>Registrados en el sistema</span></article>
      <article><b>{pedidos.filter((pedido) => EN_DESPACHO.includes(pedido.estado)).length} pedidos</b><span>En despacho</span></article>
    </section>
    <nav className="orders-tabs">{[['todos', 'Todos'], ['pending', 'Pendientes de pago'], ['completed', 'Cobrados'], ['shipped', 'En despacho']].map(([id, etiqueta]) => <button className={tab === id ? 'active' : ''} onClick={() => setTab(id)} key={id}>{etiqueta}</button>)}</nav>
    <section className="orders-list">
      <header><div><span>Órdenes de autoservicio</span><h2>Pedidos en operación</h2></div><div className="orders-list-tools"><label><Search size={18} /><input value={buscar} onChange={(event) => setBuscar(event.target.value)} placeholder={TEXTO_BUSQUEDA} /></label>{esVendedor && <ReportePedidosVendedor pedidos={pedidos} />}<button type="button" className="orders-refresh" onClick={actualizar} disabled={actualizando}><RefreshCw size={16} className={actualizando ? 'is-spinning' : ''} /> Actualizar</button></div></header>
      {cargando && pedidos.length === 0 && <p>Cargando pedidos reales...</p>}{error && <p className="error-box">{error}</p>}
      {!cargando && !error && vista.length === 0 && <p>{buscar.trim() ? `No hay pedidos que coincidan con «${buscar.trim()}».` : 'No hay pedidos registrados todavía.'}</p>}
      {vista.map((pedido, indice) => <article key={pedido.id}><div><b>N.º {indice + 1} · #{pedido.codigo}</b><small>{new Date(pedido.fecha).toLocaleString('es-BO')}</small></div><div><b>{pedido.cliente}</b><small>{pedido.cliente_telefono ? `Tel. ${pedido.cliente_telefono}` : pedido.comprobante_url ? 'Comprobante adjunto' : 'Sin teléfono registrado'}{pedido.cliente_nit ? ` · NIT ${pedido.cliente_nit}` : ''}</small></div><p>{pedido.items || 'Sin artículos'}</p><strong>{formatoMoneda(pedido.total)}</strong><i className={pedido.estado}>{etiquetas[pedido.estado] || pedido.estado}</i><div className="order-actions">{esVendedor && <button type="button" className="order-ticket" onClick={() => imprimirTicket(pedido)} disabled={imprimiendoId === pedido.id}>{imprimiendoId === pedido.id ? 'Generando…' : <><Printer size={16} /> Ticket</>}</button>}<button onClick={() => abrirPedido(pedido)}>{POR_COBRAR.includes(pedido.estado) ? <><CreditCard size={18} /> Cobrar</> : 'Ver detalle'}</button></div></article>)}
    </section>
    {seleccion && <div className="orders-modal"><section><header><div><span>Caja Equipetrol</span><h2>#{seleccion.codigo}</h2><p>Cliente: {seleccion.cliente}</p>{(seleccion.cliente_telefono || seleccion.cliente_nit) && <p className="orders-client-data">{seleccion.cliente_telefono ? `Tel. ${seleccion.cliente_telefono}` : ''}{seleccion.cliente_telefono && seleccion.cliente_nit ? ' · ' : ''}{seleccion.cliente_nit ? `NIT ${seleccion.cliente_nit}` : ''}</p>}{seleccion.direccion_entrega && <p className="orders-hint"><Package size={16} /> Envío: {seleccion.direccion_entrega}{seleccion.referencia_entrega ? ` · ${seleccion.referencia_entrega}` : ''}</p>}</div><button onClick={() => setSeleccion(null)}>×</button></header><div className="orders-total"><span>Monto a liquidar</span><b>{formatoMoneda(seleccion.total)}</b></div><h3>Artículos</h3><p>{seleccion.items || 'Sin artículos registrados'}</p><div className="orders-methods"><button className={metodo === 'qr' ? 'active' : ''} onClick={() => setMetodo('qr')}><QrCode />QR Simple</button><button className={metodo === 'efectivo' ? 'active' : ''} onClick={() => setMetodo('efectivo')}><Package />Efectivo</button><button className={metodo === 'tarjeta' ? 'active' : ''} onClick={() => setMetodo('tarjeta')}><CreditCard />Tarjeta</button></div>{metodo === 'qr' && <div className="orders-qr"><b>Imagen de prueba</b><QRCode value={`TERRA-PRUEBA|${seleccion.codigo}|${Number(seleccion.total)}`} size={200} /><p>Escanea el código para simular el pago del cliente</p><small>#{seleccion.codigo} · {formatoMoneda(seleccion.total)}</small></div>}{metodo === 'efectivo' && <p className="orders-hint">Cobra el monto en efectivo en caja y luego confirma el pago.</p>}{metodo === 'tarjeta' && <p className="orders-hint">Pasa la tarjeta por el POS y luego confirma el pago.</p>}
      <section className="orders-receipt"><div className="orders-receipt-head"><div><b><ImagePlus size={17} /> Comprobante de pago</b><span>Opcional · JPG, PNG o WEBP · máximo 8 MB</span></div>{comprobanteActual && <a href={comprobanteActual} target="_blank" rel="noreferrer"><ExternalLink size={17} /></a>}</div><label className="orders-receipt-btn"><ImagePlus size={17} /> {archivoComprobante ? 'Cambiar imagen' : comprobanteActual ? 'Reemplazar imagen' : 'Cargar comprobante'}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setArchivoComprobante(event.target.files?.[0] || null)} /></label>{comprobanteActual ? <div className="orders-receipt-preview"><img src={comprobanteActual} alt="Comprobante de pago" /><div><p>{archivoComprobante ? archivoComprobante.name : 'Comprobante guardado en Supabase'}</p>{archivoComprobante && <button type="button" className="orders-receipt-remove" onClick={() => setArchivoComprobante(null)}><Trash2 size={14} /> Quitar cambio</button>}</div></div> : <span className="orders-receipt-empty">Aún no se adjuntó una imagen.</span>}</section>
      {error && <p className="orders-alert is-error">{error}</p>}<footer><button onClick={() => setSeleccion(null)}>Cerrar</button><button onClick={registrarPago} disabled={subiendoPago}>{subiendoPago ? 'Guardando…' : pendiente ? <><CheckCircle2 /> Confirmar pago</> : <><CheckCircle2 /> Guardar comprobante</>}</button></footer></section></div>}
  </main>;
}
