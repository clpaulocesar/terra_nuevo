import { useContext, useEffect, useMemo, useState } from 'react';
import { ArrowRight, BarChart3, ClipboardList, MapPin, Package, Repeat2, ShoppingBag, TrendingUp } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { SesionClienteContext } from '../context/SesionClienteContext.jsx';
import { listarMisPedidosMayorista } from '../services/sesionClienteService.js';
import { listarProductos } from '../services/productoService.js';
import { formatoMoneda } from '../utils/formatoMoneda.js';
import './InicioMayorista.css';

const MES = new Intl.DateTimeFormat('es-BO', { month: 'short' });
const activo = (estado) => !['completed', 'delivered', 'cancelled'].includes(String(estado || '').toLowerCase());

export default function InicioMayorista() {
  const { sesion, esMayorista } = useContext(SesionClienteContext);
  const [pedidos, setPedidos] = useState([]); const [productos, setProductos] = useState([]); const [cargando, setCargando] = useState(true);
  useEffect(() => { if (!sesion?.token) return; Promise.all([listarMisPedidosMayorista(sesion.token), listarProductos({ limite: 100 })]).then(([ordenes, catalogo]) => { setPedidos(Array.isArray(ordenes) ? ordenes : []); setProductos(Array.isArray(catalogo) ? catalogo : []); }).catch(() => { setPedidos([]); setProductos([]); }).finally(() => setCargando(false)); }, [sesion?.token]);
  const analisis = useMemo(() => {
    const total = pedidos.reduce((suma, pedido) => suma + Number(pedido.total || 0), 0);
    const meses = Array.from({ length: 6 }, (_, indice) => { const fecha = new Date(); fecha.setMonth(fecha.getMonth() - (5 - indice)); return { clave: `${fecha.getFullYear()}-${fecha.getMonth()}`, etiqueta: MES.format(fecha), valor: 0 }; });
    pedidos.forEach((pedido) => { const fecha = new Date(pedido.fecha); const clave = `${fecha.getFullYear()}-${fecha.getMonth()}`; const mes = meses.find((item) => item.clave === clave); if (mes) mes.valor += Number(pedido.total || 0); });
    const categorias = new Map(); pedidos.forEach((pedido) => String(pedido.items || '').split(',').forEach((item) => { const clave = item.trim().split(' ').slice(-2).join(' ') || 'Otros'; categorias.set(clave, (categorias.get(clave) || 0) + 1); }));
    return { total, activos: pedidos.filter((pedido) => activo(pedido.estado)).length, meses, categorias: [...categorias.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3) };
  }, [pedidos]);
  const maximo = Math.max(1, ...analisis.meses.map((mes) => mes.valor));
  const frecuentes = [...productos].sort((a, b) => Number(b.ventas || 0) - Number(a.ventas || 0)).slice(0, 3);
  if (!esMayorista) return <Navigate to="/catalogo" replace />;
  return <main className="wholesale-home wholesale-home--advanced">
    <section className="wholesale-home__hero"><div><span>CUENTA MAYORISTA VERIFICADA</span><h1>¡Bienvenido de nuevo, {sesion?.nombre || 'cliente'}!</h1><small>NIT: {sesion?.nit || 'Pendiente de registro'}</small><p>Administra tus compras por mayor, pedidos en tránsito y condiciones comerciales desde tu panel central.</p></div><Link to="/catalogo">Comprar con precio B2B <ArrowRight size={18} /></Link></section>
    <section className="wholesale-home__metrics"><article><ShoppingBag /><div><small>Compras realizadas</small><b>{cargando ? '—' : formatoMoneda(analisis.total)}</b><em>Acumulado de pedidos</em></div></article><article><ClipboardList /><div><small>Pedidos activos</small><b>{cargando ? '—' : analisis.activos}</b><em>En preparación o tránsito</em></div></article><article><Package /><div><small>Pedidos registrados</small><b>{cargando ? '—' : pedidos.length}</b><em>Historial comercial</em></div></article></section>
    <section className="wholesale-home__analysis"><article className="wholesale-chart"><header><div><span><BarChart3 size={15} /> Análisis comercial</span><h2>Historial de compras B2B</h2><p>Volumen facturado durante los últimos seis meses.</p></div><b>Últimos 6 meses</b></header><div className="wholesale-chart__bars">{analisis.meses.map((mes) => <div key={mes.clave}><strong>{mes.valor ? formatoMoneda(mes.valor) : ''}</strong><i style={{ height: `${Math.max(7, mes.valor / maximo * 100)}%` }} /><small>{mes.etiqueta}</small></div>)}</div></article><article className="wholesale-categories"><header><span><TrendingUp size={15} /> Preferencias</span><h2>Categorías más solicitadas</h2></header>{analisis.categorias.length ? analisis.categorias.map(([nombre, cantidad], indice) => <div className="wholesale-categories__row" key={nombre}><span>{nombre}</span><b style={{ width: `${Math.max(20, 100 - indice * 27)}%` }} /><small>{cantidad} pedidos</small></div>) : <p>Las categorías aparecerán con tus compras.</p>}<Link to="/catalogo">Ver catálogo mayorista <ArrowRight size={15} /></Link></article></section>
    <section className="wholesale-home__orders"><header><div><span>Seguimiento de compra</span><h2>Pedidos mayoristas recientes</h2></div><Link to="/mi-cuenta/pedidos">Ver todos los pedidos <ArrowRight size={15} /></Link></header>{cargando ? <p>Cargando pedidos…</p> : pedidos.length ? <div className="wholesale-orders-table">{pedidos.slice(0, 4).map((pedido) => <div key={pedido.id}><b>{pedido.codigo || `Pedido #${pedido.id}`}</b><small>{new Date(pedido.fecha).toLocaleDateString('es-BO')}</small><span>{pedido.items || 'Sin artículos'}</span><strong>{formatoMoneda(pedido.total)}</strong><em>{pedido.estado || 'Pendiente'}</em></div>)}</div> : <p>Aún no registras pedidos. Explora el catálogo para iniciar tu compra.</p>}</section>
    <section className="wholesale-frequent"><header><div><span><Repeat2 size={15} /> Compra rápida</span><h2>Productos frecuentes de alta rotación</h2></div><Link to="/catalogo">Ver catálogo completo <ArrowRight size={15} /></Link></header><div>{frecuentes.map((producto) => <article key={producto.id}><img src={producto.imagen_url || '/logo-terra.png'} alt="" /><small>{producto.categoria || 'Producto TERRA'}</small><b>{producto.nombre}</b><strong>{formatoMoneda(producto.precioMayorista ?? producto.precio)}</strong><button type="button" onClick={() => window.location.assign(`/productos/${producto.id}`)}>Ver producto</button></article>)}{!frecuentes.length && <p>No hay productos frecuentes disponibles.</p>}</div></section>
    <section className="wholesale-home__links"><Link to="/mi-cuenta/perfil"><MapPin size={18} /> Actualizar perfil, facturación y dirección <ArrowRight size={16} /></Link></section>
  </main>;
}
