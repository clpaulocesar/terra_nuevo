import { pool } from '../config/database.js';

export async function obtenerMayoristaDesdeToken(authorization) {
  const token = String(authorization || '').replace(/^Bearer\s+/i, '');
  const url = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const key = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!token || !url || !key) return null;
  const respuesta = await fetch(`${url}/auth/v1/user`, { headers: { apikey: key, Authorization: `Bearer ${token}` } });
  const usuario = await respuesta.json().catch(() => null);
  if (!respuesta.ok || !usuario?.id) return null;
  const perfil = await pool.query(`SELECT c.id AS cliente_id,c.name AS nombre,c.email,c.phone AS telefono,c.nit,u.role AS rol FROM users u LEFT JOIN customers c ON c.auth_user_id=u.auth_user_id WHERE u.auth_user_id=$1 AND u.is_active=TRUE LIMIT 1`, [usuario.id]);
  return perfil.rowCount && perfil.rows[0].rol === 'mayorista' ? perfil.rows[0] : null;
}
