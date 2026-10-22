import { useState } from 'react';
import { LayoutDashboard, Package, ReceiptText, Store, LogOut, Tags, TrendingUp, Users, X, ShoppingCart, UserCog, Warehouse } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { cerrarSesionAdmin, getAdminUser } from '../../services/adminService.js';
import AdminHeader from './AdminHeader.jsx';
import '../../pages/admin/Admin.css';
import './AdminSidebar.css';
import './AdminSidebarFix.css';
import './AdminNavigationHidden.css';
import './AdminContentFix.css';
import './AdminTheme.css';

const enlaces = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true, roles: ['admin', 'vendedor', 'despacho'] },
  { to: '/admin/pedidos', label: 'Pedidos', icon: ReceiptText, roles: ['admin', 'vendedor', 'despacho'] },
  { to: '/admin/ventas-directas', label: 'Ventas directas', icon: ShoppingCart, roles: ['admin', 'vendedor'] },
  { to: '/admin/productos', label: 'Productos', icon: Package, roles: ['admin'] },
  { to: '/admin/categorias', label: 'Categorías', icon: Tags, roles: ['admin'] },
  { to: '/admin/almacen', label: 'Almacén', icon: Warehouse, roles: ['admin'] },
  { to: '/admin/clientes', label: 'Clientes', icon: Users, roles: ['admin', 'vendedor'] },
  { to: '/admin/personal', label: 'Personal', icon: UserCog, roles: ['admin'] },
  { to: '/admin/reportes', label: 'Reportes', icon: TrendingUp, roles: ['admin'] },
];

export default function AdminLayout() {
  const [drawerAbierto, setDrawerAbierto] = useState(false);
  const navigate = useNavigate();
  const usuario = getAdminUser() || { nombre: 'Administrador Principal', rol: 'admin' };
  const enlacesVisibles = enlaces.filter((enlace) => enlace.roles.includes(usuario.rol));
  const etiquetaRol = usuario.rol === 'vendedor' ? 'Vendedor' : usuario.rol === 'despacho' ? 'Despacho' : 'Administrador';
  const salir = () => { cerrarSesionAdmin(); navigate('/', { replace: true }); };
  const navegacion = (clase = '') => <nav className={clase}>{enlacesVisibles.map(({ to, label, icon: Icon, end }) => (
    <NavLink end={end} key={to} to={to} onClick={() => setDrawerAbierto(false)} className={clase ? 'admin-mobile-nav-item' : undefined}><Icon size={clase ? 19 : 18} /><span>{label}</span></NavLink>
  ))}</nav>;

  return <div className={`admin-shell ${drawerAbierto ? 'drawer-open' : ''}`}>
    {drawerAbierto && <div className="admin-drawer-overlay" onClick={() => setDrawerAbierto(false)} aria-hidden="true" />}
    <aside className={`admin-sidebar ${drawerAbierto ? 'open' : ''}`}>
      <header className="admin-brand"><img src="/logo-terra.png" alt="TERRA Autoservicio" className="admin-brand-logo" /><button className="admin-drawer-close" onClick={() => setDrawerAbierto(false)} aria-label="Cerrar menú" type="button"><X size={20} /></button></header>
      <section className="admin-branch"><span><Store size={17} /></span><div><small>Sucursal activa</small><b>Equipetrol Showroom</b></div><i title="Terminal operativo" /></section>
      {navegacion()}
      <footer><div className="admin-user"><span><Users size={15} /></span><div><b>{usuario.nombre}</b><small>{etiquetaRol} · Sucursal Equipetrol</small></div></div><button onClick={salir}><LogOut size={16} /> Cerrar sesión</button></footer>
    </aside>
    <div className="admin-main-wrap"><AdminHeader onToggleDrawer={() => setDrawerAbierto((prev) => !prev)} /><section className="admin-content"><Outlet /></section></div>
    {navegacion('admin-mobile-bottom-nav')}
  </div>;
}
