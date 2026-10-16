export function validarNit(nit) {
  return !nit || /^[0-9]{5,20}$/.test(nit);
}

export function validarTelefono(telefono) {
  return !telefono || /^[0-9+()\s-]{6,30}$/.test(telefono);
}

export function validarDatosCliente(cliente) {
  const errores = {};
  const nombre = (cliente.nombre || '').trim();
  const telefono = (cliente.telefono || '').trim();
  const nit = (cliente.nit || '').trim();

  if (nombre.length < 2 || nombre.length > 120) {
    errores.nombre = 'Ingresa un nombre de 2 a 120 caracteres';
  }
  if (!validarTelefono(telefono)) {
    errores.telefono = 'El teléfono no tiene un formato válido';
  }
  if (!validarNit(nit)) {
    errores.nit = 'El NIT debe tener entre 5 y 20 dígitos';
  }
  return errores;
}