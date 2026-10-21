import { apiRequest, MODO_DEMO } from './api.js';

export function normalizarProducto(producto) {
  const precio = Number(producto.precio || 0);
  const precioMayorista = producto.precio_mayorista === null || producto.precio_mayorista === undefined || producto.precio_mayorista === '' ? null : Number(producto.precio_mayorista);
  const showroom = Number(producto.showroom ?? producto.stock ?? 0);
  const imagenes = Array.isArray(producto.imagenes) && producto.imagenes.length ? producto.imagenes : (producto.imagen_url ? [producto.imagen_url] : []);
  const escalasMayorista = Array.isArray(producto.escalas_mayorista) ? producto.escalas_mayorista
    .map((escala) => ({ minCantidad: Number(escala.minCantidad), precio: Number(escala.precio) }))
    .filter((escala) => Number.isSafeInteger(escala.minCantidad) && escala.minCantidad > 0 && Number.isFinite(escala.precio))
    .sort((a, b) => a.minCantidad - b.minCantidad) : [];
  return {
    ...producto,
    id: producto.id,
    sku: producto.sku || `TRR-${producto.id}`,
    precio,
    precioMayorista: Number.isFinite(precioMayorista) ? precioMayorista : null,
    escalasMayorista,
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
function construirQueryProductos({
  buscar = '',
  categoria = '',
  pagina = 1,
  limite = 100,
  todos = false,
  orden = '',
  promos = false,
  stock = false,
  precioMin = null,
  precioMax = null,
} = {}) {
  // El backend en produccion valida limite <= 200. Se normaliza a un maximo de 200 para evitar error 400.
  const limiteNormalizado = Math.min(Math.max(1, Number(limite) || 100), 200);
  const p = new URLSearchParams({ pagina: String(pagina), limite: String(limiteNormalizado) });
  if (buscar) p.set('buscar', buscar);
  if (categoria && categoria !== 'Todos' && categoria !== 'Todas') p.set('categoria', categoria);
  if (orden) p.set('orden', orden);
  if (todos) p.set('todos', 'true');
  if (promos) p.set('promos', 'true');
  if (stock) p.set('stock', 'true');
  if (precioMin !== null && precioMin !== '' && Number.isFinite(Number(precioMin))) p.set('precioMin', String(precioMin));
  if (precioMax !== null && precioMax !== '' && Number.isFinite(Number(precioMax))) p.set('precioMax', String(precioMax));
  return p;
}

export async function listarProductos({ signal, ...filtros } = {}) {
  exigirConexionReal();
  const r = await apiRequest(`/productos?${construirQueryProductos(filtros)}`, { signal });
  return (Array.isArray(r) ? r : r?.data || []).map(normalizarProducto);
}

// Igual que listarProductos pero conserva la metadata de paginación que devuelve el backend.
// apiRequest con `raw` devuelve el sobre completo (`data` + `paginacion`).
export async function listarProductosPaginado({ signal, ...filtros } = {}) {
  exigirConexionReal();
  const datos = await apiRequest(`/productos?${construirQueryProductos(filtros)}`, { signal, raw: true });
  const lista = Array.isArray(datos) ? datos : datos?.data || [];
  const limite = Number(datos?.paginacion?.limite ?? filtros.limite ?? 18);
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
}
export async function obtenerProducto(id) { exigirConexionReal(); return normalizarProducto(await apiRequest(`/productos/${id}`)); }
export async function crearProducto(datos) { exigirConexionReal(); return normalizarProducto(await apiRequest('/productos', { method: 'POST', body: datos })); }
export async function actualizarProducto(id, datos) { exigirConexionReal(); return normalizarProducto(await apiRequest(`/productos/${id}`, { method: 'PUT', body: datos })); }
export async function actualizarStock(id, datos) { exigirConexionReal(); return normalizarProducto(await apiRequest(`/productos/${id}/stock`, { method: 'PATCH', body: datos })); }
export async function cambiarVisibilidadProducto(id, activo) {
  exigirConexionReal();
  try {
    const res = await apiRequest(`/productos/${id}/visibilidad`, {
      method: 'PATCH',
      body: { activo: Boolean(activo) },
    });
    const data = res?.data || res;
    return normalizarProducto(data);
  } catch (err) {
    if (err.message?.includes('Ruta no encontrada') || err.message?.includes('404')) {
      const resFallback = await apiRequest(`/productos/${id}`, {
        method: 'PUT',
        body: { activo: Boolean(activo) },
      });
      const dataFallback = resFallback?.data || resFallback;
      return normalizarProducto(dataFallback);
    }
    throw err;
  }
}
export async function eliminarProducto(id) { exigirConexionReal(); return apiRequest(`/productos/${id}`, { method: 'DELETE' }); }
// `todas: true` incluye las categorías sin productos (uso del backoffice); el catálogo público solo recibe las que tienen productos activos.
export async function listarCategorias({ signal, todas = false } = {}) { try { const r = await apiRequest(todas ? '/categorias?todas=1' : '/categorias', { signal }); return Array.isArray(r) ? r : r?.data || []; } catch { return []; } }
export async function crearCategoria(datos) { exigirConexionReal(); return apiRequest('/categorias', { method: 'POST', body: datos }); }
export async function actualizarCategoria(id, datos) { exigirConexionReal(); return apiRequest(`/categorias/${id}`, { method: 'PUT', body: datos }); }
export async function eliminarCategoria(id) { exigirConexionReal(); return apiRequest(`/categorias/${id}`, { method: 'DELETE' }); }
