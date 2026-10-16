import { buscarProductosChatBD } from '../models/asistenteModel.js';

export async function buscarProductosChat(req, res, next) {
  try {
    const termino = String(req.query.termino ?? req.body?.termino ?? '').trim();
    if (termino.length > 120) return res.status(400).json({ success: false, mensaje: 'El término no puede superar 120 caracteres.' });
    const productos = await buscarProductosChatBD(termino);
    return res.json({ success: true, termino, total: productos.length, data: productos });
  } catch (error) {
    next(error);
  }
}
