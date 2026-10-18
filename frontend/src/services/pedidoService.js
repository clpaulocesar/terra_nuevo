import { apiRequest, MODO_DEMO } from './api.js';

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
export async function listarPedidos({ buscar = '', estado = '', limite = 100 } = {}) { exigirConexionReal(); return apiRequest(`/pedidos?buscar=${encodeURIComponent(buscar)}&estado=${encodeURIComponent(estado)}&limite=${limite}`); }
export async function actualizarEstadoPedido(id, estado) { exigirConexionReal(); return apiRequest(`/pedidos/${id}/estado`, { method: 'PATCH', body: { estado } }); }
export async function registrarPagoPedido(id, { metodoPago, comprobanteUrl = null }) { exigirConexionReal(); return apiRequest(`/pedidos/${id}/pago`, { method: 'PATCH', body: { metodoPago, comprobanteUrl } }); }
