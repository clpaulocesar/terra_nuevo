import { useState } from 'react';
import { LayoutDashboard, LogOut, Menu, ReceiptText, ShoppingCart, Users, X } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { cerrarSesionAdmin, getAdminUser } from '../../services/adminService.js';
import './VendedorLayout.css';

const enlaces = [
  { to: '/vendedor', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/vendedor/pedidos', label: 'Pedidos', icon: ReceiptText },
  { to: '/vendedor/ventas', label: 'Ventas directas', icon: ShoppingCart },
  { to: '/vendedor/clientes', label: 'Clientes', icon: Users },
];

export default function VendedorLayout() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const navigate = useNavigate();
  const usuario = getAdminUser() || { nombre: 'Vendedor TERRA', email: '' };

  const salir = () => {
    cerrarSesionAdmin();
    navigate('/', { replace: true });
  };

  return (
    <div className="seller-shell">
      {menuAbierto && (
        <button
          type="button"
          className="seller-overlay"
          aria-label="Cerrar menú"
          onClick={() => setMenuAbierto(false)}
        />
      )}
      <aside className={`seller-sidebar ${menuAbierto ? 'is-open' : ''}`}>
        <header className="seller-sidebar__header">
          <img src="/logo-terra.png" alt="TERRA Autoservicio" />
          <button
            type="button"
            className="seller-sidebar__close"
            onClick={() => setMenuAbierto(false)}
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>
        </header>

        <nav className="seller-sidebar__nav">
          {enlaces.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              end={end}
              key={to}
              to={to}
              onClick={() => setMenuAbierto(false)}
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <footer className="seller-sidebar__footer">
          <div className="seller-user-card">
            <span>
              <Users size={17} />
            </span>
            <section>
              <b>{usuario.nombre}</b>
              <small>Vendedor · Sucursal Equipetrol</small>
            </section>
          </div>
          <button type="button" className="seller-sidebar-logout" onClick={salir}>
            <LogOut size={16} /> Cerrar sesión
          </button>
        </footer>
      </aside>

      <div className="seller-main">
        <header className="seller-header">
          <button
            type="button"
            className="seller-menu-btn"
            onClick={() => setMenuAbierto(true)}
            aria-label="Abrir menú"
          >
            <Menu size={21} />
          </button>
          <div className="seller-header__info">
            <small>Portal de ventas</small>
            <strong>Hola, {usuario.nombre}</strong>
          </div>
          <div className="seller-header__actions">
            <span className="seller-role-badge">Vendedor</span>
            <button
              type="button"
              className="seller-header-logout"
              onClick={salir}
              title="Cerrar sesión de vendedor"
            >
              <LogOut size={16} />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </header>
        <main className="seller-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
