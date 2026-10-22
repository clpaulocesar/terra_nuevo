
import {
  crearPedidoBD,
  registrarPagoPedidoBD,
  obtenerPedidoBD,
  listarPedidosBD,
  actualizarEstadoPedidoBD,
  actualizarItemsPedidoBD,
} from '../models/pedidoModel.js';
import { pool } from '../config/database.js';
import { obtenerMayoristaDesdeToken } from '../services/sesionMayorista.js';

export async function registrarPagoPedido(req, res, next) {
  try {
    const id = String(req.params.id || '').trim();
    const metodoPago = String(req.body?.metodoPago || '').trim();
    const comprobanteUrl = String(req.body?.comprobanteUrl || '').trim() || null;
    if (!id || !['qr', 'efectivo', 'tarjeta'].includes(metodoPago)) {
      return res.status(400).json({ success: false, mensaje: 'Datos de pago inválidos.' });
    }
    if (comprobanteUrl && (comprobanteUrl.length > 2000 || !/^https:\/\//i.test(comprobanteUrl))) {
      return res.status(400).json({ success: false, mensaje: 'La URL del comprobante no es válida.' });
    }
    const pedido = await registrarPagoPedidoBD(id, { metodoPago, comprobanteUrl });
    if (!pedido) return res.status(404).json({ success: false, mensaje: 'Pedido no encontrado.' });
    return res.json({ success: true, data: pedido });
  } catch (error) { next(error); }
}

export async function actualizarEstadoPedido(req, res, next) {
  try {
    const id = String(req.params.id || '').trim(); const estado = String(req.body?.estado || '').trim();
    const permitidos = ['pending', 'confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery', 'completed', 'cancelled'];
    if (!id || !permitidos.includes(estado)) return res.status(400).json({ success: false, mensaje: 'Estado inválido' });
    const pedido = await actualizarEstadoPedidoBD(id, estado);
    if (!pedido) return res.status(404).json({ success: false, mensaje: 'Pedido no encontrado' });
    return res.json({ success: true, data: pedido });
  } catch (error) { next(error); }
}

export async function listarPedidos(req, res, next) {
  try {
    const limite = Number(req.query.limite ?? 100);
    if (!Number.isSafeInteger(limite) || limite < 1 || limite > 200) return res.status(400).json({ success: false, mensaje: 'Límite inválido' });
    const estado = String(req.query.estado ?? '').trim();
    const permitidos = ['', 'pending', 'confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery', 'completed', 'cancelled'];
    if (!permitidos.includes(estado)) return res.status(400).json({ success: false, mensaje: 'Estado inválido' });
    const pedidos = await listarPedidosBD({ buscar: String(req.query.buscar ?? '').trim(), estado, limite });
    return res.json({ success: true, data: pedidos });
  } catch (error) { next(error); }
}

export async function crearPedido(req, res, next) {
  try {
    let clienteId = req.body?.clienteId == null ? null : String(req.body.clienteId).trim();
    const mayorista = req.headers.authorization ? await obtenerMayoristaDesdeToken(req.headers.authorization) : null;
    if (req.headers.authorization && !mayorista) return res.status(403).json({ success: false, mensaje: 'La sesión mayorista no es válida.' });
    if (mayorista) clienteId = mayorista.cliente_id;

    const items = req.body?.items;

    if (
      clienteId !== null &&
      !clienteId
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
      const productoId = String(item?.productoId || '').trim();
      const cantidad = Number(item?.cantidad);

      if (
        !productoId ||
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

    const entrega = mayorista?.direccion
      ? {
          direccion: mayorista.direccion,
          referencia: mayorista.referencia || null,
          latitud: mayorista.latitud ?? null,
          longitud: mayorista.longitud ?? null,
        }
      : null;

    const pedido = await crearPedidoBD(
      clienteId,
      itemsNormalizados,
      { precioMayorista: Boolean(mayorista), entrega }
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

export async function crearVentaDirecta(req, res, next) {
  try {
    const clienteId = req.body?.clienteId == null ? null : String(req.body.clienteId).trim();
    const metodoPago = String(req.body?.metodoPago || '').trim();
    const items = req.body?.items;
    if (!['qr', 'efectivo', 'tarjeta'].includes(metodoPago)) return res.status(400).json({ success: false, mensaje: 'Selecciona un método de pago válido.' });
    if (!Array.isArray(items) || !items.length || items.length > 50) return res.status(400).json({ success: false, mensaje: 'Debes agregar entre 1 y 50 productos.' });
    const agrupados = new Map();
    for (const item of items) {
      const productoId = String(item?.productoId || '').trim(); const cantidad = Number(item?.cantidad);
      if (!productoId || !Number.isSafeInteger(cantidad) || cantidad < 1 || cantidad > 100) return res.status(400).json({ success: false, mensaje: 'Producto o cantidad inválida.' });
      const total = (agrupados.get(productoId) || 0) + cantidad;
      if (total > 100) return res.status(400).json({ success: false, mensaje: 'Máximo 100 unidades por producto.' });
      agrupados.set(productoId, total);
    }
    const tipoMayoristaManual = req.body?.tipoMayoristaManual === true;
    let precioMayorista = tipoMayoristaManual;
    if (clienteId) {
      const cliente = await pool.query(`SELECT u.role FROM customers c LEFT JOIN users u ON u.auth_user_id=c.auth_user_id WHERE c.id=$1`, [clienteId]);
      if (!cliente.rowCount) return res.status(404).json({ success: false, mensaje: 'Cliente no encontrado.' });
      precioMayorista = cliente.rows[0].role === 'mayorista';
    }
    const pedido = await crearPedidoBD(clienteId, Array.from(agrupados, ([productoId, cantidad]) => ({ productoId, cantidad })), { precioMayorista });
    const cobrado = await registrarPagoPedidoBD(pedido.id, { metodoPago, comprobanteUrl: null });
    return res.status(201).json({ success: true, mensaje: 'Venta directa registrada.', data: { ...cobrado, tipoCliente: precioMayorista ? 'mayorista' : 'minorista' } });
  } catch (error) { next(error); }
}

export async function obtenerPedido(req, res, next) {
  try {
    const id = String(req.params.id || '').trim();

    if (!id) {
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

export async function actualizarItemsPedido(req, res, next) {
  try {
    const id = String(req.params.id || '').trim();
    const items = req.body?.items;
    if (!id) {
      return res.status(400).json({ success: false, mensaje: 'ID de pedido inválido' });
    }
    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ success: false, mensaje: 'Debes enviar al menos un producto para el pedido' });
    }
    const pedido = await actualizarItemsPedidoBD(id, items);
    return res.json({ success: true, mensaje: 'Pedido actualizado correctamente', data: pedido });
  } catch (error) {
    next(error);
  }
}
