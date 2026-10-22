import { Navigate } from 'react-router-dom';
import { getAdminToken, getAdminUser } from '../../services/adminService.js';

export default function RutaAdmin({ children, roles }) {
  if (!getAdminToken()) return <Navigate to="/admin/login" replace />;
  const usuario = getAdminUser();
  const inicio = usuario?.rol === 'despacho' ? '/admin/despacho' : '/admin';
  if (Array.isArray(roles) && !roles.includes(usuario?.rol)) return <Navigate to={inicio} replace />;
  return children;
}
