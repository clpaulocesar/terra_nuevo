
export function rutaNoEncontrada(req, res) {
  return res.status(404).json({
    success: false,
    mensaje: 'Ruta no encontrada',
  });
}

export function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || err.status || 500;
  let mensaje = err.message || 'Error interno del servidor';

  // Error por datos duplicados en PostgreSQL.
  if (err.code === '23505') {
    statusCode = 409;
    mensaje = 'Ya existe un registro con esos datos';
  }

  // Error por clave foránea.
  if (err.code === '23503') {
    statusCode = 400;
    mensaje = 'El registro relacionado no existe';
  }

  // Error por restricciones de base de datos.
  if (err.code === '23514') {
    statusCode = 400;
    mensaje = 'Los datos no cumplen las restricciones';
  }

  // JSON enviado con formato incorrecto.
  if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    mensaje = 'El JSON enviado no es válido';
  }

  if (statusCode >= 500) {
    console.error('Error del servidor:', err);
    mensaje = 'Error interno del servidor';
  }

  return res.status(statusCode).json({
    success: false,
    mensaje,
  });
}
