import { pool } from '../config/database.js';

let tablaLista;

async function asegurarTablaPersonal() {
  if (!tablaLista) {
    tablaLista = (async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS staff_accounts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          auth_user_id UUID NOT NULL UNIQUE,
          name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          role TEXT NOT NULL CHECK (role IN ('admin', 'vendedor', 'despacho')),
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      // Datos del reparto (solo aplican al rol despacho). Se agregan aparte
      // para no recrear la tabla en instalaciones que ya existen.
      await Promise.all([
        pool.query('ALTER TABLE staff_accounts ADD COLUMN IF NOT EXISTS vehicle TEXT'),
        pool.query('ALTER TABLE staff_accounts ADD COLUMN IF NOT EXISTS plate TEXT'),
      ]);
    })();
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

export async function crearPersonalBD({ authUserId, nombre, email, rol, vehiculo = null, placa = null }) {
  await asegurarTablaPersonal();
  const { rows } = await pool.query(`
    INSERT INTO staff_accounts (auth_user_id, name, email, role, vehicle, plate)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING ${CAMPOS_PERSONAL}
  `, [authUserId, nombre, email, rol, vehiculo, placa]);
  return rows[0];
}

// Actualiza los datos editables del reparto (nombre, vehículo, placa y estado).
export async function actualizarPersonalBD(id, { nombre, vehiculo = null, placa = null, activo = null }) {
  await asegurarTablaPersonal();
  const { rows } = await pool.query(`
    UPDATE staff_accounts
       SET name = $2,
           vehicle = $3,
           plate = $4,
           is_active = COALESCE($5, is_active)
     WHERE id = $1
     RETURNING ${CAMPOS_PERSONAL}
  `, [id, nombre, vehiculo, placa, activo]);
  return rows[0] || null;
}

// Busca una cuenta del equipo (staff_accounts) por correo.
// Si además existe en la tabla `users` (clientes), se toma el rol de staff.
export async function buscarCuentaStaffBD(email) {
  await asegurarTablaPersonal();
  const correo = String(email || '').trim().toLowerCase();
  if (!correo) return null;
  const { rows } = await pool.query(`
    SELECT id, auth_user_id, name AS nombre, email, role AS rol, is_active AS activo,
           vehicle AS vehiculo, plate AS placa
    FROM staff_accounts
    WHERE lower(email) = $1
    LIMIT 1
  `, [correo]);
  if (!rows.length) return null;
  const cuenta = rows[0];
  return { ...cuenta, activo: cuenta.activo !== false };
}
