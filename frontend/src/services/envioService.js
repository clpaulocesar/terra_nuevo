import { apiRequest, MODO_DEMO } from './api.js';
import { getAdminToken } from './adminService.js';

export async function listarTarifasEnvio() {
  if (MODO_DEMO) return [];
  return apiRequest('/envios/tarifas');
}

function encabezadoAdmin() {
  const token = getAdminToken();
  if (!token) throw new Error('Iniciá sesión nuevamente como administrador.');
  return { Authorization: `Bearer ${token}` };
}

export async function listarTarifasEnvioAdmin() {
  return apiRequest('/envios/tarifas/admin', { headers: encabezadoAdmin() });
}

export async function crearTarifaEnvio(datos) {
  return apiRequest('/envios/tarifas', { method: 'POST', headers: encabezadoAdmin(), body: datos });
}

export async function actualizarTarifaEnvio(id, datos) {
  return apiRequest(`/envios/tarifas/${id}`, { method: 'PUT', headers: encabezadoAdmin(), body: datos });
}

export async function eliminarTarifaEnvio(id) {
  return apiRequest(`/envios/tarifas/${id}`, { method: 'DELETE', headers: encabezadoAdmin() });
}
