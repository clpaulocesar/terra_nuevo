// Corrige las URLs de `products.imagen_url` que tienen saltos de línea o espacios
// sobrantes y lista las que todavía apuntan a Supabase (solo lectura para esas).
//
// Uso (desde la carpeta backend/):
//   node scripts/corregir-urls-imagenes.mjs            -> vista previa, no modifica nada
//   node scripts/corregir-urls-imagenes.mjs --aplicar  -> limpia las URLs con saltos de línea
//
// Toma DATABASE_URL del entorno o de backend/.env. Nunca borra ni reescribe URLs de
// Supabase: solo las informa para migrarlas cuando se defina el nuevo almacenamiento.
import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config({ path: path.resolve(import.meta.dirname, '../.env'), quiet: true });
const { pool } = await import('../src/config/database.js');

const APLICAR = process.argv.includes('--aplicar');
const limpiar = (url) => String(url || '').replace(/[\r\n\t]+/g, '').trim();

try {
  const { rows: sucias } = await pool.query(
    `SELECT id, codigo_terra, name, imagen_url
       FROM products
      WHERE imagen_url ~ '[\\r\\n\\t]' OR imagen_url <> btrim(imagen_url)
      ORDER BY codigo_terra`
  );
  console.log(`URLs con saltos de línea o espacios en products.imagen_url: ${sucias.length}`);
  for (const fila of sucias) {
    console.log(`  ${fila.codigo_terra || fila.id}  ${fila.name}`);
    console.log(`     antes:   ${JSON.stringify(fila.imagen_url)}`);
    console.log(`     después: ${JSON.stringify(limpiar(fila.imagen_url))}`);
  }

  const { rows: arreglosSucios } = await pool.query(
    `SELECT COUNT(*)::int AS n FROM products
      WHERE EXISTS (SELECT 1 FROM unnest(COALESCE(image_urls, '{}')) u WHERE u ~ '[\\r\\n\\t]' OR u <> btrim(u))`
  );
  if (arreglosSucios[0].n) console.log(`\nAviso: ${arreglosSucios[0].n} producto(s) con espacios o saltos de línea dentro de image_urls (no se tocan).`);

  if (sucias.length && APLICAR) {
    const conexion = await pool.connect();
    try {
      await conexion.query('BEGIN');
      for (const fila of sucias) {
        await conexion.query('UPDATE products SET imagen_url = $2, updated_at = NOW() WHERE id = $1', [fila.id, limpiar(fila.imagen_url) || null]);
      }
      await conexion.query('COMMIT');
      console.log(`\nListo. URLs corregidas: ${sucias.length}`);
    } catch (error) {
      await conexion.query('ROLLBACK');
      throw error;
    } finally {
      conexion.release();
    }
  } else if (sucias.length) {
    console.log('\nModo vista previa. Ejecutá con --aplicar para corregir estas URLs.');
  }

  const { rows: supabase } = await pool.query(
    `SELECT id, codigo_terra, name, imagen_url,
            ARRAY(SELECT u FROM unnest(COALESCE(image_urls, '{}')) u WHERE u ILIKE '%supabase.co%') AS galeria_supabase
       FROM products
      WHERE imagen_url ILIKE '%supabase.co%'
         OR EXISTS (SELECT 1 FROM unnest(COALESCE(image_urls, '{}')) u WHERE u ILIKE '%supabase.co%')
      ORDER BY codigo_terra`
  );
  console.log(`\nProductos con imágenes en Supabase: ${supabase.length}`);
  for (const fila of supabase) {
    const principal = String(fila.imagen_url || '').includes('supabase.co') ? limpiar(fila.imagen_url) : '(principal fuera de Supabase)';
    console.log(`  ${fila.codigo_terra || fila.id}  ${fila.name}`);
    console.log(`     imagen_url: ${principal}`);
    for (const url of fila.galeria_supabase) console.log(`     image_urls: ${limpiar(url)}`);
  }
} catch (error) {
  console.error('Error:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
