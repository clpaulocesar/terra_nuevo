
import {
  crearClienteBD,
  obtenerClienteBD,
} from '../models/clienteModel.js';

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

    const cliente = await crearClienteBD({
      nombre,
      telefono,
      email,
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

export async function obtenerCliente(req, res, next) {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id < 1) {
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
