const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const BUCKET = 'product-images';

export async function subirImagenProducto(archivo) {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('Falta configurar Supabase Storage en las variables del frontend.');
  if (!archivo?.type?.startsWith('image/')) throw new Error('Selecciona un archivo de imagen válido.');
  if (archivo.size > 8 * 1024 * 1024) throw new Error(`“${archivo.name}” supera el límite de 8 MB.`);

  const extension = archivo.name.split('.').pop()?.toLowerCase() || 'jpg';
  const nombreSeguro = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${extension}`;
  const ruta = `productos/${nombreSeguro}`;
  const respuesta = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${ruta}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': archivo.type,
      'x-upsert': 'false',
    },
    body: archivo,
  });
  if (!respuesta.ok) {
    const detalle = await respuesta.text();
    throw new Error(`No se pudo subir la imagen. Verifica el bucket público “${BUCKET}” y sus permisos de inserción.${detalle ? ` (${detalle})` : ''}`);
  }
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${ruta}`;
}
