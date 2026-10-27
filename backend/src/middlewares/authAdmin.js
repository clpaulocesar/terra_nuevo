import { createHmac, timingSafeEqual } from 'node:crypto';

const ADMIN_SECRET = process.env.ADMIN_TOKEN_SECRET || 'terra_admin_secret_token_key_dev';

function firma(payload) {
  return createHmac('sha256', ADMIN_SECRET).update(payload).digest('base64url');
}

export function crearTokenAdmin(datosAdicionales = {}) {
  const payload = Buffer.from(JSON.stringify({
    rol: 'admin',
    exp: Date.now() + 8 * 60 * 60 * 1000,
    ...datosAdicionales,
  })).toString('base64url');
  return `${payload}.${firma(payload)}`;
}

export function authAdmin(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ success: false, mensaje: 'Sesión de administrador requerida' });
  const [payload, firmaRecibida] = token.split('.');
  const firmaEsperada = firma(payload || '');
  try {
    const datos = JSON.parse(Buffer.from(payload, 'base64url').toString());
    const valido = firmaRecibida && firmaRecibida.length === firmaEsperada.length && timingSafeEqual(Buffer.from(firmaRecibida), Buffer.from(firmaEsperada));
    if (!valido || !['admin', 'vendedor', 'despacho'].includes(datos.rol) || datos.exp < Date.now()) throw new Error('Token inválido');
    req.admin = datos;
    return next();
  } catch {
    return res.status(401).json({ success: false, mensaje: 'Sesión de administrador inválida o vencida' });
  }
}

export function requiereRol(...roles) {
  return (req, res, next) => {
    if (!req.admin || !roles.includes(req.admin.rol)) return res.status(403).json({ success: false, mensaje: 'No tienes permisos para esta operaci├│n.' });
    return next();
  };
}
