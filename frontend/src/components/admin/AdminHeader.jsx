import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, LogOut, Menu, Search, ShieldCheck, Store, UserRound } from 'lucide-react';
import { cerrarSesionAdmin } from '../../services/adminService.js';
import { listarClientes } from '../../services/clienteService.js';
import { listarPedidos } from '../../services/pedidoService.js';
import { listarProductos } from '../../services/productoService.js';
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
  const [menuNotifAbierto, setMenuNotifAbierto] = useState(false);
  const [actividades, setActividades] = useState([]);
  const [cargandoActividad, setCargandoActividad] = useState(false);
  const userMenuRef = useRef(null);
  const notifMenuRef = useRef(null);
  const nombrePaginaActual = TITULOS_RUTAS[location.pathname] || 'Panel Principal';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) setMenuUsuarioAbierto(false);
      if (notifMenuRef.current && !notifMenuRef.current.contains(event.target)) setMenuNotifAbierto(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function cargarActividad() {
    setCargandoActividad(true);
    try {
      const [pedidos, productos, clientes] = await Promise.all([
        listarPedidos({ limite: 4 }), listarProductos({ limite: 100, todos: true }), listarClientes({ limite: 3 }),
      ]);
      const eventos = [
        ...(pedidos || []).slice(0, 3).map((pedido) => ({ id: `pedido-${pedido.id}`, titulo: `Pedido ${pedido.codigo || `#${pedido.id}`}`, detalle: `${pedido.cliente || 'Cliente'} · ${pedido.items || 'Pedido registrado'}` })),
        ...(productos || []).filter((producto) => Number(producto.stock ?? producto.showroom) < 2).slice(0, 2).map((producto) => ({ id: `stock-${producto.id}`, titulo: 'Alerta de inventario', detalle: `${producto.nombre}: ${Number(producto.stock ?? producto.showroom) || 0} unidad(es) disponible(s).` })),
        ...(clientes || []).slice(0, 1).map((cliente) => ({ id: `cliente-${cliente.id}`, titulo: 'Cliente registrado', detalle: `${cliente.nombre}${cliente.nit ? ` · NIT ${cliente.nit}` : ''}` })),
      ];
      setActividades(eventos);
    } catch {
      setActividades([]);
    } finally {
      setCargandoActividad(false);
    }
  }

  useEffect(() => { cargarActividad(); }, []);

  const handleLogout = () => { cerrarSesionAdmin(); navigate('/admin/login', { replace: true }); };
  const handleBuscar = (event) => {
    if (event.key === 'Enter' && busqueda.trim() && location.pathname !== '/admin/pedidos' && location.pathname !== '/admin/productos') {
      navigate(`/admin/pedidos?q=${encodeURIComponent(busqueda.trim())}`);
    }
  };
  const abrirNotificaciones = () => {
    const abrira = !menuNotifAbierto;
    setMenuNotifAbierto(abrira);
    setMenuUsuarioAbierto(false);
    if (abrira) cargarActividad();
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
      <div className="admin-search-box"><Search size={16} /><input type="text" placeholder="Buscar pedidos (Bs), productos, client..." value={busqueda} onChange={(event) => setBusqueda(event.target.value)} onKeyDown={handleBuscar} /></div>
      <div className="relative" ref={notifMenuRef}>
        <button type="button" className="admin-icon-btn" title="Actividad registrada" onClick={abrirNotificaciones}><Bell size={19} />{actividades.length > 0 && <span className="admin-notif-dot" />}</button>
        {menuNotifAbierto && <div className="admin-dropdown-menu admin-notif-dropdown">
          <div className="admin-dropdown-header"><strong>Actividad en Showroom</strong><small>Datos registrados en Supabase</small></div>
          {cargandoActividad && <div className="admin-notif-item"><p>Cargando actividad real…</p></div>}
          {!cargandoActividad && actividades.length === 0 && <div className="admin-notif-item"><p>Aún no hay actividad registrada.</p></div>}
          {!cargandoActividad && actividades.map((actividad) => <div className="admin-notif-item" key={actividad.id}><b>{actividad.titulo}</b><p>{actividad.detalle}</p></div>)}
        </div>}
      </div>
      <div className="relative" ref={userMenuRef}>
        <button type="button" className="admin-avatar-btn" title="Perfil de Administrador" onClick={() => { setMenuUsuarioAbierto((abierto) => !abierto); setMenuNotifAbierto(false); }}><UserRound size={19} /></button>
        {menuUsuarioAbierto && <div className="admin-dropdown-menu"><div className="admin-dropdown-header"><strong>Administrador TERRA</strong><small>admin@terra.bo</small></div><div className="admin-dropdown-item" style={{ cursor: 'default' }}><Store size={16} color="#745a27" /><span>Sucursal Equipetrol</span></div><div className="admin-dropdown-item" style={{ cursor: 'default' }}><ShieldCheck size={16} color="#a6192e" /><span>Acceso Backoffice Seguro</span></div><hr style={{ border: 'none', borderTop: '1px solid #f0eded', margin: '0.4rem 0' }} /><button type="button" className="admin-dropdown-item danger" onClick={handleLogout}><LogOut size={16} /><span>Cerrar sesión</span></button></div>}
      </div>
    </div>
  </header>;
}
