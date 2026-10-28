// Migra a copyparty las imágenes de producto que todavía apuntan a Supabase: descarga
// cada archivo, lo sube con services/almacenamiento.js y reemplaza la URL donde aparezca
// (products.imagen_url, products.image_urls y product_images.image_url).
//
// Uso (desde la carpeta backend/):
//   node scripts/migrar-imagenes-supabase.mjs            -> vista previa: descarga y valida, no sube ni escribe
//   node scripts/migrar-imagenes-supabase.mjs --aplicar  -> sube, exporta un CSV de respaldo y reemplaza las URLs
//
// Solo reemplaza URLs: no inserta ni borra filas de product_images (hay filas heredadas
// que no están en image_urls y no deben perderse). Antes de descargar normaliza la URL
// (saltos de línea y doble barra). Es el único lugar del repo autorizado a leer URLs de
// Supabase. MIGRACION_PATRON_ORIGEN (regex) solo sirve para las pruebas con un servidor
// falso; por defecto es `supabase\.co`.
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';

dotenv.config({ path: path.resolve(import.meta.dirname, '../.env'), quiet: true });
const { pool } = await import('../src/config/database.js');
const { subirArchivo, carpetaProductos, detectarTipoImagen, nombreArchivoProducto, TIPOS_IMAGEN } = await import('../src/services/almacenamiento.js');
const { asegurarTablaImagenesBD } = await import('../src/models/productoModel.js');

const APLICAR = process.argv.includes('--aplicar');
const PATRON = new RegExp(process.env.MIGRACION_PATRON_ORIGEN || 'supabase\\.co', 'i');
const CARPETA_RESPALDOS = path.resolve(import.meta.dirname, 'respaldos');
const MAX_BYTES = 15 * 1024 * 1024;

const normalizar = (url) => String(url || '').replace(/[\r\n\t]+/g, '').trim().replace(/([^:]\/)\/+/g, '$1');
const esOrigen = (url) => PATRON.test(String(url || ''));
const csv = (valor) => `"${String(valor ?? '').replace(/"/g, '""')}"`;

async function descargar(url) {
  const respuesta = await fetch(url, { signal: AbortSignal.timeout(30000), redirect: 'follow' });
  if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status} al descargar`);
  const buffer = Buffer.from(await respuesta.arrayBuffer());
  if (!buffer.length) throw new Error('archivo vacío');
  if (buffer.length > MAX_BYTES) throw new Error(`archivo de ${buffer.length} bytes supera el máximo`);
  const tipo = detectarTipoImagen(buffer);
  if (!tipo) throw new Error('no es JPG, PNG ni WEBP');
  return { buffer, tipo, extension: TIPOS_IMAGEN[tipo] };
}

try {
  await asegurarTablaImagenesBD();
  const { rows: productos } = await pool.query(
    `SELECT p.id, p.codigo_terra, p.name, p.imagen_url, p.image_urls,
            COALESCE((SELECT json_agg(json_build_object('id', pi.id, 'url', pi.image_url))
                        FROM product_images pi WHERE pi.product_id = p.id AND pi.image_url ~* $1), '[]'::json) AS filas_imagenes
       FROM products p
      WHERE p.imagen_url ~* $1
         OR EXISTS (SELECT 1 FROM unnest(COALESCE(p.image_urls, '{}')) u WHERE u ~* $1)
         OR EXISTS (SELECT 1 FROM product_images pi WHERE pi.product_id = p.id AND pi.image_url ~* $1)
      ORDER BY p.codigo_terra`,
    [PATRON.source]
  );
  console.log(`${APLICAR ? 'MIGRACIÓN' : 'VISTA PREVIA'} · productos con imágenes de origen: ${productos.length}`);

  const migradas = [];
  const fallidas = [];
  const cambios = [];
  const fecha = new Date();

  for (const producto of productos) {
    const galeria = Array.isArray(producto.image_urls) ? producto.image_urls : null;
    const originales = [producto.imagen_url, ...(galeria || []), ...producto.filas_imagenes.map((f) => f.url)].filter((u) => esOrigen(u));
    const distintas = [...new Set(originales.map(normalizar))];
    const nuevas = new Map();
    let n = 0;
    for (const original of distintas) {
      n += 1;
      try {
        const { buffer, tipo, extension } = await descargar(original);
        const nombre = nombreArchivoProducto({ codigoTerra: producto.codigo_terra, productoId: producto.id, extension, n, fecha });
        let url = `(se subiría como ${carpetaProductos()}/${nombre})`;
        if (APLICAR) ({ url } = await subirArchivo({ carpeta: carpetaProductos(), nombre, buffer, tipo }));
        nuevas.set(original, url);
        migradas.push({ codigo: producto.codigo_terra, original, nueva: url, bytes: buffer.length });
      } catch (error) {
        fallidas.push({ codigo: producto.codigo_terra, original, motivo: error.message });
      }
    }
    if (!nuevas.size) continue;
    const reemplazar = (u) => (esOrigen(u) && nuevas.has(normalizar(u)) ? nuevas.get(normalizar(u)) : u);
    cambios.push({
      producto,
      imagen_url: producto.imagen_url ? reemplazar(producto.imagen_url) : producto.imagen_url,
      // NULL se conserva como NULL: el catálogo lo trata distinto de un arreglo vacío.
      image_urls: galeria ? galeria.map(reemplazar) : galeria,
      filas_imagenes: producto.filas_imagenes
        .filter((f) => nuevas.has(normalizar(f.url)))
        .map((f) => ({ id: f.id, anterior: f.url, nueva: nuevas.get(normalizar(f.url)) })),
    });
  }

  if (APLICAR && cambios.length) {
    fs.mkdirSync(CARPETA_RESPALDOS, { recursive: true });
    const archivo = path.join(CARPETA_RESPALDOS, `imagenes-supabase-${fecha.toISOString().replace(/[:.]/g, '-')}.csv`);
    const lineas = ['tabla,id,codigo_terra,name,imagen_url,image_urls'];
    for (const { producto, filas_imagenes: filas } of cambios) {
      lineas.push(['products', producto.id, producto.codigo_terra, producto.name, producto.imagen_url, JSON.stringify(producto.image_urls)].map(csv).join(','));
      for (const fila of filas) lineas.push(['product_images', fila.id, producto.codigo_terra, producto.name, fila.anterior, ''].map(csv).join(','));
    }
    fs.writeFileSync(archivo, `${lineas.join('\n')}\n`, 'utf8');
    console.log(`Respaldo escrito en ${archivo}`);

    const conexion = await pool.connect();
    try {
      await conexion.query('BEGIN');
      for (const cambio of cambios) {
        await conexion.query('UPDATE products SET imagen_url = $2, image_urls = $3, updated_at = NOW() WHERE id = $1', [cambio.producto.id, cambio.imagen_url, cambio.image_urls]);
        for (const fila of cambio.filas_imagenes) {
          await conexion.query('UPDATE product_images SET image_url = $2 WHERE id = $1', [fila.id, fila.nueva]);
        }
      }
      await conexion.query('COMMIT');
    } catch (error) {
      await conexion.query('ROLLBACK');
      throw error;
    } finally {
      conexion.release();
    }
  }

  const filasImagenes = cambios.reduce((total, c) => total + c.filas_imagenes.length, 0);
  console.log(`\n## ${APLICAR ? 'Migradas' : 'Listas para migrar'}: ${migradas.length}`);
  for (const m of migradas) console.log(`  ${m.codigo}  ${m.original}  ->  ${m.nueva}  (${m.bytes} B)`);
  console.log(`\n## Fallidas: ${fallidas.length}`);
  for (const f of fallidas) console.log(`  ${f.codigo}  ${f.original}  :: ${f.motivo}`);
  console.log(`\n## Productos ${APLICAR ? 'actualizados' : 'que se actualizarían'}: ${cambios.length}`);
  console.log(`## Filas de product_images ${APLICAR ? 'actualizadas' : 'que se actualizarían'}: ${filasImagenes}`);
  if (!APLICAR && migradas.length) console.log('\nModo vista previa: nada se subió ni se escribió. Ejecutá con --aplicar para migrar.');
  if (fallidas.length) process.exitCode = 2;
} catch (error) {
  console.error('Error:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
