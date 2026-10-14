import { pool } from '../config/database.js';

export async function crearClienteBD({ nombre, telefono, email }) {
  const { rows } = await pool.query(
    `INSERT INTO customers (name, phone, email) VALUES ($1,$2,$3)
     RETURNING id, name AS nombre, phone AS telefono, email, created_at AS fecha_registro`,
    [nombre, telefono, email]
  );
  return rows[0];
}

export async function obtenerClienteBD(id) {
  const { rows } = await pool.query(`SELECT id, name AS nombre, phone AS telefono, email, created_at AS fecha_registro FROM customers WHERE id=$1`, [id]);
  return rows[0] || null;
}

export async function listarClientesBD({ buscar = '', limite = 100 } = {}) {
  const { rows } = await pool.query(
    `SELECT c.id, c.name AS nombre, c.phone AS telefono, c.email, c.created_at AS fecha_registro,
       COUNT(o.id)::int AS compras, COALESCE(SUM(o.total_minor),0) / 100.0 AS gasto, MAX(o.created_at) AS ultima_compra
     FROM customers c LEFT JOIN orders o ON o.customer_id=c.id
     WHERE c.name ILIKE $1 OR COALESCE(c.phone,'') ILIKE $1 OR COALESCE(c.email,'') ILIKE $1
     GROUP BY c.id ORDER BY c.created_at DESC LIMIT $2`, [`%${buscar}%`, limite]
  );
  return rows;
}
