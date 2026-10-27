import { apiRequest } from './api.js';
import { PRODUCTOS_CATALOGO_FULL, CATEGORY_PILLS } from '../data/catalogoData.js';

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

  // Normalizar imágenes
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

  // Normalizar sucursales
  const sucursales = Array.isArray(producto.sucursales) ? producto.sucursales : [];

  // Normalizar colores
  let colores = [];
  if (Array.isArray(producto.colores)) {
    colores = producto.colores.map((c, idx) => {
      if (typeof c === 'string') {
        try {
          const parsed = JSON.parse(c);
          return {
            id: parsed.id || `col-${idx}`,
            nombre: parsed.nombre || `Variante ${idx + 1}`,
            valor: parsed.valor || '#8b001a',
            imagenes: Array.isArray(parsed.imagenes) ? parsed.imagenes : [],
          };
        } catch {
          return { id: `col-${idx}`, nombre: c, valor: '#8b001a', imagenes: [] };
        }
      }
      return c;
    });
  }

  return {
    ...producto,
    id: producto.id,
    sku: producto.sku || producto.codigo_terra || producto.codigo_interno || `TER-${producto.id}`,
    nombre: producto.nombre || producto.name || 'Producto TERRA',
    subtitulo: producto.sublinea || producto.subtitulo || (producto.categoria ? `Línea ${producto.categoria}` : 'Confort & Calidad TERRA'),
    categoria: producto.categoria || 'Muebles & Descanso',
    categoriaKey: String(producto.categoriaKey || producto.categoria || 'sofas').toLowerCase().replace(/[^a-z0-9]/g, ''),
    descripcion: producto.descripcion || producto.description || 'Producto certificado con garantía oficial TERRA de 1 año.',
    precio,
    precioLista,
    precioOriginal: tieneDescuento ? precioLista : null,
    descuentoTag: tieneDescuento ? descuento : null,
    descuento,
    enOferta,
    masVendido,
    stock: Number(producto.stock || producto.stock_quantity || 0),
    sucursales,
    disponible: producto.activo !== false && (producto.stock === undefined || Number(producto.stock) > 0),
    disponibilidadTexto: producto.disponibilidadTexto || (sucursales.length ? `En ${sucursales.filter((s) => Number(s.stock) > 0).length || 3} Salas` : 'En 3 Salas'),
    imagenes: imagenes.length ? imagenes : [imagenPrincipal],
    imagen: imagenPrincipal,
    src: imagenPrincipal,
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
    console.warn('Backend /productos no disponible, usando reserva local:', err.message);
  }

  // Fallback con filtrado local
  let filtrados = [...PRODUCTOS_CATALOGO_FULL];
  if (categoria && categoria !== 'todas') {
    filtrados = filtrados.filter((p) => p.categoriaKey === categoria || p.categoria.toLowerCase().includes(categoria.toLowerCase()));
  }
  if (buscar) {
    const q = buscar.toLowerCase();
    filtrados = filtrados.filter((p) => p.nombre.toLowerCase().includes(q) || p.descripcion.toLowerCase().includes(q));
  }
  return {
    productos: filtrados.map(normalizarProducto),
    paginacion: { total: filtrados.length, pagina: 1, totalPaginas: 1 },
  };
}

export async function listarProductosDestacados(signal) {
  try {
    const res = await apiRequest('/productos?limite=24&orden=recomendados', { signal, raw: true });
    if (res?.success && Array.isArray(res?.data) && res.data.length > 0) {
      return res.data.map(normalizarProducto);
    }
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    console.warn('Backend /productos destacados no disponible, usando reserva:', err.message);
  }
  return PRODUCTOS_CATALOGO_FULL.slice(0, 12).map(normalizarProducto);
}

export async function obtenerProducto(id, signal) {
  try {
    const data = await apiRequest(`/productos/${id}`, { signal });
    if (data) return normalizarProducto(data);
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    console.warn(`Backend /productos/${id} no disponible, buscando en datos locales:`, err.message);
  }
  const encontrado = PRODUCTOS_CATALOGO_FULL.find((p) => String(p.id) === String(id));
  return encontrado ? normalizarProducto(encontrado) : null;
}

export async function obtenerCategorias(signal) {
  try {
    const res = await apiRequest('/categorias', { signal });
    if (Array.isArray(res) && res.length) {
      return [
        { id: 'todas', nombre: 'Ver Todo', key: 'todas', icono: 'apps', total: 0 },
        ...res.map((cat) => ({
          id: cat.nombre?.toLowerCase().replace(/[^a-z0-9]/g, '') || cat.id,
          nombre: cat.nombre || cat.name,
          key: cat.nombre?.toLowerCase().replace(/[^a-z0-9]/g, ''),
          total: Number(cat.total || cat.total_productos || 0),
          icono: cat.icon || 'category',
        })),
      ];
    }
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    console.warn('Backend /categorias no disponible, usando reserva:', err.message);
  }
  return CATEGORY_PILLS;
}
