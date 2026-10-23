import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowRight, Box, CheckCircle2, CircleAlert, Clock3, CreditCard, GitCompareArrows, Package, PackageCheck, RefreshCw, ShoppingBag, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { listarPedidos, obtenerResumenPedidos } from '../../services/pedidoService.js';
import { listarProductos } from '../../services/productoService.js';
import { listarClientes } from '../../services/clienteService.js';
import { formatoMoneda } from '../../utils/formatoMoneda.js';
import AnaliticaHoraria from '../../components/analytics/AnaliticaHoraria.jsx';
import ComparativaPeriodos from '../../components/analytics/ComparativaPeriodos.jsx';
import './Admin.css';

const LIMITE_STOCK_CRITICO = 2;
const etiquetaEstado = (estado) => ({ completed: 'Pagado', pending: 'Pendiente', shipped: 'Enviado', delivered: 'Entregado', pagado: 'Pagado' }[estado] || estado || 'Pendiente');
// Fechas en zona de Bolivia (YYYY-MM-DD), igual criterio que el backend.
const fechaBolivia = (dias = 0) => { const fecha = new Date(); fecha.setDate(fecha.getDate() - dias); return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/La_Paz' }).format(fecha); };
const formatoLargo = new Intl.DateTimeFormat('es-BO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const formatoCorto = new Intl.DateTimeFormat('es-BO', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const capitalizar = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1);
const fechaDesdeIso = (iso) => new Date(`${iso}T00:00:00Z`);
const RESUMEN_VACIO = { pedidos: 0, ventas: 0, ticketPromedio: 0, unidades: 0, clientes: 0, pedidosTotales: 0, pedidosAnulados: 0, horaPico: null };
const PRESETS_PERIODO = [{ clave: 'hoy', etiqueta: 'Hoy' }, { clave: 'ayer', etiqueta: 'Ayer' }, { clave: 'personalizado', etiqueta: 'Personalizado' }];

export default function DashboardAdmin() {
  const [pedidos, setPedidos] = useState([]); const [productos, setProductos] = useState([]); const [clientes, setClientes] = useState([]);
  const [resumen, setResumen] = useState(RESUMEN_VACIO);
  const [cargando, setCargando] = useState(true); const [actualizando, setActualizando] = useState(false); const [error, setError] = useState(''); const [ultimaActualizacion, setUltimaActualizacion] = useState(null);
  const [comparando, setComparando] = useState(false);
  // Período de los indicadores: hoy, ayer o un rango elegido a mano.
  const [periodo, setPeriodo] = useState('hoy');
  const [rangoLibre, setRangoLibre] = useState(() => ({ desde: fechaBolivia(), hasta: fechaBolivia() }));
  const rango = useMemo(() => {
    if (periodo === 'ayer') { const ayer = fechaBolivia(1); return { desde: ayer, hasta: ayer }; }
    if (periodo === 'personalizado' && rangoLibre.desde && rangoLibre.hasta && rangoLibre.desde <= rangoLibre.hasta) return { ...rangoLibre };
    const hoy = fechaBolivia(); return { desde: hoy, hasta: hoy };
  }, [periodo, rangoLibre]);
  const { desde, hasta } = rango;

  const cargarDashboard = useCallback(async ({ silencioso = false } = {}) => {
    if (silencioso) setActualizando(true); else setCargando(true);
    try {
      const [nuevosPedidos, nuevosProductos, nuevosClientes, nuevoResumen] = await Promise.all([listarPedidos({ limite: 100 }), listarProductos({ limite: 200, todos: true }), listarClientes({ limite: 100 }), obtenerResumenPedidos({ desde, hasta })]);
      setPedidos(Array.isArray(nuevosPedidos) ? nuevosPedidos : []); setProductos(Array.isArray(nuevosProductos) ? nuevosProductos : []); setClientes(Array.isArray(nuevosClientes) ? nuevosClientes : []);
      setResumen(nuevoResumen && typeof nuevoResumen === 'object' ? { ...RESUMEN_VACIO, ...nuevoResumen } : RESUMEN_VACIO);
      setError(''); setUltimaActualizacion(new Date());
    } catch { setError('No se pudieron actualizar los indicadores. Verifica la conexión con la API.'); } finally { setCargando(false); setActualizando(false); }
  }, [desde, hasta]);
  useEffect(() => { cargarDashboard(); const intervalo = window.setInterval(() => cargarDashboard({ silencioso: true }), 60000); return () => window.clearInterval(intervalo); }, [cargarDashboard]);

  const criticos = useMemo(() => productos.filter((producto) => producto.activo !== false && Number(producto.stock ?? producto.showroom ?? 0) <= LIMITE_STOCK_CRITICO).sort((a, b) => Number(a.stock ?? a.showroom ?? 0) - Number(b.stock ?? b.showroom ?? 0) || String(a.nombre).localeCompare(String(b.nombre))), [productos]);

  // Fecha grande de la cabecera: "Jueves, 22 de octubre de 2026" o "Del 1 al 22 de octubre de 2026".
  const esUnDia = desde === hasta;
  const fechaGrande = esUnDia ? capitalizar(formatoLargo.format(fechaDesdeIso(desde))) : `Del ${formatoCorto.format(fechaDesdeIso(desde))} al ${formatoCorto.format(fechaDesdeIso(hasta))}`;
  const etiquetaPeriodo = periodo === 'hoy' ? 'hoy' : periodo === 'ayer' ? 'ayer' : esUnDia ? 'ese día' : 'en el período';
  const sinCobrar = Math.max(0, resumen.pedidosTotales - resumen.pedidos);
  const plural = (n, singular, pluralTexto) => `${n} ${n === 1 ? singular : pluralTexto}`;
  const kpis = [
    ['Ventas cobradas', formatoMoneda(resumen.ventas), `${plural(resumen.pedidos, 'pedido cobrado', 'pedidos cobrados')} ${etiquetaPeriodo}`, CreditCard],
    ['Pedidos', String(resumen.pedidosTotales), resumen.pedidosTotales ? `${resumen.pedidos} cobrados · ${sinCobrar} sin cobrar` : `Sin pedidos ${etiquetaPeriodo}`, ShoppingBag],
    ['Ticket promedio', formatoMoneda(resumen.ticketPromedio), 'Solo pedidos cobrados', TrendingUp],
    ['Unidades vendidas', String(resumen.unidades), 'Artículos en pedidos cobrados', Package],
    ['Hora más vendida', resumen.horaPico ? `${String(resumen.horaPico.hora).padStart(2, '0')}:00` : '—', resumen.horaPico ? `${formatoMoneda(resumen.horaPico.ventas)} en ${plural(resumen.horaPico.pedidos, 'pedido', 'pedidos')} ${etiquetaPeriodo}` : `Sin ventas cobradas ${etiquetaPeriodo}`, Clock3],
    ['Ventas anuladas', String(resumen.pedidosAnulados), 'Pedidos anulados por clientes', CircleAlert],
    ['Clientes con compra', String(resumen.clientes), `${clientes.length} en la base consolidada`, PackageCheck],
  ];
  const cambiarRango = (campo) => (evento) => setRangoLibre((valor) => ({ ...valor, [campo]: evento.target.value }));

  return <main className="dash dash-professional">
    <header className="dash-welcome">
      <div>
        <span>Centro de control</span><h1>Panel administrativo</h1>
        <p className="dash-welcome__fecha" aria-live="polite">{fechaGrande}</p>
        <p>Indicadores de ventas, pedidos e inventario {periodo === 'hoy' ? 'de hoy' : periodo === 'ayer' ? 'de ayer' : 'del período elegido'}.</p>
        <div className="dash-periodo" role="group" aria-label="Período de los indicadores">
          {PRESETS_PERIODO.map((preset) => <button key={preset.clave} type="button" className={`dash-periodo__chip ${periodo === preset.clave ? 'active' : ''}`} aria-pressed={periodo === preset.clave} onClick={() => setPeriodo(preset.clave)}>{preset.etiqueta}</button>)}
          {periodo === 'personalizado' && <div className="dash-periodo__rango"><label>Desde<input type="date" value={rangoLibre.desde} max={rangoLibre.hasta || undefined} onChange={cambiarRango('desde')} /></label><label>Hasta<input type="date" value={rangoLibre.hasta} min={rangoLibre.desde || undefined} onChange={cambiarRango('hasta')} /></label></div>}
        </div>
      </div>
      <div className="dash-welcome__acciones"><button type="button" className={comparando ? 'dash-btn-secundario is-on' : 'dash-btn-secundario'} onClick={() => setComparando((valor) => !valor)} aria-pressed={comparando} aria-controls="dash-comparativa"><GitCompareArrows size={16} />{comparando ? 'Ocultar comparación' : 'Comparar'}</button><button type="button" onClick={() => cargarDashboard({ silencioso: true })} disabled={actualizando}><RefreshCw size={16} className={actualizando ? 'dash-spin' : ''} />{actualizando ? 'Actualizando' : 'Actualizar'}</button></div>
    </header>
    {error && <p className="dash-error"><CircleAlert size={17} />{error}</p>}
    <section className="dash-kpis" aria-label="Indicadores principales">{kpis.map(([etiqueta, valor, detalle, Icono]) => <article key={etiqueta} className={cargando ? 'dash-loading' : ''}><div><span>{etiqueta}</span><i><Icono size={19} /></i></div><strong>{cargando ? '—' : valor}</strong><p>{detalle}</p></article>)}</section>
    {comparando && <ComparativaPeriodos id="dash-comparativa" actualizadoEn={ultimaActualizacion} />}
    <AnaliticaHoraria modo="admin" rango={rango} />
    <section className="dash-grid">
      <article className="dash-card dash-orders"><header><div><span>Autoservicio en vivo</span><h2>Últimos pedidos emitidos</h2></div><Link to="/admin/pedidos">Ver pedidos <ArrowRight size={15} /></Link></header><div className="dash-table"><div className="dash-table-head"><b>Ticket</b><b>Cliente</b><b>Artículos</b><b>Total</b><b>Estado</b></div>{pedidos.slice(0, 5).map((pedido) => <div key={pedido.id} className="dash-table-row"><b>{pedido.numero ? `Pedido #${pedido.numero}` : ''} {pedido.codigo ? `· #${pedido.codigo}` : (pedido.id ? `· #${pedido.id}` : '')}</b><span>{pedido.cliente || 'Compra como invitado'}</span><span>{pedido.items || '—'}</span><strong>{formatoMoneda(pedido.total)}</strong><i className={'estado-' + pedido.estado}>{etiquetaEstado(pedido.estado)}</i></div>)}{!cargando && pedidos.length === 0 && <div className="dash-empty">Aún no hay pedidos registrados.</div>}</div></article>
      <article className="dash-card dash-stock"><header><div><span><AlertTriangle size={15} />Inventario alerta</span><h2>Stock crítico</h2></div><b>{criticos.length} crítico{criticos.length === 1 ? '' : 's'}</b></header><p className="dash-stock-caption">Productos con {LIMITE_STOCK_CRITICO} unidades o menos.</p><div className="dash-stock-list">{criticos.slice(0, 4).map((producto) => { const unidades = Number(producto.stock ?? producto.showroom ?? 0); return <div className="dash-stock-row" key={producto.id}><Box size={22} /><div><b>{producto.nombre}</b><small>{unidades === 0 ? 'Sin existencias' : unidades + (unidades === 1 ? ' unidad disponible' : ' unidades disponibles')}</small></div><em>{unidades}</em></div>; })}{!cargando && criticos.length === 0 && <div className="dash-stock-ok"><CheckCircle2 size={22} /><div><b>Inventario bajo control</b><small>No hay productos con stock crítico.</small></div></div>}</div><Link className="dash-stock-link" to="/admin/productos">Gestionar inventario <ArrowRight size={15} /></Link></article>
    </section>
    {ultimaActualizacion && <p className="dash-updated">Actualizado a las {ultimaActualizacion.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}. Se actualiza automáticamente cada minuto.</p>}
  </main>;
}
