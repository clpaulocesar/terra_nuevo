import { pool } from '../config/database.js';

let tablaLista;

async function asegurarTablaPersonal() {
  if (!tablaLista) {
    tablaLista = pool.query(`
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
  }
  await tablaLista;
}

export async function listarPersonalBD() {
  await asegurarTablaPersonal();
  const { rows } = await pool.query(`
    SELECT id, name AS nombre, email, role AS rol, is_active AS activo, created_at AS fecha_registro
    FROM staff_accounts
    ORDER BY created_at DESC
  `);
  return rows;
}

export async function crearPersonalBD({ authUserId, nombre, email, rol }) {
  await asegurarTablaPersonal();
  const { rows } = await pool.query(`
    INSERT INTO staff_accounts (auth_user_id, name, email, role)
    VALUES ($1, $2, $3, $4)
    RETURNING id, name AS nombre, email, role AS rol, is_active AS activo, created_at AS fecha_registro
  `, [authUserId, nombre, email, rol]);
  return rows[0];
}

export async function obtenerPersonalPorEmailBD(email) {
  await asegurarTablaPersonal();
  const { rows } = await pool.query(`
    SELECT id, auth_user_id, name AS nombre, email, role AS rol, is_active AS activo, created_at AS fecha_registro
    FROM staff_accounts
    WHERE LOWER(email) = LOWER($1)
    LIMIT 1
  `, [email]);
  return rows[0] || null;
}

