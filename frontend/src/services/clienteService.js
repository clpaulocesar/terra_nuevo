import { apiRequest, MODO_DEMO } from './api.js';
import { getAdminToken } from './adminService.js';

function exigirConexionReal() { if (MODO_DEMO) throw new Error('El modo demostración está activo. Configura VITE_MODO_DEMO=false.'); }
export async function crearCliente(datos) { exigirConexionReal(); return apiRequest('/clientes', { method: 'POST', body: datos }); }
export async function obtenerCliente(id) { exigirConexionReal(); return apiRequest(`/clientes/${id}`); }
export async function eliminarCliente(id) { exigirConexionReal(); return apiRequest(`/clientes/${id}`, { method: 'DELETE' }); }
export async function listarClientes({ buscar = '', limite = 100 } = {}) { exigirConexionReal(); return apiRequest(`/clientes?buscar=${encodeURIComponent(buscar)}&limite=${limite}`); }
// Asigna o resetea la clave de un cliente mayorista (solo administrador).
export async function asignarClaveMayorista(id, password) {
  exigirConexionReal();
  const token = getAdminToken();
  if (!token) throw new Error('Inicia sesión nuevamente como administrador.');
  return apiRequest(`/clientes/${id}/clave`, {
    method: 'PATCH', body: { password }, headers: { Authorization: `Bearer ${token}` }, raw: true,
  });
}
export async function crearUsuarioMayorista(datos) {
  exigirConexionReal();
  const token = getAdminToken();
  if (!token) throw new Error('Inicia sesión nuevamente como administrador.');
  return apiRequest('/clientes/mayoristas', {
    method: 'POST', body: datos, headers: { Authorization: `Bearer ${token}` },
  });
}
