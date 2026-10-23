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

// Repartidores (rol despacho) con su vehículo y placa.
export function listarRepartidores() {
  return apiRequest('/personal/repartidores', { headers: encabezadoAdmin() });
}

export function crearPersonal(datos) {
  return apiRequest('/personal', {
    method: 'POST',
    headers: encabezadoAdmin(),
    body: datos,
  });
}

export function actualizarPersonal(id, datos) {
  return apiRequest(`/personal/${id}`, {
    method: 'PATCH',
    headers: encabezadoAdmin(),
    body: datos,
  });
}

export function eliminarPersonal(id) {
  return apiRequest(`/personal/${id}`, {
    method: 'DELETE',
    headers: encabezadoAdmin(),
  });
}
