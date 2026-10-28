import bcrypt from 'bcryptjs';
import {
  crearClienteBD,
  eliminarClienteBD,
  obtenerClienteBD,
  listarClientesBD,
  actualizarPerfilMayoristaBD,
} from '../models/clienteModel.js';
import { crearPerfilMayoristaBD, actualizarClaveMayoristaBD } from '../models/mayoristaModel.js';
import { iniciarSesionMayorista as iniciarSesionMayoristaServicio } from '../services/sesionMayorista.js';
import { claveIntento, estaBloqueado, registrarFallo, limpiarIntentos } from '../services/limiteIntentos.js';
import { listarPedidosPorClienteBD, obtenerPedidoBD } from '../models/pedidoModel.js';

function campoTexto(valor) {
  return typeof valor === 'string' ? valor.trim() : '';
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NIT = /^[0-9]{5,20}$/;
const UUID = /^[0-9a-f-]{36}$/i;

function ipDe(req) {
  return String(req.headers['x-forwarded-for'] || req.ip || req.socket?.remoteAddress || '').split(',')[0].trim();
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
    const nombre = campoTexto(req.body?.nombre);
    const telefono = campoTexto(req.body?.telefono) || null;
    const email = campoTexto(req.body?.email).toLowerCase() || null;
    const nit = campoTexto(req.body?.nit) || null;

    if (nombre.length < 2 || nombre.length > 120) {
      return res.status(400).json({ success: false, mensaje: 'El nombre debe tener entre 2 y 120 caracteres' });
    }
    if (telefono && telefono.length > 30) {
      return res.status(400).json({ success: false, mensaje: 'El teléfono es demasiado largo' });
    }
    if (email && (email.length > 150 || !EMAIL.test(email))) {
      return res.status(400).json({ success: false, mensaje: 'Correo electrónico inválido' });
    }
    if (nit && !NIT.test(nit)) {
      return res.status(400).json({ success: false, mensaje: 'NIT inválido: debe tener entre 5 y 20 dígitos' });
    }

    const cliente = await crearClienteBD({ nombre, telefono, email, nit });
    return res.status(201).json({ success: true, mensaje: 'Cliente registrado correctamente', data: cliente });
  } catch (error) {
    next(error);
  }
}

// Alta de cuenta mayorista desde el backoffice: cliente + usuario con clave propia.
export async function crearUsuarioMayorista(req, res, next) {
  const nombre = campoTexto(req.body?.nombre);
  const email = campoTexto(req.body?.email).toLowerCase();
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const telefono = campoTexto(req.body?.telefono) || null;
  const nit = campoTexto(req.body?.nit) || null;

  if (nombre.length < 2 || nombre.length > 120) return res.status(400).json({ success: false, mensaje: 'El nombre debe tener entre 2 y 120 caracteres.' });
  if (email.length > 150 || !EMAIL.test(email)) return res.status(400).json({ success: false, mensaje: 'Correo electrónico inválido.' });
  if (password.length < 8 || password.length > 128) return res.status(400).json({ success: false, mensaje: 'La contraseña debe tener entre 8 y 128 caracteres.' });
  if (telefono && telefono.length > 30) return res.status(400).json({ success: false, mensaje: 'El teléfono es demasiado largo.' });
  if (nit && !NIT.test(nit)) return res.status(400).json({ success: false, mensaje: 'NIT inválido: debe tener entre 5 y 20 dígitos.' });

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const mayorista = await crearPerfilMayoristaBD({ nombre, email, telefono, nit, passwordHash });
    return res.status(201).json({ success: true, mensaje: 'Usuario mayorista creado correctamente.', data: mayorista });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, mensaje: error.message });
    return next(error);
  }
}

// Login de mayoristas: correo + clave contra `users`, con límite de intentos por email+IP.
export async function iniciarSesionMayorista(req, res, next) {
  try {
    const email = campoTexto(req.body?.email).toLowerCase();
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!EMAIL.test(email) || !password) return res.status(400).json({ success: false, mensaje: 'Ingresá tu correo y tu contraseña.' });

    const clave = claveIntento(email, ipDe(req));
    if (estaBloqueado(clave)) {
      return res.status(429).json({ success: false, mensaje: 'Demasiados intentos. Esperá 15 minutos antes de volver a intentar.' });
    }
    try {
      const sesion = await iniciarSesionMayoristaServicio(email, password);
      limpiarIntentos(clave);
      return res.json({ success: true, data: sesion });
    } catch (error) {
      if (error.statusCode === 401) {
        registrarFallo(clave);
        return res.status(401).json({ success: false, mensaje: error.message });
      }
      throw error;
    }
  } catch (error) { next(error); }
}

// Asignar o resetear la clave de un mayorista (solo administrador).
export async function asignarClaveMayorista(req, res, next) {
  try {
    const id = campoTexto(req.params.id);
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!UUID.test(id)) return res.status(400).json({ success: false, mensaje: 'Identificador de cliente inválido.' });
    if (password.length < 8 || password.length > 128) return res.status(400).json({ success: false, mensaje: 'La contraseña debe tener entre 8 y 128 caracteres.' });
    const passwordHash = await bcrypt.hash(password, 10);
    const actualizado = await actualizarClaveMayoristaBD(id, passwordHash);
    if (!actualizado) return res.status(404).json({ success: false, mensaje: 'El cliente no tiene cuenta mayorista.' });
    return res.json({ success: true, mensaje: 'Clave actualizada. Compartila de forma segura con el cliente.' });
  } catch (error) { next(error); }
}

export function obtenerSesionCliente(req, res) {
  return res.json({ success: true, data: req.mayorista });
}

export async function actualizarPerfilMayorista(req, res, next) {
  try {
    const perfil = req.mayorista;
    const nombre = campoTexto(req.body?.nombre) || perfil.nombre;
    const titular = campoTexto(req.body?.titular) || null;
    const telefono = campoTexto(req.body?.telefono) || null;
    const nit = campoTexto(req.body?.nit) || null;
    const direccion = campoTexto(req.body?.direccion) || null;
    const referencia = campoTexto(req.body?.referencia) || null;
    const gps = campoTexto(req.body?.gps);

    if (nombre.length < 2 || nombre.length > 120) {
      return res.status(400).json({ success: false, mensaje: 'La razón social debe tener entre 2 y 120 caracteres.' });
    }
    if (titular && titular.length > 120) {
      return res.status(400).json({ success: false, mensaje: 'El nombre del titular es demasiado largo.' });
    }
    if (telefono && telefono.length > 30) {
      return res.status(400).json({ success: false, mensaje: 'El teléfono es demasiado largo.' });
    }
    if (nit && !NIT.test(nit)) {
      return res.status(400).json({ success: false, mensaje: 'NIT inválido: debe tener entre 5 y 20 dígitos.' });
    }
    if (direccion && direccion.length > 250) {
      return res.status(400).json({ success: false, mensaje: 'La dirección de envío es demasiado larga.' });
    }
    if (referencia && referencia.length > 250) {
      return res.status(400).json({ success: false, mensaje: 'La referencia de entrega es demasiado larga.' });
    }

    let latitud = null;
    let longitud = null;
    if (gps) {
      const [latTexto, lngTexto] = gps.split(',');
      const lat = Number(latTexto);
      const lng = Number(lngTexto);
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return res.status(400).json({ success: false, mensaje: 'Las coordenadas GPS no son válidas.' });
      }
      latitud = lat;
      longitud = lng;
    }

    const actualizado = await actualizarPerfilMayoristaBD(perfil.cliente_id, {
      nombre, titular, telefono, nit, direccion, referencia, latitud, longitud,
    });
    if (!actualizado) {
      return res.status(404).json({ success: false, mensaje: 'No se encontró el perfil mayorista.' });
    }

    return res.json({ success: true, mensaje: 'Perfil y dirección de envío actualizados correctamente.', data: actualizado });
  } catch (error) { next(error); }
}

export async function listarMisPedidosMayorista(req, res, next) {
  try {
    const limite = Number(req.query.limite ?? 50);
    if (!Number.isSafeInteger(limite) || limite < 1 || limite > 100) return res.status(400).json({ success: false, mensaje: 'Límite inválido.' });
    const pedidos = await listarPedidosPorClienteBD(req.mayorista.cliente_id, limite);
    return res.json({ success: true, data: pedidos });
  } catch (error) { next(error); }
}

export async function obtenerMiPedidoMayorista(req, res, next) {
  try {
    const pedido = await obtenerPedidoBD(String(req.params.id || '').trim());
    if (!pedido || String(pedido.cliente_id) !== String(req.mayorista.cliente_id)) {
      return res.status(404).json({ success: false, mensaje: 'Pedido no encontrado.' });
    }
    return res.json({ success: true, data: pedido });
  } catch (error) { next(error); }
}

export async function obtenerCliente(req, res, next) {
  try {
    const id = String(req.params.id || '').trim();
    if (!id) return res.status(400).json({ success: false, mensaje: 'ID de cliente inválido' });
    const cliente = await obtenerClienteBD(id);
    if (!cliente) return res.status(404).json({ success: false, mensaje: 'Cliente no encontrado' });
    return res.json({ success: true, data: cliente });
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
