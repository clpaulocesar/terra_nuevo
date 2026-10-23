import { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { cerrarSesionAdmin, getAdminExpiracion, getAdminToken, getAdminUser } from '../../services/adminService.js';

const MAX_TIMEOUT_MS = 2 ** 31 - 1;

export default function RutaAdmin({ children, roles }) {
  const navigate = useNavigate();
  const token = getAdminToken();
  const expira = getAdminExpiracion();

  // Al vencer el token (8 h) se limpia la sesión guardada y se vuelve al login,
  // aunque la pantalla haya quedado abierta sin navegar.
  useEffect(() => {
    if (!token || !expira) return undefined;
    const temporizador = window.setTimeout(() => {
      cerrarSesionAdmin();
      navigate('/admin/login', { replace: true });
    }, Math.min(Math.max(0, expira - Date.now()), MAX_TIMEOUT_MS));
    return () => window.clearTimeout(temporizador);
  }, [token, expira, navigate]);

  if (!token) return <Navigate to="/admin/login" replace />;
  const usuario = getAdminUser();
  const inicio = usuario?.rol === 'despacho' ? '/admin/despacho' : '/admin';
  if (Array.isArray(roles) && !roles.includes(usuario?.rol)) return <Navigate to={inicio} replace />;
  return children;
}
