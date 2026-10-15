import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, UserRound, LogOut, Store, ShieldCheck, Menu } from 'lucide-react';
import { cerrarSesionAdmin } from '../../services/adminService.js';
import './AdminHeader.css';
import './AdminNavigationHidden.css';

const TITULOS_RUTAS = {
  '/admin': 'Panel Principal',
  '/admin/': 'Panel Principal',
  '/admin/productos': 'Productos',
  '/admin/pedidos': 'Pedidos',
  '/admin/clientes': 'Clientes',
};

export default function AdminHeader({ onToggleDrawer }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [busqueda, setBusqueda] = useState('');
  const [menuUsuarioAbierto, setMenuUsuarioAbierto] = useState(false);
  const [menuNotifAbierto, setMenuNotifAbierto] = useState(false);

  const userMenuRef = useRef(null);
  const notifMenuRef = useRef(null);

  // Determinar el título de la página activa para el breadcrumb
  const nombrePaginaActual = TITULOS_RUTAS[location.pathname] || 'Panel Principal';

  // Cerrar menús al hacer click afuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setMenuUsuarioAbierto(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(event.target)) {
        setMenuNotifAbierto(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleLogout() {
    cerrarSesionAdmin();
    navigate('/admin/login', { replace: true });
  }

  function handleBuscar(e) {
    if (e.key === 'Enter' && busqueda.trim()) {
      // Redirigir a pedidos o productos si busca algo específico
      if (location.pathname !== '/admin/pedidos' && location.pathname !== '/admin/productos') {
        navigate(`/admin/pedidos?q=${encodeURIComponent(busqueda.trim())}`);
      }
    }
  }

  return (
    <header className="admin-header-bar">
      {/* Sección Izquierda: Breadcrumbs, Separador y Estado de Kioscos */}
      <div className="admin-header-left">
        {onToggleDrawer && (
          <button
            type="button"
            className="admin-menu-toggle"
            onClick={onToggleDrawer}
            aria-label="Abrir menú lateral"
            title="Abrir menú"
          >
            <Menu size={20} />
          </button>
        )}
        <nav className="admin-breadcrumbs" aria-label="Ruta de navegación">
          <Link to="/admin" className="breadcrumb-root">
            Backoffice
          </Link>
          <span className="breadcrumb-sep">›</span>
          <span className="breadcrumb-current">{nombrePaginaActual}</span>
        </nav>

        <div className="admin-header-divider" />

        <div className="admin-kiosk-status-pill">
          <span className="admin-kiosk-dot" />
          <span>Kioscos Showroom: En línea</span>
        </div>
      </div>

      {/* Sección Derecha: Búsqueda táctica, Campana de notificaciones y Avatar */}
      <div className="admin-header-right">
        {/* Cuadro de Búsqueda */}
        <div className="admin-search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Buscar pedidos (Bs), productos, client..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            onKeyDown={handleBuscar}
          />
        </div>

        {/* Campana de Notificaciones */}
        <div className="relative" ref={notifMenuRef}>
          <button
            type="button"
            className="admin-icon-btn"
            title="Notificaciones de Kioscos"
            onClick={() => {
              setMenuNotifAbierto((prev) => !prev);
              setMenuUsuarioAbierto(false);
            }}
          >
            <Bell size={19} />
            <span className="admin-notif-dot" />
          </button>

          {menuNotifAbierto && (
            <div className="admin-dropdown-menu admin-notif-dropdown">
              <div className="admin-dropdown-header">
                <strong>Actividad en Showroom</strong>
                <small>Terminales de autoservicio activas</small>
              </div>
              <div className="admin-notif-item">
                <b>Terminal Kiosco #02</b>
                <p>Sesión activa iniciada en salón principal.</p>
              </div>
              <div className="admin-notif-item">
                <b>Sucursal Equipetrol</b>
                <p>2 terminales sincronizadas con catálogo en vivo.</p>
              </div>
              <div className="admin-notif-item">
                <b>Alerta de Inventario</b>
                <p>Colchón Ortopédic King: 1 unidad disponible en sala.</p>
              </div>
            </div>
          )}
        </div>

        {/* Avatar de Administrador */}
        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            className="admin-avatar-btn"
            title="Perfil de Administrador"
            onClick={() => {
              setMenuUsuarioAbierto((prev) => !prev);
              setMenuNotifAbierto(false);
            }}
          >
            <UserRound size={19} />
          </button>

          {menuUsuarioAbierto && (
            <div className="admin-dropdown-menu">
              <div className="admin-dropdown-header">
                <strong>Administrador TERRA</strong>
                <small>admin@terra.bo</small>
              </div>
              <div className="admin-dropdown-item" style={{ cursor: 'default' }}>
                <Store size={16} color="#745a27" />
                <span>Sucursal Equipetrol</span>
              </div>
              <div className="admin-dropdown-item" style={{ cursor: 'default' }}>
                <ShieldCheck size={16} color="#a6192e" />
                <span>Acceso Backoffice Seguro</span>
              </div>
              <hr style={{ border: 'none', borderTop: '1px solid #f0eded', margin: '0.4rem 0' }} />
              <button
                type="button"
                className="admin-dropdown-item danger"
                onClick={handleLogout}
              >
                <LogOut size={16} />
                <span>Cerrar sesión</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
