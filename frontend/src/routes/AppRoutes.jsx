import { useRef, useState, useEffect } from 'react';
import {
  BrowserRouter, Routes, Route, Navigate, Link,
  NavLink, Outlet, useNavigate, useLocation, useSearchParams,
} from 'react-router-dom';
import { ShoppingCart, Store, Search, Plus, Minus, Trash2, ArrowRight, CheckCircle2, PackageOpen, Home, Package, Tags, Headphones, RotateCcw, Timer, UserRound, LogOut, ChevronDown, BadgeCheck, BookOpen, ReceiptText, MessageCircle, FileText, Repeat2, ContactRound, QrCode, Menu, X } from 'lucide-react';
import { useCarrito } from '../hooks/useCarrito.js';
import { useProductos } from '../hooks/useProductos.js';
import { ClienteContext } from '../context/ClienteContext.jsx';
import { SesionClienteContext } from '../context/SesionClienteContext.jsx';
import { useContext } from 'react';
import { categorias, emojiCategoria } from '../data/categorias.js';
import { formatoMoneda } from '../utils/formatoMoneda.js';
import { validarDatosCliente } from '../utils/validaciones.js';
import { crearCliente } from '../services/clienteService.js';
import { crearPedido } from '../services/pedidoService.js';
import { leerCarritoQr } from '../services/qrCartService.js';
import { MODO_DEMO, WHATSAPP_COMPROBANTES } from '../services/api.js';
import Bienvenida from '../pages/Bienvenida.jsx';
import Categorias from '../pages/Categorias.jsx';
import DetalleProducto from '../pages/DetalleProducto.jsx';
import CarritoPage from '../pages/CarritoPage.jsx';
import IdentificacionPage from '../pages/Identificacion.jsx';
import ConfirmacionPage from '../pages/Confirmacion.jsx';
import PedidoGeneradoPage from '../pages/PedidoGenerado.jsx';
import Catalogo from '../pages/Catalogo.jsx';
import PedidosMayorista from '../pages/PedidosMayorista.jsx';
import PanelMayorista from '../pages/PanelMayorista.jsx';
import InicioMayorista from '../pages/InicioMayorista.jsx';
import AdminLayout from '../components/admin/AdminLayout.jsx';
import DashboardAdmin from '../pages/admin/DashboardAdmin.jsx';
import ProductosAdmin from '../pages/admin/ProductosAdmin.jsx';
import VentasDirectasAdmin from '../pages/admin/VentasDirectasAdmin.jsx';
import PedidosAdmin from '../pages/admin/PedidosAdmin.jsx';
import ClientesAdmin from '../pages/admin/ClientesAdmin.jsx';
import PersonalAdmin from '../pages/admin/PersonalAdmin.jsx';
import CategoriasAdmin from '../pages/admin/CategoriasAdmin.jsx';
import AlmacenAdmin from '../pages/admin/AlmacenAdmin.jsx';
import ReportesAdmin from '../pages/admin/ReportesAdmin.jsx';
import LoginAdmin from '../pages/admin/LoginAdmin.jsx';
import RutaAdmin from '../components/admin/RutaAdmin.jsx';
import VendedorLayout from '../components/vendedor/VendedorLayout.jsx';
import DashboardVendedor from '../pages/vendedor/DashboardVendedor.jsx';
import LoginVendedor from '../pages/vendedor/LoginVendedor.jsx';
import ChatAsistente from '../components/chat/ChatAsistente.jsx';
import CarritoFlotante from '../components/cart/CarritoFlotante.jsx';
import WebAccountModal from '../components/WebAccountModal.jsx';
import BotonTema from '../components/ui/BotonTema.jsx';
import BotonesVoz from '../components/accesibilidad/BotonesVoz.jsx';
import LectorVoz from '../components/accesibilidad/LectorVoz.jsx';
import './Layout.css';
import './NavigationFix.css';
import './ClienteTheme.css';
import '../Responsive.css';
import './HeaderOptionsHidden.css';
import './FloatingActions.css';
// Modo noche: va al final para que sus reglas pisen las de todas las páginas.
import '../theme-dark.css';
import '../theme-dark-admin.css';

function Layout() {
  const { cantidadTotal } = useCarrito();
  const { sesion, esMayorista, cerrarSesion } = useContext(SesionClienteContext);
  const [cuentaAbierta, setCuentaAbierta] = useState(false);
  const [menuCuentaAbierto, setMenuCuentaAbierto] = useState(false);
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
  const [unidadesQr, setUnidadesQr] = useState(() => (leerCarritoQr() || []).reduce((t, i) => t + Number(i.cantidad || 0), 0));
  const navigate = useNavigate();
  const location = useLocation();
  const pulsacionesLogo = useRef([]);

  useEffect(() => {
    const actualizar = () => setUnidadesQr((leerCarritoQr() || []).reduce((t, i) => t + Number(i.cantidad || 0), 0));
    actualizar();
    window.addEventListener('storage', actualizar);
    return () => window.removeEventListener('storage', actualizar);
  }, [location.pathname]);

  useEffect(() => {
    setMenuMovilAbierto(false);
  }, [location.pathname]);

  const abrirAdminConLogo = (event) => {
    const ahora = Date.now();
    pulsacionesLogo.current = [...pulsacionesLogo.current, ahora].filter((marca) => ahora - marca < 2500);
    if (pulsacionesLogo.current.length < 5) return;
    event.preventDefault();
    pulsacionesLogo.current = [];
    navigate('/admin/login');
  };

  const cerrarCuenta = () => {
    cerrarSesion();
    setMenuCuentaAbierto(false);
    navigate('/');
  };
  const inicialesCuenta = String(sesion?.nombre || 'M').split(' ').filter(Boolean).slice(0, 2).map((parte) => parte[0]).join('').toUpperCase();
  const enlaceAsesor = `https://wa.me/${WHATSAPP_COMPROBANTES}?text=${encodeURIComponent('Hola, necesito asesoramiento sobre mi cuenta mayorista TERRA.')}`;

  return (
    <div className="app-shell">
      <a className="terra-skip-link" href="#contenido">Saltar al contenido</a>
      <LectorVoz />
      <header className="site-header terra-header">
        <div className="terra-header-left">
          <Link to="/" className="brand terra-logo" title="TERRA Autoservicio" onClick={abrirAdminConLogo}>
            <img src="/logo-terra.png" alt="TERRA Autoservicio" />
          </Link>
        </div>

        <button
          type="button"
          className="terra-menu-toggle"
          aria-label={menuMovilAbierto ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={menuMovilAbierto}
          aria-controls="terra-menu-movil"
          onClick={() => setMenuMovilAbierto((abierto) => !abierto)}
        >
          {menuMovilAbierto ? <X size={20} /> : <Menu size={20} />}
        </button>

        <div id="terra-menu-movil" className={`terra-header-nav${menuMovilAbierto ? ' is-open' : ''}`}>
        {/* Desktop & Tablet Navigation */}
        <nav className="desktop-nav" aria-label="Navegación principal">
          <NavLink to="/catalogo"><Package size={17} /> <span>Catálogo de Productos</span></NavLink>
          <NavLink to="/categorias"><Tags size={17} /> <span>Líneas y Categorías</span></NavLink>
        </nav>

        <div className="terra-header-right">
          <BotonesVoz />
          <BotonTema />
          <div className="terra-account">
            <button type="button" className={`terra-login-button${esMayorista ? ' terra-login-button--mayorista' : ''}`} aria-haspopup={esMayorista ? 'menu' : 'dialog'} aria-expanded={esMayorista ? menuCuentaAbierto : cuentaAbierta} onClick={() => { setMenuMovilAbierto(false); return esMayorista ? setMenuCuentaAbierto((abierto) => !abierto) : setCuentaAbierta(true); }}>{esMayorista ? <i className="terra-account-avatar">{inicialesCuenta}</i> : <UserRound size={19} />}<span>{esMayorista ? (sesion?.nombre || 'Mayorista') : 'Iniciar sesión'}</span>{esMayorista && <ChevronDown size={15} className={menuCuentaAbierto ? 'is-open' : ''} />}</button>
            {esMayorista && menuCuentaAbierto && <section className="terra-account-menu" role="menu">
              <div className="terra-account-summary">
                <i className="terra-account-avatar terra-account-avatar--large">{inicialesCuenta}</i>
                <div>
                  <div className="terra-account-name"><strong>{sesion?.nombre || 'Cliente mayorista'}</strong><b>Nivel Oro</b></div>
                  <small className="terra-account-status">Cuenta mayorista autorizada</small>
                  <span>{sesion?.email}</span>
                  <span>NIT/CI: {sesion?.nit || 'Pendiente de registro'}</span>
                </div>
              </div>
              <nav className="terra-account-links" aria-label="Opciones de cuenta mayorista">
                <Link className="is-active" to="/mi-cuenta" onClick={() => setMenuCuentaAbierto(false)}><Home size={16} /> Mi panel mayorista<i /></Link>
                <Link to="/catalogo" onClick={() => setMenuCuentaAbierto(false)}><BookOpen size={16} /> Catálogo mayorista con precios B2B</Link>
                <Link to="/mi-cuenta/pedidos" onClick={() => setMenuCuentaAbierto(false)}><ReceiptText size={16} /> Mis pedidos</Link>
                <button type="button" className="terra-account-link-disabled" title="Disponible próximamente"><FileText size={16} /> Mis cotizaciones y licitaciones</button>
                <Link to="/mi-cuenta/perfil" onClick={() => setMenuCuentaAbierto(false)}><ContactRound size={16} /> Mi perfil y datos de facturación</Link>
                <a className="terra-account-support" href={enlaceAsesor} target="_blank" rel="noreferrer"><MessageCircle size={16} /> Soporte por WhatsApp<i>Asesor en línea</i></a>
              </nav>
              <div className="terra-account-footer"><button type="button" onClick={cerrarCuenta}><LogOut size={16} /> Cerrar sesión</button></div>
            </section>}
          </div>
          <NavLink to="/carrito" className="cart-link terra-cart-link">
            <ShoppingCart size={18} />
            <span>Carrito</span>
            {cantidadTotal > 0 && <b>{cantidadTotal}</b>}
          </NavLink>
          <NavLink to="/" end className="terra-home-btn" title="Inicio">
            <Home size={18} />
            <span>Inicio</span>
          </NavLink>
        </div>
        </div>
      </header>
      {cuentaAbierta && <WebAccountModal onClose={() => setCuentaAbierta(false)} />}

      {MODO_DEMO && (
        <div className="demo-banner">
          MODO DEMOSTRACIÓN: precios y pedidos simulados para exhibición showroom.
        </div>
      )}

      <main className="page-content" id="contenido" tabIndex={-1}>
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation (< 640px) */}
      <nav className="mobile-bottom-nav" aria-label="Navegación móvil">
        <NavLink to="/catalogo" className="mobile-nav-item">
          <Package size={20} />
          <span>Catálogo</span>
        </NavLink>
        <NavLink to="/categorias" className="mobile-nav-item">
          <Tags size={20} />
          <span>Categorías</span>
        </NavLink>
        <NavLink to="/carrito" className="mobile-nav-item mobile-cart-item">
          <div className="mobile-cart-icon-wrap">
            <ShoppingCart size={20} />
            {cantidadTotal > 0 && <span className="mobile-cart-badge">{cantidadTotal}</span>}
          </div>
          <span>Carrito</span>
        </NavLink>
        <NavLink to="/" end className="mobile-nav-item">
          <Home size={20} />
          <span>Inicio</span>
        </NavLink>
      </nav>

      <footer className="site-footer">
        <div>TERRA AUTOSERVICIO · Sucursal Equipetrol, Santa Cruz</div>
        <small>Terminal táctil optimizado para celular, tablet y PC</small>
      </footer>

      <CarritoFlotante />
      <ChatAsistente />
      <button
        type="button"
        className="catalog-qr-fab"
        onClick={() => navigate(`/catalogo?abrirQr=1&t=${Date.now()}`)}
        aria-label={unidadesQr ? `Comprar por QR, ${unidadesQr} unidades agregadas` : 'Comprar por QR, abrir cámara'}
      >
        <QrCode size={21} />
        {unidadesQr > 0 && <b>{unidadesQr}</b>}
      </button>
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
        <Route path="vendedor/login" element={<LoginVendedor />} />
        <Route path="admin" element={<RutaAdmin><AdminLayout /></RutaAdmin>}>
          <Route index element={<DashboardAdmin />} />
          <Route path="productos" element={<RutaAdmin roles={['admin']}><ProductosAdmin /></RutaAdmin>} />
          <Route path="ventas-directas" element={<RutaAdmin roles={['admin', 'vendedor']}><VentasDirectasAdmin /></RutaAdmin>} />
          <Route path="categorias" element={<RutaAdmin roles={['admin']}><CategoriasAdmin /></RutaAdmin>} />
          <Route path="almacen" element={<RutaAdmin roles={['admin']}><AlmacenAdmin /></RutaAdmin>} />
          <Route path="pedidos" element={<RutaAdmin roles={['admin', 'vendedor', 'despacho']}><PedidosAdmin /></RutaAdmin>} />
          <Route path="clientes" element={<RutaAdmin roles={['admin', 'vendedor']}><ClientesAdmin /></RutaAdmin>} />
          <Route path="personal" element={<RutaAdmin roles={['admin']}><PersonalAdmin /></RutaAdmin>} />
          <Route path="reportes" element={<RutaAdmin roles={['admin']}><ReportesAdmin /></RutaAdmin>} />
        </Route>
        <Route path="vendedor" element={<RutaAdmin roles={['vendedor', 'admin']}><VendedorLayout /></RutaAdmin>}>
          <Route index element={<DashboardVendedor />} />
          <Route path="ventas" element={<VentasDirectasAdmin />} />
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
          <Route path="mi-cuenta" element={<InicioMayorista />} />
          <Route path="mi-cuenta/perfil" element={<PanelMayorista />} />
          <Route path="mi-cuenta/pedidos" element={<PedidosMayorista />} />
          <Route path="*" element={<NoEncontrado />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
