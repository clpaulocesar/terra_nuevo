import {
  listarProductosPaginadoBD,
  ORDENES_PRODUCTOS,
  obtenerProductoBD,
  crearProductoBD,
  actualizarProductoBD,
  actualizarStockBD,
  eliminarProductoBD,
  cambiarVisibilidadProductoBD,
  buscarCoincidenciasNombreProductoBD,
} from '../models/productoModel.js';
import { migrateAndSeed } from '../config/migrate_seed.js';

export async function seedProductos(req, res, next) {
  try {
    const resultado = await migrateAndSeed({ closePool: false });
    return res.json({
      success: true,
      mensaje: 'Base de datos sincronizada con éxito',
      total: resultado.total,
    });
  } catch (error) {
    next(error);
  }
}

const ORDENES_VALIDOS = ORDENES_PRODUCTOS;

function normalizarEscalasMayoristas(escalas, { obligatorio = false } = {}) {
  if (escalas === undefined) return obligatorio ? [] : undefined;
  if (!Array.isArray(escalas) || escalas.length > 10) throw new Error('Las escalas mayoristas deben contener entre 0 y 10 tramos.');
  const normalizadas = escalas.map((escala) => ({
    minCantidad: Number(escala?.minCantidad),
    precio: Number(escala?.precio),
  })).sort((a, b) => a.minCantidad - b.minCantidad);
  const minimos = new Set();
  for (const escala of normalizadas) {
    if (!Number.isSafeInteger(escala.minCantidad) || escala.minCantidad < 1 || !Number.isFinite(escala.precio) || escala.precio < 0 || minimos.has(escala.minCantidad)) {
      throw new Error('Cada escala debe tener una cantidad mínima única y un precio válido.');
    }
    minimos.add(escala.minCantidad);
  }
  return normalizadas;
}

export async function listarProductos(req, res, next) {
  try {
    const buscar = String(req.query.buscar ?? '').trim();
    const categoria = String(req.query.categoria ?? '').trim();
    const orden = ORDENES_VALIDOS.includes(String(req.query.orden ?? '')) ? String(req.query.orden) : 'recomendados';
    const pagina = Number(req.query.pagina ?? 1);
    const limite = Number(req.query.limite ?? 100);
    const soloActivos = req.query.todos === 'true' ? false : true;
    const soloPromos = req.query.promos === 'true';
    const soloOfertas = req.query.ofertas === 'true';
    // Solo quien lo pide filtra por stock: el catálogo del kiosco oculta los productos
    // con stock 0 y Ventas directas tiene "Solo con stock". El resto (admin, ficha,
    // relacionados) sigue viendo todo.
    const conStock = req.query.stock === 'true';
    const precioMin = req.query.precioMin != null && req.query.precioMin !== '' ? Number(req.query.precioMin) : null;
    const precioMax = req.query.precioMax != null && req.query.precioMax !== '' ? Number(req.query.precioMax) : null;

    if (
      !Number.isSafeInteger(pagina) ||
      pagina < 1 ||
      !Number.isSafeInteger(limite) ||
      limite < 1 ||
      limite > 100000
    ) {
      return res.status(400).json({
        success: false,
        mensaje: 'Paginación inválida',
      });
    }

    if (
      (precioMin !== null && (!Number.isFinite(precioMin) || precioMin < 0)) ||
      (precioMax !== null && (!Number.isFinite(precioMax) || precioMax < 0))
    ) {
      return res.status(400).json({ success: false, mensaje: 'Rango de precios inválido' });
    }

    const { productos, total } = await listarProductosPaginadoBD({
      buscar,
      categoria,
      pagina,
      limite,
      soloActivos,
      soloPromos,
      soloOfertas,
      conStock,
      precioMin,
      precioMax,
      orden,
    });

    const totalPaginas = Math.max(1, Math.ceil(total / limite));

    return res.json({
      success: true,
      data: productos,
      paginacion: {
        pagina,
        limite,
        total,
        totalPaginas,
        tieneAnterior: pagina > 1,
        tieneSiguiente: pagina < totalPaginas,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function obtenerProducto(req, res, next) {
  try {
    const id = String(req.params.id || '').trim();

    if (!id) {
      return res.status(400).json({
        success: false,
        mensaje: 'ID de producto inválido',
      });
    }

    const producto = await obtenerProductoBD(id);

    if (!producto) {
      return res.status(404).json({
        success: false,
        mensaje: 'Producto no encontrado',
      });
    }

    return res.json({
      success: true,
      data: producto,
    });
  } catch (error) {
    next(error);
  }
}

export async function crearProducto(req, res, next) {
  try {
    const datos = req.body;
    if (!datos.nombre || !datos.categoria || datos.precio === undefined) {
      return res.status(400).json({
        success: false,
        mensaje: 'Nombre, categoría y precio son obligatorios',
      });
    }
    const coincidencias = await buscarCoincidenciasNombreProductoBD({ nombre: datos.nombre, medida: datos.medida, color: datos.detalle });
    if (coincidencias.some((producto) => producto.exacto)) {
      return res.status(409).json({ success: false, mensaje: 'Ya existe un producto con el mismo nombre, medida y color.', coincidencias });
    }

    const precioMayorista = datos.precioMayorista === '' || datos.precioMayorista == null ? null : Number(datos.precioMayorista);
    if (precioMayorista !== null && (!Number.isFinite(precioMayorista) || precioMayorista < 0)) {
      return res.status(400).json({ success: false, mensaje: 'El precio mayorista debe ser un monto válido.' });
    }
    const escalasMayorista = normalizarEscalasMayoristas(datos.escalasMayorista, { obligatorio: true });
    const nuevo = await crearProductoBD({ ...datos, precioMayorista, escalasMayorista });
    return res.status(201).json({
      success: true,
      mensaje: 'Producto creado exitosamente',
      data: nuevo,
    });
  } catch (error) {
    if (error.message?.includes('escala')) return res.status(400).json({ success: false, mensaje: error.message });
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        mensaje: 'Ya existe un producto con ese SKU / código.',
      });
    }
    next(error);
  }
}

export async function actualizarProducto(req, res, next) {
  try {
    const id = String(req.params.id || '').trim();
    if (!id) {
      return res.status(400).json({
        success: false,
        mensaje: 'ID de producto inválido',
      });
    }

    const precioMayorista = req.body?.precioMayorista === '' || req.body?.precioMayorista == null ? null : Number(req.body.precioMayorista);
    if (precioMayorista !== null && (!Number.isFinite(precioMayorista) || precioMayorista < 0)) {
      return res.status(400).json({ success: false, mensaje: 'El precio mayorista debe ser un monto válido.' });
    }
    const escalasMayorista = normalizarEscalasMayoristas(req.body?.escalasMayorista);
    const actualizado = await actualizarProductoBD(id, { ...req.body, precioMayorista, escalasMayorista });
    if (!actualizado) {
      return res.status(404).json({
        success: false,
        mensaje: 'Producto no encontrado',
      });
    }

    return res.json({
      success: true,
      mensaje: 'Producto actualizado exitosamente',
      data: actualizado,
    });
  } catch (error) {
    if (error.message?.includes('escala')) return res.status(400).json({ success: false, mensaje: error.message });
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        mensaje: 'Ya existe un producto con ese SKU / código.',
      });
    }
    next(error);
  }
}

export async function actualizarStock(req, res, next) {
  try {
    const id = String(req.params.id || '').trim();
    const { showroom, agregar } = req.body ?? {};

    // Dos modos: { showroom: n } fija el stock; { agregar: n } suma n unidades
    // al stock actual (ingreso de almacén) de forma atómica en la base de datos.
    if (agregar !== undefined) {
      const unidades = Number(agregar);
      if (!Number.isSafeInteger(unidades) || unidades < 1 || unidades > 100000) {
        return res.status(400).json({ success: false, mensaje: 'La cantidad a agregar debe ser un entero entre 1 y 100000.' });
      }
    } else {
      const fijo = Number(showroom);
      if (!Number.isFinite(fijo) || fijo < 0) {
        return res.status(400).json({ success: false, mensaje: 'El stock debe ser un número mayor o igual a 0.' });
      }
    }

    const actualizado = await actualizarStockBD(id, { showroom, agregar });
    if (!actualizado) {
      return res.status(404).json({
        success: false,
        mensaje: 'Producto no encontrado',
      });
    }

    return res.json({
      success: true,
      mensaje: 'Inventario de producto actualizado',
      data: actualizado,
    });
  } catch (error) {
    next(error);
  }
}

export async function eliminarProducto(req, res, next) {
  try {
    const id = String(req.params.id || '').trim();
    const eliminado = await eliminarProductoBD(id);
    if (!eliminado) {
      return res.status(404).json({
        success: false,
        mensaje: 'Producto no encontrado',
      });
    }

    return res.json({
      success: true,
      mensaje: 'Producto eliminado exitosamente',
      data: eliminado,
    });
  } catch (error) {
    next(error);
  }
}

export async function cambiarVisibilidadProducto(req, res, next) {
  try {
    const id = String(req.params.id || '').trim();
    if (!id) {
      return res.status(400).json({
        success: false,
        mensaje: 'ID de producto inválido',
      });
    }

    const activo = req.body?.activo !== undefined ? Boolean(req.body.activo) : false;
    const actualizado = await cambiarVisibilidadProductoBD(id, activo);
    if (!actualizado) {
      return res.status(404).json({
        success: false,
        mensaje: 'Producto no encontrado',
      });
    }

    return res.json({
      success: true,
      mensaje: activo ? 'Producto ahora visible para clientes' : 'Producto oculto para clientes y catálogo',
      data: actualizado,
    });
  } catch (error) {
    next(error);
  }
}


