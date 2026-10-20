import { API_URL } from './api.js';

const TOKEN_KEY = 'terra_admin_token';
const USER_KEY = 'terra_admin_user';

export function getAdminToken() { return sessionStorage.getItem(TOKEN_KEY); }
export function getAdminUser() {
  try {
    const raw = sessionStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
export function cerrarSesionAdmin() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}

export async function iniciarSesionAdmin(email, password) {
  const respuesta = await fetch(`${API_URL}/admin/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }),
  });
  const datos = await respuesta.json().catch(() => null);
  if (!respuesta.ok) throw new Error(datos?.mensaje || 'No se pudo iniciar sesión');
  sessionStorage.setItem(TOKEN_KEY, datos.data.token);
  if (datos.data?.usuario) {
    sessionStorage.setItem(USER_KEY, JSON.stringify(datos.data.usuario));
  }
  return datos.data.usuario;
}

