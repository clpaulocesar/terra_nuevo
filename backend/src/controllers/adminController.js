import { timingSafeEqual } from 'node:crypto';
import { crearTokenAdmin } from '../middlewares/authAdmin.js';
import { obtenerPersonalPorEmailBD } from '../models/personalModel.js';
import { autenticarUsuarioSupabase } from '../services/supabaseAuth.js';

function coincide(valor, esperado) {
  const a = Buffer.from(String(valor || ''));
  const b = Buffer.from(String(esperado || ''));
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function iniciarSesionAdmin(req, res, next) {
  try {
    const { email, password } = req.body || {};
    const emailNormalizado = String(email || '').trim().toLowerCase();

    if (!process.env.ADMIN_TOKEN_SECRET) {
      return res.status(500).json({ success: false, mensaje: 'Falta configurar la clave secreta de administración.' });
    }

    // 1. Superadministrador configurado en variables de entorno (.env)
    const tieneCredencialesEnv = Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD);
    if (
      tieneCredencialesEnv &&
      coincide(emailNormalizado, process.env.ADMIN_EMAIL.toLowerCase()) &&
      coincide(password, process.env.ADMIN_PASSWORD)
    ) {
      return res.json({
        success: true,
        data: {
          token: crearTokenAdmin({
            email: process.env.ADMIN_EMAIL,
            rol: 'admin',
            nombre: 'Administrador Principal',
          }),
          usuario: {
            email: process.env.ADMIN_EMAIL,
            rol: 'admin',
            nombre: 'Administrador Principal',
          },
        },
      });
    }

    // 2. Personal administrativo registrado en base de datos (staff_accounts)
    const personal = await obtenerPersonalPorEmailBD(emailNormalizado).catch(() => null);

    if (personal) {
      if (!personal.activo) {
        return res.status(403).json({ success: false, mensaje: 'Esta cuenta de personal se encuentra desactivada.' });
      }

      if (!['admin', 'vendedor', 'despacho'].includes(personal.rol)) {
        return res.status(403).json({ success: false, mensaje: 'Esta cuenta no tiene un rol autorizado para ingresar al panel.' });
      }

      const usuarioAuth = await autenticarUsuarioSupabase({ email: personal.email, password }).catch(() => null);
      if (!usuarioAuth || (personal.auth_user_id && usuarioAuth.id !== personal.auth_user_id)) {
        return res.status(401).json({ success: false, mensaje: 'Credenciales inválidas' });
      }

      return res.json({
        success: true,
        data: {
          token: crearTokenAdmin({
            id: personal.id,
            authUserId: personal.auth_user_id,
            email: personal.email,
            nombre: personal.nombre,
            rol: personal.rol,
          }),
          usuario: {
            id: personal.id,
            email: personal.email,
            nombre: personal.nombre,
            rol: personal.rol,
          },
        },
      });
    }

    return res.status(401).json({ success: false, mensaje: 'Credenciales inválidas' });
  } catch (error) {
    return next(error);
  }
}

export function perfilAdmin(req, res) {
  return res.json({
    success: true,
    data: {
      id: req.admin?.id || null,
      email: req.admin?.email || process.env.ADMIN_EMAIL,
      nombre: req.admin?.nombre || 'Administrador',
      rol: req.admin?.rol || 'admin',
    },
  });
}

