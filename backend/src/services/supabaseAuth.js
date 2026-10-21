import { crearUsuarioAuthBD, eliminarUsuarioAuthBD } from './authUsuariosBD.js';

const SUPABASE_URL = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';
const PUBLIC_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || '';
// La clave pública puede venir rotada: se prueban ambas hasta que una responda.
const PUBLIC_KEYS = [process.env.SUPABASE_ANON_KEY, process.env.SUPABASE_PUBLISHABLE_KEY]
  .map((clave) => String(clave || '').trim())
  .filter(Boolean);

let clavePublicaValida;

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

// Devuelve la primera clave pública que Supabase acepte (anon o publishable).
async function obtenerClavePublica() {
  if (clavePublicaValida) return clavePublicaValida;
  if (!SUPABASE_URL || !PUBLIC_KEYS.length) {
    const error = new Error('Falta SUPABASE_URL o una clave pública de Supabase en el backend.');
    error.codigo = 'SUPABASE_NO_CONFIGURADO';
    throw error;
  }
  for (const key of PUBLIC_KEYS) {
    const respuesta = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    const cuerpo = await respuesta.text().catch(() => '');
    if (respuesta.ok && !/Invalid API key/i.test(cuerpo)) {
      clavePublicaValida = key;
      return key;
    }
  }
  const error = new Error('La clave pública de Supabase no es válida para este proyecto.');
  error.codigo = 'SUPABASE_CLAVE_INVALIDA';
  throw error;
}

async function leerError(respuesta) {
  const data = await respuesta.json().catch(() => ({}));
  return data?.msg || data?.message || data?.error_description || 'No se pudo completar la operación en Supabase Auth.';
}

export async function crearUsuarioSupabase({ email, password }) {
  const conPermisoAdmin = Boolean(SERVICE_ROLE_KEY);
  const url = SUPABASE_URL;
  let key = conPermisoAdmin ? SERVICE_ROLE_KEY : null;
  let errorApi = null;

  if (key) {
    const headers = {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    };
    const respuesta = await fetch(`${url}/auth/v1/admin/users`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ email, password, email_confirm: true }),
    });
    if (!respuesta.ok) {
      errorApi = new Error(await leerError(respuesta));
      errorApi.statusCode = respuesta.status === 422 ? 409 : 502;
    } else {
      const data = await respuesta.json();
      if (!data?.id) throw new Error('Supabase Auth no devolvió el identificador de la cuenta creada.');
      return data;
    }
  } else {
    // Sin service role se usa el alta pública, que puede fallar por clave rotada
    // o por el límite de altas del proyecto.
    try {
      key = await obtenerClavePublica();
      const headers = {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      };
      const respuesta = await fetch(`${url}/auth/v1/signup`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ email, password, email_confirm: true }),
      });
      if (!respuesta.ok) {
        errorApi = new Error(await leerError(respuesta));
        errorApi.statusCode = respuesta.status === 422 ? 409 : 502;
      } else {
        const data = await respuesta.json();
        const usuario = data?.user || data;
        if (!usuario?.id) throw new Error('Supabase Auth no devolvió el identificador de la cuenta creada.');
        return usuario;
      }
    } catch (error) {
      errorApi = error;
    }
  }

  // Respaldo: alta directa sobre el esquema auth de la base de datos.
  try {
    return await crearUsuarioAuthBD({ email, password });
  } catch (error) {
    throw errorApi || error;
  }
}

export async function eliminarUsuarioSupabase(id) {
  if (!id) return;
  // La API pública no puede borrar cuentas: la compensación se hace sobre el
  // esquema auth de la base de datos.
  if (SERVICE_ROLE_KEY) {
    const { url, headers } = configuracionSupabase({ requiereAdmin: true });
    const respuesta = await fetch(`${url}/auth/v1/admin/users/${encodeURIComponent(id)}`, { method: 'DELETE', headers });
    if (respuesta.ok) return;
  }
  await eliminarUsuarioAuthBD({ id }).catch(() => {});
}

// Verifica correo y contraseña contra Supabase Auth.
// Devuelve { ok: true } o { ok: false, mensaje } con el motivo real del rechazo.
export async function verificarCredencialesSupabase({ email, password }) {
  if (!SUPABASE_URL) return { ok: false, mensaje: 'Supabase no está configurado en el backend.' };
  const key = await obtenerClavePublica();
  const respuesta = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  if (respuesta.ok) return { ok: true };
  const data = await respuesta.json().catch(() => ({}));
  const detalle = String(data.msg || data.message || data.error_description || '');
  if (/not confirmed/i.test(detalle)) {
    return { ok: false, mensaje: 'La cuenta todavía no fue confirmada. Revisá el correo de invitación.' };
  }
  if (/Invalid login credentials/i.test(detalle)) {
    return { ok: false, mensaje: 'Credenciales inválidas.' };
  }
  return { ok: false, mensaje: detalle || 'No se pudo validar la cuenta.' };
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

