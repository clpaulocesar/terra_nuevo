export const URL_BANECO_SANDBOX = 'https://apimktdesa.baneco.com.bo/ApiGateway';

function leerEntero(valor, predeterminado) {
  if (valor === undefined || String(valor).trim() === '') return predeterminado;
  const numero = Number(valor);
  return Number.isSafeInteger(numero) ? numero : null;
}

export function obtenerConfiguracionBaneco(env = process.env) {
  return {
    ambiente: String(env.BANECO_ENVIRONMENT || 'sandbox').trim().toLowerCase(),
    url: String(env.BANECO_API_URL || URL_BANECO_SANDBOX).trim().replace(/\/+$/, ''),
    usuario: String(env.BANECO_API_USER || '').trim(),
    clave: String(env.BANECO_API_PASSWORD || '').trim(),
    llaveAes: String(env.BANECO_AES_KEY || '').trim(),
    cuentaAbono: String(env.BANECO_ACCOUNT_CREDIT || '').trim(),
    codigoSucursal: String(env.BANECO_BRANCH_CODE || '').trim(),
    timeoutMs: leerEntero(env.BANECO_TIMEOUT_MS, 10000),
    vigenciaQrMinutos: leerEntero(env.BANECO_QR_VALIDITY_MINUTES, 15),
    rutas: {
      autenticar: '/api/authentication/authenticate',
      generarQr: '/api/qrsimple/generateQR',
      consultarQr: '/api/qrsimple/v2/statusQR',
      cancelarQr: '/api/qrsimple/cancelQR',
      conciliarQr: '/api/qrsimple/v2/paidQR',
    },
  };
}

export function validarConfiguracionBaneco(configuracion = obtenerConfiguracionBaneco()) {
  const errores = [];

  if (configuracion.ambiente !== 'sandbox') {
    errores.push('BANECO_ENVIRONMENT debe ser sandbox.');
  }

  if (configuracion.url !== URL_BANECO_SANDBOX) {
    errores.push('BANECO_API_URL debe apuntar al endpoint de pruebas documentado.');
  }

  if (!configuracion.usuario) errores.push('Falta BANECO_API_USER.');
  if (!configuracion.clave) errores.push('Falta BANECO_API_PASSWORD.');
  if (!configuracion.llaveAes) errores.push('Falta BANECO_AES_KEY.');
  if (!configuracion.cuentaAbono) errores.push('Falta BANECO_ACCOUNT_CREDIT.');

  if (!Number.isSafeInteger(configuracion.timeoutMs) || configuracion.timeoutMs < 1000) {
    errores.push('BANECO_TIMEOUT_MS debe ser un entero de al menos 1000.');
  }

  if (!Number.isSafeInteger(configuracion.vigenciaQrMinutos) || configuracion.vigenciaQrMinutos < 1) {
    errores.push('BANECO_QR_VALIDITY_MINUTES debe ser un entero positivo.');
  }

  if (String(configuracion.codigoSucursal || '').length > 5) {
    errores.push('BANECO_BRANCH_CODE no puede superar 5 caracteres.');
  }

  return { valida: errores.length === 0, errores };
}
