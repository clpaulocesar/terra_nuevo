import { apiRequest, MODO_DEMO } from './api.js';
import { getAdminToken } from './adminService.js';

function exigirConexionReal() { if (MODO_DEMO) throw new Error('El modo demostración está activo. Configura VITE_MODO_DEMO=false.'); }

export async function crearPedido({ clienteId = null, items, token = null, entregaDomicilio = false }) {
  exigirConexionReal();
  return apiRequest('/pedidos', { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: { clienteId, entregaDomicilio: Boolean(entregaDomicilio), items: items.map(item => ({ productoId: String(item.productoId), cantidad: Number(item.cantidad), color: String(item.color || '').trim() || null })) } });
}
export async function crearVentaDirecta({ clienteId = null, items, metodoPago, tipoMayoristaManual = false }) {
  exigirConexionReal();
  const token = sessionStorage.getItem('terra_admin_token');
  if (!token) throw new Error('Inicia sesión nuevamente como administrador.');
  return apiRequest('/pedidos/venta-directa', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: { clienteId, items, metodoPago, tipoMayoristaManual } });
}
export async function obtenerPedido(id) { exigirConexionReal(); return apiRequest(`/pedidos/${id}`); }
export async function listarPedidos({ buscar = '', estado = '', entrega = '', limite = 100 } = {}) {
  exigirConexionReal();
  // El listado incluye el teléfono/NIT del cliente para ubicar el pedido en caja,
  // por eso el backend exige sesión de backoffice (admin, vendedor o despacho).
  const token = getAdminToken();
  return apiRequest(`/pedidos?buscar=${encodeURIComponent(buscar)}&estado=${encodeURIComponent(estado)}&entrega=${encodeURIComponent(entrega)}&limite=${limite}`, {
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
export async function actualizarEstadoPedido(id, estado) {
  exigirConexionReal();
  const token = getAdminToken();
  if (!token) throw new Error('Inicia sesión nuevamente para actualizar el pedido.');
  return apiRequest(`/pedidos/${id}/estado`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: { estado },
  });
}
export async function actualizarEntregaPedido(id, etapa) {
  exigirConexionReal();
  const token = getAdminToken();
  if (!token) throw new Error('Inicia sesión nuevamente para actualizar el envío.');
  return apiRequest(`/pedidos/${id}/entrega`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: { etapa },
  });
}
// Asigna (o quita con repartidorId = null) el repartidor de un envío.
export async function asignarRepartidorPedido(id, repartidorId = null) {
  exigirConexionReal();
  const token = getAdminToken();
  if (!token) throw new Error('Inicia sesión nuevamente para asignar el envío.');
  return apiRequest(`/pedidos/${id}/repartidor`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: { repartidorId },
  });
}
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

