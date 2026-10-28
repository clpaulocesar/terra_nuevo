// Límite de intentos de inicio de sesión en memoria: 5 fallos por email+IP cada 15 min.
// Suficiente para un solo proceso persistente; con varias instancias habría que
// moverlo a la base de datos.
const VENTANA_MS = 15 * 60 * 1000;
const MAXIMO = 5;
const intentos = new Map();

function limpiarVencidos(ahora) {
  for (const [clave, datos] of intentos) if (ahora - datos.desde > VENTANA_MS) intentos.delete(clave);
}

export function claveIntento(email, ip) {
  return `${String(email || '').trim().toLowerCase()}|${String(ip || '')}`;
}

// true si la clave ya agotó sus intentos dentro de la ventana.
export function estaBloqueado(clave, ahora = Date.now()) {
  limpiarVencidos(ahora);
  const datos = intentos.get(clave);
  return Boolean(datos && datos.fallos >= MAXIMO);
}

export function registrarFallo(clave, ahora = Date.now()) {
  limpiarVencidos(ahora);
  const datos = intentos.get(clave) || { desde: ahora, fallos: 0 };
  datos.fallos += 1;
  intentos.set(clave, datos);
  return datos.fallos;
}

export function limpiarIntentos(clave) {
  intentos.delete(clave);
}

// Solo para pruebas: vacía el registro.
export function reiniciarLimiteIntentos() {
  intentos.clear();
}
