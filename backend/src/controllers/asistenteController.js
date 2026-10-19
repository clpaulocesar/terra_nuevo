import { buscarProductosChatBD } from '../models/asistenteModel.js';

export async function buscarProductosChat(req, res, next) {
  try {
    const termino = String(req.query.termino ?? req.body?.termino ?? '').trim();
    if (termino.length > 120) return res.status(400).json({ success: false, mensaje: 'El término no puede superar 120 caracteres.' });
    const productos = await buscarProductosChatBD(termino);
    return res.json({ success: true, termino, total: productos.length, data: productos });
  } catch (error) {
    if (error.code === '42P01') {
      return res.status(503).json({
        success: false,
        mensaje: 'No se encontró la tabla de productos en Supabase.',
      });
    }
    if (error.code === '42703') {
      return res.status(503).json({
        success: false,
        mensaje: 'La tabla products no tiene las columnas esperadas por el asistente.',
      });
    }
    next(error);
  }
}
