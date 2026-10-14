export function validarEmail(email) {
  return !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validarTelefono(telefono) {
  return !telefono || /^[0-9+()\s-]{6,30}$/.test(telefono);
}

export function validarDatosCliente(cliente) {
  const errores = {};
  const nombre = (cliente.nombre || '').trim();
  const telefono = (cliente.telefono || '').trim();
  const email = (cliente.email || '').trim();

  if (nombre.length < 2 || nombre.length > 120) {
    errores.nombre = 'Ingresa un nombre de 2 a 120 caracteres';
  }
  if (!validarTelefono(telefono)) {
    errores.telefono = 'El teléfono no tiene un formato válido';
  }
  if (!validarEmail(email) || email.length > 150) {
    errores.email = 'El correo electrónico no es válido';
  }
  return errores;
}