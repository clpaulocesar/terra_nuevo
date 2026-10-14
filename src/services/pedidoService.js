import { apiRequest, MODO_DEMO } from './api.js';

function exigirConexionReal() { if (MODO_DEMO) throw new Error('El modo demostración está activo. Configura VITE_MODO_DEMO=false.'); }

export async function crearPedido({ clienteId = null, items }) {
  exigirConexionReal();
  return apiRequest('/pedidos', { method: 'POST', body: { clienteId, items: items.map(item => ({ productoId: Number(item.productoId), cantidad: Number(item.cantidad) })) } });
}

export async function obtenerPedido(id) { exigirConexionReal(); return apiRequest(`/pedidos/${id}`); }
