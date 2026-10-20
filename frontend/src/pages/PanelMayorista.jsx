import { useContext, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight, BadgeCheck, Boxes, ClipboardList, Package, ReceiptText, RefreshCw, ShoppingCart, Sparkles, Truck, WalletCards } from 'lucide-react';
import { SesionClienteContext } from '../context/SesionClienteContext.jsx';
import { useCarrito } from '../hooks/useCarrito.js';
import { useProductos } from '../hooks/useProductos.js';
import { listarMisPedidosMayorista } from '../services/sesionClienteService.js';
import { formatoMoneda } from '../utils/formatoMoneda.js';
import { imagenDeProducto, usarImagenFallback } from '../utils/imagenProducto.js';
import './PanelMayorista.css';

const ESTADOS = {
  pending: 'Pendiente', confirmed: 'Confirmado', preparing: 'En preparación',
  ready_for_pickup: 'Listo para recoger', out_for_delivery: 'En camino',
  completed: 'Completado', cancelled: 'Cancelado',
};
const ACTIVOS = new Set(['pending', 'confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery']);

export default function PanelMayorista() {
  const { sesion, esMayorista } = useContext(SesionClienteContext);
  const { productos, cargando: cargandoProductos } = useProductos();
  const { agregarProducto } = useCarrito();
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState([]);
  const [cargandoPedidos, setCargandoPedidos] = useState(true);
  const [errorPedidos, setErrorPedidos] = useState('');

  useEffect(() => {
    if (!esMayorista) return;
    setCargandoPedidos(true);
    listarMisPedidosMayorista(sesion?.token)
      .then((lista) => setPedidos(Array.isArray(lista) ? lista : []))
      .catch((error) => setErrorPedidos(error.message || 'No se pudieron cargar tus pedidos.'))
      .finally(() => setCargandoPedidos(false));
  }, [esMayorista, sesion?.token]);

  const resumen = useMemo(() => ({
    pedidos: pedidos.length,
    activos: pedidos.filter((pedido) => ACTIVOS.has(pedido.estado)).length,
    total: pedidos.reduce((suma, pedido) => suma + Number(pedido.total || 0), 0),
  }), [pedidos]);
  const sugeridos = productos.filter((producto) => producto.stock > 0).slice(0, 3);
  const nombre = String(sesion?.nombre || 'cliente').split(' ')[0];

  if (!esMayorista) return <Navigate to="/catalogo" replace />;

  return <section className="wholesale-panel">
    <header className="wholesale-panel__hero">
      <div>
        <span className="wholesale-panel__eyebrow"><Sparkles size={15} /> Portal mayorista</span>
        <h1>¡Bienvenido de nuevo, {nombre}!</h1>
        <p>Administra tus compras mayoristas, consulta el estado de tus pedidos y compra con tus precios B2B.</p>
        <div className="wholesale-panel__identity"><BadgeCheck size={16} /> Cuenta mayorista verificada {sesion?.nit ? `· NIT/CI: ${sesion.nit}` : ''}</div>
      </div>
      <div className="wholesale-panel__hero-actions">
        <Link to="/catalogo" className="wholesale-panel__primary"><ShoppingCart size={17} /> Nueva orden B2B</Link>
        <Link to="/mi-cuenta/pedidos" className="wholesale-panel__secondary"><ReceiptText size={17} /> Ver pedidos</Link>
      </div>
    </header>

    <div className="wholesale-panel__stats" aria-label="Resumen de actividad">
      <article><span className="wholesale-panel__stat-icon"><ClipboardList size={20} /></span><div><small>Pedidos registrados</small><strong>{resumen.pedidos}</strong></div></article>
      <article><span className="wholesale-panel__stat-icon wholesale-panel__stat-icon--blue"><Truck size={20} /></span><div><small>Pedidos activos</small><strong>{resumen.activos}</strong></div></article>
      <article><span className="wholesale-panel__stat-icon wholesale-panel__stat-icon--green"><WalletCards size={20} /></span><div><small>Total de compras</small><strong>{formatoMoneda(resumen.total)}</strong></div></article>
    </div>

    <section className="wholesale-panel__section">
      <div className="wholesale-panel__section-title"><div><h2>Pedidos recientes</h2><p>Información actualizada de tus compras vinculadas a esta cuenta.</p></div><Link to="/mi-cuenta/pedidos">Ver historial <ArrowRight size={15} /></Link></div>
      {cargandoPedidos && <div className="wholesale-panel__loading">Cargando pedidos…</div>}
      {!cargandoPedidos && errorPedidos && <div className="wholesale-panel__notice">{errorPedidos}</div>}
      {!cargandoPedidos && !errorPedidos && (pedidos.length ? <div className="wholesale-panel__orders">
        {pedidos.slice(0, 4).map((pedido) => <article key={pedido.id}>
          <div><strong>{pedido.codigo}</strong><small>{new Date(pedido.fecha).toLocaleDateString('es-BO', { dateStyle: 'medium' })}</small></div>
          <p><Package size={15} /> {pedido.items || 'Sin detalle de productos'}</p>
          <b>{formatoMoneda(pedido.total)}</b>
          <span className={`wholesale-panel__status wholesale-panel__status--${pedido.estado}`}>{ESTADOS[pedido.estado] || pedido.estado}</span>
        </article>)}
      </div> : <div className="wholesale-panel__empty"><Boxes size={30} /><div><strong>Aún no tienes pedidos registrados</strong><p>Explora el catálogo mayorista para realizar tu primera compra.</p></div><Link to="/catalogo">Ir al catálogo</Link></div>)}
    </section>

    <section className="wholesale-panel__section">
      <div className="wholesale-panel__section-title"><div><h2>Productos para tu próxima compra</h2><p>Productos disponibles con el precio mayorista de tu cuenta.</p></div><Link to="/catalogo">Catálogo completo <ArrowRight size={15} /></Link></div>
      {cargandoProductos ? <div className="wholesale-panel__loading">Cargando catálogo…</div> : <div className="wholesale-panel__products">
        {sugeridos.map((producto) => {
          const precioMinorista = Number(producto.precio || 0);
          const precioMayorista = Number(producto.precioMayorista ?? producto.precio);
          const descuento = precioMinorista > precioMayorista
            ? Math.round(((precioMinorista - precioMayorista) / precioMinorista) * 100)
            : 0;
          return <article key={producto.id} style={{ display: 'block' }}>
          <div style={{ alignItems: 'center', display: 'flex', gap: '0.75rem' }}>
            <Link to={`/productos/${producto.id}`} className="wholesale-panel__product-image"><img src={imagenDeProducto(producto.imagen_url)} onError={usarImagenFallback} alt={producto.nombre} /></Link>
            <div className="wholesale-panel__product-info" style={{ flex: 1, minWidth: 0 }}><small>{producto.categoria}</small><Link to={`/productos/${producto.id}`}>{producto.nombre}</Link><span>Disponible: {producto.stock} un.</span></div>
          </div>
          <div style={{ alignItems: 'end', display: 'flex', gap: '0.75rem', justifyContent: 'space-between', marginTop: '0.8rem' }}>
            <div className="wholesale-panel__product-price" style={{ gridColumn: 'auto' }}><small>Precio minorista: <s>{formatoMoneda(precioMinorista)}</s></small><strong>{formatoMoneda(precioMayorista)}</strong><em style={{ color: '#747d79', display: 'block', fontSize: '0.67rem', fontStyle: 'normal' }}>Precio mayorista</em>{descuento > 0 && <b style={{ background: '#eaf8ee', borderRadius: '5px', color: '#27743e', display: 'inline-block', fontSize: '0.64rem', marginTop: '0.28rem', padding: '0.18rem 0.32rem' }}>Ahorro {descuento}%</b>}</div>
            <button type="button" style={{ flex: '0 0 auto', gridColumn: 'auto', padding: '0.68rem 0.9rem', width: 'auto' }} onClick={() => { if (agregarProducto(producto)) navigate('/carrito'); }}><ShoppingCart size={16} /> Agregar</button>
          </div>
        </article>;
        })}
        {!sugeridos.length && <div className="wholesale-panel__empty wholesale-panel__empty--short"><Boxes size={28} /><div><strong>No hay productos disponibles por el momento.</strong></div></div>}
      </div>}
    </section>
  </section>;
}
