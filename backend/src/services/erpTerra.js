import https from 'node:https';
import fs from 'node:fs';

// Cliente de la API del ERP de TERRA ("API TERRA – Guía de conexión v1.2").
// Toda la configuración se lee en el momento de usarla: `dotenv` se carga en
// `server.js`/`app.js` después de que ESM resuelva los imports, así que leerla al
// importar el módulo daría valores vacíos.
function configuracion() {
  return {
    habilitado: String(process.env.TERRA_ERP_HABILITADO ?? 'true').trim().toLowerCase() !== 'false',
    url: String(process.env.TERRA_ERP_URL || '').trim().replace(/\/+$/, ''),
    usuario: String(process.env.TERRA_ERP_API_USER || ''),
    clave: String(process.env.TERRA_ERP_API_PASSWORD || ''),
    rutaCa: String(process.env.TERRA_ERP_CA_CERT_PATH || '').trim(),
    timeoutCotizacion: Number(process.env.TERRA_ERP_TIMEOUT_MS) || 20000,
    timeoutConsulta: Number(process.env.TERRA_ERP_TIMEOUT_CONSULTA_MS) || 10000,
    concurrencia: Math.max(1, Number(process.env.TERRA_ERP_CONCURRENCIA) || 5),
    // Solo este almacén cuenta para vender; los demás se guardan como referencia.
    almacenVenta: normalizarAlmacen(process.env.TERRA_ERP_ALMACEN_VENTA) || 'ALMACEN CENTRAL',
  };
}

// El ERP devuelve nombres de almacén con espacios sobrantes (" ALMACEN ALEMANA").
function normalizarAlmacen(valor) {
  return String(valor || '').trim().replace(/\s+/g, ' ').toUpperCase();
}

export function erpHabilitado() {
  return configuracion().habilitado;
}

export function concurrenciaErp() {
  return configuracion().concurrencia;
}

export function almacenVentaErp() {
  return configuracion().almacenVenta;
}

// Error tipado para que el flujo de cobro decida por `tipo` sin leer mensajes.
//   config        -> falta configuración o la API rechazó la forma de la petición (400/403)
//   auth          -> credenciales inválidas (no se reintenta)
//   bloqueado     -> 429 demasiados_intentos
//   no_encontrado -> 404 producto_no_encontrado
//   rechazado     -> 422 productos_invalidos (no se grabó nada)
//   desconocido   -> timeout, red o 5xx: no se sabe si el ERP procesó la petición
export class ErrorErp extends Error {
  constructor(tipo, mensaje, { codigo = null, detalles = null, httpStatus = null } = {}) {
    super(mensaje);
    this.name = 'ErrorErp';
    this.tipo = tipo;
    this.codigo = codigo;
    this.detalles = detalles;
    this.httpStatus = httpStatus;
  }
}

let agenteCache = { ruta: null, agente: null };
function agenteHttps(rutaCa) {
  if (agenteCache.agente && agenteCache.ruta === rutaCa) return agenteCache.agente;
  // Con certificado propio de TERRA se confía solo en esa CA; sin él se usa el
  // almacén del sistema. Nunca se desactiva la verificación TLS.
  const opciones = { keepAlive: true, maxSockets: 10 };
  if (rutaCa) {
    try {
      opciones.ca = fs.readFileSync(rutaCa);
    } catch (error) {
      throw new ErrorErp('config', `No se pudo leer el certificado del ERP (${rutaCa}): ${error.message}`, { codigo: 'ca_invalida' });
    }
  }
  agenteCache = { ruta: rutaCa, agente: new https.Agent(opciones) };
  return agenteCache.agente;
}

function exigirConfiguracion(cfg) {
  if (!cfg.habilitado) throw new ErrorErp('config', 'La integración con el ERP de TERRA está desactivada (TERRA_ERP_HABILITADO=false).', { codigo: 'erp_deshabilitado' });
  if (!cfg.url || !/^https:\/\//i.test(cfg.url)) throw new ErrorErp('config', 'Falta TERRA_ERP_URL (debe ser https).', { codigo: 'config_incompleta' });
  if (!cfg.usuario || !cfg.clave) throw new ErrorErp('config', 'Faltan TERRA_ERP_API_USER / TERRA_ERP_API_PASSWORD.', { codigo: 'config_incompleta' });
}

// Petición HTTPS cruda: resuelve con { status, body } (body ya parseado si es JSON).
function peticionHttps(cfg, metodo, ruta, { body, headers = {}, timeout }) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${cfg.url}${ruta.startsWith('/') ? ruta : `/${ruta}`}`);
    const datos = body === undefined ? null : Buffer.from(JSON.stringify(body), 'utf8');
    const req = https.request(url, {
      method: metodo,
      agent: agenteHttps(cfg.rutaCa),
      headers: {
        Accept: 'application/json',
        ...(datos ? { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': datos.length } : {}),
        ...headers,
      },
    });
    const temporizador = setTimeout(() => {
      req.destroy(new ErrorErp('desconocido', `El ERP no respondió en ${timeout} ms.`, { codigo: 'timeout' }));
    }, timeout);
    req.on('response', (res) => {
      const trozos = [];
      res.on('data', (trozo) => trozos.push(trozo));
      res.on('end', () => {
        clearTimeout(temporizador);
        const texto = Buffer.concat(trozos).toString('utf8');
        let cuerpo = texto;
        try { cuerpo = texto ? JSON.parse(texto) : null; } catch { cuerpo = texto; }
        resolve({ status: res.statusCode || 0, body: cuerpo });
      });
      res.on('error', (error) => { clearTimeout(temporizador); reject(error); });
    });
    req.on('error', (error) => {
      clearTimeout(temporizador);
      if (error instanceof ErrorErp) reject(error);
      else reject(new ErrorErp('desconocido', `No se pudo conectar con el ERP: ${error.message}`, { codigo: error.code || 'red' }));
    });
    if (datos) req.write(datos);
    req.end();
  });
}

function codigoDeError(body) {
  return String(body?.error?.codigo || body?.codigo || '').trim();
}
function mensajeDeError(body, porDefecto) {
  return String(body?.error?.mensaje || body?.mensaje || body?.message || porDefecto);
}

// Traduce una respuesta no exitosa del ERP a un ErrorErp tipado.
function errorDesdeRespuesta({ status, body }) {
  const codigo = codigoDeError(body);
  const detalles = body?.error?.detalles ?? null;
  const mensaje = mensajeDeError(body, `El ERP respondió HTTP ${status}.`);
  if (status === 401) {
    if (codigo === 'credenciales_invalidas') return new ErrorErp('auth', mensaje, { codigo, httpStatus: status });
    return new ErrorErp('auth', mensaje, { codigo: codigo || 'token_invalido', httpStatus: status });
  }
  if (status === 429) return new ErrorErp('bloqueado', mensaje, { codigo: codigo || 'demasiados_intentos', httpStatus: status });
  if (status === 404) return new ErrorErp('no_encontrado', mensaje, { codigo: codigo || 'producto_no_encontrado', httpStatus: status });
  if (status === 422) return new ErrorErp('rechazado', mensaje, { codigo: codigo || 'productos_invalidos', detalles, httpStatus: status });
  if (status === 400 || status === 403) return new ErrorErp('config', mensaje, { codigo: codigo || `http_${status}`, detalles, httpStatus: status });
  return new ErrorErp('desconocido', mensaje, { codigo: codigo || `http_${status}`, httpStatus: status });
}

// ---- Token ----
const MARGEN_RENOVACION_MS = 5 * 60 * 1000;
let tokenCache = { token: null, expiraEn: 0 };
let tokenEnVuelo = null;

export function invalidarTokenErp() {
  tokenCache = { token: null, expiraEn: 0 };
}

export async function obtenerToken() {
  const cfg = configuracion();
  exigirConfiguracion(cfg);
  if (tokenCache.token && tokenCache.expiraEn - MARGEN_RENOVACION_MS > Date.now()) return tokenCache.token;
  if (tokenEnVuelo) return tokenEnVuelo;
  tokenEnVuelo = (async () => {
    const respuesta = await peticionHttps(cfg, 'POST', '/api/auth/token', {
      body: { usuario: cfg.usuario, clave: cfg.clave },
      timeout: cfg.timeoutConsulta,
    });
    if (respuesta.status < 200 || respuesta.status >= 300) throw errorDesdeRespuesta(respuesta);
    const token = String(respuesta.body?.token || '');
    if (!token) throw new ErrorErp('desconocido', 'El ERP no devolvió un token.', { codigo: 'token_ausente' });
    const segundos = Number(respuesta.body?.expiraEnSegundos) > 0 ? Number(respuesta.body.expiraEnSegundos) : 8 * 60 * 60;
    tokenCache = { token, expiraEn: Date.now() + segundos * 1000 };
    return token;
  })().finally(() => { tokenEnVuelo = null; });
  return tokenEnVuelo;
}

const CODIGOS_TOKEN = new Set(['token_vencido', 'token_invalido', 'token_requerido']);

// Petición autenticada. Ante token vencido/inválido pide uno nuevo y repite UNA vez.
export async function request(metodo, ruta, body, { timeout, reintentarToken = true } = {}) {
  const cfg = configuracion();
  exigirConfiguracion(cfg);
  const token = await obtenerToken();
  const respuesta = await peticionHttps(cfg, metodo, ruta, {
    body,
    headers: { Authorization: `Bearer ${token}` },
    timeout: timeout || cfg.timeoutConsulta,
  });
  if (respuesta.status >= 200 && respuesta.status < 300) return respuesta;
  const error = errorDesdeRespuesta(respuesta);
  if (respuesta.status === 401 && CODIGOS_TOKEN.has(error.codigo) && reintentarToken) {
    invalidarTokenErp();
    return request(metodo, ruta, body, { timeout, reintentarToken: false });
  }
  throw error;
}

// GET /api/productos/terra/{codigoTerra} -> producto | null (404 producto_no_encontrado).
// Es la única consulta de producto: la clave es `products.codigo_terra` y la respuesta
// trae el `codigo` interno que luego se envía en la cotización.
export async function consultarPorCodigoTerra(codigoTerra) {
  const limpio = String(codigoTerra || '').trim();
  if (!limpio) return null;
  try {
    const { body } = await request('GET', `/api/productos/terra/${encodeURIComponent(limpio)}`);
    return body && typeof body === 'object' ? body : null;
  } catch (error) {
    if (error instanceof ErrorErp && error.tipo === 'no_encontrado') return null;
    throw error;
  }
}

// POST /api/cotizaciones. `items` = [{ codigo, cantidad }] ya agrupados por código.
// Devuelve { ok: true, numero, fecha, total, productos } o
// { ok: false, tipo: 'rechazado' | 'desconocido' | 'config', codigo, mensaje, detalles }.
export async function crearCotizacion(items) {
  const cfg = configuracion();
  const productos = (Array.isArray(items) ? items : []).map((item) => ({
    codigo: String(item.codigo),
    cantidad: Number(item.cantidad),
  }));
  if (!productos.length) return { ok: false, tipo: 'config', codigo: 'sin_items', mensaje: 'La cotización no tiene productos.', detalles: null };
  if (productos.some((p) => !p.codigo || !Number.isSafeInteger(p.cantidad) || p.cantidad < 1 || p.cantidad > 9999)) {
    return { ok: false, tipo: 'config', codigo: 'items_invalidos', mensaje: 'Cada producto necesita código y cantidad entre 1 y 9999.', detalles: null };
  }
  try {
    const { status, body } = await request('POST', '/api/cotizaciones', { productos }, { timeout: cfg.timeoutCotizacion });
    if (status !== 201 && status !== 200) {
      return { ok: false, tipo: 'desconocido', codigo: `http_${status}`, mensaje: 'El ERP devolvió una respuesta inesperada.', detalles: null };
    }
    const numero = Number(body?.numero);
    if (!Number.isFinite(numero)) {
      return { ok: false, tipo: 'desconocido', codigo: 'numero_ausente', mensaje: 'El ERP no devolvió el número de cotización.', detalles: body ?? null };
    }
    return { ok: true, numero, fecha: body?.fecha || null, total: Number(body?.total ?? 0), productos: body?.productos || [], respuesta: body };
  } catch (error) {
    if (error instanceof ErrorErp) {
      const tipo = error.tipo === 'rechazado' ? 'rechazado'
        : error.tipo === 'desconocido' ? 'desconocido'
          : 'config';
      return { ok: false, tipo, codigo: error.codigo, mensaje: error.message, detalles: error.detalles ?? null, tipoError: error.tipo };
    }
    throw error;
  }
}

// Stock que vale para vender: solo el del almacén configurado (ALMACEN CENTRAL por
// defecto). Si no aparece en `almacenes[]` es 0. Nunca se usa `stockTotal`.
export function stockAlmacenVenta(producto, almacen = almacenVentaErp()) {
  if (!producto || !Array.isArray(producto.almacenes)) return 0;
  const buscado = normalizarAlmacen(almacen);
  const fila = producto.almacenes.find((a) => normalizarAlmacen(a?.almacen) === buscado);
  const stock = Math.floor(Number(fila?.stock));
  return Number.isFinite(stock) && stock > 0 ? stock : 0;
}

// Ejecuta `fn` sobre cada elemento con un máximo de tareas en paralelo.
export async function enParalelo(elementos, fn, limite = concurrenciaErp()) {
  const resultados = new Array(elementos.length);
  let indice = 0;
  const trabajadores = Array.from({ length: Math.min(limite, elementos.length) }, async () => {
    while (indice < elementos.length) {
      const actual = indice;
      indice += 1;
      resultados[actual] = await fn(elementos[actual], actual);
    }
  });
  await Promise.all(trabajadores);
  return resultados;
}
