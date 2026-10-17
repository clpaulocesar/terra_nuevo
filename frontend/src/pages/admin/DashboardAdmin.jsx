import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowRight, Box, CheckCircle2, CircleAlert, CreditCard, PackageCheck, RefreshCw, ShoppingBag, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { listarPedidos } from '../../services/pedidoService.js';
import { listarProductos } from '../../services/productoService.js';
import { listarClientes } from '../../services/clienteService.js';
import { formatoMoneda } from '../../utils/formatoMoneda.js';
import './Admin.css';

const LIMITE_STOCK_CRITICO = 2;
const ESTADOS_COBRADOS = new Set(['completed', 'shipped', 'delivered', 'pagado']);
const esDeHoy = (fecha) => { const valor = new Date(fecha); return !Number.isNaN(valor.getTime()) && valor.toDateString() === new Date().toDateString(); };
const etiquetaEstado = (estado) => ({ completed: 'Pagado', pending: 'Pendiente', shipped: 'Enviado', delivered: 'Entregado', pagado: 'Pagado' }[estado] || estado || 'Pendiente');

export default function DashboardAdmin() {
  const [pedidos, setPedidos] = useState([]); const [productos, setProductos] = useState([]); const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true); const [actualizando, setActualizando] = useState(false); const [error, setError] = useState(''); const [ultimaActualizacion, setUltimaActualizacion] = useState(null);
  const cargarDashboard = useCallback(async ({ silencioso = false } = {}) => {
    if (silencioso) setActualizando(true); else setCargando(true);
    try {
      const [nuevosPedidos, nuevosProductos, nuevosClientes] = await Promise.all([listarPedidos({ limite: 100 }), listarProductos({ limite: 200, todos: true }), listarClientes({ limite: 100 })]);
      setPedidos(Array.isArray(nuevosPedidos) ? nuevosPedidos : []); setProductos(Array.isArray(nuevosProductos) ? nuevosProductos : []); setClientes(Array.isArray(nuevosClientes) ? nuevosClientes : []);
      setError(''); setUltimaActualizacion(new Date());
    } catch { setError('No se pudieron actualizar los indicadores. Verifica la conexión con la API.'); } finally { setCargando(false); setActualizando(false); }
  }, []);
  useEffect(() => { cargarDashboard(); const intervalo = window.setInterval(() => cargarDashboard({ silencioso: true }), 60000); return () => window.clearInterval(intervalo); }, [cargarDashboard]);
  const resumen = useMemo(() => {
    const cobrados = pedidos.filter((pedido) => ESTADOS_COBRADOS.has(String(pedido.estado).toLowerCase()));
    const hoy = cobrados.filter((pedido) => esDeHoy(pedido.fecha));
    const criticos = productos.filter((producto) => producto.activo !== false && Number(producto.stock ?? producto.showroom ?? 0) <= LIMITE_STOCK_CRITICO).sort((a, b) => Number(a.stock ?? a.showroom ?? 0) - Number(b.stock ?? b.showroom ?? 0) || String(a.nombre).localeCompare(String(b.nombre)));
    return { hoy, ventasHoy: hoy.reduce((total, pedido) => total + Number(pedido.total || 0), 0), ticketPromedio: cobrados.length ? cobrados.reduce((total, pedido) => total + Number(pedido.total || 0), 0) / cobrados.length : 0, criticos };
  }, [pedidos, productos]);
  const kpis = [
    ['Ventas del día', formatoMoneda(resumen.ventasHoy), resumen.hoy.length + ' cobrado' + (resumen.hoy.length === 1 ? '' : 's') + ' hoy', CreditCard],
    ['Pedidos kiosco', String(pedidos.length), 'Pedidos registrados', ShoppingBag],
    ['Ticket promedio', formatoMoneda(resumen.ticketPromedio), 'Solo pedidos cobrados', TrendingUp],
    ['Clientes', String(clientes.length), 'Base consolidada', PackageCheck],
  ];
  return <main className="dash dash-professional">
    <header className="dash-welcome"><div><span>Centro de control</span><h1>Panel administrativo</h1><p>Indicadores en tiempo real de ventas, pedidos e inventario.</p></div><button type="button" onClick={() => cargarDashboard({ silencioso: true })} disabled={actualizando}><RefreshCw size={16} className={actualizando ? 'dash-spin' : ''} />{actualizando ? 'Actualizando' : 'Actualizar'}</button></header>
    {error && <p className="dash-error"><CircleAlert size={17} />{error}</p>}
    <section className="dash-kpis" aria-label="Indicadores principales">{kpis.map(([etiqueta, valor, detalle, Icono]) => <article key={etiqueta} className={cargando ? 'dash-loading' : ''}><div><span>{etiqueta}</span><i><Icono size={19} /></i></div><strong>{cargando ? '—' : valor}</strong><p>{detalle}</p></article>)}</section>
    <section className="dash-grid">
      <article className="dash-card dash-orders"><header><div><span>Autoservicio en vivo</span><h2>Últimos pedidos emitidos</h2></div><Link to="/admin/pedidos">Ver pedidos <ArrowRight size={15} /></Link></header><div className="dash-table"><div className="dash-table-head"><b>Ticket</b><b>Cliente</b><b>Artículos</b><b>Total</b><b>Estado</b></div>{pedidos.slice(0, 5).map((pedido) => <div key={pedido.id} className="dash-table-row"><b>#{pedido.codigo || pedido.id}</b><span>{pedido.cliente || 'Compra como invitado'}</span><span>{pedido.items || '—'}</span><strong>{formatoMoneda(pedido.total)}</strong><i className={'estado-' + pedido.estado}>{etiquetaEstado(pedido.estado)}</i></div>)}{!cargando && pedidos.length === 0 && <div className="dash-empty">Aún no hay pedidos registrados.</div>}</div></article>
      <article className="dash-card dash-stock"><header><div><span><AlertTriangle size={15} />Inventario alerta</span><h2>Stock crítico</h2></div><b>{resumen.criticos.length} crítico{resumen.criticos.length === 1 ? '' : 's'}</b></header><p className="dash-stock-caption">Productos con {LIMITE_STOCK_CRITICO} unidades o menos.</p><div className="dash-stock-list">{resumen.criticos.slice(0, 4).map((producto) => { const unidades = Number(producto.stock ?? producto.showroom ?? 0); return <div className="dash-stock-row" key={producto.id}><Box size={22} /><div><b>{producto.nombre}</b><small>{unidades === 0 ? 'Sin existencias' : unidades + (unidades === 1 ? ' unidad disponible' : ' unidades disponibles')}</small></div><em>{unidades}</em></div>; })}{!cargando && resumen.criticos.length === 0 && <div className="dash-stock-ok"><CheckCircle2 size={22} /><div><b>Inventario bajo control</b><small>No hay productos con stock crítico.</small></div></div>}</div><Link className="dash-stock-link" to="/admin/productos">Gestionar inventario <ArrowRight size={15} /></Link></article>
    </section>
    {ultimaActualizacion && <p className="dash-updated">Actualizado a las {ultimaActualizacion.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}. Se actualiza automáticamente cada minuto.</p>}
  </main>;
}
