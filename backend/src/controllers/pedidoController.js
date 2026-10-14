
import {
  crearPedidoBD,
  obtenerPedidoBD,
} from '../models/pedidoModel.js';

export async function crearPedido(req, res, next) {
  try {
    const clienteId =
      req.body?.clienteId == null
        ? null
        : Number(req.body.clienteId);

    const items = req.body?.items;

    if (
      clienteId !== null &&
      (!Number.isSafeInteger(clienteId) || clienteId < 1)
    ) {
      return res.status(400).json({
        success: false,
        mensaje: 'ID de cliente inválido',
      });
    }

    if (
      !Array.isArray(items) ||
      items.length === 0 ||
      items.length > 50
    ) {
      return res.status(400).json({
        success: false,
        mensaje: 'Debes enviar entre 1 y 50 productos',
      });
    }

    const productos = new Map();

    for (const item of items) {
      const productoId = Number(item?.productoId);
      const cantidad = Number(item?.cantidad);

      if (
        !Number.isSafeInteger(productoId) ||
        productoId < 1 ||
        !Number.isSafeInteger(cantidad) ||
        cantidad < 1 ||
        cantidad > 100
      ) {
        return res.status(400).json({
          success: false,
          mensaje: 'Producto o cantidad inválida',
        });
      }

      const cantidadTotal =
        (productos.get(productoId) || 0) + cantidad;

      if (cantidadTotal > 100) {
        return res.status(400).json({
          success: false,
          mensaje: 'Máximo 100 unidades por producto',
        });
      }

      productos.set(productoId, cantidadTotal);
    }

    const itemsNormalizados = Array.from(
      productos,
      ([productoId, cantidad]) => ({
        productoId,
        cantidad,
      })
    );

    const pedido = await crearPedidoBD(
      clienteId,
      itemsNormalizados
    );

    return res.status(201).json({
      success: true,
      mensaje: 'Pedido generado correctamente',
      data: pedido,
    });
  } catch (error) {
    next(error);
  }
}

export async function obtenerPedido(req, res, next) {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id < 1) {
      return res.status(400).json({
        success: false,
        mensaje: 'ID de pedido inválido',
      });
    }

    const pedido = await obtenerPedidoBD(id);

    if (!pedido) {
      return res.status(404).json({
        success: false,
        mensaje: 'Pedido no encontrado',
      });
    }

    return res.json({
      success: true,
      data: pedido,
    });
  } catch (error) {
    next(error);
  }
}
