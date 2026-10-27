import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Client } = require('../backend/node_modules/pg');

function resolverSsl(url) {
  const forzado = String(process.env.DB_SSL ?? process.env.DATABASE_SSL ?? '').trim().toLowerCase();
  if (forzado === 'true') return { rejectUnauthorized: false };
  if (forzado === 'false') return undefined;
  return /supabase|pooler/.test(url || '') ? { rejectUnauthorized: false } : undefined;
}

const cliente = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: resolverSsl(process.env.DATABASE_URL),
});

try {
  await cliente.connect();
  await cliente.query('BEGIN');

  await cliente.query(`
    CREATE TABLE IF NOT EXISTS producto_sucursales (
      product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      sucursal_id BIGINT NOT NULL REFERENCES sucursales(id_sucursal) ON DELETE RESTRICT,
      stock_disponible NUMERIC NOT NULL DEFAULT 0 CHECK (stock_disponible >= 0),
      activo BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (product_id, sucursal_id)
    )
  `);

  const central = await cliente.query(`
    INSERT INTO sucursales (nombre, direccion, activo)
    SELECT 'TERRA Central', 'Dirección por configurar', TRUE
    WHERE NOT EXISTS (
      SELECT 1
      FROM sucursales
      WHERE lower(nombre) = lower('TERRA Central')
    )
    RETURNING id_sucursal
  `);

  const sucursalId = central.rows[0]?.id_sucursal ?? (await cliente.query(`
    SELECT id_sucursal
    FROM sucursales
    WHERE lower(nombre) = lower('TERRA Central')
    LIMIT 1
  `)).rows[0]?.id_sucursal;

  if (!sucursalId) {
    throw new Error('No se pudo crear ni encontrar la sucursal TERRA Central.');
  }

  const asignacion = await cliente.query(`
    INSERT INTO producto_sucursales (product_id, sucursal_id, stock_disponible, activo)
    SELECT
      id,
      $1,
      GREATEST(COALESCE(stock_quantity, 0), 0),
      COALESCE(is_active, activo, TRUE)
    FROM products
    ON CONFLICT (product_id, sucursal_id) DO NOTHING
  `, [sucursalId]);

  const total = await cliente.query(`
    SELECT count(*)::int AS productos_asignados
    FROM producto_sucursales
    WHERE sucursal_id = $1
  `, [sucursalId]);

  await cliente.query('COMMIT');
  console.log(JSON.stringify({
    sucursal: 'TERRA Central',
    sucursalId,
    nuevasAsignaciones: asignacion.rowCount,
    productosAsignados: total.rows[0].productos_asignados,
  }, null, 2));
} catch (error) {
  await cliente.query('ROLLBACK').catch(() => {});
  throw error;
} finally {
  await cliente.end();
}
