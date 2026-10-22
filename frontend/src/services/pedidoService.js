import { apiRequest, MODO_DEMO } from './api.js';
import { getAdminToken } from './adminService.js';

function exigirConexionReal() { if (MODO_DEMO) throw new Error('El modo demostración está activo. Configura VITE_MODO_DEMO=false.'); }

export async function crearPedido({ clienteId = null, items, token = null }) {
  exigirConexionReal();
  return apiRequest('/pedidos', { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: { clienteId, items: items.map(item => ({ productoId: String(item.productoId), cantidad: Number(item.cantidad), color: String(item.color || '').trim() || null })) } });
}
export async function crearVentaDirecta({ clienteId = null, items, metodoPago, tipoMayoristaManual = false }) {
  exigirConexionReal();
  const token = sessionStorage.getItem('terra_admin_token');
  if (!token) throw new Error('Inicia sesión nuevamente como administrador.');
  return apiRequest('/pedidos/venta-directa', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: { clienteId, items, metodoPago, tipoMayoristaManual } });
}

export async function obtenerPedido(id) { exigirConexionReal(); return apiRequest(`/pedidos/${id}`); }
export async function listarPedidos({ buscar = '', estado = '', limite = 100 } = {}) {
  exigirConexionReal();
  // El listado incluye el teléfono/NIT del cliente para ubicar el pedido en caja,
  // por eso el backend exige sesión de backoffice (admin, vendedor o despacho).
  const token = getAdminToken();
  return apiRequest(`/pedidos?buscar=${encodeURIComponent(buscar)}&estado=${encodeURIComponent(estado)}&limite=${limite}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}
export async function obtenerAnaliticaHoraria({ desde, hasta, horaInicio, horaFin } = {}) {
  exigirConexionReal();
  const parametros = new URLSearchParams();
  if (desde) parametros.set('desde', desde);
  if (hasta) parametros.set('hasta', hasta);
  if (horaInicio !== undefined && horaInicio !== null) parametros.set('horaInicio', String(horaInicio));
  if (horaFin !== undefined && horaFin !== null) parametros.set('horaFin', String(horaFin));
  const token = getAdminToken();
  return apiRequest(`/pedidos/analitica-horaria?${parametros}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
}
// Totales de un rango de fechas (YYYY-MM-DD, zona La Paz) para los KPI del dashboard.
export async function obtenerResumenPedidos({ desde, hasta } = {}) {
  exigirConexionReal();
  const parametros = new URLSearchParams();
  if (desde) parametros.set('desde', desde);
  if (hasta) parametros.set('hasta', hasta);
  const token = getAdminToken();
  return apiRequest(`/pedidos/resumen?${parametros}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
}
// Comparativa de períodos: periodo = dia | semana | mes | personalizado (con desde/hasta y desde2/hasta2).
export async function obtenerComparativaPeriodos({ periodo = 'dia', desde, hasta, desde2, hasta2 } = {}) {
  exigirConexionReal();
  const parametros = new URLSearchParams({ periodo });
  if (periodo === 'personalizado') { parametros.set('desde', desde); parametros.set('hasta', hasta); parametros.set('desde2', desde2); parametros.set('hasta2', hasta2); }
  const token = getAdminToken();
  return apiRequest(`/pedidos/comparativa?${parametros}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
}
export async function actualizarEstadoPedido(id, estado) { exigirConexionReal(); return apiRequest(`/pedidos/${id}/estado`, { method: 'PATCH', body: { estado } }); }
export async function registrarPagoPedido(id, { metodoPago, comprobanteUrl = null }) { exigirConexionReal(); return apiRequest(`/pedidos/${id}/pago`, { method: 'PATCH', body: { metodoPago, comprobanteUrl } }); }
export async function actualizarItemsPedido(id, items) {
  exigirConexionReal();
  const token = getAdminToken();
  if (!token) throw new Error('Inicia sesión nuevamente para modificar el pedido.');
  return apiRequest(`/pedidos/${id}/items`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: { items: items.map(item => ({ productoId: String(item.productoId), cantidad: Number(item.cantidad) })) },
  });
}

