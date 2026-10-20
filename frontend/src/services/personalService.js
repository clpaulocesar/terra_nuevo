import { apiRequest } from './api.js';
import { getAdminToken } from './adminService.js';

function encabezadoAdmin() {
  const token = getAdminToken();
  if (!token) throw new Error('Inicia sesión como administrador.');
  return { Authorization: `Bearer ${token}` };
}

export function listarPersonal() {
  return apiRequest('/personal', { headers: encabezadoAdmin() });
}

export function crearPersonal(datos) {
  return apiRequest('/personal', {
    method: 'POST',
    headers: encabezadoAdmin(),
    body: datos,
  });
}
