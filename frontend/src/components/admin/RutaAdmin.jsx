import { Navigate } from 'react-router-dom';
import { getAdminToken, getAdminUser } from '../../services/adminService.js';

export default function RutaAdmin({ children, roles }) {
  if (!getAdminToken()) return <Navigate to="/admin/login" replace />;
  if (Array.isArray(roles) && !roles.includes(getAdminUser()?.rol)) return <Navigate to="/admin" replace />;
  return children;
}
