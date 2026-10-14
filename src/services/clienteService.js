import { apiRequest, MODO_DEMO } from './api.js';
function exigirConexionReal() { if (MODO_DEMO) throw new Error('El modo demostración está activo. Configura VITE_MODO_DEMO=false.'); }
export async function crearCliente(datos) { exigirConexionReal(); return apiRequest('/clientes', { method: 'POST', body: datos }); }
export async function obtenerCliente(id) { exigirConexionReal(); return apiRequest(`/clientes/${id}`); }
