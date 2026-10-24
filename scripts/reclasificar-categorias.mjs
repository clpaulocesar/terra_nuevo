// scripts/reclasificar-categorias.mjs
// Reasigna productos en Supabase a sus categorías específicas según su código/nombre.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(__dirname, '..');
const ENV_PATH = path.join(RAIZ, 'backend', '.env');

const require = createRequire(path.join(RAIZ, 'backend', 'package.json'));
const pg = require('pg');

if (!process.env.DATABASE_URL && fs.existsSync(ENV_PATH)) {
  const envContent = fs.readFileSync(ENV_PATH, 'utf-8');
  for (const line of envContent.split('\n')) {
    const match = line.match(/^\s*DATABASE_URL\s*=\s*(.+?)\s*$/);
    if (match) {
      process.env.DATABASE_URL = match[1].replace(/^['"]|['"]$/g, '');
      break;
    }
  }
}

const NUEVAS_CATEGORIAS = [
  { name: 'MUEBLES', slug: 'muebles' },
  { name: 'CUADROS Y DECORACIÓN', slug: 'cuadros-y-decoracion' },
  { name: 'ROPEROS', slug: 'roperos' },
  { name: 'MESAS', slug: 'mesas' },
  { name: 'CUBRECAMAS', slug: 'cubrecamas' },
  { name: 'CORTINAS', slug: 'cortinas' },
  { name: 'EDREDONES', slug: 'edredones' },
  { name: 'LAMPARAS', slug: 'lamparas' },
  { name: 'COMODAS', slug: 'comodas' }
];

const REGLAS_REASIGNACION = [
  { prefijo: 'RECA', categoria: 'RECAMIER' },
  { prefijo: 'POLT', categoria: 'POLTRONA' },
  { prefijo: 'SETC', categoria: 'SET CAMA' },
  { prefijo: 'CONJ', categoria: 'CONJUNTOS' },
  { prefijo: 'SOFC', categoria: 'SOFA CAMA' },
  { prefijo: 'MUEB', categoria: 'MUEBLES' },
  { prefijo: 'CUAD', categoria: 'CUADROS Y DECORACIÓN' },
  { prefijo: 'ROPE', categoria: 'ROPEROS' },
  { prefijo: 'MESA', categoria: 'MESAS' },
  { prefijo: 'CUBR', categoria: 'CUBRECAMAS' },
  { prefijo: 'CORT', categoria: 'CORTINAS' },
  { prefijo: 'EDRE', categoria: 'EDREDONES' },
  { prefijo: 'LAMP', categoria: 'LAMPARAS' },
  { prefijo: 'COMO', categoria: 'COMODAS' }
];

async function main() {
  console.log('===============================================================');
  console.log('  REASIGNACIÓN AUTOMÁTICA DE CATEGORÍAS EN SUPABASE');
  console.log('===============================================================\n');

  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  console.log('1. Verificando y creando categorías necesarias...');
  for (const cat of NUEVAS_CATEGORIAS) {
    const res = await pool.query('SELECT id FROM categories WHERE UPPER(name) = $1 OR slug = $2', [cat.name, cat.slug]);
    if (res.rowCount === 0) {
      await pool.query(
        'INSERT INTO categories (name, slug, is_active, updated_at) VALUES ($1, $2, TRUE, NOW())',
        [cat.name, cat.slug]
      );
      console.log(`   + Categoría creada: ${cat.name} (${cat.slug})`);
    } else {
      console.log(`   ✓ Categoría ya existe: ${cat.name}`);
    }
  }

  // Cargar mapa de todas las categorías
  const resCat = await pool.query('SELECT id, UPPER(name) as name FROM categories');
  const mapaCategorias = {};
  for (const r of resCat.rows) {
    mapaCategorias[r.name] = r.id;
  }

  console.log('\n2. Reasignando productos por prefijo de código TERRA...');
  let totalReasignados = 0;

  for (const regla of REGLAS_REASIGNACION) {
    const targetCatId = mapaCategorias[regla.categoria];
    if (!targetCatId) {
      console.warn(`   ! Advertencia: No se encontró ID para la categoría ${regla.categoria}`);
      continue;
    }

    const resUpdate = await pool.query(
      `UPDATE products
       SET category_id = $1, updated_at = NOW()
       WHERE UPPER(codigo_terra) LIKE $2 || '%'`,
      [targetCatId, regla.prefijo]
    );

    console.log(`   ✓ ${regla.prefijo}... ➔ ${regla.categoria}: ${resUpdate.rowCount} productos actualizados.`);
    totalReasignados += resUpdate.rowCount;
  }

  console.log(`\n✓ Total productos reasignados a categorías específicas: ${totalReasignados}`);

  console.log('\n3. Distribución final por categoría en Supabase:');
  const resFinal = await pool.query(`
    SELECT c.name, COUNT(p.id) as cantidad
    FROM products p
    JOIN categories c ON p.category_id = c.id
    GROUP BY c.name
    ORDER BY cantidad DESC
  `);

  for (const row of resFinal.rows) {
    console.log(`   - ${row.name.padEnd(25)} : ${row.cantidad} productos`);
  }

  await pool.end();
  console.log('\nReasignación finalizada con éxito.');
}

main().catch(err => {
  console.error('Error al reasignar categorías:', err);
  process.exit(1);
});
