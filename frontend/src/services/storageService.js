import { apiRequest } from './api.js';
import { getAdminToken } from './adminService.js';

// Las imágenes de producto se suben al backend (POST /api/archivos/productos), que las
// guarda en el almacenamiento propio y devuelve la URL pública. El navegador nunca
// habla con el almacenamiento directamente.
const MAX_BYTES = 8 * 1024 * 1024;

export async function subirImagenProducto(archivo, { codigoTerra = null, productoId = null } = {}) {
  if (!archivo?.type?.startsWith('image/')) throw new Error('Selecciona un archivo de imagen válido.');
  if (archivo.size > MAX_BYTES) throw new Error(`“${archivo.name}” supera el límite de 8 MB.`);
  const token = getAdminToken();
  if (!token) throw new Error('Inicia sesión como administrador para subir imágenes.');

  // Normaliza la foto (máx 1600px, JPEG q0.85) para que pese menos y siempre
  // tenga el mismo formato en el kiosco.
  const normalizada = await normalizarImagen(archivo);
  const formulario = new FormData();
  formulario.append('archivos', normalizada, 'imagen.jpg');
  if (codigoTerra) formulario.append('codigoTerra', String(codigoTerra));
  if (productoId) formulario.append('productoId', String(productoId));

  const datos = await apiRequest('/archivos/productos', {
    method: 'POST',
    body: formulario,
    headers: { Authorization: `Bearer ${token}` },
  });
  const url = Array.isArray(datos?.urls) ? datos.urls[0] : null;
  if (!url) throw new Error('El servidor no devolvió la URL de la imagen.');
  return url;
}

function normalizarImagen(archivo) {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onerror = () => reject(new Error(`No se pudo leer "${archivo.name}"`));
    lector.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error(`Formato no soportado: "${archivo.name}"`));
      img.onload = () => {
        const MAX = 1600;
        const escala = Math.min(1, MAX / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * escala));
        const h = Math.max(1, Math.round(img.height * escala));
        const lienzo = document.createElement('canvas');
        lienzo.width = w;
        lienzo.height = h;
        const ctx = lienzo.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        lienzo.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error(`No se pudo procesar "${archivo.name}"`))),
          'image/jpeg',
          0.85,
        );
      };
      img.src = lector.result;
    };
    lector.readAsDataURL(archivo);
  });
}
