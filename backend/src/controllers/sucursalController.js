import { listarSucursalesConDisponibilidadBD } from '../models/sucursalModel.js';

export async function listarSucursalesConDisponibilidad(req, res, next) {
  try {
    const sucursales = await listarSucursalesConDisponibilidadBD();
    return res.json({ success: true, data: sucursales });
  } catch (error) {
    next(error);
  }
}
