import { crearUsuarioSupabase, eliminarUsuarioSupabase } from '../services/supabaseAuth.js';
import {
  actualizarPersonalBD,
  crearPersonalBD,
  eliminarPersonalBD,
  listarPersonalBD,
  listarRepartidoresBD,
  obtenerPersonalBD,
} from '../models/personalModel.js';

const ROLES = new Set(['admin', 'vendedor', 'despacho']);
const PLACA = /^[A-Z0-9 -]{3,12}$/;
const texto = (valor) => typeof valor === 'string' ? valor.trim() : '';

// Vehículo y placa solo tienen sentido para quien reparte a domicilio.
function datosReparto(rol, cuerpo) {
  if (rol !== 'despacho') return { vehiculo: null, placa: null };
  const vehiculo = texto(cuerpo?.vehiculo);
  const placa = texto(cuerpo?.placa).toUpperCase();
  if (vehiculo.length > 60) return { error: 'El vehículo no puede superar los 60 caracteres.' };
  if (placa && !PLACA.test(placa)) return { error: 'La placa debe tener entre 3 y 12 caracteres (letras, números o guiones).' };
  return { vehiculo: vehiculo || null, placa: placa || null };
}

export async function listarPersonal(req, res, next) {
  try {
    return res.json({ success: true, data: await listarPersonalBD() });
  } catch (error) { return next(error); }
}

export async function listarRepartidores(req, res, next) {
  try {
    return res.json({ success: true, data: await listarRepartidoresBD() });
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

  const reparto = datosReparto(rol, req.body);
  if (reparto.error) return res.status(400).json({ success: false, mensaje: reparto.error });

  let usuario;
  try {
    usuario = await crearUsuarioSupabase({ email, password });
    const personal = await crearPersonalBD({
      authUserId: usuario.id, nombre, email, rol,
      vehiculo: reparto.vehiculo, placa: reparto.placa,
    });
    return res.status(201).json({ success: true, data: personal, mensaje: 'Personal registrado correctamente.' });
  } catch (error) {
    if (usuario?.id) await eliminarUsuarioSupabase(usuario.id).catch(() => {});
    return next(error);
  }
}

// Actualiza nombre, vehículo, placa y estado de una cuenta del equipo.
export async function actualizarPersonal(req, res, next) {
  try {
    const id = texto(req.params.id);
    if (!/^[0-9a-f-]{36}$/i.test(id)) return res.status(400).json({ success: false, mensaje: 'Identificador inválido.' });

    const actual = await obtenerPersonalBD(id);
    if (!actual) return res.status(404).json({ success: false, mensaje: 'Cuenta no encontrada.' });

    const nombre = texto(req.body?.nombre) || actual.nombre;
    if (nombre.length < 2 || nombre.length > 120) return res.status(400).json({ success: false, mensaje: 'El nombre debe tener entre 2 y 120 caracteres.' });

    const reparto = datosReparto(actual.rol, req.body);
    if (reparto.error) return res.status(400).json({ success: false, mensaje: reparto.error });

    const activo = typeof req.body?.activo === 'boolean' ? req.body.activo : null;
    const personal = await actualizarPersonalBD(id, { nombre, vehiculo: reparto.vehiculo, placa: reparto.placa, activo });
    return res.json({ success: true, data: personal, mensaje: 'Datos actualizados.' });
  } catch (error) { return next(error); }
}

export async function eliminarPersonal(req, res, next) {
  try {
    const id = texto(req.params.id);
    if (!/^[0-9a-f-]{36}$/i.test(id)) return res.status(400).json({ success: false, mensaje: 'Identificador inválido.' });
    if (req.admin?.id === id) return res.status(409).json({ success: false, mensaje: 'No puedes eliminar tu propia cuenta mientras tienes la sesión iniciada.' });

    const eliminado = await eliminarPersonalBD(id);
    if (!eliminado) return res.status(404).json({ success: false, mensaje: 'Cuenta no encontrada.' });
    await eliminarUsuarioSupabase(eliminado.authUserId);
    return res.json({ success: true, data: { id }, mensaje: 'Cuenta eliminada y envíos liberados.' });
  } catch (error) { return next(error); }
}
