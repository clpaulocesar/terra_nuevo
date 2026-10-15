import { useRef, useState } from 'react';
import {
  BrowserRouter, Routes, Route, Navigate, Link,
  NavLink, Outlet, useNavigate, useLocation, useSearchParams,
} from 'react-router-dom';
import { ShoppingCart, Store, Search, Plus, Minus, Trash2, ArrowRight, CheckCircle2, PackageOpen, Home, Package, Tags, Headphones, RotateCcw, Timer, UserRound } from 'lucide-react';
import { useCarrito } from '../hooks/useCarrito.js';
import { useProductos } from '../hooks/useProductos.js';
import { ClienteContext } from '../context/ClienteContext.jsx';
import { useContext } from 'react';
import { categorias, emojiCategoria } from '../data/categorias.js';
import { formatoMoneda } from '../utils/formatoMoneda.js';
import { validarDatosCliente } from '../utils/validaciones.js';
import { crearCliente } from '../services/clienteService.js';
import { crearPedido } from '../services/pedidoService.js';
import { MODO_DEMO } from '../services/api.js';
import Bienvenida from '../pages/Bienvenida.jsx';
import Categorias from '../pages/Categorias.jsx';
import DetalleProducto from '../pages/DetalleProducto.jsx';
import CarritoPage from '../pages/CarritoPage.jsx';
import IdentificacionPage from '../pages/Identificacion.jsx';
import ConfirmacionPage from '../pages/Confirmacion.jsx';
import PedidoGeneradoPage from '../pages/PedidoGenerado.jsx';
import Catalogo from '../pages/Catalogo.jsx';
import AdminLayout from '../components/admin/AdminLayout.jsx';
import DashboardAdmin from '../pages/admin/DashboardAdmin.jsx';
import ProductosAdmin from '../pages/admin/ProductosAdmin.jsx';
import PedidosAdmin from '../pages/admin/PedidosAdmin.jsx';
import ClientesAdmin from '../pages/admin/ClientesAdmin.jsx';
import LoginAdmin from '../pages/admin/LoginAdmin.jsx';
import RutaAdmin from '../components/admin/RutaAdmin.jsx';
import ChatAsistente from '../components/chat/ChatAsistente.jsx';
import WebAccountModal from '../components/WebAccountModal.jsx';
import './Layout.css';
import './NavigationFix.css';
import './ClienteTheme.css';
import '../Responsive.css';
import './HeaderOptionsHidden.css';

const TABS_MOVIL = [
  { ruta: '/catalogo', icono: Package, texto: 'Catálogo' },
  { ruta: '/categorias', icono: Tags, texto: 'Categorías' },
  { ruta: '/carrito', icono: ShoppingCart, texto: 'Carrito' },
  { ruta: '/', icono: Home, texto: 'Inicio', exacto: true },
];

function indiceTabActivo(rutaActual) {
  if (rutaActual === '/') return 3;
  if (rutaActual.startsWith('/catalogo') || rutaActual.startsWith('/productos')) return 0;
  if (rutaActual.startsWith('/categorias')) return 1;
  if (rutaActual.startsWith('/carrito') || rutaActual.startsWith('/identificacion') || rutaActual.startsWith('/confirmacion') || rutaActual.startsWith('/pedido')) return 2;
  return 3;
}

function NavegacionMovil() {
  const { cantidadTotal } = useCarrito();
  const ubicacion = useLocation();
  const indice = indiceTabActivo(ubicacion.pathname);

  return (
    <nav className="mobile-bottom-nav" aria-label="Navegación móvil">
      <span
        className="mobile-nav-glider"
        style={{ transform: `translateX(${indice * 100}%)` }}
        aria-hidden="true"
      />
      {TABS_MOVIL.map(({ ruta, icono: Icono, texto, exacto }) => (
        <NavLink key={ruta} to={ruta} end={exacto} className="mobile-nav-item">
          {ruta === '/carrito' ? (
            <span className="mobile-cart-icon-wrap">
              <Icono size={20} />
              {cantidadTotal > 0 && <span className="mobile-cart-badge">{cantidadTotal}</span>}
            </span>
          ) : (
            <Icono size={20} />
          )}
          <span>{texto}</span>
        </NavLink>
      ))}
    </nav>
  );
}

function Layout() {
  const { cantidadTotal } = useCarrito();
  const navigate = useNavigate();
  const [texto, setTexto] = useState('');
  const [cuentaAbierta, setCuentaAbierta] = useState(false);

  function buscar(event) {
    event.preventDefault();
    const q = texto.trim();
    navigate(q ? `/catalogo?buscar=${encodeURIComponent(q)}` : '/catalogo');
  }

  return (
    <div className="app-shell">
      <header className="site-header terra-header">
        <div className="terra-header-left">
          <Link to="/" className="brand terra-logo" title="TERRA Autoservicio">
            <img src="/logo-terra.png" alt="TERRA Autoservicio" />
          </Link>
        </div>

        <form className="terra-search" role="search" onSubmit={buscar}>
          <Search size={17} />
          <input
            value={texto}
            onChange={(event) => setTexto(event.target.value)}
            placeholder="Buscar muebles y más..."
            aria-label="Buscar muebles y más"
          />
          <button type="submit" aria-label="Buscar">
            <ArrowRight size={17} />
          </button>
        </form>

        {/* Desktop & Tablet Navigation */}
        <nav className="desktop-nav" aria-label="Navegación principal">
          <NavLink to="/catalogo"><Package size={17} /> <span>Catálogo de Productos</span></NavLink>
          <NavLink to="/categorias"><Tags size={17} /> <span>Líneas y Categorías</span></NavLink>
        </nav>

        <div className="terra-header-right">
          <button type="button" className="terra-login-button" aria-haspopup="dialog" aria-expanded={cuentaAbierta} onClick={() => setCuentaAbierta(true)}><UserRound size={19} /><span>Iniciar sesión</span></button>
          <NavLink to="/carrito" className="cart-link terra-cart-link">
            <ShoppingCart size={18} />
            <span>Carrito</span>
            {cantidadTotal > 0 && <b>{cantidadTotal}</b>}
          </NavLink>
          <NavLink to="/" end className="terra-home-btn" title="Inicio">
            <Home size={18} />
          </NavLink>
        </div>
      </header>
      {cuentaAbierta && <WebAccountModal onClose={() => setCuentaAbierta(false)} />}

      {MODO_DEMO && (
        <div className="demo-banner">
          MODO DEMOSTRACIÓN: precios y pedidos simulados para exhibición showroom.
        </div>
      )}

      <main className="page-content">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation (< 640px) */}
      <NavegacionMovil />

      <footer className="site-footer">
        <div>TERRA AUTOSERVICIO · Sucursal Equipetrol, Santa Cruz</div>
        <small>Terminal táctil optimizado para celular, tablet y PC</small>
      </footer>

      <ChatAsistente />
    </div>
  );
}




function Confirmacion() {
  const { items, subtotal, vaciarCarrito } = useCarrito();
  const { cliente, limpiarCliente } = useContext(ClienteContext);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');
  const clienteRegistradoRef = useRef(null);
  const enviandoRef = useRef(false);
  const navigate = useNavigate();
  if (items.length === 0) return <Navigate to="/carrito" replace />;

  async function confirmarPedido() {
    if (enviandoRef.current) return;
    enviandoRef.current = true;
    setProcesando(true);
    setError('');
    try {
      let clienteId = null;
      if (cliente.nombre.trim()) {
        if (!clienteRegistradoRef.current) {
          clienteRegistradoRef.current = await crearCliente(cliente);
        }
        clienteId = clienteRegistradoRef.current?.id ?? null;
      }
      const pedido = await crearPedido({ clienteId, items: items.map((item) => ({ productoId: item.id, cantidad: item.cantidad })) });
      vaciarCarrito();
      limpiarCliente();
      navigate('/pedido', { replace: true, state: { pedido } });
    } catch (err) {
      setError(err.message);
    } finally {
      enviandoRef.current = false;
      setProcesando(false);
    }
  }

  return (
    <section className="narrow-page"><h1>Confirmar pedido</h1>
      <div className="form-card"><h2>Resumen de compra</h2>
        {items.map((item) => <div className="receipt-row" key={item.id}><span>{item.cantidad} × {item.nombre}</span><b>{formatoMoneda(item.cantidad * item.precio)}</b></div>)}
        <div className="summary"><span>Total</span><strong>{formatoMoneda(subtotal)}</strong></div>
        <p className="muted">Cliente: {cliente.nombre || 'Invitado'}</p>
        <p className="muted">Forma de pago: en caja (no se cobra desde esta pantalla).</p>
        {error && <p className="error-box" role="alert">{error}</p>}
        <button className="btn btn-primary btn-large" type="button" disabled={procesando} onClick={confirmarPedido}>{procesando ? 'Generando pedido...' : 'Generar pedido'} <ArrowRight size={20} /></button>
        <Link className="btn btn-ghost" to="/carrito">Volver al carrito</Link>
      </div>
    </section>
  );
}

function PedidoGenerado() {
  const location = useLocation();
  const pedido = location.state?.pedido;
  if (!pedido) return <Navigate to="/" replace />;
  return (
    <section className="success-page"><CheckCircle2 size={70} className="success-icon" />
      <h1>{pedido.demo ? 'Pedido de demostración' : '¡Pedido generado!'}</h1>
      <p>{pedido.demo ? 'Esta operación es una simulación y no se guardó en el servidor.' : 'Muestra este código en caja para realizar el pago.'}</p>
      <div className="code-card"><span>Código de pedido</span><strong>{pedido.codigo}</strong><span>Total: {formatoMoneda(pedido.total)}</span></div>
      <Link to="/" className="btn btn-primary btn-large">Nueva compra</Link>
    </section>
  );
}

function NoEncontrado() {
  return <div className="empty-state"><h1>Página no encontrada</h1><Link className="btn btn-primary" to="/">Volver al inicio</Link></div>;
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="admin/login" element={<LoginAdmin />} />
        <Route path="admin" element={<RutaAdmin><AdminLayout /></RutaAdmin>}>
          <Route index element={<DashboardAdmin />} />
          <Route path="productos" element={<ProductosAdmin />} />
          <Route path="pedidos" element={<PedidosAdmin />} />
          <Route path="clientes" element={<ClientesAdmin />} />
        </Route>
        <Route element={<Layout />}>
          <Route index element={<Bienvenida />} />
          <Route path="categorias" element={<Categorias />} />
          <Route path="catalogo" element={<Catalogo />} />
          <Route path="productos/:id" element={<DetalleProducto />} />
          <Route path="carrito" element={<CarritoPage />} />
          <Route path="identificacion" element={<IdentificacionPage />} />
          <Route path="confirmacion" element={<ConfirmacionPage />} />
          <Route path="pedido" element={<PedidoGeneradoPage />} />
          <Route path="pedido/:id" element={<PedidoGeneradoPage />} />
          <Route path="*" element={<NoEncontrado />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
