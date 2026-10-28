import { randomUUID } from 'node:crypto';
import { pool } from '../config/database.js';

// Cuentas de clientes mayoristas: `users` (rol, clave) + `customers` (perfil).
// `users.auth_user_id` es una columna heredada que sigue siendo NOT NULL en la base,
// así que se rellena con un UUID local que no se usa para autenticar.
let columnasListas;
export function asegurarColumnasUsuariosBD() {
  if (!columnasListas) {
    columnasListas = (async () => {
      await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT');
      await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS ultimo_login_at TIMESTAMPTZ');
    })().catch((error) => { columnasListas = null; throw error; });
  }
  return columnasListas;
}

const errorConCodigo = (statusCode, mensaje) => Object.assign(new Error(mensaje), { statusCode });

// Alta desde el admin: cliente + usuario en una sola transacción, sin servicios externos.
export async function crearPerfilMayoristaBD({ nombre, email, telefono, nit, passwordHash }) {
  await asegurarColumnasUsuariosBD();
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');

    const existente = await cliente.query('SELECT 1 FROM users WHERE lower(email)=lower($1) LIMIT 1', [email]);
    if (existente.rowCount) throw errorConCodigo(409, 'Ya existe un usuario registrado con este correo.');

    const authUserId = randomUUID();
    const customerResult = await cliente.query(
      `INSERT INTO customers (auth_user_id, name, email, phone, nit)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING id, name AS nombre, email, phone AS telefono, nit, created_at AS fecha_registro`,
      [authUserId, nombre, email, telefono, nit]
    );

    await cliente.query(
      `INSERT INTO users (auth_user_id, name, email, role, is_active, password_hash)
       VALUES ($1,$2,$3,'mayorista',TRUE,$4)`,
      [authUserId, nombre, email, passwordHash]
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

// Devuelve el usuario con su hash solo para validar el login; nunca se expone.
export async function buscarMayoristaPorEmailBD(email) {
  await asegurarColumnasUsuariosBD();
  const { rows } = await pool.query(
    `SELECT u.id, u.auth_user_id, u.email, u.role AS rol, u.is_active AS activo, u.password_hash,
            c.id AS cliente_id
       FROM users u
       LEFT JOIN customers c ON c.auth_user_id = u.auth_user_id
      WHERE lower(u.email) = lower($1)
      ORDER BY u.created_at ASC
      LIMIT 1`,
    [String(email || '').trim()]
  );
  return rows[0] || null;
}

export async function registrarLoginMayoristaBD(userId) {
  await asegurarColumnasUsuariosBD();
  await pool.query('UPDATE users SET ultimo_login_at = NOW() WHERE id = $1', [userId]);
}

// Asigna o resetea la clave de un mayorista a partir del id del cliente (customers.id).
export async function actualizarClaveMayoristaBD(clienteId, passwordHash) {
  await asegurarColumnasUsuariosBD();
  const { rows } = await pool.query(
    `UPDATE users u
        SET password_hash = $2, updated_at = NOW()
       FROM customers c
      WHERE c.id = $1 AND u.auth_user_id = c.auth_user_id AND u.role = 'mayorista'
      RETURNING u.id, u.email`,
    [clienteId, passwordHash]
  );
  return rows[0] || null;
}
