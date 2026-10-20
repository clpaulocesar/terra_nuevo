import { useContext, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ClipboardList, Package, ShoppingBag } from 'lucide-react';
import { SesionClienteContext } from '../context/SesionClienteContext.jsx';
import { listarMisPedidosMayorista } from '../services/sesionClienteService.js';
import { formatoMoneda } from '../utils/formatoMoneda.js';
import './PedidosMayorista.css';

const ESTADOS = { pending: 'Pendiente', confirmed: 'Confirmado', preparing: 'En preparación', ready_for_pickup: 'Listo para recoger', out_for_delivery: 'En camino', completed: 'Completado', cancelled: 'Cancelado' };

export default function PedidosMayorista() {
  const { sesion, esMayorista } = useContext(SesionClienteContext);
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!esMayorista) return;
    listarMisPedidosMayorista(sesion?.token).then(setPedidos).catch((e) => setError(e.message)).finally(() => setCargando(false));
  }, [esMayorista, sesion?.token]);

  if (!esMayorista) return <Navigate to="/catalogo" replace />;
  return <section className="wholesale-orders">
    <header><span><ClipboardList size={17} /> Cuenta mayorista</span><h1>Mis pedidos</h1><p>Revisa las compras vinculadas a tu cuenta comercial.</p></header>
    {cargando && <p className="wholesale-orders__state">Cargando pedidos…</p>}
    {error && <p className="wholesale-orders__error">{error}</p>}
    {!cargando && !error && (pedidos.length ? <div className="wholesale-orders__list">{pedidos.map((pedido) => <article key={pedido.id}><div><span className="wholesale-orders__code">{pedido.codigo}</span><small>{new Date(pedido.fecha).toLocaleDateString('es-BO', { dateStyle: 'medium' })}</small></div><p><Package size={17} /> {pedido.items || 'Sin detalle de productos'}</p><strong>{formatoMoneda(pedido.total)}</strong><b className={`wholesale-orders__status wholesale-orders__status--${pedido.estado}`}>{ESTADOS[pedido.estado] || pedido.estado}</b></article>)}</div> : <div className="wholesale-orders__empty"><ShoppingBag size={38} /><h2>Aún no tienes pedidos registrados</h2><p>Explora el catálogo mayorista para realizar tu primera compra.</p><Link to="/catalogo">Ir al catálogo</Link></div>)}
  </section>;
}
