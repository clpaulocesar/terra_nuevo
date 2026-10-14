import { timingSafeEqual } from 'node:crypto';
import { crearTokenAdmin } from '../middlewares/authAdmin.js';

function coincide(valor, esperado) {
  const a = Buffer.from(String(valor || ''));
  const b = Buffer.from(String(esperado || ''));
  return a.length === b.length && timingSafeEqual(a, b);
}

export function iniciarSesionAdmin(req, res) {
  const { email, password } = req.body || {};
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD || !process.env.ADMIN_TOKEN_SECRET) return res.status(500).json({ success: false, mensaje: 'Falta configurar las credenciales de administración' });
  if (!coincide(email?.trim().toLowerCase(), process.env.ADMIN_EMAIL.toLowerCase()) || !coincide(password, process.env.ADMIN_PASSWORD)) return res.status(401).json({ success: false, mensaje: 'Credenciales inválidas' });
  return res.json({ success: true, data: { token: crearTokenAdmin(), usuario: { email: process.env.ADMIN_EMAIL, rol: 'admin' } } });
}

export function perfilAdmin(req, res) {
  return res.json({ success: true, data: { email: process.env.ADMIN_EMAIL, rol: req.admin.rol } });
}
