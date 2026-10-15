import { apiRequest, MODO_DEMO } from './api.js';

function exigirConexionReal() { if (MODO_DEMO) throw new Error('El modo demostración está activo. Configura VITE_MODO_DEMO=false.'); }

export async function crearPedido({ clienteId = null, items }) {
  exigirConexionReal();
  return apiRequest('/pedidos', { method: 'POST', body: { clienteId, items: items.map(item => ({ productoId: String(item.productoId), cantidad: Number(item.cantidad) })) } });
}

export async function obtenerPedido(id) { exigirConexionReal(); return apiRequest(`/pedidos/${id}`); }
export async function listarPedidos({ buscar = '', estado = '', limite = 100 } = {}) { exigirConexionReal(); return apiRequest(`/pedidos?buscar=${encodeURIComponent(buscar)}&estado=${encodeURIComponent(estado)}&limite=${limite}`); }
export async function actualizarEstadoPedido(id, estado) { exigirConexionReal(); return apiRequest(`/pedidos/${id}/estado`, { method: 'PATCH', body: { estado } }); }
