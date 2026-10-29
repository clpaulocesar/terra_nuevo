export const CAMPOS_NUMERICOS = new Set(['telefono', 'nit']);

const LARGO_MAXIMO = { telefono: 8, nit: 20 };

// Teléfono y NIT solo admiten dígitos. Al teléfono se le quita el prefijo 591 si viene
// pegado con el número (la pantalla ya muestra +591).
export function normalizarValorCampo(campo, valor) {
  if (!CAMPOS_NUMERICOS.has(campo)) return valor;
  let digitos = String(valor || '').replace(/\D/g, '');
  if (campo === 'telefono' && digitos.startsWith('591') && digitos.length > 8) digitos = digitos.slice(3);
  return digitos.slice(0, LARGO_MAXIMO[campo]);
}
