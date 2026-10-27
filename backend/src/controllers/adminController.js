import { timingSafeEqual } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { crearTokenAdmin } from '../middlewares/authAdmin.js';
import { buscarCuentaStaffBD } from '../models/personalModel.js';

function coincide(valor, esperado) {
  const a = Buffer.from(String(valor || ''));
  const b = Buffer.from(String(esperado || ''));
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function iniciarSesionAdmin(req, res, next) {
  try {
    const { email, password } = req.body || {};
    const emailNormalizado = String(email || '').trim().toLowerCase();

    // 1. Superadministrador configurado en variables de entorno (.env) o credencial local por defecto
    const adminEmailEnv = String(process.env.ADMIN_EMAIL || 'admin@terra.local').trim();
    const adminPassEnv = String(process.env.ADMIN_PASSWORD || 'TerraAdmin2026!').trim();
    const tieneCredencialesEnv = Boolean(adminEmailEnv && adminPassEnv);
    if (
      tieneCredencialesEnv &&
      coincide(emailNormalizado, adminEmailEnv.toLowerCase()) &&
      coincide(String(password || '').trim(), adminPassEnv)
    ) {
      return res.json({
        success: true,
        data: {
          token: crearTokenAdmin({
            email: adminEmailEnv,
            rol: 'admin',
            nombre: 'Administrador Principal',
          }),
          usuario: {
            email: adminEmailEnv,
            rol: 'admin',
            nombre: 'Administrador Principal',
          },
        },
      });
    }

    // 2. Personal administrativo registrado en base de datos (staff_accounts)
    const personal = await buscarCuentaStaffBD(emailNormalizado).catch((error) => {
      console.error('No se pudo consultar la cuenta de personal:', error.message);
      return null;
    });

    if (personal) {
      if (!personal.activo) {
        return res.status(403).json({ success: false, mensaje: 'Esta cuenta de personal se encuentra desactivada.' });
      }

      if (!['admin', 'vendedor', 'despacho'].includes(personal.rol)) {
        return res.status(403).json({ success: false, mensaje: 'Esta cuenta no tiene un rol autorizado para ingresar al panel.' });
      }

      const passwordOk = personal.password_hash
        ? await bcrypt.compare(String(password || ''), personal.password_hash).catch(() => false)
        : false;
      if (!passwordOk) {
        return res.status(401).json({ success: false, mensaje: 'Credenciales inválidas' });
      }

      return res.json({
        success: true,
        data: {
          token: crearTokenAdmin({
            id: personal.id,
            email: personal.email,
            nombre: personal.nombre,
            rol: personal.rol,
          }),
          usuario: {
            id: personal.id,
            email: personal.email,
            nombre: personal.nombre,
            rol: personal.rol,
            vehiculo: personal.vehiculo || null,
            placa: personal.placa || null,
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
