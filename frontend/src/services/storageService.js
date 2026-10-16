// Subida directa de imágenes a Supabase Storage (bucket público `product-images`).
// No requiere dependencias nuevas: usa la API REST de Storage con fetch.
// En la BD solo se guarda la URL pública https resultante.

const SUPABASE_URL = String(import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_ANON_KEY = String(import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();
const BUCKET = 'product-images';
const MAX_PX = 1600;
const MAX_BYTES = 5 * 1024 * 1024;

export function subidaStorageDisponible() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

// Normaliza la imagen (máx 1600px, JPEG q0.85) y devuelve un Blob listo para subir.
function normalizarABlob(archivo) {
  return new Promise((resolve, reject) => {
    if (!archivo || !String(archivo.type || '').startsWith('image/')) {
      reject(new Error(`"${archivo?.name || 'archivo'}" no es una imagen válida`));
      return;
    }
    if (archivo.size > MAX_BYTES && !String(archivo.type).startsWith('image/')) {
      reject(new Error(`"${archivo.name}" supera los 5 MB`));
      return;
    }
    const lector = new FileReader();
    lector.onerror = () => reject(new Error(`No se pudo leer "${archivo.name}"`));
    lector.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error(`Formato no soportado: "${archivo.name}"`));
      img.onload = () => {
        const escala = Math.min(1, MAX_PX / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * escala));
        const h = Math.max(1, Math.round(img.height * escala));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob(
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

export async function subirImagen(archivo, { signal } = {}) {
  if (!subidaStorageDisponible()) {
    throw new Error('Subida no configurada: falta VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en frontend/.env');
  }
  const blob = await normalizarABlob(archivo);
  const nombre = `productos/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.jpg`;
  const respuesta = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${nombre}`, {
    method: 'POST',
    signal,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'image/jpeg',
      'x-upsert': 'false',
    },
    body: blob,
  });
  if (!respuesta.ok) {
    const detalle = await respuesta.text().catch(() => '');
    throw new Error(`No se pudo subir "${archivo.name}" (${respuesta.status}). ${detalle}`.trim());
  }
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${nombre}`;
}
