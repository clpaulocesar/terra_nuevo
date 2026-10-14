import { API_URL } from './api.js';

const TOKEN_KEY = 'terra_admin_token';

export function getAdminToken() { return sessionStorage.getItem(TOKEN_KEY); }
export function cerrarSesionAdmin() { sessionStorage.removeItem(TOKEN_KEY); }

export async function iniciarSesionAdmin(email, password) {
  const respuesta = await fetch(`${API_URL}/admin/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }),
  });
  const datos = await respuesta.json().catch(() => null);
  if (!respuesta.ok) throw new Error(datos?.mensaje || 'No se pudo iniciar sesión');
  sessionStorage.setItem(TOKEN_KEY, datos.data.token);
  return datos.data.usuario;
}
