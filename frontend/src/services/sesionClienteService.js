import { apiRequest } from './api.js';

// Login mayorista contra el backend propio. Devuelve el perfil más `token` y
// `expira` (ms), que "Recordar mi sesión" usa para respetar el vencimiento.
export async function iniciarSesionCliente(email, password) {
  const sesion = await apiRequest('/clientes/auth/login', {
    method: 'POST',
    body: { email: String(email || '').trim(), password: String(password || '') },
  });
  if (!sesion?.token) throw new Error('No se pudo iniciar sesión.');
  return sesion;
}

export async function actualizarPerfilMayorista(token, datos) {
  if (!token) throw new Error('Inicia sesión como mayorista.');
  return apiRequest('/clientes/perfil', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: datos,
  });
}

export async function listarMisPedidosMayorista(token) {
  if (!token) throw new Error('Inicia sesión como mayorista.');
  return apiRequest('/clientes/mis-pedidos', { headers: { Authorization: `Bearer ${token}` } });
}

export async function obtenerMiPedidoMayorista(token, pedidoId) {
  if (!token) throw new Error('Inicia sesión como mayorista.');
  return apiRequest(`/clientes/mis-pedidos/${encodeURIComponent(pedidoId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}
