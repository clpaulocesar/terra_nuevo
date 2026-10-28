// Corrige las URLs de `products.imagen_url` que tienen saltos de línea o espacios sobrantes.
//
// Uso (desde la carpeta backend/):
//   node scripts/corregir-urls-imagenes.mjs            -> vista previa, no modifica nada
//   node scripts/corregir-urls-imagenes.mjs --aplicar  -> respalda en CSV y limpia las URLs
//
// Toma DATABASE_URL del entorno o de backend/.env.
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';

dotenv.config({ path: path.resolve(import.meta.dirname, '../.env'), quiet: true });
const { pool } = await import('../src/config/database.js');

const APLICAR = process.argv.includes('--aplicar');
const CARPETA_RESPALDOS = path.resolve(import.meta.dirname, 'respaldos');
const limpiar = (url) => String(url || '').replace(/[\r\n\t]+/g, '').trim();
const csv = (valor) => `"${String(valor ?? '').replace(/"/g, '""')}"`;

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
    // Respaldo de las filas tal como están antes de tocarlas.
    fs.mkdirSync(CARPETA_RESPALDOS, { recursive: true });
    const respaldo = path.join(CARPETA_RESPALDOS, `urls-imagen-${new Date().toISOString().replace(/[:.]/g, '-')}.csv`);
    fs.writeFileSync(respaldo, `id,codigo_terra,name,imagen_url\n${sucias.map((f) => [f.id, f.codigo_terra, f.name, f.imagen_url].map(csv).join(',')).join('\n')}\n`, 'utf8');
    console.log(`\nRespaldo escrito en ${respaldo}`);
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
} catch (error) {
  console.error('Error:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
