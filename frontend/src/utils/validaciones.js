export function validarNit(nit) {
  return !nit || /^[0-9]{5,20}$/.test(nit);
}

export function validarTelefono(telefono) {
  return !telefono || /^[0-9]{8}$/.test(telefono);
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
    errores.telefono = 'El teléfono debe tener 8 dígitos';
  }
  if (!validarNit(nit)) {
    errores.nit = 'El NIT debe tener entre 5 y 20 dígitos';
  }
  if (cliente.entregaDomicilio && (!cliente.direccion || cliente.direccion.trim().length < 5)) {
    errores.direccion = 'Ingresá la calle, número y zona para el envío a domicilio';
  }
  return errores;
}
