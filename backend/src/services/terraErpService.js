const TIMEOUT_IMAGEN_MS = 60_000;
let tokenActual = null;

function configuracion() {
  const baseUrl = String(process.env.TERRA_ERP_BASE_URL || '').trim().replace(/\/$/, '');
  const usuario = String(process.env.TERRA_ERP_API_USER || '').trim();
  const clave = String(process.env.TERRA_ERP_API_PASSWORD || '');
  if (!baseUrl || !usuario || !clave) {
    const error = new Error('Falta configurar TERRA_ERP_BASE_URL, TERRA_ERP_API_USER o TERRA_ERP_API_PASSWORD.');
    error.statusCode = 503;
    throw error;
  }
  return { baseUrl, usuario, clave };
}

async function solicitarToken() {
  const { baseUrl, usuario, clave } = configuracion();
  const respuesta = await fetch(`${baseUrl}/api/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario, clave }),
    signal: AbortSignal.timeout(15_000),
  });
  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok || !datos.token) {
    const error = new Error(datos?.error?.mensaje || 'No se pudo autenticar con el ERP TERRA.');
    error.statusCode = 502;
    throw error;
  }
  tokenActual = { valor: datos.token, venceEn: Date.now() + Math.max(60, Number(datos.expiraEnSegundos || 28_800) - 60) * 1000 };
  return tokenActual.valor;
}

async function token() {
  return tokenActual?.venceEn > Date.now() ? tokenActual.valor : solicitarToken();
}

async function llamada(ruta, opciones = {}, { timeout = 15_000 } = {}) {
  const { baseUrl } = configuracion();
  for (let intento = 0; intento < 2; intento += 1) {
    const respuesta = await fetch(`${baseUrl}${ruta}`, {
      ...opciones,
      headers: { Authorization: `Bearer ${await token()}`, ...(opciones.headers || {}) },
      signal: AbortSignal.timeout(timeout),
    });
    const datos = await respuesta.json().catch(() => ({}));
    if (respuesta.status === 401 && intento === 0) { tokenActual = null; continue; }
    if (!respuesta.ok) {
      const error = new Error(datos?.error?.mensaje || `ERP TERRA respondió HTTP ${respuesta.status}.`);
      error.statusCode = respuesta.status === 404 ? 404 : 502;
      error.codigoErp = datos?.error?.codigo;
      error.detalles = datos?.error?.detalles;
      throw error;
    }
    return datos;
  }
}

export function obtenerProductoErp(codigo) {
  return llamada(`/api/productos/codigo/${encodeURIComponent(codigo)}`);
}

export function obtenerImagenesProductoErp(codigo) {
  return llamada(`/api/productos/codigo/${encodeURIComponent(codigo)}/imagenes`, {}, { timeout: TIMEOUT_IMAGEN_MS });
}

export function registrarCotizacionErp(productos) {
  return llamada('/api/cotizaciones', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productos }),
  });
}

export async function guardarImagenesErpEnSupabase(codigoTerra, imagenes = []) {
  if (!imagenes.length) return [];
  const url = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const clave = String(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '');
  const bucket = String(process.env.SUPABASE_STORAGE_BUCKET || 'product-images');
  if (!url || !clave) throw new Error('La sincronización de imágenes requiere SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.');
  const base = String(codigoTerra).replace(/[^a-zA-Z0-9_-]/g, '_');
  const urls = [];
  for (const [indice, imagen] of imagenes.entries()) {
    const tipo = String(imagen.tipo || 'image/jpeg');
    if (!tipo.startsWith('image/')) throw new Error('El ERP devolvió un archivo que no es imagen.');
    const bytes = Buffer.from(String(imagen.base64 || ''), 'base64');
    if (!bytes.length || bytes.length > 15 * 1024 * 1024) throw new Error('Una imagen ERP es inválida o supera 15 MB.');
    const extension = tipo.split('/')[1]?.replace(/[^a-z0-9]/gi, '') || 'jpg';
    const ruta = `productos/erp/${base}/${indice + 1}.${extension}`;
    const respuesta = await fetch(`${url}/storage/v1/object/${bucket}/${ruta}`, {
      method: 'POST',
      headers: { apikey: clave, Authorization: `Bearer ${clave}`, 'Content-Type': tipo, 'x-upsert': 'true' },
      body: bytes,
      signal: AbortSignal.timeout(TIMEOUT_IMAGEN_MS),
    });
    if (!respuesta.ok) throw new Error(`No se pudo guardar una imagen ERP en Supabase Storage (HTTP ${respuesta.status}).`);
    urls.push(`${url}/storage/v1/object/public/${bucket}/${ruta}`);
  }
  return urls;
}
