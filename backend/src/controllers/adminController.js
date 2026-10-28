import bcrypt from 'bcryptjs';
import { crearTokenAdmin } from '../middlewares/authAdmin.js';
import { buscarCuentaStaffBD } from '../models/personalModel.js';
import { claveIntento, estaBloqueado, registrarFallo, limpiarIntentos } from '../services/limiteIntentos.js';

const ROLES = ['admin', 'vendedor', 'despacho'];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Hash de relleno: cuando el correo no existe se compara igual contra él, así el
// tiempo de respuesta no delata qué correos tienen cuenta.
const HASH_RELLENO = bcrypt.hashSync('relleno-sin-cuenta', 10);

function ipDe(req) {
  return String(req.headers['x-forwarded-for'] || req.ip || req.socket?.remoteAddress || '').split(',')[0].trim();
}

// Login del personal: solo contra `staff_accounts` (email + bcrypt). La misma
// respuesta 401 para usuario inexistente, clave incorrecta o cuenta inactiva.
export async function iniciarSesionAdmin(req, res, next) {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!EMAIL.test(email) || !password) return res.status(400).json({ success: false, mensaje: 'Ingresá tu correo y tu contraseña.' });

    const clave = claveIntento(`staff|${email}`, ipDe(req));
    if (estaBloqueado(clave)) {
      return res.status(429).json({ success: false, mensaje: 'Demasiados intentos. Esperá 15 minutos antes de volver a intentar.' });
    }

    const personal = await buscarCuentaStaffBD(email);
    const hash = personal?.password_hash || HASH_RELLENO;
    const coincide = await bcrypt.compare(password, hash).catch(() => false);
    const valido = Boolean(personal) && coincide && personal.activo !== false && ROLES.includes(personal.rol);
    if (!valido) {
      registrarFallo(clave);
      return res.status(401).json({ success: false, mensaje: 'Credenciales inválidas' });
    }

    limpiarIntentos(clave);
    const usuario = { id: personal.id, email: personal.email, nombre: personal.nombre, rol: personal.rol };
    return res.json({
      success: true,
      data: {
        token: crearTokenAdmin(usuario),
        usuario: { ...usuario, vehiculo: personal.vehiculo || null, placa: personal.placa || null },
      },
    });
  } catch (error) {
    return next(error);
  }
}

export function perfilAdmin(req, res) {
  return res.json({
    success: true,
    data: {
      id: req.admin.id,
      email: req.admin.email,
      nombre: req.admin.nombre,
      rol: req.admin.rol,
    },
  });
}
