import { pool } from '../config/database.js';
import { asegurarColumnasPerfilBD } from '../models/clienteModel.js';

export async function obtenerMayoristaDesdeToken(authorization) {
  const token = String(authorization || '').replace(/^Bearer\s+/i, '');
  const url = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const key = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!token || !url || !key) return null;
  const respuesta = await fetch(`${url}/auth/v1/user`, { headers: { apikey: key, Authorization: `Bearer ${token}` } });
  const usuario = await respuesta.json().catch(() => null);
  if (!respuesta.ok || !usuario?.id) return null;
  await asegurarColumnasPerfilBD();
  const perfil = await pool.query(
    `SELECT c.id AS cliente_id, c.name AS nombre, c.contact_name AS titular, c.email,
            c.phone AS telefono, c.nit, c.delivery_address AS direccion,
            c.delivery_reference AS referencia, c.delivery_lat AS latitud,
            c.delivery_lng AS longitud,
            CASE WHEN c.delivery_lat IS NOT NULL AND c.delivery_lng IS NOT NULL
              THEN c.delivery_lat::text || ', ' || c.delivery_lng::text END AS gps,
            u.role AS rol
     FROM users u
     LEFT JOIN customers c ON c.auth_user_id=u.auth_user_id
     WHERE u.auth_user_id=$1 AND u.is_active=TRUE LIMIT 1`,
    [usuario.id]
  );
  return perfil.rowCount && perfil.rows[0].rol === 'mayorista' ? perfil.rows[0] : null;
}
