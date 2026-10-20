import { pool } from '../config/database.js';

let perfilColumnsReady = null;
export function asegurarColumnasPerfilBD() {
  if (!perfilColumnsReady) perfilColumnsReady = (async () => {
    await pool.query('ALTER TABLE customers ADD COLUMN IF NOT EXISTS nit TEXT');
    await pool.query('ALTER TABLE customers ALTER COLUMN nit TYPE TEXT');
    await pool.query('ALTER TABLE customers ADD COLUMN IF NOT EXISTS contact_name TEXT');
    await pool.query('ALTER TABLE customers ADD COLUMN IF NOT EXISTS delivery_address TEXT');
    await pool.query('ALTER TABLE customers ADD COLUMN IF NOT EXISTS delivery_reference TEXT');
    await pool.query('ALTER TABLE customers ADD COLUMN IF NOT EXISTS delivery_lat DOUBLE PRECISION');
    await pool.query('ALTER TABLE customers ADD COLUMN IF NOT EXISTS delivery_lng DOUBLE PRECISION');
  })();
  return perfilColumnsReady;
}

function asegurarColumnaNit() {
  return asegurarColumnasPerfilBD();
}

const camposPerfil = `id, id AS cliente_id, name AS nombre, contact_name AS titular, email,
  phone AS telefono, nit, delivery_address AS direccion, delivery_reference AS referencia,
  delivery_lat AS latitud, delivery_lng AS longitud,
  CASE WHEN delivery_lat IS NOT NULL AND delivery_lng IS NOT NULL
    THEN delivery_lat::text || ', ' || delivery_lng::text END AS gps`;

export async function crearClienteBD({ nombre, telefono, email, nit }) {
  await asegurarColumnaNit();
  const { rows } = await pool.query(
    `INSERT INTO customers (name, phone, email, nit) VALUES ($1,$2,$3,$4)
     RETURNING id, name AS nombre, phone AS telefono, email, nit, created_at AS fecha_registro`,
    [nombre, telefono, email, nit]
  );
  return rows[0];
}

export async function obtenerClienteBD(id) {
  await asegurarColumnaNit();
  const { rows } = await pool.query(`SELECT ${camposPerfil}, created_at AS fecha_registro FROM customers WHERE id=$1`, [id]);
  return rows[0] || null;
}

export async function actualizarPerfilMayoristaBD(clienteId, {
  nombre, titular, telefono, nit, direccion, referencia, latitud, longitud,
}) {
  await asegurarColumnaNit();
  const { rows } = await pool.query(
    `UPDATE customers
     SET name=$2, contact_name=$3, phone=$4, nit=$5, delivery_address=$6,
         delivery_reference=$7, delivery_lat=$8, delivery_lng=$9
     WHERE id=$1
     RETURNING ${camposPerfil}`,
    [clienteId, nombre, titular, telefono, nit, direccion, referencia, latitud, longitud]
  );
  return rows[0] || null;
}

export async function eliminarClienteBD(id) {
  await asegurarColumnaNit();
  // Los pedidos del cliente se conservan: orders.customer_id es ON DELETE SET NULL,
  // por lo que quedan sin cliente asociado (se muestran como "Compra como invitado").
  const pedidos = await pool.query('SELECT COUNT(*)::int AS total FROM orders WHERE customer_id=$1', [id]);
  const { rows } = await pool.query(
    'DELETE FROM customers WHERE id=$1 RETURNING id, name AS nombre',
    [id]
  );
  if (!rows[0]) return null;
  return { ...rows[0], pedidos_desvinculados: pedidos.rows[0].total };
}

export async function listarClientesBD({ buscar = '', limite = 100 } = {}) {
  await asegurarColumnaNit();
  const { rows } = await pool.query(
    `SELECT c.id, c.name AS nombre, c.contact_name AS titular, c.phone AS telefono, c.email, c.nit,
       c.delivery_address AS direccion, c.delivery_reference AS referencia,
       c.delivery_lat AS latitud, c.delivery_lng AS longitud, c.created_at AS fecha_registro,
       MAX(u.role) AS rol,
       COUNT(o.id)::int AS compras, COALESCE(SUM(o.total_minor),0) / 100.0 AS gasto, MAX(o.created_at) AS ultima_compra
     FROM customers c
     LEFT JOIN users u ON u.auth_user_id=c.auth_user_id
     LEFT JOIN orders o ON o.customer_id=c.id
     WHERE c.name ILIKE $1 OR COALESCE(c.contact_name,'') ILIKE $1 OR COALESCE(c.phone,'') ILIKE $1 OR COALESCE(c.email,'') ILIKE $1 OR COALESCE(c.nit,'') ILIKE $1 OR COALESCE(c.delivery_address,'') ILIKE $1
     GROUP BY c.id ORDER BY c.created_at DESC LIMIT $2`, [`%${buscar}%`, limite]
  );
  return rows;
}
