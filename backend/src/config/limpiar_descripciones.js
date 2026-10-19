// Limpia las descripciones genéricas autogeneradas por el panel de admin:
//   "Producto de alta calidad <nombre> disponible en Showroom Equipetrol con garantía oficial TERRA."
//
// La app lee los productos de la tabla "products" (columna "description").
//
// Uso (desde la carpeta backend/):
//   node src/config/limpiar_descripciones.js            -> solo muestra lo que hay (no modifica)
//   node src/config/limpiar_descripciones.js --aplicar  -> borra esas descripciones (las deja en blanco)
//
// Es idempotente: se puede volver a ejecutar sin problema.

import 'dotenv/config';
import { pool } from './database.js';

const APLICAR = process.argv.includes('--aplicar');

// Detecta el texto genérico: empieza con "Producto de alta calidad" y menciona el showroom.
const FILTRO = `description LIKE 'Producto de alta calidad %' AND description LIKE '%Showroom Equipetrol%'`;

async function main() {
  const { rows } = await pool.query(
    `SELECT id, name, description FROM products WHERE ${FILTRO} ORDER BY id`
  );

  console.log(`Productos con descripción genérica: ${rows.length}`);
  for (const fila of rows) {
    console.log(`  #${fila.id}  ${fila.name}`);
    console.log(`      "${fila.description}"`);
  }

  if (!rows.length) {
    console.log('No hay nada que limpiar.');
    return;
  }

  if (!APLICAR) {
    console.log('\nModo vista previa. Ejecutá con --aplicar para borrar estas descripciones.');
    return;
  }

  const resultado = await pool.query(
    `UPDATE products SET description = NULL, updated_at = NOW() WHERE ${FILTRO}`
  );
  console.log(`\nListo. Descripciones borradas: ${resultado.rowCount}`);
}

main()
  .catch((error) => {
    console.error('Error:', error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
