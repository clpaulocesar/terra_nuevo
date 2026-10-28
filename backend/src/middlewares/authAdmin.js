import { createHmac, timingSafeEqual } from 'node:crypto';
import { ADMIN_TOKEN_SECRET } from '../config/secretos.js';
import { obtenerPersonalBD } from '../models/personalModel.js';

// Sesión del personal (admin, vendedor, despacho): token `payload_base64url.firma`
// HMAC-SHA256 de 8 horas. El token identifica a la cuenta por su id en
// `staff_accounts`; el rol y el estado se leen de la base en cada petición.
const ROLES = ['admin', 'vendedor', 'despacho'];
const DURACION_MS = 8 * 60 * 60 * 1000;

function firma(payload) {
  return createHmac('sha256', ADMIN_TOKEN_SECRET).update(payload).digest('base64url');
}

export function crearTokenAdmin({ id, email, nombre, rol }) {
  if (!id) throw new Error('El token de personal necesita el id de la cuenta.');
  const payload = Buffer.from(JSON.stringify({ id, email, nombre, rol, exp: Date.now() + DURACION_MS })).toString('base64url');
  return `${payload}.${firma(payload)}`;
}

// Firma válida, no vencido y con id: devuelve los datos del token, o null.
export function verificarTokenAdmin(token) {
  const [payload, firmaRecibida] = String(token || '').split('.');
  if (!payload || !firmaRecibida) return null;
  const firmaEsperada = firma(payload);
  try {
    if (firmaRecibida.length !== firmaEsperada.length || !timingSafeEqual(Buffer.from(firmaRecibida), Buffer.from(firmaEsperada))) return null;
    const datos = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (!datos?.id || !(Number(datos.exp) > Date.now())) return null;
    return datos;
  } catch {
    return null;
  }
}

const noAutorizado = (res) => res.status(401).json({ success: false, mensaje: 'Sesión de administrador inválida o vencida' });

export async function authAdmin(req, res, next) {
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return res.status(401).json({ success: false, mensaje: 'Sesión de administrador requerida' });
  const datos = verificarTokenAdmin(token);
  if (!datos) return noAutorizado(res);
  try {
    // Desactivar una cuenta o cambiarle el rol corta el acceso de inmediato: manda la base, no el token.
    const cuenta = await obtenerPersonalBD(datos.id);
    if (!cuenta || cuenta.activo === false || !ROLES.includes(cuenta.rol)) return noAutorizado(res);
    req.admin = { id: cuenta.id, email: cuenta.email, nombre: cuenta.nombre, rol: cuenta.rol, exp: datos.exp };
    return next();
  } catch (error) {
    return next(error);
  }
}

export function requiereRol(...roles) {
  return (req, res, next) => {
    if (!req.admin || !roles.includes(req.admin.rol)) return res.status(403).json({ success: false, mensaje: 'No tienes permisos para esta operación.' });
    return next();
  };
}
