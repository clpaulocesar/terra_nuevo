import { apiRequest } from './api.js';
import { CATEGORY_PILLS } from '../data/catalogoData.js';

export function normalizarProducto(producto) {
  if (!producto) return null;
  const precio = Number(producto.precio || 0);
  const precioLista = Number(producto.precio_lista ?? producto.precioLista ?? precio);
  const enOferta = producto.en_oferta === true || producto.enOferta === true;
  const tieneDescuento = enOferta && precioLista > precio;
  const descuento = tieneDescuento ? `-${Math.round(((precioLista - precio) / precioLista) * 100)}%` : null;
  const masVendido = Boolean(
    producto.mas_vendido ||
    producto.masVendido ||
    producto.mas_vendido_scz ||
    Number(producto.ventas || 0) > 0 ||
    producto.badge === 'MÁS VENDIDO' ||
    producto.badge === 'MÁS VENDIDO SCZ'
  );

  // Normalizar imágenes reales
  let imagenes = [];
  if (Array.isArray(producto.imagenes) && producto.imagenes.length) {
    imagenes = producto.imagenes;
  } else if (Array.isArray(producto.image_urls) && producto.image_urls.length) {
    imagenes = producto.image_urls;
  } else if (producto.imagen_url) {
    imagenes = [producto.imagen_url];
  } else if (producto.imagen) {
    imagenes = [producto.imagen];
  } else if (producto.src) {
    imagenes = [producto.src];
  }

  const imagenPrincipal = imagenes[0] || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80';

  // Normalizar colores
  let colores = [];
  if (Array.isArray(producto.colores) && producto.colores.length) {
    colores = producto.colores.map((c, i) => {
      if (typeof c === 'string') {
        return {
          id: `c_${i}`,
          nombre: c.startsWith('#') ? `Color ${i + 1}` : c,
          valor: c.startsWith('#') ? c : '#c8b6a6',
        };
      }
      return {
        id: c.id || `c_${i}`,
        nombre: c.nombre || c.name || `Color ${i + 1}`,
        valor: c.valor || c.hex || '#c8b6a6',
      };
    });
  }

  const stockReal = Number(producto.stock ?? producto.stock_quantity ?? 0);
  const sucursales = Array.isArray(producto.sucursales) ? producto.sucursales : [];

  return {
    id: producto.id,
    sku: producto.sku || producto.codigo_terra || producto.codigo_interno || producto.codigo || `TR-${producto.id}`,
    codigoTerra: producto.codigo_terra || null,
    codigoInterno: producto.codigo_interno || null,
    nombre: producto.nombre || producto.name || 'Producto TERRA',
    descripcion: producto.descripcion || producto.description || '',
    marca: producto.marca || 'TERRA Confort & Hogar',
    categoria: producto.categoria || producto.category || 'Muebles & Descanso',
    categoriaKey: (producto.categoria || producto.category || 'todas').toLowerCase().replace(/\s+/g, '-'),
    sublinea: producto.sublinea || producto.linea || producto.marca || 'Línea Exclusiva TERRA',
    precio,
    precioLista,
    precioOriginal: tieneDescuento ? precioLista : null,
    descuento,
    enOferta,
    masVendido,
    stock: stockReal,
    sucursales,
    disponible: stockReal > 0,
    disponibilidadTexto: producto.disponibilidadTexto || (sucursales.length ? `En ${sucursales.filter((s) => Number(s.stock) > 0).length || 3} Salas` : 'En 3 Salas'),
    imagenes: imagenes.length ? imagenes : [imagenPrincipal],
    imagen: imagenPrincipal,
    src: imagenPrincipal,
    videoUrl: producto.video_url || producto.videoUrl || producto.video || null,
    videos: [producto.video_url, ...(Array.isArray(producto.instrucciones_video) ? producto.instrucciones_video : [])].filter(Boolean),
    imagenes360: Array.isArray(producto.imagenes_360) ? producto.imagenes_360 : (Array.isArray(producto.spin360) ? producto.spin360 : []),
    colores: colores.length ? colores : [{ id: 'c1', nombre: 'Arena', valor: '#d6c8b2' }, { id: 'c2', nombre: 'Gris', valor: '#54595f' }, { id: 'c3', nombre: 'Vino', valor: '#8b001a' }],
    plazas: producto.plazas || producto.medida || producto.size || 'Estándar',
    firmeza: producto.firmeza || 'Confort Certificado',
    calidad: producto.calidad || '★★★★★ (4.9)',
    cuotasTag: null,
    badge: producto.badge || null,
    badgeClass: producto.badgeClass || (tieneDescuento ? 'bg-primary text-on-primary' : 'bg-surface-container-highest text-on-surface'),
  };
}

export async function listarProductos({
  buscar = '',
  categoria = '',
  orden = 'recomendados',
  pagina = 1,
  limite = 50,
  promos = false,
  ofertas = false,
  precioMin = null,
  precioMax = null,
  signal,
} = {}) {
  const query = new URLSearchParams();
  if (buscar) query.set('buscar', buscar);
  if (categoria && categoria !== 'todas') query.set('categoria', categoria);
  if (orden) query.set('orden', orden);
  if (pagina) query.set('pagina', String(pagina));
  if (limite) query.set('limite', String(limite));
  if (promos) query.set('promos', 'true');
  if (ofertas) query.set('ofertas', 'true');
  if (precioMin !== null && precioMin !== '' && Number.isFinite(Number(precioMin))) query.set('precioMin', String(precioMin));
  if (precioMax !== null && precioMax !== '' && Number.isFinite(Number(precioMax))) query.set('precioMax', String(precioMax));

  try {
    const res = await apiRequest(`/productos?${query.toString()}`, { signal, raw: true });
    if (res?.success && Array.isArray(res?.data)) {
      return {
        productos: res.data.map(normalizarProducto),
        paginacion: res.paginacion || { total: res.data.length, pagina: 1, totalPaginas: 1 },
      };
    }
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    console.warn('Backend /productos no disponible:', err.message);
  }

  return {
    productos: [],
    paginacion: { total: 0, pagina: 1, totalPaginas: 1 },
  };
}

export async function listarProductosDestacados(signal) {
  try {
    const res = await apiRequest('/productos?limite=24&orden=recomendados', { signal, raw: true });
    if (res?.success && Array.isArray(res?.data)) {
      return res.data.map(normalizarProducto);
    }
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    console.warn('Backend /productos destacados no disponible:', err.message);
  }
  return [];
}

export async function obtenerProducto(id, signal) {
  try {
    const data = await apiRequest(`/productos/${id}`, { signal });
    if (data) return normalizarProducto(data);
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    console.warn(`Backend /productos/${id} no disponible:`, err.message);
  }
  return null;
}

export async function obtenerCategorias(signal) {
  try {
    const res = await apiRequest('/categorias', { signal });
    if (Array.isArray(res) && res.length) {
      return [
        { id: 'todas', nombre: 'Ver Todo', key: 'todas', icono: 'apps', total: 0 },
        ...res.map((cat) => ({
          id: cat.nombre || cat.name || cat.id,
          nombre: cat.nombre || cat.name,
          key: cat.nombre || cat.name || String(cat.id),
          total: Number(cat.total || cat.total_productos || 0),
          icono: cat.icon || 'category',
        })),
      ];
    }
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    console.warn('Backend /categorias no disponible, usando reserva:', err.message);
  }
  return CATEGORY_PILLS.map((c) => ({
    id: c.id,
    nombre: c.label,
    key: c.id,
    icono: c.icon,
    total: 0,
  }));
}
