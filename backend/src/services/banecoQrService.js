import { ErrorBanecoNoImplementado } from './banecoErrores.js';

export { ErrorBanecoNoImplementado };

export async function generarQrDinamico() {
  throw new ErrorBanecoNoImplementado();
}

export async function consultarQrDinamico() {
  throw new ErrorBanecoNoImplementado();
}

export async function cancelarQrDinamico() {
  throw new ErrorBanecoNoImplementado();
}
