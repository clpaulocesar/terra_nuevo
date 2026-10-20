const SUPABASE_URL = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';
const PUBLIC_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || '';

function configuracionSupabase({ requiereAdmin = false } = {}) {
  const key = SERVICE_ROLE_KEY || (!requiereAdmin ? PUBLIC_KEY : '');
  if (!SUPABASE_URL || !key) {
    const error = new Error(requiereAdmin
      ? 'Esta operación requiere SUPABASE_SERVICE_ROLE_KEY en el backend.'
      : 'Falta SUPABASE_URL o una clave pública de Supabase en el backend.');
    error.codigo = 'SUPABASE_NO_CONFIGURADO';
    throw error;
  }

  return {
    url: SUPABASE_URL,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
  };
}

async function leerError(respuesta) {
  const data = await respuesta.json().catch(() => ({}));
  return data?.msg || data?.message || data?.error_description || 'No se pudo completar la operación en Supabase Auth.';
}

export async function crearUsuarioSupabase({ email, password }) {
  const conPermisoAdmin = Boolean(SERVICE_ROLE_KEY);
  const { url, headers } = configuracionSupabase();
  const respuesta = await fetch(`${url}${conPermisoAdmin ? '/auth/v1/admin/users' : '/auth/v1/signup'}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ email, password, email_confirm: true }),
  });

  if (!respuesta.ok) {
    const error = new Error(await leerError(respuesta));
    error.statusCode = respuesta.status === 422 ? 409 : 502;
    throw error;
  }

  const data = await respuesta.json();
  const usuario = conPermisoAdmin ? data : data?.user;
  if (!usuario?.id) throw new Error('Supabase Auth no devolvió el identificador de la cuenta creada.');
  if (!conPermisoAdmin && Array.isArray(usuario.identities) && usuario.identities.length === 0) {
    const error = new Error('Ya existe una cuenta de Supabase con este correo.');
    error.statusCode = 409;
    throw error;
  }
  return usuario;
}

export async function eliminarUsuarioSupabase(id) {
  // La API pública no puede borrar cuentas. La compensación se hace solo cuando
  // hay service role; el flujo temporal registra primero los datos validados.
  if (!id || !SERVICE_ROLE_KEY) return;
  const { url, headers } = configuracionSupabase({ requiereAdmin: true });
  await fetch(`${url}/auth/v1/admin/users/${encodeURIComponent(id)}`, { method: 'DELETE', headers });
}

export async function autenticarUsuarioSupabase({ email, password }) {
  const { url } = configuracionSupabase();
  const key = PUBLIC_KEY || SERVICE_ROLE_KEY;
  const respuesta = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      apikey: key,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!respuesta.ok) return null;

  const data = await respuesta.json().catch(() => null);
  return data?.user || null;
}

