import { randomUUID } from 'node:crypto';
import { pool } from '../config/database.js';

let tablaLista;

async function asegurarTablaPersonal() {
  if (!tablaLista) {
    tablaLista = (async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS staff_accounts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          auth_user_id UUID,
          name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT,
          role TEXT NOT NULL CHECK (role IN ('admin', 'vendedor', 'despacho')),
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      // Datos del reparto y columnas requeridas de forma idempotente
      await Promise.all([
        pool.query('ALTER TABLE staff_accounts ADD COLUMN IF NOT EXISTS password_hash TEXT'),
        pool.query('ALTER TABLE staff_accounts ADD COLUMN IF NOT EXISTS vehicle TEXT'),
        pool.query('ALTER TABLE staff_accounts ADD COLUMN IF NOT EXISTS plate TEXT'),
        pool.query('ALTER TABLE staff_accounts ALTER COLUMN auth_user_id DROP NOT NULL').catch(() => {}),
      ]);
    })().catch((error) => {
      tablaLista = null;
      throw error;
    });
  }
  await tablaLista;
  return tablaLista;
}

export { asegurarTablaPersonal };

const CAMPOS_PERSONAL = 'id, name AS nombre, email, role AS rol, is_active AS activo, created_at AS fecha_registro, vehicle AS vehiculo, plate AS placa';

export async function listarPersonalBD() {
  await asegurarTablaPersonal();
  const { rows } = await pool.query(`
    SELECT ${CAMPOS_PERSONAL}
    FROM staff_accounts
    ORDER BY created_at DESC
  `);
  return rows;
}

// Repartidores disponibles para asignar envíos (rol despacho).
export async function listarRepartidoresBD() {
  await asegurarTablaPersonal();
  const { rows } = await pool.query(`
    SELECT ${CAMPOS_PERSONAL}
    FROM staff_accounts
    WHERE role = 'despacho'
    ORDER BY is_active DESC, name ASC
  `);
  return rows;
}

export async function obtenerPersonalBD(id) {
  await asegurarTablaPersonal();
  const { rows } = await pool.query(`SELECT ${CAMPOS_PERSONAL} FROM staff_accounts WHERE id = $1 LIMIT 1`, [id]);
  return rows[0] || null;
}

export async function crearPersonalBD({ nombre, email, rol, passwordHash, vehiculo = null, placa = null }) {
  await asegurarTablaPersonal();
  // `auth_user_id` es legado de cuando el personal se autenticaba con Supabase.
  // La columna sigue siendo NOT NULL en bases existentes, así que se rellena con
  // un UUID local que ya no se usa para autenticar.
  const authUserId = randomUUID();
  const { rows } = await pool.query(`
    INSERT INTO staff_accounts (auth_user_id, name, email, password_hash, role, vehicle, plate)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING ${CAMPOS_PERSONAL}
  `, [authUserId, nombre, email, passwordHash, rol, vehiculo, placa]);
  return rows[0];
}

// Actualiza los datos editables del reparto (nombre, vehículo, placa y estado).
// Si se recibe passwordHash, también cambia la contraseña de acceso.
export async function actualizarPersonalBD(id, { nombre, vehiculo = null, placa = null, activo = null, passwordHash = null }) {
  await asegurarTablaPersonal();
  const { rows } = await pool.query(`
    UPDATE staff_accounts
       SET name = $2,
           vehicle = $3,
           plate = $4,
           is_active = COALESCE($5, is_active),
           password_hash = COALESCE($6, password_hash)
     WHERE id = $1
     RETURNING ${CAMPOS_PERSONAL}
  `, [id, nombre, vehiculo, placa, activo, passwordHash]);
  return rows[0] || null;
}

// Elimina la cuenta operativa y libera los pedidos que todavía la tenían asignada.
export async function eliminarPersonalBD(id) {
  await asegurarTablaPersonal();
  const conexion = await pool.connect();
  try {
    await conexion.query('BEGIN');
    await conexion.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_driver_id UUID');
    await conexion.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_assigned_at TIMESTAMPTZ');
    const cuenta = await conexion.query(
      'SELECT id FROM staff_accounts WHERE id = $1 FOR UPDATE',
      [id],
    );
    if (!cuenta.rowCount) {
      await conexion.query('ROLLBACK');
      return null;
    }
    await conexion.query(
      'UPDATE orders SET delivery_driver_id = NULL, delivery_assigned_at = NULL WHERE delivery_driver_id = $1',
      [id],
    );
    await conexion.query('DELETE FROM staff_accounts WHERE id = $1', [id]);
    await conexion.query('COMMIT');
    return cuenta.rows[0];
  } catch (error) {
    await conexion.query('ROLLBACK');
    throw error;
  } finally {
    conexion.release();
  }
}

// Busca una cuenta del equipo (staff_accounts) por correo.
// Devuelve `password_hash` solo para validar el login; nunca se expone en las
// respuestas de listado, que usan CAMPOS_PERSONAL.
export async function buscarCuentaStaffBD(email) {
  await asegurarTablaPersonal();
  const correo = String(email || '').trim().toLowerCase();
  if (!correo) return null;
  const { rows } = await pool.query(`
    SELECT id, name AS nombre, email, role AS rol, is_active AS activo,
           vehicle AS vehiculo, plate AS placa, password_hash
    FROM staff_accounts
    WHERE lower(email) = $1
    LIMIT 1
  `, [correo]);
  if (!rows.length) return null;
  const cuenta = rows[0];
  return { ...cuenta, activo: cuenta.activo !== false };
}
