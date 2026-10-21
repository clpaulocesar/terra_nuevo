import { useState } from 'react';
import { ClipboardList, LayoutDashboard, LogOut, Menu, ShoppingCart, Users, X } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { cerrarSesionAdmin, getAdminUser } from '../../services/adminService.js';
import './VendedorLayout.css';

const enlaces = [
  { to: '/vendedor', label: 'Inicio', icon: LayoutDashboard, end: true },
  { to: '/vendedor/ventas', label: 'Nueva venta', icon: ShoppingCart },
  { to: '/vendedor/pedidos', label: 'Pedidos', icon: ClipboardList },
  { to: '/vendedor/clientes', label: 'Clientes', icon: Users },
];

export default function VendedorLayout() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const navigate = useNavigate();
  const usuario = getAdminUser() || { nombre: 'Vendedor TERRA', email: '' };
  const salir = () => { cerrarSesionAdmin(); navigate('/', { replace: true }); };
  const menu = () => enlaces.map(({ to, label, icon: Icon, end }) => <NavLink end={end} key={to} to={to} onClick={() => setMenuAbierto(false)}><Icon size={18} /><span>{label}</span></NavLink>);
  return <div className="seller-shell">
    {menuAbierto && <button type="button" className="seller-overlay" aria-label="Cerrar menú" onClick={() => setMenuAbierto(false)} />}
    <aside className={`seller-sidebar ${menuAbierto ? 'is-open' : ''}`}>
      <header><img src="/logo-terra.png" alt="TERRA Autoservicio" /><button type="button" onClick={() => setMenuAbierto(false)} aria-label="Cerrar menú"><X size={20} /></button></header>
      <div className="seller-sidebar__title">Portal de ventas<small>Sucursal Equipetrol</small></div>
      <nav>{menu()}</nav>
      <footer><div><b>{usuario.nombre}</b><small>Vendedor autorizado</small></div><button type="button" onClick={salir}><LogOut size={16} /> Cerrar sesión</button></footer>
    </aside>
    <div className="seller-main"><header className="seller-header"><button type="button" onClick={() => setMenuAbierto(true)} aria-label="Abrir menú"><Menu size={21} /></button><div><small>Portal de ventas</small><strong>Hola, {usuario.nombre}</strong></div><span>Vendedor</span></header><main className="seller-content"><Outlet /></main></div>
  </div>;
}
