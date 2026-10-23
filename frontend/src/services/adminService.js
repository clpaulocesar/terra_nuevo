import { API_URL } from './api.js';

const TOKEN_KEY = 'terra_admin_token';
const USER_KEY = 'terra_admin_user';
const EXP_KEY = 'terra_admin_exp';

// Sin "Recordar sesión" la sesión vive en la pestaña (sessionStorage). Con la casilla
// marcada queda en localStorage, siempre limitada al vencimiento del token (8 h).
const almacenes = () => [sessionStorage, localStorage];

// El token es `<payload base64url>.<firma>`; el payload trae `exp` en milisegundos.
function expiracionDelToken(token) {
  try {
    const payload = String(token).split('.')[0].replace(/-/g, '+').replace(/_/g, '/');
    const json = JSON.parse(atob(payload + '='.repeat((4 - (payload.length % 4)) % 4)));
    return Number(json.exp) || 0;
  } catch {
    return 0;
  }
}

function almacenConSesion() {
  for (const almacen of almacenes()) {
    const token = almacen.getItem(TOKEN_KEY);
    if (!token) continue;
    const expira = Number(almacen.getItem(EXP_KEY)) || expiracionDelToken(token);
    if (expira && expira <= Date.now()) { cerrarSesionAdmin(); return null; }
    return almacen;
  }
  return null;
}

export function getAdminToken() { return almacenConSesion()?.getItem(TOKEN_KEY) || null; }
// Momento (ms) en que vence la sesión guardada, o 0 si no hay sesión.
export function getAdminExpiracion() {
  const almacen = almacenConSesion();
  if (!almacen) return 0;
  return Number(almacen.getItem(EXP_KEY)) || expiracionDelToken(almacen.getItem(TOKEN_KEY));
}
export function getAdminUser() {
  try {
    const raw = almacenConSesion()?.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
export function cerrarSesionAdmin() {
  for (const almacen of almacenes()) {
    almacen.removeItem(TOKEN_KEY);
    almacen.removeItem(USER_KEY);
    almacen.removeItem(EXP_KEY);
  }
}

export async function iniciarSesionAdmin(email, password, { recordar = false } = {}) {
  const respuesta = await fetch(`${API_URL}/admin/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }),
  });
  const datos = await respuesta.json().catch(() => null);
  if (!respuesta.ok) throw new Error(datos?.mensaje || 'No se pudo iniciar sesión');
  cerrarSesionAdmin();
  const almacen = recordar ? localStorage : sessionStorage;
  const token = datos.data.token;
  almacen.setItem(TOKEN_KEY, token);
  almacen.setItem(EXP_KEY, String(expiracionDelToken(token) || Date.now() + 8 * 60 * 60 * 1000));
  if (datos.data?.usuario) {
    almacen.setItem(USER_KEY, JSON.stringify(datos.data.usuario));
  }
  return datos.data.usuario;
}
