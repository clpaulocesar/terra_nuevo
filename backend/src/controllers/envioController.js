import {
  actualizarTarifaEnvioBD,
  crearTarifaEnvioBD,
  eliminarTarifaEnvioBD,
  listarTarifasEnvioBD,
  listarTodasTarifasEnvioBD,
} from '../models/envioModel.js';

export async function listarTarifasEnvio(req, res, next) {
  try {
    const tarifas = await listarTarifasEnvioBD();
    return res.json({ success: true, data: tarifas });
  } catch (error) {
    next(error);
  }
}

function datosTarifa(body) {
  const nombre = String(body?.nombre || '').trim();
  const costo = Number(body?.costo);
  const activo = body?.activo !== false;
  if (nombre.length < 3 || nombre.length > 180) throw Object.assign(new Error('El nombre debe tener entre 3 y 180 caracteres.'), { statusCode: 400 });
  if (!Number.isFinite(costo) || costo < 0 || costo > 10000) throw Object.assign(new Error('Ingresá un costo entre Bs. 0 y Bs. 10.000.'), { statusCode: 400 });
  return { nombre, costo, activo };
}

export async function listarTodasTarifasEnvio(req, res, next) {
  try { return res.json({ success: true, data: await listarTodasTarifasEnvioBD() }); } catch (error) { next(error); }
}

export async function crearTarifaEnvio(req, res, next) {
  try { return res.status(201).json({ success: true, data: await crearTarifaEnvioBD(datosTarifa(req.body)) }); } catch (error) { next(error); }
}

export async function actualizarTarifaEnvio(req, res, next) {
  try {
    const tarifa = await actualizarTarifaEnvioBD(String(req.params.id || ''), datosTarifa(req.body));
    if (!tarifa) return res.status(404).json({ success: false, mensaje: 'Zona no encontrada.' });
    return res.json({ success: true, data: tarifa });
  } catch (error) { next(error); }
}

export async function eliminarTarifaEnvio(req, res, next) {
  try {
    const eliminada = await eliminarTarifaEnvioBD(String(req.params.id || ''));
    if (!eliminada) return res.status(404).json({ success: false, mensaje: 'Zona no encontrada.' });
    return res.json({ success: true });
  } catch (error) { next(error); }
}
