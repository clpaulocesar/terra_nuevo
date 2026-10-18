import { pool } from '../config/database.js';

export async function crearPerfilMayoristaBD({ authUserId, nombre, email, telefono, nit }) {
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');

    const existente = await cliente.query(
      `SELECT 1 FROM users WHERE auth_user_id=$1 OR lower(email)=lower($2) LIMIT 1`,
      [authUserId, email]
    );
    if (existente.rowCount) {
      const error = new Error('Ya existe un usuario registrado con este correo.');
      error.statusCode = 409;
      throw error;
    }

    const customerResult = await cliente.query(
      `INSERT INTO customers (auth_user_id, name, email, phone, nit)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING id, name AS nombre, email, phone AS telefono, nit, created_at AS fecha_registro`,
      [authUserId, nombre, email, telefono, nit]
    );

    await cliente.query(
      `INSERT INTO users (auth_user_id, name, email, role, is_active)
       VALUES ($1,$2,$3,'mayorista',TRUE)`,
      [authUserId, nombre, email]
    );

    await cliente.query('COMMIT');
    return { ...customerResult.rows[0], rol: 'mayorista', compras: 0, gasto: 0 };
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }
}
