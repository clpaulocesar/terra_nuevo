
import { randomUUID } from 'node:crypto';
import { pool } from '../config/database.js';

function crearError(mensaje, statusCode = 400) {
  const error = new Error(mensaje);
  error.statusCode = statusCode;
  return error;
}

export async function crearPedidoBD(clienteId, items) {
  const conexion = await pool.connect();

  try {
    await conexion.query('BEGIN');

    // Validar que el cliente exista, si fue indicado.
    if (clienteId !== null) {
      const cliente = await conexion.query(
        'SELECT id FROM clientes WHERE id = $1',
        [clienteId]
      );

      if (cliente.rowCount === 0) {
        throw crearError('El cliente no existe', 404);
      }
    }

    const detalles = [];
    let totalCentavos = 0;

    // Consultar precios y stock desde PostgreSQL.
    for (const item of items) {
      const resultado = await conexion.query(
        `SELECT id, nombre, precio, stock
         FROM productos
         WHERE id = $1 AND activo = TRUE
         FOR SHARE`,
        [item.productoId]
      );

      if (resultado.rowCount === 0) {
        throw crearError(
          `Producto ${item.productoId} no encontrado`,
          404
        );
      }

      const producto = resultado.rows[0];

      if (producto.stock < item.cantidad) {
        throw crearError(
          `Stock insuficiente para ${producto.nombre}`,
          409
        );
      }

      const precioCentavos = Math.round(
        Number(producto.precio) * 100
      );

      const subtotalCentavos =
        precioCentavos * item.cantidad;

      totalCentavos += subtotalCentavos;

      detalles.push({
        productoId: producto.id,
        nombre: producto.nombre,
        cantidad: item.cantidad,
        precioUnitario: producto.precio,
        subtotal: (subtotalCentavos / 100).toFixed(2),
      });
    }

    // Generar un código único para el pedido.
    const codigo = `TER-${randomUUID()}`;

    const nuevoPedido = await conexion.query(
      `INSERT INTO pedidos
         (codigo, cliente_id, total, estado)
       VALUES ($1, $2, $3, 'pendiente_pago')
       RETURNING id, codigo, cliente_id,
                 total, estado, fecha`,
      [
        codigo,
        clienteId,
        (totalCentavos / 100).toFixed(2),
      ]
    );

    const pedido = nuevoPedido.rows[0];

    // Registrar el detalle de cada producto.
    for (const detalle of detalles) {
      await conexion.query(
        `INSERT INTO pedido_detalles
          (pedido_id, producto_id, cantidad,
           precio_unitario, subtotal)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          pedido.id,
          detalle.productoId,
          detalle.cantidad,
          detalle.precioUnitario,
          detalle.subtotal,
        ]
      );
    }

    await conexion.query('COMMIT');

    return {
      ...pedido,
      items: detalles,
    };

  } catch (error) {
    await conexion.query('ROLLBACK');
    throw error;
  } finally {
    conexion.release();
  }
}

export async function obtenerPedidoBD(id) {
  const resultado = await pool.query(
    `SELECT id, codigo, cliente_id,
            total, estado, fecha
     FROM pedidos
     WHERE id = $1`,
    [id]
  );

  if (resultado.rowCount === 0) {
    return null;
  }

  const pedido = resultado.rows[0];

  const detalles = await pool.query(
    `SELECT d.producto_id AS "productoId",
            p.nombre,
            d.cantidad,
            d.precio_unitario AS "precioUnitario",
            d.subtotal
     FROM pedido_detalles d
     INNER JOIN productos p
       ON p.id = d.producto_id
     WHERE d.pedido_id = $1
     ORDER BY d.id`,
    [id]
  );

  return {
    ...pedido,
    items: detalles.rows,
  };
}
