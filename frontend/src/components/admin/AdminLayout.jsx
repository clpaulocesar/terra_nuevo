import { useState } from 'react';
import { LayoutDashboard, Package, ReceiptText, Store, LogOut, Tags, Users, X, ShoppingCart } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { cerrarSesionAdmin } from '../../services/adminService.js';
import AdminHeader from './AdminHeader.jsx';
import '../../pages/admin/Admin.css';
import './AdminSidebar.css';
import './AdminSidebarFix.css';
import './AdminNavigationHidden.css';
import './AdminContentFix.css';
import './AdminTheme.css';

const enlaces = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/pedidos', label: 'Pedidos', icon: ReceiptText },
  { to: '/admin/ventas-directas', label: 'Ventas directas', icon: ShoppingCart },
  { to: '/admin/productos', label: 'Productos', icon: Package },
  { to: '/admin/categorias', label: 'Categorías', icon: Tags },
  { to: '/admin/clientes', label: 'Clientes', icon: Users },
];

export default function AdminLayout() {
  const [drawerAbierto, setDrawerAbierto] = useState(false);
  const navigate = useNavigate();
  const salir = () => { cerrarSesionAdmin(); navigate('/admin/login', { replace: true }); };

  return (
    <div className={`admin-shell ${drawerAbierto ? 'drawer-open' : ''}`}>
      {/* Overlay para móvil cuando el menú lateral está abierto */}
      {drawerAbierto && (
        <div
          className="admin-drawer-overlay"
          onClick={() => setDrawerAbierto(false)}
          aria-hidden="true"
        />
      )}

      {/* Barra lateral / Drawer deslizable */}
      <aside className={`admin-sidebar ${drawerAbierto ? 'open' : ''}`}>
        <header className="admin-brand">
          <img src="/logo-terra.png" alt="TERRA Autoservicio" className="admin-brand-logo" />
          <button
            className="admin-drawer-close"
            onClick={() => setDrawerAbierto(false)}
            aria-label="Cerrar menú"
            type="button"
          >
            <X size={20} />
          </button>
        </header>

        <section className="admin-branch">
          <span><Store size={17}/></span>
          <div><small>Sucursal activa</small><b>Equipetrol Showroom</b></div>
          <i title="Terminal operativo"/>
        </section>

        <nav>
          {enlaces.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              end={end}
              key={to}
              to={to}
              onClick={() => setDrawerAbierto(false)}
            >
              <Icon size={18}/>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <footer>
          <div className="admin-user">
            <span><Users size={15}/></span>
            <div><b>Carlos Mendoza</b><small>Admin Sucursal Equipetrol</small></div>
          </div>
          <button onClick={salir}><LogOut size={16}/> Cerrar sesión</button>
        </footer>
      </aside>

      {/* Contenedor Principal */}
      <div className="admin-main-wrap">
        <AdminHeader onToggleDrawer={() => setDrawerAbierto(prev => !prev)} />
        <section className="admin-content">
          <Outlet />
        </section>
      </div>

      {/* Barra de navegación inferior fija para celular (< 768px) */}
      <nav className="admin-mobile-bottom-nav" aria-label="Navegación móvil backoffice">
        {enlaces.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            end={end}
            key={to}
            to={to}
            className="admin-mobile-nav-item"
          >
            <Icon size={19} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
