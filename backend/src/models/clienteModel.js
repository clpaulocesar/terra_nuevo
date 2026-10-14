
import { pool } from '../config/database.js';

export async function crearClienteBD(datos) {
  const { nombre, telefono, email } = datos;

  const resultado = await pool.query(
    `INSERT INTO clientes (nombre, telefono, email)
     VALUES ($1, $2, $3)
     RETURNING id, nombre, telefono, email, fecha_registro`,
    [nombre, telefono, email]
  );

  return resultado.rows[0];
}

export async function obtenerClienteBD(id) {
  const resultado = await pool.query(
    `SELECT id, nombre, telefono, email, fecha_registro
     FROM clientes
     WHERE id = $1`,
    [id]
  );

  return resultado.rows[0] || null;
}
