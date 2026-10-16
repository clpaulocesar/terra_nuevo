const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
// Los proyectos nuevos de Supabase usan claves publicables `sb_publishable_*`.
// Se prioriza esa clave porque la anónima antigua puede quedar invalidada al rotar JWT.
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;
const BUCKET = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'product-images';

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
