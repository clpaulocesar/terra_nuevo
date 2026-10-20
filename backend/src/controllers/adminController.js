import { timingSafeEqual } from 'node:crypto';
import { crearTokenAdmin } from '../middlewares/authAdmin.js';
import { buscarCuentaStaffBD } from '../models/personalModel.js';
import { verificarCredencialesSupabase } from '../services/supabaseAuth.js';

function coincide(valor, esperado) {
  const a = Buffer.from(String(valor || ''));
  const b = Buffer.from(String(esperado || ''));
  return a.length === b.length && timingSafeEqual(a, b);
}

function credencialesArranque() {
  const email = String(process.env.ADMIN_EMAIL || '').trim();
  const password = String(process.env.ADMIN_PASSWORD || '');
  if (!email || !password || !process.env.ADMIN_TOKEN_SECRET) return null;
  return { email, password };
}

export async function iniciarSesionAdmin(req, res) {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  if (!email || !password) {
    return res.status(400).json({ success: false, mensaje: 'Ingresa tu correo y contraseña.' });
  }
  if (!process.env.ADMIN_TOKEN_SECRET) {
    return res.status(500).json({ success: false, mensaje: 'Falta configurar ADMIN_TOKEN_SECRET en el servidor.' });
  }

  // 1) Cuenta de arranque definida en el servidor (.env).
  const arranque = credencialesArranque();
  if (arranque && coincide(email, arranque.email.toLowerCase()) && coincide(password, arranque.password)) {
    return res.json({
      success: true,
      data: {
        token: crearTokenAdmin({ email: arranque.email, nombre: 'Administración' }),
        usuario: { email: arranque.email, nombre: 'Administración', rol: 'admin' },
      },
    });
  }

  // 2) Cuenta del equipo registrada en la base de datos (tabla staff_accounts).
  let cuenta = null;
  try {
    cuenta = await buscarCuentaStaffBD(email);
  } catch (error) {
    return res.status(500).json({ success: false, mensaje: 'No se pudo consultar la base de datos de personal.' });
  }

  if (!cuenta) {
    return res.status(401).json({ success: false, mensaje: 'Credenciales inválidas.' });
  }
  if (!cuenta.activo) {
    return res.status(403).json({ success: false, mensaje: 'La cuenta está desactivada. Contacta a soporte.' });
  }

  const verificacion = await verificarCredencialesSupabase({ email, password });
  if (!verificacion.ok) {
    return res.status(401).json({ success: false, mensaje: verificacion.mensaje || 'Credenciales inválidas.' });
  }

  return res.json({
    success: true,
    data: {
      token: crearTokenAdmin({ email: cuenta.email, nombre: cuenta.nombre || 'Equipo TERRA', rolOperativo: cuenta.rol }),
      usuario: { email: cuenta.email, nombre: cuenta.nombre || 'Equipo TERRA', rol: 'admin', rolOperativo: cuenta.rol },
    },
  });
}

export function perfilAdmin(req, res) {
  return res.json({ success: true, data: { email: req.admin?.email || process.env.ADMIN_EMAIL, rol: req.admin?.rol } });
}
