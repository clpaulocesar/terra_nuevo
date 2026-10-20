import { API_URL, apiRequest, MODO_DEMO } from './api.js';

export function normalizarProducto(producto) {
  const precio = Number(producto.precio || 0);
  const precioMayorista = producto.precio_mayorista === null || producto.precio_mayorista === undefined || producto.precio_mayorista === '' ? null : Number(producto.precio_mayorista);
  const showroom = Number(producto.showroom ?? producto.stock ?? 0);
  const imagenes = Array.isArray(producto.imagenes) && producto.imagenes.length ? producto.imagenes : (producto.imagen_url ? [producto.imagen_url] : []);
  return {
    ...producto,
    id: producto.id,
    sku: producto.sku || `TRR-${producto.id}`,
    precio,
    precioMayorista: Number.isFinite(precioMayorista) ? precioMayorista : null,
    precioOriginal: producto.precio_original ? Number(producto.precio_original) : null,
    showroom,
    bodega: Number(producto.bodega ?? 0),
    stock: Number(producto.stock ?? showroom),
    imagenes,
    imagen_url: imagenes[0] || null,
    video_url: producto.video_url ? String(producto.video_url).trim() : null,
    visible: producto.activo !== false,
    activo: producto.activo !== false,
    detalle: producto.detalle || producto.medida || '',
    descripcion: producto.descripcion || '',
    categoria: producto.categoria || 'Sin categoría',
    ventas: Number(producto.ventas || 0),
    promocion: Boolean(producto.promocion)
  };
}
function exigirConexionReal() { if (MODO_DEMO) throw new Error('El modo demostración está activo. Configura VITE_MODO_DEMO=false para usar PostgreSQL.'); }
<<<<<<< Updated upstream
function construirQueryProductos({ buscar = '', categoria = '', pagina = 1, limite = 100, todos = false, orden = '' } = {}) {
  const p = new URLSearchParams({ pagina, limite });
  if (buscar) p.set('buscar', buscar);
  if (categoria && categoria !== 'Todos') p.set('categoria', categoria);
  if (orden) p.set('orden', orden);
  if (todos) p.set('todos', 'true');
  return p;
}

export async function listarProductos({ signal, ...filtros } = {}) {
  exigirConexionReal();
  const r = await apiRequest(`/productos?${construirQueryProductos(filtros)}`, { signal });
  return (Array.isArray(r) ? r : r?.data || []).map(normalizarProducto);
}

// Igual que listarProductos pero conserva la metadata de paginación que devuelve el backend.
// apiRequest desenvuelve `data`, así que aquí se hace el fetch completo para leer `paginacion`.
export async function listarProductosPaginado({ signal, ...filtros } = {}) {
  exigirConexionReal();
  let respuesta;
  try {
    respuesta = await fetch(`${API_URL}/productos?${construirQueryProductos(filtros)}`, { signal, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('No se pudo conectar al backend. Comprueba que esté encendido.');
  }
  const datos = await respuesta.json().catch(() => null);
  if (!respuesta.ok || datos?.success === false) throw new Error(datos?.mensaje || `Error HTTP ${respuesta.status}`);
  const lista = Array.isArray(datos) ? datos : datos?.data || [];
  const limite = Number(datos?.paginacion?.limite ?? filtros.limite ?? 100);
  const pagina = Number(datos?.paginacion?.pagina ?? filtros.pagina ?? 1);
  // Un backend anterior no manda `total`: en ese caso queda en null y la
  // paginación avanza "a ciegas" mientras la página venga completa.
  const totalCrudo = datos?.paginacion?.total;
  const total = totalCrudo === undefined || totalCrudo === null ? null : Number(totalCrudo);
  const totalPaginas = total === null
    ? null
    : Number(datos?.paginacion?.totalPaginas ?? Math.max(1, Math.ceil(total / limite)));
  const tieneSiguiente = typeof datos?.paginacion?.tieneSiguiente === 'boolean'
    ? datos.paginacion.tieneSiguiente
    : (totalPaginas === null ? lista.length >= limite : pagina < totalPaginas);
  return {
    productos: lista.map(normalizarProducto),
    paginacion: { pagina, limite, total, totalPaginas, tieneSiguiente },
  };
=======
export async function listarProductos({ buscar = '', categoria = '', pagina = 1, limite = 100, todos = false, signal } = {}) {
  exigirConexionReal();
  const p = new URLSearchParams({ pagina, limite });
  if (buscar) p.set('buscar', buscar);
  if (categoria && categoria !== 'Todos') p.set('categoria', categoria);
  if (todos) p.set('todos', 'true');
  const r = await apiRequest(`/productos?${p}`, { signal });
  return (Array.isArray(r) ? r : r?.data || []).map(normalizarProducto);
}

// Listado paginado del catálogo (caja administrativa): trae el sobre completo
// para conocer el total de referencias y calcular las páginas en el servidor.
export async function listarProductosPaginado({
  buscar = '',
  categoria = '',
  pagina = 1,
  limite = 18,
  todos = false,
  orden = 'recomendados',
  promos = false,
  stock = false,
  precioMin = null,
  precioMax = null,
  signal,
} = {}) {
  exigirConexionReal();
  const p = new URLSearchParams({ pagina: String(pagina), limite: String(limite), orden });
  if (buscar) p.set('buscar', buscar);
  if (categoria && categoria !== 'Todos') p.set('categoria', categoria);
  if (todos) p.set('todos', 'true');
  if (promos) p.set('promos', 'true');
  if (stock) p.set('stock', 'true');
  if (Number.isFinite(Number(precioMin)) && precioMin !== null && precioMin !== '') p.set('precioMin', String(precioMin));
  if (Number.isFinite(Number(precioMax)) && precioMax !== null && precioMax !== '') p.set('precioMax', String(precioMax));
  const r = await apiRequest(`/productos?${p}`, { signal, raw: true });
  const productos = (Array.isArray(r?.data) ? r.data : []).map(normalizarProducto);
  const paginacion = r?.paginacion || { pagina: 1, limite, total: productos.length, totalPaginas: 1 };
  return { productos, paginacion };
>>>>>>> Stashed changes
}
export async function obtenerProducto(id) { exigirConexionReal(); return normalizarProducto(await apiRequest(`/productos/${id}`)); }
export async function crearProducto(datos) { exigirConexionReal(); return normalizarProducto(await apiRequest('/productos', { method: 'POST', body: datos })); }
export async function actualizarProducto(id, datos) { exigirConexionReal(); return normalizarProducto(await apiRequest(`/productos/${id}`, { method: 'PUT', body: datos })); }
export async function actualizarStock(id, datos) { exigirConexionReal(); return normalizarProducto(await apiRequest(`/productos/${id}/stock`, { method: 'PATCH', body: datos })); }
export async function eliminarProducto(id) { exigirConexionReal(); return apiRequest(`/productos/${id}`, { method: 'DELETE' }); }
export async function listarCategorias({ signal } = {}) { try { const r = await apiRequest('/categorias', { signal }); return Array.isArray(r) ? r : r?.data || []; } catch { return []; } }
export async function crearCategoria(datos) { exigirConexionReal(); return apiRequest('/categorias', { method: 'POST', body: datos }); }
export async function actualizarCategoria(id, datos) { exigirConexionReal(); return apiRequest(`/categorias/${id}`, { method: 'PUT', body: datos }); }
export async function eliminarCategoria(id) { exigirConexionReal(); return apiRequest(`/categorias/${id}`, { method: 'DELETE' }); }
