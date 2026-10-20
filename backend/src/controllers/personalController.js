import { crearUsuarioSupabase, eliminarUsuarioSupabase } from '../services/supabaseAuth.js';
import { crearPersonalBD, listarPersonalBD } from '../models/personalModel.js';

const ROLES = new Set(['admin', 'vendedor', 'despacho']);
const texto = (valor) => typeof valor === 'string' ? valor.trim() : '';

export async function listarPersonal(req, res, next) {
  try {
    return res.json({ success: true, data: await listarPersonalBD() });
  } catch (error) { return next(error); }
}

export async function crearPersonal(req, res, next) {
  const nombre = texto(req.body?.nombre);
  const email = texto(req.body?.email).toLowerCase();
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const rol = texto(req.body?.rol);

  if (nombre.length < 2 || nombre.length > 120) return res.status(400).json({ success: false, mensaje: 'El nombre debe tener entre 2 y 120 caracteres.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 150) return res.status(400).json({ success: false, mensaje: 'Correo electrónico inválido.' });
  if (password.length < 8 || password.length > 128) return res.status(400).json({ success: false, mensaje: 'La contraseña temporal debe tener entre 8 y 128 caracteres.' });
  if (!ROLES.has(rol)) return res.status(400).json({ success: false, mensaje: 'Selecciona un rol válido.' });

  let usuario;
  try {
    usuario = await crearUsuarioSupabase({ email, password });
    const personal = await crearPersonalBD({ authUserId: usuario.id, nombre, email, rol });
    return res.status(201).json({ success: true, data: personal, mensaje: 'Personal registrado correctamente.' });
  } catch (error) {
    if (usuario?.id) await eliminarUsuarioSupabase(usuario.id).catch(() => {});
    return next(error);
  }
}
