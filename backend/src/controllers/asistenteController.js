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
        mensaje: 'No existe la vista public.v_productos_chat en Supabase. Debe crearse antes de usar el asistente.',
      });
    }
    if (error.code === '42703') {
      return res.status(503).json({
        success: false,
        mensaje: 'La vista v_productos_chat no tiene las columnas esperadas: nombre, categoría, palabras_clave, medida y precio_venta.',
      });
    }
    next(error);
  }
}
