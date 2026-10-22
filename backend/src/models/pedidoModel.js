import { randomUUID } from 'node:crypto';
import { pool } from '../config/database.js';
import { asegurarEscalasMayoristasBD } from './productoModel.js';

const aMonto = (minor) => Number(minor || 0) / 100;
let paymentColumnsReady;
function asegurarColumnasPago() {
  if (!paymentColumnsReady) paymentColumnsReady = Promise.all([
    pool.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_receipt_url TEXT'),
    pool.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT'),
  ]);
  return paymentColumnsReady;
}

let deliveryColumnsReady;
function asegurarColumnasEntrega() {
  if (!deliveryColumnsReady) deliveryColumnsReady = Promise.all([
    pool.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address TEXT'),
    pool.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_reference TEXT'),
    pool.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_lat DOUBLE PRECISION'),
    pool.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_lng DOUBLE PRECISION'),
  ]);
  return deliveryColumnsReady;
}

export async function crearPedidoBD(clienteId, items, { precioMayorista = false, entrega = null } = {}) {
  await Promise.all([asegurarEscalasMayoristasBD(), asegurarColumnasEntrega()]);
  const conexion = await pool.connect();
  try {
    await conexion.query('BEGIN');
    if (clienteId) {
      const cliente = await conexion.query('SELECT id FROM customers WHERE id=$1', [clienteId]);
      if (!cliente.rowCount) throw new Error('El cliente no existe en Supabase');
    }
    const detalles = []; let totalMinor = 0;
    for (const item of items) {
      const producto = await conexion.query(
        // El catálogo actual guarda el precio en products.public_price y no tiene
        // variantes activas. product_variant_id admite NULL en order_items.
        `SELECT p.id AS product_id, p.name, p.stock_quantity, NULL::uuid AS variant_id,
                COALESCE(p.codigo_terra, p.internal_code, p.slug, p.id::text) AS sku,
                ROUND(COALESCE(
                  CASE WHEN $2 THEN (SELECT w.unit_price FROM wholesale_price_tiers w WHERE w.product_id=p.id AND w.minimum_quantity <= $3 ORDER BY w.minimum_quantity DESC LIMIT 1) END,
                  CASE WHEN $2 THEN NULLIF(BTRIM(p.precio_mayorista::text), '')::numeric END,
                  CASE WHEN COALESCE(p.en_oferta, FALSE) AND COALESCE(p.precio_oferta, 0) > 0 THEN p.precio_oferta END,
                  p.public_price, 0) * 100)::bigint AS price_minor,
                CASE WHEN $2 THEN COALESCE((SELECT MIN(w.minimum_quantity) FROM wholesale_price_tiers w WHERE w.product_id=p.id), 1) ELSE 1 END AS minimum_order_quantity
         FROM products p
         WHERE p.id=$1 AND COALESCE(p.activo,p.is_active,TRUE)=TRUE LIMIT 1`, [item.productoId, precioMayorista, item.cantidad]);
      if (!producto.rowCount) throw new Error('Producto no encontrado o inactivo en Supabase');
      const p = producto.rows[0];
      if (Number(p.stock_quantity || 0) < item.cantidad) throw new Error(`Stock insuficiente para ${p.name}`);
      if (item.cantidad < Number(p.minimum_order_quantity || 1)) throw new Error(`La compra mínima de ${p.name} es de ${p.minimum_order_quantity} unidades.`);
      const subtotalMinor = Number(p.price_minor) * item.cantidad;
      totalMinor += subtotalMinor;
      detalles.push({ variantId: p.variant_id, nombre: p.name, sku: p.sku, cantidad: item.cantidad, precioUnitario: aMonto(p.price_minor), subtotal: aMonto(subtotalMinor) });
    }
    const ticket = `TER-${randomUUID().slice(0, 8).toUpperCase()}`;
    const tipoEntrega = entrega?.direccion ? 'home_delivery' : 'store_pickup';
    const nuevo = await conexion.query(
      `INSERT INTO orders (
         customer_id,status,fulfillment_type,subtotal_minor,discount_minor,
         delivery_fee_minor,total_minor,currency,ticket_number,
         delivery_address,delivery_reference,delivery_lat,delivery_lng
       )
       VALUES ($1,'pending',$2,$3,0,0,$3,'BOB',$4,$5,$6,$7,$8)
       RETURNING id, ticket_number AS codigo, customer_id AS cliente_id, total_minor,
                 status AS estado, created_at AS fecha, fulfillment_type AS tipo_entrega,
                 delivery_address AS direccion_entrega, delivery_reference AS referencia_entrega,
                 delivery_lat AS latitud_entrega, delivery_lng AS longitud_entrega`,
      [
        clienteId, tipoEntrega, totalMinor, ticket,
        entrega?.direccion || null, entrega?.referencia || null,
        entrega?.latitud ?? null, entrega?.longitud ?? null,
      ]
    );
    for (const d of detalles) {
      await conexion.query(`INSERT INTO order_items (order_id,product_variant_id,product_name,sku,quantity,unit_price_minor,discount_minor,total_minor,currency) VALUES ($1,$2,$3,$4,$5,$6,0,$7,'BOB')`, [nuevo.rows[0].id, d.variantId, d.nombre, d.sku, d.cantidad, Math.round(d.precioUnitario*100), Math.round(d.subtotal*100)]);
    }
    const totalPedidos = await conexion.query('SELECT count(*)::integer AS total FROM orders');
    const numero = totalPedidos.rows[0]?.total || 1;
    await conexion.query('COMMIT');
    return { ...nuevo.rows[0], numero, total: aMonto(nuevo.rows[0].total_minor), items: detalles };
  } catch (error) { await conexion.query('ROLLBACK'); throw error; } finally { conexion.release(); }
}

export async function obtenerPedidoBD(id) {
  await Promise.all([asegurarColumnasPago(), asegurarColumnasEntrega()]);
  const { rows } = await pool.query(
    `WITH pedidos_base AS (
       SELECT o.*, ROW_NUMBER() OVER (ORDER BY o.created_at ASC) AS numero_pedido
       FROM orders o
     )
     SELECT p.id,p.numero_pedido::integer AS numero,p.ticket_number AS codigo,p.customer_id AS cliente_id,p.total_minor,p.status AS estado,p.created_at AS fecha,
            p.payment_receipt_url AS comprobante_url,p.payment_method AS metodo_pago,
            p.fulfillment_type AS tipo_entrega,
            p.delivery_address AS direccion_entrega,p.delivery_reference AS referencia_entrega,
            p.delivery_lat AS latitud_entrega,p.delivery_lng AS longitud_entrega,
            c.name AS cliente_nombre,c.phone AS cliente_telefono,c.nit AS cliente_nit
     FROM pedidos_base p LEFT JOIN customers c ON c.id=p.customer_id WHERE p.id=$1`,
    [id]
  );
  if (!rows[0]) return null;
  const detalles = await pool.query(
    `SELECT COALESCE(p.id::text, i.product_variant_id::text) AS "productoId",
            i.product_name AS nombre,
            COALESCE(i.sku, p.codigo_terra, p.internal_code, '') AS sku,
            i.quantity AS cantidad,
            i.unit_price_minor/100.0 AS "precioUnitario",
            i.total_minor/100.0 AS subtotal
     FROM order_items i
     LEFT JOIN products p ON (p.codigo_terra = i.sku OR p.internal_code = i.sku OR p.name = i.product_name)
     WHERE i.order_id=$1
     ORDER BY i.created_at`,
    [id]
  );
  const pedido = rows[0];
  return {
    ...pedido,
    total: aMonto(pedido.total_minor),
    cliente: pedido.cliente_nombre ? { nombre: pedido.cliente_nombre, telefono: pedido.cliente_telefono, nit: pedido.cliente_nit } : null,
    items: detalles.rows,
  };
}

export async function listarPedidosBD({ buscar = '', estado = '', limite = 100 } = {}) {
  await Promise.all([asegurarColumnasPago(), asegurarColumnasEntrega()]);
  const valores=[]; const condiciones=[];
  const termino=String(buscar||'').trim();
  if(termino){
    // En caja el vendedor identifica al cliente por teléfono, NIT o nombre:
    // el ticket impreso no siempre está a mano. Además de buscar los números
    // tal cual se escriben, se comparan sin separadores para que "71234567"
    // encuentre "+591 712-34567" y para que "59171234567" encuentre "712-34567".
    valores.push(`%${termino}%`);
    const difuso=`$${valores.length}`;
    const digitos=termino.replace(/[^0-9]/g,'');
    let busqueda=`p.ticket_number ILIKE ${difuso} OR COALESCE(c.name,'') ILIKE ${difuso} OR COALESCE(c.contact_name,'') ILIKE ${difuso} OR COALESCE(c.nit,'') ILIKE ${difuso} OR COALESCE(c.phone,'') ILIKE ${difuso} OR COALESCE(c.email,'') ILIKE ${difuso}`;
    if(digitos.length>=4){
      valores.push(`%${digitos}%`);
      busqueda+=` OR regexp_replace(COALESCE(c.phone,''),'[^0-9]','','g') LIKE $${valores.length}`;
    }
    const numeroLimpio = termino.replace(/^#/, '').trim();
    if (/^\d+$/.test(numeroLimpio)) {
      busqueda += ` OR p.numero_pedido = ${parseInt(numeroLimpio, 10)}`;
    }
    condiciones.push(`(${busqueda})`);
  }
  if(estado){valores.push(estado);condiciones.push(`p.status=$${valores.length}`);}
  valores.push(limite); const where=condiciones.length?`WHERE ${condiciones.join(' AND ')}`:'';
  const { rows } = await pool.query(`
    WITH pedidos_base AS (
      SELECT o.*, ROW_NUMBER() OVER (ORDER BY o.created_at ASC) AS numero_pedido
      FROM orders o
    )
    SELECT p.id,
           p.numero_pedido::integer AS numero,
           p.ticket_number AS codigo,
           p.customer_id AS cliente_id,
           p.total_minor/100.0 AS total,
           p.status AS estado,
           p.created_at AS fecha,
           p.payment_receipt_url AS comprobante_url,
           p.payment_method AS metodo_pago,
           p.fulfillment_type AS tipo_entrega,
           p.delivery_address AS direccion_entrega,
           p.delivery_reference AS referencia_entrega,
           COALESCE(c.name,'Compra como invitado') AS cliente,
           COALESCE(c.contact_name,'') AS cliente_titular,
           COALESCE(c.phone,'') AS cliente_telefono,
           COALESCE(c.nit,'') AS cliente_nit,
           COALESCE(string_agg(i.quantity::text || 'x ' || i.product_name, ', '),'') AS items
    FROM pedidos_base p
    LEFT JOIN customers c ON c.id=p.customer_id
    LEFT JOIN order_items i ON i.order_id=p.id
    ${where}
    GROUP BY p.id, p.numero_pedido, p.ticket_number, p.customer_id, p.total_minor, p.status, p.created_at,
             p.payment_receipt_url, p.payment_method, p.fulfillment_type, p.delivery_address, p.delivery_reference,
             c.id, c.name, c.contact_name, c.phone, c.nit
    ORDER BY p.created_at DESC
    LIMIT $${valores.length}
  `, valores);
  return rows;
}

export async function obtenerAnaliticaHorariaBD({ desde, hasta, horaInicio = null, horaFin = null } = {}) {
  const valores = [desde, hasta];
  const filtroHora = [];
  if (horaInicio !== null) { valores.push(horaInicio); filtroHora.push(`EXTRACT(HOUR FROM (o.created_at AT TIME ZONE 'America/La_Paz')) >= $${valores.length}`); }
  if (horaFin !== null) { valores.push(horaFin); filtroHora.push(`EXTRACT(HOUR FROM (o.created_at AT TIME ZONE 'America/La_Paz')) <= $${valores.length}`); }
  const horario = filtroHora.length ? ` AND ${filtroHora.join(' AND ')}` : '';
  const base = `o.status IN ('completed','paid','pagado','shipped','delivered')
    AND (o.created_at AT TIME ZONE 'America/La_Paz')::date BETWEEN $1::date AND $2::date`;
  const porHora = await pool.query(
    `SELECT EXTRACT(HOUR FROM (o.created_at AT TIME ZONE 'America/La_Paz'))::int AS hora,
            COUNT(DISTINCT o.id)::int AS pedidos, COALESCE(SUM(o.total_minor),0)/100.0 AS ventas,
            COALESCE(SUM(oi.quantity),0)::int AS unidades
     FROM orders o LEFT JOIN order_items oi ON oi.order_id=o.id
     WHERE ${base} GROUP BY hora ORDER BY hora`, valores.slice(0, 2),
  );
  const productos = await pool.query(
    `SELECT oi.product_name AS nombre, COALESCE(SUM(oi.quantity),0)::int AS unidades,
            COALESCE(SUM(oi.total_minor),0)/100.0 AS ventas
     FROM orders o JOIN order_items oi ON oi.order_id=o.id
     WHERE ${base}${horario}
     GROUP BY oi.product_name ORDER BY unidades DESC, ventas DESC, oi.product_name ASC LIMIT 8`, valores,
  );
  const horas = Array.from({ length: 24 }, (_, hora) => {
    const fila = porHora.rows.find((item) => Number(item.hora) === hora);
    return { hora, pedidos: Number(fila?.pedidos || 0), ventas: Number(fila?.ventas || 0), unidades: Number(fila?.unidades || 0) };
  });
  return { horas, productos: productos.rows.map((fila) => ({ nombre: fila.nombre, unidades: Number(fila.unidades), ventas: Number(fila.ventas) })) };
}

export async function listarPedidosPorClienteBD(clienteId, limite = 50) {
  await asegurarColumnasEntrega();
  const { rows } = await pool.query(
    `WITH pedidos_base AS (
       SELECT o.*, ROW_NUMBER() OVER (ORDER BY o.created_at ASC) AS numero_pedido
       FROM orders o
     )
     SELECT p.id,p.numero_pedido::integer AS numero,p.ticket_number AS codigo,p.total_minor/100.0 AS total,p.status AS estado,p.created_at AS fecha,
            p.fulfillment_type AS tipo_entrega,p.delivery_address AS direccion_entrega,
            p.delivery_reference AS referencia_entrega,
            COALESCE(string_agg(i.quantity::text || 'x ' || i.product_name, ', '),'') AS items
     FROM pedidos_base p
     LEFT JOIN order_items i ON i.order_id=p.id
     WHERE p.customer_id=$1
     GROUP BY p.id, p.numero_pedido, p.ticket_number, p.total_minor, p.status, p.created_at,
              p.fulfillment_type, p.delivery_address, p.delivery_reference
     ORDER BY p.created_at DESC
     LIMIT $2`,
    [clienteId, limite]
  );
  return rows;
}

export async function registrarPagoPedidoBD(id, { metodoPago, comprobanteUrl }) {
  await asegurarColumnasPago();
  const { rows } = await pool.query(
    `UPDATE orders
     SET status='completed', payment_method=$1, payment_receipt_url=COALESCE($2, payment_receipt_url), updated_at=NOW()
     WHERE id=$3
     RETURNING id`,
    [metodoPago, comprobanteUrl || null, id]
  );
  return rows[0] ? obtenerPedidoBD(id) : null;
}

export async function actualizarEstadoPedidoBD(id, estado) {
  const { rows } = await pool.query(`UPDATE orders SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING id`, [estado, id]);
  return rows[0] ? obtenerPedidoBD(id) : null;
}

export async function actualizarItemsPedidoBD(pedidoId, items) {
  if (!Array.isArray(items) || !items.length) {
    throw new Error('El pedido debe tener al menos un producto.');
  }
  const conexion = await pool.connect();
  try {
    await conexion.query('BEGIN');
    const pedidoActual = await conexion.query(
      `SELECT id, status, customer_id, fulfillment_type FROM orders WHERE id=$1 FOR UPDATE`,
      [pedidoId]
    );
    if (!pedidoActual.rowCount) throw new Error('Pedido no encontrado.');
    const pActual = pedidoActual.rows[0];
    if (['completed', 'cancelled', 'entregado'].includes(pActual.status)) {
      throw new Error('No se pueden modificar productos de un pedido ya cobrado o cancelado.');
    }

    let precioMayorista = false;
    if (pActual.customer_id) {
      const cliente = await conexion.query(
        `SELECT u.role FROM customers c LEFT JOIN users u ON u.auth_user_id=c.auth_user_id WHERE c.id=$1`,
        [pActual.customer_id]
      );
      precioMayorista = cliente.rows[0]?.role === 'mayorista';
    }

    let totalMinor = 0;
    const nuevosDetalles = [];

    for (const item of items) {
      const cantidad = Number(item.cantidad);
      if (!Number.isSafeInteger(cantidad) || cantidad < 1 || cantidad > 100) {
        throw new Error('Cantidad inválida.');
      }
      const prodRes = await conexion.query(
        `SELECT p.id AS product_id, p.name, p.stock_quantity,
                COALESCE(p.codigo_terra, p.internal_code, p.slug, p.id::text) AS sku,
                ROUND(COALESCE(
                  CASE WHEN $2 THEN (SELECT w.unit_price FROM wholesale_price_tiers w WHERE w.product_id=p.id AND w.minimum_quantity <= $3 ORDER BY w.minimum_quantity DESC LIMIT 1) END,
                  CASE WHEN $2 THEN NULLIF(BTRIM(p.precio_mayorista::text), '')::numeric END,
                  p.public_price, 0) * 100)::bigint AS price_minor
         FROM products p
         WHERE (p.id::text=$1 OR p.codigo_terra=$4 OR p.internal_code=$4 OR p.name=$5)
           AND COALESCE(p.activo, p.is_active, TRUE) = TRUE
         LIMIT 1`,
        [item.productoId ? String(item.productoId) : '00000000-0000-0000-0000-000000000000', precioMayorista, cantidad, item.sku || null, item.nombre || null]
      );
      if (!prodRes.rowCount) throw new Error(`Producto «${item.nombre || item.productoId}» no encontrado.`);
      const prod = prodRes.rows[0];
      const subtotalMinor = Number(prod.price_minor) * cantidad;
      totalMinor += subtotalMinor;
      nuevosDetalles.push({
        nombre: prod.name,
        sku: prod.sku,
        cantidad,
        unitPriceMinor: Number(prod.price_minor),
        subtotalMinor,
      });
    }

    // Reemplazar order_items
    await conexion.query(`DELETE FROM order_items WHERE order_id=$1`, [pedidoId]);
    for (const d of nuevosDetalles) {
      await conexion.query(
        `INSERT INTO order_items (order_id, product_variant_id, product_name, sku, quantity, unit_price_minor, discount_minor, total_minor, currency)
         VALUES ($1, NULL, $2, $3, $4, $5, 0, $6, 'BOB')`,
        [pedidoId, d.nombre, d.sku, d.cantidad, d.unitPriceMinor, d.subtotalMinor]
      );
    }

    await conexion.query(
      `UPDATE orders SET subtotal_minor=$1, total_minor=$1, updated_at=NOW() WHERE id=$2`,
      [totalMinor, pedidoId]
    );

    await conexion.query('COMMIT');
    return obtenerPedidoBD(pedidoId);
  } catch (error) {
    await conexion.query('ROLLBACK');
    throw error;
  } finally {
    conexion.release();
  }
}

