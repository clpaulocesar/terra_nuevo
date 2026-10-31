import {
  cancelarQrDinamico,
  consultarQrDinamico,
  ErrorBanecoNoImplementado,
  generarQrDinamico,
} from '../services/banecoQrService.js';
import {
  validarPedidoIdParaQr,
  validarQrIdBaneco,
} from '../utils/banecoQrValidacion.js';

function manejarErrorBaneco(res, next, error) {
  if (error instanceof ErrorBanecoNoImplementado) {
    return res.status(501).json({
      success: false,
      codigo: error.codigo,
      mensaje: error.message,
    });
  }

  return next(error);
}

export async function generarPagoQr(req, res, next) {
  const validacion = validarPedidoIdParaQr(req.body?.pedidoId);
  if (!validacion.valido) {
    return res.status(400).json({ success: false, mensaje: validacion.mensaje });
  }

  try {
    const data = await generarQrDinamico({ pedidoId: validacion.valor });
    return res.status(201).json({ success: true, data });
  } catch (error) {
    return manejarErrorBaneco(res, next, error);
  }
}

export async function consultarPagoQr(req, res, next) {
  const validacion = validarQrIdBaneco(req.params.qrId);
  if (!validacion.valido) {
    return res.status(400).json({ success: false, mensaje: validacion.mensaje });
  }

  try {
    const data = await consultarQrDinamico({ qrId: validacion.valor });
    return res.json({ success: true, data });
  } catch (error) {
    return manejarErrorBaneco(res, next, error);
  }
}

export async function cancelarPagoQr(req, res, next) {
  const validacion = validarQrIdBaneco(req.params.qrId);
  if (!validacion.valido) {
    return res.status(400).json({ success: false, mensaje: validacion.mensaje });
  }

  try {
    const data = await cancelarQrDinamico({ qrId: validacion.valor });
    return res.json({ success: true, data });
  } catch (error) {
    return manejarErrorBaneco(res, next, error);
  }
}
