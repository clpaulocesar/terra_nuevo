
import {
  crearClienteBD,
  eliminarClienteBD,
  obtenerClienteBD,
  listarClientesBD,
} from '../models/clienteModel.js';
import { crearPerfilMayoristaBD } from '../models/mayoristaModel.js';
import { crearUsuarioSupabase, eliminarUsuarioSupabase } from '../services/supabaseAuth.js';

function campoTexto(valor) {
  return typeof valor === 'string' ? valor.trim() : '';
}

export async function listarClientes(req, res, next) {
  try {
    const limite = Number(req.query.limite ?? 100);
    if (!Number.isSafeInteger(limite) || limite < 1 || limite > 200) return res.status(400).json({ success: false, mensaje: 'Límite inválido' });
    const clientes = await listarClientesBD({ buscar: String(req.query.buscar ?? '').trim(), limite });
    return res.json({ success: true, data: clientes });
  } catch (error) { next(error); }
}

export async function crearCliente(req, res, next) {
  try {
    const nombre =
      typeof req.body?.nombre === 'string'
        ? req.body.nombre.trim()
        : '';

    const telefono =
      typeof req.body?.telefono === 'string'
        ? req.body.telefono.trim() || null
        : null;

    const email =
      typeof req.body?.email === 'string'
        ? req.body.email.trim().toLowerCase() || null
        : null;

    const nit =
      typeof req.body?.nit === 'string'
        ? req.body.nit.trim() || null
        : null;

    if (nombre.length < 2 || nombre.length > 120) {
      return res.status(400).json({
        success: false,
        mensaje: 'El nombre debe tener entre 2 y 120 caracteres',
      });
    }

    if (telefono && telefono.length > 30) {
      return res.status(400).json({
        success: false,
        mensaje: 'El teléfono es demasiado largo',
      });
    }

    if (
      email &&
      (email.length > 150 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    ) {
      return res.status(400).json({
        success: false,
        mensaje: 'Correo electrónico inválido',
      });
    }

    if (nit && !/^[0-9]{5,20}$/.test(nit)) {
      return res.status(400).json({
        success: false,
        mensaje: 'NIT inválido: debe tener entre 5 y 20 dígitos',
      });
    }

    const cliente = await crearClienteBD({
      nombre,
      telefono,
      email,
      nit,
    });

    return res.status(201).json({
      success: true,
      mensaje: 'Cliente registrado correctamente',
      data: cliente,
    });
  } catch (error) {
    next(error);
  }
}

export async function crearUsuarioMayorista(req, res, next) {
  const nombre = campoTexto(req.body?.nombre);
  const email = campoTexto(req.body?.email).toLowerCase();
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const telefono = campoTexto(req.body?.telefono) || null;
  const nit = campoTexto(req.body?.nit) || null;

  if (nombre.length < 2 || nombre.length > 120) return res.status(400).json({ success: false, mensaje: 'El nombre debe tener entre 2 y 120 caracteres.' });
  if (email.length > 150 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ success: false, mensaje: 'Correo electrónico inválido.' });
  if (password.length < 8 || password.length > 128) return res.status(400).json({ success: false, mensaje: 'La contraseña debe tener entre 8 y 128 caracteres.' });
  if (telefono && telefono.length > 30) return res.status(400).json({ success: false, mensaje: 'El teléfono es demasiado largo.' });
  if (nit && !/^[0-9]{5,20}$/.test(nit)) return res.status(400).json({ success: false, mensaje: 'NIT inválido: debe tener entre 5 y 20 dígitos.' });

  let usuarioAuth;
  try {
    usuarioAuth = await crearUsuarioSupabase({ email, password });
    const mayorista = await crearPerfilMayoristaBD({
      authUserId: usuarioAuth.id, nombre, email, telefono, nit,
    });
    return res.status(201).json({ success: true, mensaje: 'Usuario mayorista creado correctamente.', data: mayorista });
  } catch (error) {
    if (usuarioAuth?.id) await eliminarUsuarioSupabase(usuarioAuth.id).catch(() => {});
    if (error.codigo === 'SUPABASE_ADMIN_NO_CONFIGURADO') {
      return res.status(503).json({ success: false, mensaje: error.message });
    }
    return next(error);
  }
}

export async function obtenerCliente(req, res, next) {
  try {
    const id = String(req.params.id || '').trim();

    if (!id) {
      return res.status(400).json({
        success: false,
        mensaje: 'ID de cliente inválido',
      });
    }

    const cliente = await obtenerClienteBD(id);

    if (!cliente) {
      return res.status(404).json({
        success: false,
        mensaje: 'Cliente no encontrado',
      });
    }

    return res.json({
      success: true,
      data: cliente,
    });
  } catch (error) {
    next(error);
  }
}

export async function eliminarCliente(req, res, next) {
  try {
    const id = String(req.params.id || '').trim();
    if (!id) return res.status(400).json({ success: false, mensaje: 'ID de cliente inválido' });

    const cliente = await eliminarClienteBD(id);
    if (!cliente) return res.status(404).json({ success: false, mensaje: 'Cliente no encontrado' });
    return res.json({ success: true, mensaje: 'Cliente eliminado correctamente', data: cliente });
  } catch (error) {
    next(error);
  }
}
