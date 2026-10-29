import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { TutorialProvider } from '../context/TutorialContext.jsx';

import Bienvenida from '../pages/Bienvenida.jsx';
import Categorias from '../pages/Categorias.jsx';
import DetalleProductoPage from '../features/detalle-producto/DetalleProductoPage.jsx';
import CarritoPage from '../pages/CarritoPage.jsx';
import IdentificacionPage from '../pages/Identificacion.jsx';
import ConfirmacionPage from '../pages/Confirmacion.jsx';
import PedidoGeneradoPage from '../pages/PedidoGenerado.jsx';
import CatalogoPage from '../features/catalogo/CatalogoPage.jsx';
import LayoutCliente from '../features/layout-cliente/LayoutCliente.jsx';
import IndicadorCarga from '../components/ui/IndicadorCarga.jsx';
import RutaAdmin from '../components/admin/RutaAdmin.jsx';
// Backoffice y cuenta mayorista: se descargan sólo cuando se entra a esas rutas, así el
// kiosco no carga su JS ni su CSS (Vite genera un chunk por cada import()).
const PedidosMayorista = lazy(() => import('../pages/PedidosMayorista.jsx'));
const PanelMayorista = lazy(() => import('../pages/PanelMayorista.jsx'));
const InicioMayorista = lazy(() => import('../pages/InicioMayorista.jsx'));
const AdminLayout = lazy(() => import('../components/admin/AdminLayout.jsx'));
const DashboardAdmin = lazy(() => import('../pages/admin/DashboardAdmin.jsx'));
const ProductosAdmin = lazy(() => import('../pages/admin/ProductosAdmin.jsx'));
const VentasDirectasAdmin = lazy(() => import('../pages/admin/VentasDirectasAdmin.jsx'));
const PedidosAdmin = lazy(() => import('../pages/admin/PedidosAdmin.jsx'));
const DespachoAdmin = lazy(() => import('../pages/admin/DespachoAdmin.jsx'));
const RepartidoresAdmin = lazy(() => import('../pages/admin/RepartidoresAdmin.jsx'));
const ClientesAdmin = lazy(() => import('../pages/admin/ClientesAdmin.jsx'));
const PersonalAdmin = lazy(() => import('../pages/admin/PersonalAdmin.jsx'));
const CategoriasAdmin = lazy(() => import('../pages/admin/CategoriasAdmin.jsx'));
const AlmacenAdmin = lazy(() => import('../pages/admin/AlmacenAdmin.jsx'));
const ReportesAdmin = lazy(() => import('../pages/admin/ReportesAdmin.jsx'));
const TarifasEnvioAdmin = lazy(() => import('../pages/admin/TarifasEnvioAdmin.jsx'));
const LoginAdmin = lazy(() => import('../pages/admin/LoginAdmin.jsx'));
const VendedorLayout = lazy(() => import('../components/vendedor/VendedorLayout.jsx'));
const DashboardVendedor = lazy(() => import('../pages/vendedor/DashboardVendedor.jsx'));
const LoginVendedor = lazy(() => import('../pages/vendedor/LoginVendedor.jsx'));
import { NavegacionProvider } from '../navegacion/NavegacionContext.jsx';
// ClienteTheme.css (Confirmación) y Responsive.css (backoffice y Bienvenida) se migran en sus fases.
import './ClienteTheme.css';
import '../Responsive.css';
// Modo noche: va al final para que sus reglas pisen las de todas las páginas.
// (theme-dark-admin.css lo importan los layouts y logins del backoffice, que son lazy.)
import '../theme-dark.css';

// Mientras baja el chunk de una ruta lazy.
function CargandoRuta() {
  return <IndicadorCarga texto="Cargando…" role="status" aria-live="polite" />;
}

function NoEncontrado() {
  return <div className="empty-state"><h1>Página no encontrada</h1><Link className="btn btn-primary" to="/">Volver al inicio</Link></div>;
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <NavegacionProvider>
      <Suspense fallback={<CargandoRuta />}>
      <Routes>
        <Route path="admin/login" element={<LoginAdmin />} />
        <Route path="vendedor/login" element={<LoginVendedor />} />
        <Route path="admin" element={<RutaAdmin><AdminLayout /></RutaAdmin>}>
          <Route index element={<RutaAdmin roles={['admin', 'vendedor']}><DashboardAdmin /></RutaAdmin>} />
          <Route path="despacho" element={<RutaAdmin roles={['admin', 'despacho']}><DespachoAdmin /></RutaAdmin>} />
          <Route path="repartidores" element={<RutaAdmin roles={['admin']}><RepartidoresAdmin /></RutaAdmin>} />
          <Route path="productos" element={<RutaAdmin roles={['admin']}><ProductosAdmin /></RutaAdmin>} />
          <Route path="ventas-directas" element={<RutaAdmin roles={['admin', 'vendedor']}><VentasDirectasAdmin /></RutaAdmin>} />
          <Route path="categorias" element={<RutaAdmin roles={['admin']}><CategoriasAdmin /></RutaAdmin>} />
          <Route path="almacen" element={<RutaAdmin roles={['admin']}><AlmacenAdmin /></RutaAdmin>} />
          <Route path="pedidos" element={<RutaAdmin roles={['admin', 'vendedor']}><PedidosAdmin /></RutaAdmin>} />
          <Route path="clientes" element={<RutaAdmin roles={['admin', 'vendedor']}><ClientesAdmin /></RutaAdmin>} />
          <Route path="personal" element={<RutaAdmin roles={['admin']}><PersonalAdmin /></RutaAdmin>} />
          <Route path="reportes" element={<RutaAdmin roles={['admin']}><ReportesAdmin /></RutaAdmin>} />
          <Route path="tarifas-envio" element={<RutaAdmin roles={['admin']}><TarifasEnvioAdmin /></RutaAdmin>} />
        </Route>
        <Route path="vendedor" element={<RutaAdmin roles={['vendedor', 'admin']}><VendedorLayout /></RutaAdmin>}>
          <Route index element={<DashboardVendedor />} />
          <Route path="ventas" element={<VentasDirectasAdmin />} />
          <Route path="pedidos" element={<PedidosAdmin />} />
          <Route path="clientes" element={<ClientesAdmin />} />
        </Route>
        <Route element={<TutorialProvider><LayoutCliente /></TutorialProvider>}>
          <Route index element={<Bienvenida />} />
          <Route path="categorias" element={<Categorias />} />
          <Route path="catalogo" element={<CatalogoPage />} />
          <Route path="productos/:id" element={<DetalleProductoPage />} />
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
      </Suspense>
      </NavegacionProvider>
    </BrowserRouter>
  );
}
