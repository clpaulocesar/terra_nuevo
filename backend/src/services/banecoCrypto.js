import { ErrorBanecoNoImplementado } from './banecoErrores.js';

export function cifrarDatoBaneco(valor, llaveAes) {
  if (typeof valor !== 'string' || !valor) {
    throw new TypeError('El dato que se cifrará debe ser un texto no vacío.');
  }
  if (typeof llaveAes !== 'string' || !llaveAes) {
    throw new TypeError('Falta la llave AES de Baneco.');
  }

  throw new ErrorBanecoNoImplementado();
}

export function descifrarDatoBaneco(valorCifrado, llaveAes) {
  if (typeof valorCifrado !== 'string' || !valorCifrado) {
    throw new TypeError('El dato cifrado debe ser un texto no vacío.');
  }
  if (typeof llaveAes !== 'string' || !llaveAes) {
    throw new TypeError('Falta la llave AES de Baneco.');
  }

  throw new ErrorBanecoNoImplementado();
}
