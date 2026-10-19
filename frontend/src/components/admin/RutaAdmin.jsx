import { Navigate } from 'react-router-dom';
import { getAdminToken } from '../../services/adminService.js';

export default function RutaAdmin({ children }) {
  return getAdminToken() ? children : <Navigate to="/admin/login" replace />;
}
