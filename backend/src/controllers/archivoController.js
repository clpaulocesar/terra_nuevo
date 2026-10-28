import multer from 'multer';
import {
  ErrorAlmacenamiento,
  TIPOS_IMAGEN,
  carpetaProductos,
  detectarTipoImagen,
  nombreArchivoProducto,
  subirArchivo,
} from '../services/almacenamiento.js';

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_ARCHIVOS = 10;
const UUID = /^[0-9a-f-]{36}$/i;

// multipart/form-data en memoria; campo `archivos` (uno o varios).
const subida = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_BYTES, files: MAX_ARCHIVOS } }).array('archivos', MAX_ARCHIVOS);

export function recibirImagenes(req, res, next) {
  subida(req, res, (error) => {
    if (!error) return next();
    if (error.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ success: false, mensaje: 'Cada imagen puede pesar como máximo 5 MB.' });
    if (error.code === 'LIMIT_FILE_COUNT' || error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ success: false, mensaje: `Enviá hasta ${MAX_ARCHIVOS} imágenes en el campo "archivos".` });
    }
    return next(error);
  });
}

// POST /api/archivos/productos: valida el tipo real por los primeros bytes y sube cada
// imagen al copyparty con el nombre {codigo_terra}_{yyyymmddHHMMss}_{n}.{ext}.
export async function subirImagenesProducto(req, res, next) {
  try {
    const archivos = Array.isArray(req.files) ? req.files : [];
    if (!archivos.length) return res.status(400).json({ success: false, mensaje: 'Adjuntá al menos una imagen en el campo "archivos".' });

    const codigoTerra = String(req.body?.codigoTerra || '').trim() || null;
    const productoId = UUID.test(String(req.body?.productoId || '')) ? String(req.body.productoId) : null;

    const validados = [];
    for (const archivo of archivos) {
      const tipo = detectarTipoImagen(archivo.buffer);
      if (!tipo) {
        return res.status(400).json({ success: false, mensaje: `"${archivo.originalname}" no es una imagen JPG, PNG o WEBP válida.` });
      }
      validados.push({ buffer: archivo.buffer, tipo, extension: TIPOS_IMAGEN[tipo], bytes: archivo.size });
    }

    const fecha = new Date();
    const subidos = [];
    for (const [indice, archivo] of validados.entries()) {
      const nombre = nombreArchivoProducto({ codigoTerra, productoId, extension: archivo.extension, n: indice + 1, fecha });
      const resultado = await subirArchivo({ carpeta: carpetaProductos(), nombre, buffer: archivo.buffer, tipo: archivo.tipo });
      subidos.push({ url: resultado.url, nombre: resultado.nombre, tipo: archivo.tipo, bytes: archivo.bytes });
    }

    return res.status(201).json({ success: true, data: { urls: subidos.map((s) => s.url), archivos: subidos } });
  } catch (error) {
    if (error instanceof ErrorAlmacenamiento) {
      const status = error.tipo === 'rechazado' ? 502 : 503;
      console.error(`[archivos] ${error.tipo}: ${error.message}`);
      return res.status(status).json({ success: false, mensaje: error.message, codigo: `almacenamiento_${error.tipo}` });
    }
    return next(error);
  }
}
