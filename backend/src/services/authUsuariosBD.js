import { pool } from '../config/database.js';

// Gestión de cuentas de Supabase Auth directamente sobre el esquema `auth`.
// Se usa como respaldo cuando la API pública de Auth no está disponible
// (clave rotada, límite de altas o ausencia de SUPABASE_SERVICE_ROLE_KEY).
// La contraseña se guarda con el mismo hash que usa Supabase (bcrypt vía crypt).

export async function crearUsuarioAuthBD({ email, password }) {
  const correo = String(email || '').trim().toLowerCase();

  // En esta versión de Supabase el correo no tiene restricción única en la tabla,
  // así que se busca antes de insertar para no duplicar la cuenta.
  const { rows: existentes } = await pool.query(
    'SELECT id, email, email_confirmed_at FROM auth.users WHERE lower(email) = $1 ORDER BY created_at LIMIT 1',
    [correo]
  );

  let usuario = existentes[0];
  if (usuario) {
    const { rows } = await pool.query(
      `UPDATE auth.users
       SET encrypted_password = crypt($2, gen_salt('bf')),
           email_confirmed_at = COALESCE(email_confirmed_at, now()),
           updated_at = now()
       WHERE id = $1
       RETURNING id, email, email_confirmed_at`,
      [usuario.id, password]
    );
    usuario = rows[0];
  } else {
    const { rows } = await pool.query(
      `INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
         raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
         confirmation_token, email_change, email_change_token_new, recovery_token)
       VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', $1,
         crypt($2, gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(),
         '', '', '', '')
       RETURNING id, email, email_confirmed_at`,
      [correo, password]
    );
    usuario = rows[0];
  }

  // La columna `email` de auth.identities es generada: no se escribe.
  await pool.query(
    `INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, created_at, updated_at)
     VALUES (gen_random_uuid(), $1::text, $2::uuid,
       jsonb_build_object('sub', $1::text, 'email', $3::text, 'email_verified', TRUE, 'phone_verified', FALSE),
       'email', now(), now())
     ON CONFLICT DO NOTHING`,
    [usuario.id, usuario.id, correo]
  );

  return { id: usuario.id, email: usuario.email, confirmado: Boolean(usuario.email_confirmed_at) };
}

export async function actualizarPasswordAuthBD({ email, password }) {
  const correo = String(email || '').trim().toLowerCase();
  const { rows } = await pool.query(
    `UPDATE auth.users
     SET encrypted_password = crypt($2, gen_salt('bf')),
         email_confirmed_at = COALESCE(email_confirmed_at, now()),
         updated_at = now()
     WHERE email = $1
     RETURNING id, email`,
    [correo, password]
  );
  return rows[0] || null;
}

export async function eliminarUsuarioAuthBD({ id }) {
  if (!id) return;
  await pool.query('DELETE FROM auth.identities WHERE user_id = $1', [id]);
  await pool.query('DELETE FROM auth.users WHERE id = $1', [id]);
}
