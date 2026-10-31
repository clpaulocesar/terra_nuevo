import { cifrarDatoBaneco } from './banecoCrypto.js';
import { ErrorBaneco } from './banecoErrores.js';

async function solicitar({ config, ruta, metodo = 'GET', token, cuerpo, fetchImpl = fetch }) {
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), config.timeoutMs);
  try {
    const respuesta = await fetchImpl(`${config.url}${ruta}`, {
      method: metodo,
      headers: { Accept: 'application/json', ...(cuerpo ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(cuerpo ? { body: JSON.stringify(cuerpo) } : {}),
      signal: controlador.signal,
    });
    const datos = await respuesta.json().catch(() => null);
    if (!respuesta.ok || !datos || Number(datos.responseCode) !== 0) throw new ErrorBaneco(datos?.message || 'Baneco rechazó la solicitud.', 'baneco_solicitud_rechazada');
    return datos;
  } catch (error) {
    if (error instanceof ErrorBaneco) throw error;
    throw new ErrorBaneco('No se pudo conectar con el sandbox de Baneco.', 'baneco_no_disponible');
  } finally { clearTimeout(temporizador); }
}

export async function autenticarBaneco({ config, fetchImpl }) {
  const password = await cifrarDatoBaneco(config.clave, config.llaveAes, { url: config.url, timeoutMs: config.timeoutMs, fetchImpl });
  const datos = await solicitar({ config, ruta: config.rutas.autenticar, metodo: 'POST', cuerpo: { userName: config.usuario, password }, fetchImpl });
  if (!datos.token) throw new ErrorBaneco('Baneco no devolvió un token de autorización.', 'baneco_token_invalido');
  return datos.token;
}

export async function generarQrBaneco({ config, token, datos, fetchImpl }) {
  const accountCredit = await cifrarDatoBaneco(config.cuentaAbono, config.llaveAes, { url: config.url, timeoutMs: config.timeoutMs, fetchImpl });
  return solicitar({ config, token, ruta: config.rutas.generarQr, metodo: 'POST', fetchImpl, cuerpo: { transactionId: datos.transactionId, accountCredit, currency: 'BOB', amount: datos.amount, description: datos.description, dueDate: datos.dueDate, singleUse: true, modifyAmount: false, ...(config.codigoSucursal ? { branchCode: config.codigoSucursal } : {}) } });
}

export function consultarQrBaneco({ config, token, qrId, fetchImpl }) { return solicitar({ config, token, ruta: `${config.rutas.consultarQr}/${encodeURIComponent(qrId)}`, fetchImpl }); }
export function cancelarQrBaneco({ config, token, qrId, fetchImpl }) { return solicitar({ config, token, ruta: config.rutas.cancelarQr, metodo: 'DELETE', cuerpo: { qrId }, fetchImpl }); }
export function conciliarQrBaneco({ config, token, fecha, fetchImpl }) { return solicitar({ config, token, ruta: `${config.rutas.conciliarQr}/${fecha}`, fetchImpl }); }
