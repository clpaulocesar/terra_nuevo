const SUPABASE_URL = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';

function configuracionAdmin() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    const error = new Error('La creación de cuentas requiere SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en el backend.');
    error.codigo = 'SUPABASE_ADMIN_NO_CONFIGURADO';
    throw error;
  }

  return {
    url: SUPABASE_URL,
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
  };
}

async function leerError(respuesta) {
  const data = await respuesta.json().catch(() => ({}));
  return data?.msg || data?.message || data?.error_description || 'No se pudo completar la operación en Supabase Auth.';
}

export async function crearUsuarioSupabase({ email, password }) {
  const { url, headers } = configuracionAdmin();
  const respuesta = await fetch(`${url}/auth/v1/admin/users`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ email, password, email_confirm: true }),
  });

  if (!respuesta.ok) {
    const error = new Error(await leerError(respuesta));
    error.statusCode = respuesta.status === 422 ? 409 : 502;
    throw error;
  }

  const usuario = await respuesta.json();
  if (!usuario?.id) throw new Error('Supabase Auth no devolvió el identificador de la cuenta creada.');
  return usuario;
}

export async function eliminarUsuarioSupabase(id) {
  if (!id) return;
  const { url, headers } = configuracionAdmin();
  await fetch(`${url}/auth/v1/admin/users/${encodeURIComponent(id)}`, { method: 'DELETE', headers });
}
