// Almacenamiento de imágenes de producto en el copyparty propio (COPYPARTY_URL).
// El navegador nunca habla con copyparty: todo pasa por el backend.
// Subida: PUT {COPYPARTY_URL}/{carpeta}/{nombre}?j -> JSON con `fileurl`.
// Si COPYPARTY_PASSWORD tiene valor se envía en la cabecera PW; si está vacía, se sube
// sin autenticación. La falta de credenciales nunca impide arrancar ni subir.
function configuracion() {
  return {
    url: String(process.env.COPYPARTY_URL || '').trim().replace(/\/+$/, ''),
    carpetaProductos: String(process.env.COPYPARTY_CARPETA_PRODUCTOS || 'imagens').trim().replace(/^\/+|\/+$/g, '') || 'imagens',
    password: String(process.env.COPYPARTY_PASSWORD || ''),
    timeoutMs: Number(process.env.COPYPARTY_TIMEOUT_MS) || 30000,
  };
}

export function carpetaProductos() {
  return configuracion().carpetaProductos;
}

// Error tipado: config (falta COPYPARTY_URL), rechazado (4xx del servidor de archivos),
// no_disponible (red, timeout, 5xx o respuesta inesperada).
export class ErrorAlmacenamiento extends Error {
  constructor(tipo, mensaje, { httpStatus = null } = {}) {
    super(mensaje);
    this.name = 'ErrorAlmacenamiento';
    this.tipo = tipo;
    this.httpStatus = httpStatus;
  }
}

// Tipos permitidos y su extensión. Se detectan por los primeros bytes, no por el nombre.
export const TIPOS_IMAGEN = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

export function detectarTipoImagen(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  return null;
}

// Base del nombre sin espacios, tildes ni símbolos (solo letras, números, guion y guion bajo).
export function limpiarNombreBase(texto) {
  const limpio = String(texto || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9_-]+/g, '')
    .slice(0, 60);
  return limpio || 'producto';
}

// yyyymmddHHMMss en hora de Bolivia.
export function marcaTiempo(fecha = new Date()) {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/La_Paz', hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(fecha).reduce((m, p) => ((m[p.type] = p.value), m), {});
  return `${partes.year}${partes.month}${partes.day}${partes.hour === '24' ? '00' : partes.hour}${partes.minute}${partes.second}`;
}

// {codigo_terra}_{yyyymmddHHMMss}_{n}.{ext}; sin codigo_terra se usa el id del producto.
export function nombreArchivoProducto({ codigoTerra = null, productoId = null, extension, n = 1, fecha = new Date() }) {
  const base = limpiarNombreBase(codigoTerra || productoId);
  return `${base}_${marcaTiempo(fecha)}_${Math.max(1, Number(n) || 1)}.${String(extension || 'jpg').replace(/^\./, '')}`;
}

// Sube un archivo y devuelve { url, nombre, sha512 } con la URL pública final (fileurl).
export async function subirArchivo({ carpeta, nombre, buffer, tipo }) {
  const cfg = configuracion();
  if (!cfg.url) throw new ErrorAlmacenamiento('config', 'Falta COPYPARTY_URL en backend/.env: no hay dónde guardar las imágenes.');
  const carpetaLimpia = String(carpeta || cfg.carpetaProductos).replace(/^\/+|\/+$/g, '');
  const destino = `${cfg.url}/${carpetaLimpia}/${encodeURIComponent(nombre)}?j`;
  const headers = { 'Content-Type': tipo || 'application/octet-stream', Accept: 'application/json' };
  if (cfg.password) headers.PW = cfg.password;

  let respuesta;
  try {
    respuesta = await fetch(destino, { method: 'PUT', headers, body: buffer, signal: AbortSignal.timeout(cfg.timeoutMs) });
  } catch (error) {
    const esTimeout = error?.name === 'TimeoutError' || error?.name === 'AbortError';
    throw new ErrorAlmacenamiento('no_disponible', esTimeout
      ? `El servidor de archivos no respondió en ${cfg.timeoutMs} ms.`
      : `No se pudo conectar con el servidor de archivos: ${error?.cause?.code || error?.message || 'error de red'}.`);
  }

  if (respuesta.status === 401 || respuesta.status === 403) {
    throw new ErrorAlmacenamiento('rechazado', `El servidor de archivos rechazó la subida (HTTP ${respuesta.status}). Revisá COPYPARTY_PASSWORD y los permisos de la carpeta.`, { httpStatus: respuesta.status });
  }
  if (respuesta.status >= 400 && respuesta.status < 500) {
    throw new ErrorAlmacenamiento('rechazado', `El servidor de archivos rechazó la subida (HTTP ${respuesta.status}).`, { httpStatus: respuesta.status });
  }
  if (respuesta.status >= 500) {
    throw new ErrorAlmacenamiento('no_disponible', `El servidor de archivos falló (HTTP ${respuesta.status}).`, { httpStatus: respuesta.status });
  }
  const cuerpo = await respuesta.json().catch(() => null);
  const url = String(cuerpo?.fileurl || '').trim();
  if (!url) throw new ErrorAlmacenamiento('no_disponible', 'El servidor de archivos no devolvió la URL del archivo (fileurl).', { httpStatus: respuesta.status });
  return { url, nombre, sha512: cuerpo?.sha512 || null };
}
