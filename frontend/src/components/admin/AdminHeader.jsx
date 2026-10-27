import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Menu, Search, ShieldCheck, Store, UserRound } from 'lucide-react';
import { cerrarSesionAdmin, getAdminUser } from '../../services/adminService.js';
import TimbrePedidos from './TimbrePedidos.jsx';
import BotonTema from '../ui/BotonTema.jsx';
import BotonesVoz from '../accesibilidad/BotonesVoz.jsx';
import './AdminHeader.css';
import './AdminNavigationHidden.css';

const TITULOS_RUTAS = {
  '/admin': 'Panel Principal', '/admin/': 'Panel Principal', '/admin/productos': 'Productos',
  '/admin/categorias': 'Categorías', '/admin/almacen': 'Almacén', '/admin/pedidos': 'Pedidos', '/admin/clientes': 'Clientes',
  '/admin/reportes': 'Reportes',
};

export default function AdminHeader({ onToggleDrawer }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [busqueda, setBusqueda] = useState('');
  const [menuUsuarioAbierto, setMenuUsuarioAbierto] = useState(false);
  const [menuControlesAbierto, setMenuControlesAbierto] = useState(false);
  const userMenuRef = useRef(null);
  const controlesMenuRef = useRef(null);
  const usuario = getAdminUser() || { nombre: 'Administrador TERRA', email: 'admin@terra.local', rol: 'admin' };
  const etiquetaRol = usuario.rol === 'vendedor' ? 'Vendedor' : usuario.rol === 'despacho' ? 'Despacho' : 'Administrador';
  const nombrePaginaActual = TITULOS_RUTAS[location.pathname] || 'Panel Principal';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) setMenuUsuarioAbierto(false);
      if (controlesMenuRef.current && !controlesMenuRef.current.contains(event.target)) setMenuControlesAbierto(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!menuControlesAbierto) return undefined;
    const cerrarConEscape = (event) => {
      if (event.key === 'Escape') setMenuControlesAbierto(false);
    };
    document.addEventListener('keydown', cerrarConEscape);
    return () => document.removeEventListener('keydown', cerrarConEscape);
  }, [menuControlesAbierto]);

  const handleLogout = () => { cerrarSesionAdmin(); navigate('/admin/login', { replace: true }); };
  const handleBuscar = (event) => {
    if (event.key === 'Enter' && busqueda.trim() && location.pathname !== '/admin/pedidos' && location.pathname !== '/admin/productos') {
      navigate(`/admin/pedidos?q=${encodeURIComponent(busqueda.trim())}`);
    }
  };

  return <header className="admin-header-bar">
    <div className="admin-header-left">
      {onToggleDrawer && <button type="button" className="admin-menu-toggle" onClick={onToggleDrawer} aria-label="Abrir menú lateral" title="Abrir menú"><Menu size={20} /></button>}
      <nav className="admin-breadcrumbs" aria-label="Ruta de navegación"><Link to="/admin" className="breadcrumb-root">Backoffice</Link><span className="breadcrumb-sep">›</span><span className="breadcrumb-current">{nombrePaginaActual}</span></nav>
      <div className="admin-header-divider" />
      <div className="admin-kiosk-status-pill"><span className="admin-kiosk-dot" /><span>Kioscos Showroom: En línea</span></div>
    </div>
    <div className="admin-header-right">
      <div className="admin-header-controls-desktop">
        <BotonesVoz className="admin-voz" />
        <BotonTema className="admin-theme-btn" />
        <TimbrePedidos />
      </div>
      <div className="admin-header-controls-mobile" ref={controlesMenuRef}>
        <button
          type="button"
          className="admin-controls-menu-toggle"
          onClick={() => setMenuControlesAbierto((abierto) => !abierto)}
          aria-label="Abrir herramientas del panel"
          aria-expanded={menuControlesAbierto}
          aria-controls="admin-controls-menu"
        >
          <Menu size={20} />
        </button>
        {menuControlesAbierto && (
          <div className="admin-controls-menu" id="admin-controls-menu">
            <p>Herramientas del panel</p>
            <div className="admin-controls-menu-section">
              <span>Accesibilidad por voz</span>
              <BotonesVoz className="admin-voz" />
            </div>
            <div className="admin-controls-menu-section admin-controls-menu-section--theme">
              <BotonTema className="admin-theme-btn" conTexto />
            </div>
            <div className="admin-controls-menu-section admin-controls-menu-section--orders">
              <TimbrePedidos />
            </div>
          </div>
        )}
      </div>
      <div className="admin-search-box"><Search size={16} /><input type="text" placeholder="Buscar pedidos, productos, client..." value={busqueda} onChange={(event) => setBusqueda(event.target.value)} onKeyDown={handleBuscar} /></div>
      <div className="relative" ref={userMenuRef}>
        <button type="button" className="admin-avatar-btn" title={`Perfil: ${usuario.nombre}`} onClick={() => setMenuUsuarioAbierto((abierto) => !abierto)}><UserRound size={19} /><span>{usuario.nombre}</span></button>
        {menuUsuarioAbierto && <div className="admin-dropdown-menu"><div className="admin-dropdown-header"><strong>{getAdminUser()?.nombre || 'Administrador TERRA'}</strong><small>{getAdminUser()?.email || 'admin@terra.bo'}</small></div><div className="admin-dropdown-item" style={{ cursor: 'default' }}><Store size={16} color="#745a27" /><span>Sucursal Equipetrol</span></div><div className="admin-dropdown-item" style={{ cursor: 'default' }}><ShieldCheck size={16} color="#a6192e" /><span>Acceso Backoffice Seguro · {etiquetaRol}</span></div><hr style={{ border: 'none', borderTop: '1px solid #f0eded', margin: '0.4rem 0' }} /><button type="button" className="admin-dropdown-item danger" onClick={handleLogout}><LogOut size={16} /><span>Cerrar sesión</span></button></div>}
      </div>
    </div>
  </header>;
}
