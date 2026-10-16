const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
// Los proyectos nuevos de Supabase usan claves publicables `sb_publishable_*`.
// Se prioriza esa clave porque la anónima antigua puede quedar invalidada al rotar JWT.
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;
const BUCKET = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'product-images';

export async function subirImagenProducto(archivo) {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('Falta configurar Supabase Storage en las variables del frontend.');
  if (!archivo?.type?.startsWith('image/')) throw new Error('Selecciona un archivo de imagen válido.');
  if (archivo.size > 8 * 1024 * 1024) throw new Error(`“${archivo.name}” supera el límite de 8 MB.`);

  // Normaliza la foto (máx 1600px, JPEG q0.85) para que pese menos y siempre
  // tenga el mismo formato en el kiosco.
  const normalizada = await normalizarImagen(archivo);
  const nombreSeguro = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.jpg`;
  const ruta = `productos/${nombreSeguro}`;
  const respuesta = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${ruta}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'image/jpeg',
      'x-upsert': 'false',
    },
    body: normalizada,
  });
  if (!respuesta.ok) {
    const detalle = await respuesta.text();
    throw new Error(`No se pudo subir la imagen. Verifica el bucket público “${BUCKET}” y sus permisos de inserción.${detalle ? ` (${detalle})` : ''}`);
  }
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${ruta}`;
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

export async function subirComprobantePago(archivo) {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('Falta configurar Supabase Storage en las variables del frontend.');
  if (!archivo?.type?.startsWith('image/')) throw new Error('Selecciona una imagen válida para el comprobante.');
  if (archivo.size > 8 * 1024 * 1024) throw new Error('El comprobante supera el límite de 8 MB.');
  const extension = archivo.name.split('.').pop()?.toLowerCase() || 'jpg';
  const ruta = `comprobantes/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${extension}`;
  const respuesta = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${ruta}`, { method: 'POST', headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': archivo.type, 'x-upsert': 'false' }, body: archivo });
  if (!respuesta.ok) throw new Error('No se pudo subir el comprobante. Verifica los permisos de Storage.');
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${ruta}`;
}
