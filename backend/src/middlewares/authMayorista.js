import { obtenerMayoristaDesdeToken } from '../services/sesionMayorista.js';

// Exige una sesión mayorista válida y deja el perfil en `req.mayorista`.
export async function authMayorista(req, res, next) {
  try {
    const perfil = await obtenerMayoristaDesdeToken(req.headers.authorization);
    if (!perfil?.cliente_id) {
      return res.status(401).json({ success: false, mensaje: 'Iniciá sesión como cliente mayorista.' });
    }
    req.mayorista = perfil;
    return next();
  } catch (error) {
    return next(error);
  }
}
