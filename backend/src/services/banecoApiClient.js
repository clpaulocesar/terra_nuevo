import { ErrorBanecoNoImplementado } from './banecoErrores.js';

export async function autenticarBaneco({ config }) {
  void config;
  throw new ErrorBanecoNoImplementado();
}

export async function generarQrBaneco({ config, token, datos }) {
  void config;
  void token;
  void datos;
  throw new ErrorBanecoNoImplementado();
}

export async function consultarQrBaneco({ config, token, qrId }) {
  void config;
  void token;
  void qrId;
  throw new ErrorBanecoNoImplementado();
}

export async function cancelarQrBaneco({ config, token, qrId }) {
  void config;
  void token;
  void qrId;
  throw new ErrorBanecoNoImplementado();
}

export async function conciliarQrBaneco({ config, token, fecha }) {
  void config;
  void token;
  void fecha;
  throw new ErrorBanecoNoImplementado();
}
