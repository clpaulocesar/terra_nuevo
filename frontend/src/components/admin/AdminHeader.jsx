import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Menu, Search, ShieldCheck, Store, UserRound } from 'lucide-react';
import { cerrarSesionAdmin, getAdminUser } from '../../services/adminService.js';
import TimbrePedidos from './TimbrePedidos.jsx';
import BotonTema from '../ui/BotonTema.jsx';
import './AdminHeader.css';
import './AdminNavigationHidden.css';

const TITULOS_RUTAS = {
  '/admin': 'Panel Principal', '/admin/': 'Panel Principal', '/admin/productos': 'Productos',
  '/admin/categorias': 'Categorías', '/admin/pedidos': 'Pedidos', '/admin/clientes': 'Clientes',
  '/admin/reportes': 'Reportes',
};

export default function AdminHeader({ onToggleDrawer }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [busqueda, setBusqueda] = useState('');
  const [menuUsuarioAbierto, setMenuUsuarioAbierto] = useState(false);
  const userMenuRef = useRef(null);
  const usuario = getAdminUser() || { nombre: 'Administrador TERRA', email: 'admin@terra.local', rol: 'admin' };
  const etiquetaRol = usuario.rol === 'vendedor' ? 'Vendedor' : usuario.rol === 'despacho' ? 'Despacho' : 'Administrador';
  const nombrePaginaActual = TITULOS_RUTAS[location.pathname] || 'Panel Principal';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) setMenuUsuarioAbierto(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      <BotonTema className="admin-theme-btn" />
      <div className="admin-search-box"><Search size={16} /><input type="text" placeholder="Buscar pedidos, productos, client..." value={busqueda} onChange={(event) => setBusqueda(event.target.value)} onKeyDown={handleBuscar} /></div>
      <TimbrePedidos />
      <div className="relative" ref={userMenuRef}>
        <button type="button" className="admin-avatar-btn" title={`Perfil: ${usuario.nombre}`} onClick={() => setMenuUsuarioAbierto((abierto) => !abierto)}><UserRound size={19} /><span>{usuario.nombre}</span></button>
        {menuUsuarioAbierto && <div className="admin-dropdown-menu"><div className="admin-dropdown-header"><strong>{getAdminUser()?.nombre || 'Administrador TERRA'}</strong><small>{getAdminUser()?.email || 'admin@terra.bo'}</small></div><div className="admin-dropdown-item" style={{ cursor: 'default' }}><Store size={16} color="#745a27" /><span>Sucursal Equipetrol</span></div><div className="admin-dropdown-item" style={{ cursor: 'default' }}><ShieldCheck size={16} color="#a6192e" /><span>Acceso Backoffice Seguro · {etiquetaRol}</span></div><hr style={{ border: 'none', borderTop: '1px solid #f0eded', margin: '0.4rem 0' }} /><button type="button" className="admin-dropdown-item danger" onClick={handleLogout}><LogOut size={16} /><span>Cerrar sesión</span></button></div>}
      </div>
    </div>
  </header>;
}
