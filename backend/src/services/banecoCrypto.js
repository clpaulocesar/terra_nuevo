import { ErrorBaneco } from './banecoErrores.js';

async function transformarDato(valor, llaveAes, { url, timeoutMs, ruta, fetchImpl = fetch }) {
  if (typeof valor !== 'string' || !valor) throw new TypeError('El dato debe ser un texto no vacío.');
  if (typeof llaveAes !== 'string' || !llaveAes) throw new TypeError('Falta la llave AES de Baneco.');
  if (!url) throw new TypeError('Falta la URL de Baneco.');
  const destino = new URL(`${String(url).replace(/\/+$/, '')}${ruta}`);
  destino.searchParams.set('text', valor);
  destino.searchParams.set('aesKey', llaveAes);
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), timeoutMs);
  try {
    const respuesta = await fetchImpl(destino, { signal: controlador.signal });
    const texto = (await respuesta.text()).trim();
    if (!respuesta.ok || !texto) throw new ErrorBaneco('Baneco no pudo transformar el dato.', 'baneco_cifrado_fallido');
    return texto;
  } catch (error) {
    if (error instanceof ErrorBaneco) throw error;
    throw new ErrorBaneco('No se pudo conectar al servicio de cifrado de Baneco.', 'baneco_cifrado_no_disponible');
  } finally {
    clearTimeout(temporizador);
  }
}

export function cifrarDatoBaneco(valor, llaveAes, opciones) {
  return transformarDato(valor, llaveAes, { ...opciones, ruta: '/api/authentication/encrypt' });
}

export function descifrarDatoBaneco(valor, llaveAes, opciones) {
  return transformarDato(valor, llaveAes, { ...opciones, ruta: '/api/authentication/decrypt' });
}
