import { apiRequest, MODO_DEMO } from './api.js';

export function normalizarProducto(producto) {
  const precio = Number(producto.precio || 0);
  const precioOriginal = producto.precio_original ? Number(producto.precio_original) : null;
  const showroom = Number(producto.showroom ?? producto.stock ?? 0);
  const bodega = Number(producto.bodega ?? 0);
  const imagenes = Array.isArray(producto.imagenes) && producto.imagenes.length > 0 ? producto.imagenes : (producto.imagen_url ? [producto.imagen_url] : []);
  return { ...producto, id: Number(producto.id), sku: producto.sku || `TRR-${producto.id}`, precio, precioOriginal, showroom, bodega, stock: Number(producto.stock ?? showroom + bodega), imagenes, imagen_url: imagenes[0] || null, visible: producto.activo !== false, activo: producto.activo !== false, detalle: producto.detalle || producto.medida || '', descripcion: producto.descripcion || '', categoria: producto.categoria || 'Sin categoría' };
}

function exigirConexionReal() { if (MODO_DEMO) throw new Error('El modo demostración está activo. Configura VITE_MODO_DEMO=false para usar PostgreSQL.'); }

export async function listarProductos({ buscar = '', categoria = '', pagina = 1, limite = 100, todos = false, signal } = {}) {
  exigirConexionReal();
  const parametros = new URLSearchParams({ pagina, limite });
  if (buscar) parametros.set('buscar', buscar);
  if (categoria && categoria !== 'Todos') parametros.set('categoria', categoria);
  if (todos) parametros.set('todos', 'true');
  const respuesta = await apiRequest(`/productos?${parametros}`, { signal });
  const lista = Array.isArray(respuesta) ? respuesta : (respuesta?.data || []);
  return lista.map(normalizarProducto);
}

export async function obtenerProducto(id) { exigirConexionReal(); return normalizarProducto(await apiRequest(`/productos/${id}`)); }
export async function crearProducto(datos) { exigirConexionReal(); return normalizarProducto(await apiRequest('/productos', { method: 'POST', body: datos })); }
export async function actualizarProducto(id, datos) { exigirConexionReal(); return normalizarProducto(await apiRequest(`/productos/${id}`, { method: 'PUT', body: datos })); }
export async function actualizarStock(id, datos) { exigirConexionReal(); return normalizarProducto(await apiRequest(`/productos/${id}/stock`, { method: 'PATCH', body: datos })); }
export async function eliminarProducto(id) { exigirConexionReal(); return apiRequest(`/productos/${id}`, { method: 'DELETE' }); }
