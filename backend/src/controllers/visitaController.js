import { obtenerAnaliticaVisitasBD, registrarVistaBD } from '../models/visitaModel.js';

const RUTAS_PUBLICAS = new Set(['/', '/catalogo', '/productos', '/carrito', '/checkout']);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const MAX_DIAS = 366;

function fechaValida(valor) {
  if (typeof valor !== 'string' || !FECHA.test(valor)) return false;
  const fecha = new Date(`${valor}T00:00:00.000Z`);
  return !Number.isNaN(fecha.getTime()) && fecha.toISOString().slice(0, 10) === valor;
}

export async function registrarVistaPublica(req, res, next) {
  const { sessionId, pagePath } = req.body || {};
  if (typeof sessionId !== 'string' || !UUID.test(sessionId) || !RUTAS_PUBLICAS.has(pagePath)) {
    return res.status(400).json({ success: false, mensaje: 'La visita enviada no es válida.' });
  }

  try {
    await registrarVistaBD({ sessionId, pagePath });
    return res.status(201).json({ success: true });
  } catch (error) {
    return next(error);
  }
}

export async function obtenerAnaliticaVisitas(req, res, next) {
  const { desde, hasta } = req.query;
  if (!fechaValida(desde) || !fechaValida(hasta) || desde > hasta) {
    return res.status(400).json({ success: false, mensaje: 'Indica un rango de fechas válido.' });
  }

  const inicio = new Date(`${desde}T00:00:00.000Z`);
  const fin = new Date(`${hasta}T00:00:00.000Z`);
  const dias = Math.floor((fin - inicio) / 86400000) + 1;
  if (dias > MAX_DIAS) {
    return res.status(400).json({ success: false, mensaje: 'El rango máximo para consultar visitas es de 366 días.' });
  }

  try {
    const data = await obtenerAnaliticaVisitasBD({ desde, hasta });
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
}
