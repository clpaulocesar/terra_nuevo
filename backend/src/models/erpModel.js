import { createHash } from 'node:crypto';
import { pool } from '../config/database.js';

// Tablas de la integración con el ERP de TERRA. Ya existen en producción con estas
// columnas; el DDL se repite aquí (idempotente) para bases locales de prueba.
//   erp_quotations:         una fila por intento de cotización (enviando|ok|rechazado|verificar)
//   erp_product_sync_state: código interno del ERP y última sincronización por producto
//   erp_warehouse_stocks:   stock por almacén informado en la última verificación
//   erp_sync_runs:          reservada para el job de sincronización masiva (fase 2)
let tablasListas;
export function asegurarTablasErpBD() {
  if (!tablasListas) {
    tablasListas = (async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS erp_quotations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          idempotency_key TEXT NOT NULL UNIQUE,
          status TEXT NOT NULL,
          erp_number BIGINT UNIQUE,
          request_products JSONB NOT NULL,
          response JSONB,
          error_message TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          completed_at TIMESTAMPTZ
        )
      `);
      await pool.query('ALTER TABLE erp_quotations ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id) ON DELETE SET NULL');
      await pool.query('CREATE INDEX IF NOT EXISTS erp_quotations_order_id_idx ON erp_quotations (order_id)');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS erp_product_sync_state (
          product_id UUID PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
          erp_internal_code TEXT NOT NULL UNIQUE,
          source_hash TEXT NOT NULL,
          last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          last_image_sync_at TIMESTAMPTZ,
          last_error TEXT
        )
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS erp_warehouse_stocks (
          product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
          warehouse_name TEXT NOT NULL,
          quantity INTEGER NOT NULL,
          synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          PRIMARY KEY (product_id, warehouse_name)
        )
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS erp_sync_runs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          status TEXT NOT NULL,
          requested_by TEXT,
          requested_count INTEGER NOT NULL DEFAULT 0,
          processed_count INTEGER NOT NULL DEFAULT 0,
          failed_count INTEGER NOT NULL DEFAULT 0,
          details JSONB NOT NULL DEFAULT '[]'::jsonb,
          started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          finished_at TIMESTAMPTZ
        )
      `);
    })().catch((error) => { tablasListas = null; throw error; });
  }
  return tablasListas;
}

// Huella de la respuesta del ERP para detectar cambios entre sincronizaciones.
export function hashRespuestaErp(erp) {
  return createHash('sha256').update(JSON.stringify(erp ?? null)).digest('hex');
}

// Guarda el código interno y la fecha de sincronización. Sin código (404) solo se
// anota el error en la fila existente: erp_internal_code es NOT NULL.
export async function guardarSincronizacionProductoBD(productoId, { erpInternalCode = null, sourceHash = null, error = null }, conexion = pool) {
  await asegurarTablasErpBD();
  if (erpInternalCode) {
    await conexion.query(
      `INSERT INTO erp_product_sync_state (product_id, erp_internal_code, source_hash, last_synced_at, last_error)
       VALUES ($1, $2, $3, NOW(), $4)
       ON CONFLICT (product_id) DO UPDATE
         SET erp_internal_code = EXCLUDED.erp_internal_code,
             source_hash = EXCLUDED.source_hash,
             last_synced_at = NOW(),
             last_error = EXCLUDED.last_error`,
      [productoId, String(erpInternalCode), sourceHash || hashRespuestaErp(null), error]
    );
    return;
  }
  await conexion.query(
    'UPDATE erp_product_sync_state SET last_synced_at = NOW(), last_error = $2 WHERE product_id = $1',
    [productoId, error]
  );
}

// Reemplaza el stock por almacén del producto con lo informado por el ERP.
export async function guardarStockAlmacenesBD(productoId, almacenes, conexion = pool) {
  await asegurarTablasErpBD();
  await conexion.query('DELETE FROM erp_warehouse_stocks WHERE product_id = $1', [productoId]);
  for (const fila of Array.isArray(almacenes) ? almacenes : []) {
    const nombre = String(fila?.almacen || '').trim().replace(/\s+/g, ' ');
    if (!nombre) continue;
    const cantidad = Math.floor(Number(fila?.stock));
    await conexion.query(
      `INSERT INTO erp_warehouse_stocks (product_id, warehouse_name, quantity, synced_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (product_id, warehouse_name) DO UPDATE SET quantity = EXCLUDED.quantity, synced_at = NOW()`,
      [productoId, nombre, Number.isFinite(cantidad) ? cantidad : 0]
    );
  }
}

// Abre un intento de cotización: idempotency_key = id del pedido + número de intento.
export async function crearIntentoCotizacionBD(orderId, requestProducts) {
  await asegurarTablasErpBD();
  const { rows: conteo } = await pool.query('SELECT COUNT(*)::int AS n FROM erp_quotations WHERE order_id = $1', [orderId]);
  const numeroIntento = Number(conteo[0]?.n || 0) + 1;
  const { rows } = await pool.query(
    `INSERT INTO erp_quotations (idempotency_key, status, request_products, order_id)
     VALUES ($1, 'enviando', $2::jsonb, $3)
     RETURNING id, idempotency_key, status, created_at`,
    [`${orderId}:${numeroIntento}`, JSON.stringify(requestProducts || []), orderId]
  );
  return rows[0];
}

export async function actualizarIntentoCotizacionBD(id, { status, erpNumber = undefined, response = undefined, errorMessage = undefined, completado = false }, conexion = pool) {
  await asegurarTablasErpBD();
  const valores = [id, status];
  const sets = ['status = $2'];
  if (erpNumber !== undefined) { valores.push(erpNumber); sets.push(`erp_number = $${valores.length}`); }
  if (response !== undefined) { valores.push(response === null ? null : JSON.stringify(response)); sets.push(`response = $${valores.length}::jsonb`); }
  if (errorMessage !== undefined) { valores.push(errorMessage); sets.push(`error_message = $${valores.length}`); }
  if (completado) sets.push('completed_at = NOW()');
  const { rowCount } = await conexion.query(`UPDATE erp_quotations SET ${sets.join(', ')} WHERE id = $1`, valores);
  return rowCount > 0;
}

// Último intento en estado `verificar` de un pedido (para la conciliación manual).
export async function obtenerIntentoPendienteBD(orderId) {
  await asegurarTablasErpBD();
  const { rows } = await pool.query(
    `SELECT id, idempotency_key, status, erp_number FROM erp_quotations
      WHERE order_id = $1 AND status = 'verificar' ORDER BY created_at DESC LIMIT 1`,
    [orderId]
  );
  return rows[0] || null;
}

export async function listarIntentosCotizacionBD(orderId) {
  await asegurarTablasErpBD();
  const { rows } = await pool.query(
    'SELECT id, idempotency_key, status, erp_number, request_products, response, error_message, created_at, completed_at FROM erp_quotations WHERE order_id = $1 ORDER BY created_at ASC',
    [orderId]
  );
  return rows;
}
