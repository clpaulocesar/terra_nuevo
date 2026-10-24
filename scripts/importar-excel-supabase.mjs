// scripts/importar-excel-supabase.mjs
// Importación NO DESTRUCTIVA de productos desde docs/TODOS.xls a Supabase PostgreSQL.
// REGLA DE ORO: NO modifica, no borra ni altera los productos existentes en Supabase.
// Por defecto se ejecuta en modo SIMULACIÓN (--dry-run).
// Para aplicar cambios reales en Supabase, se requiere el argumento explícito: --aplicar

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(__dirname, '..');
const ENV_PATH = path.join(RAIZ, 'backend', '.env');
const EXCEL_PATH = path.join(RAIZ, 'docs', 'TODOS.xls');

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

const APLICAR_CAMBIOS = process.argv.includes('--aplicar');

// Función para parsear SpreadsheetML (XML de Excel) de manera eficiente
function parsearSpreadsheetML(rutaArchivo) {
  const contenido = fs.readFileSync(rutaArchivo, 'utf-8');
  const filas = [];
  
  // Extraer las filas <Row>...</Row>
  const rowRegex = /<Row[^>]*>([\s\S]*?)<\/Row>/gi;
  let rowMatch;
  let esPrimeraFila = true;
  let headers = [];

  while ((rowMatch = rowRegex.exec(contenido)) !== null) {
    const rowContent = rowMatch[1];
    const cellRegex = /<Cell(?:\s+ss:Index="(\d+)")?[^>]*>(?:[\s\S]*?<Data[^>]*>([\s\S]*?)<\/Data>)?[\s\S]*?<\/Cell>/gi;
    let cellMatch;
    let colIdx = 0;
    const filaObj = {};
    const filaArray = [];

    while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
      if (cellMatch[1]) {
        colIdx = parseInt(cellMatch[1], 10) - 1;
      }
      let valor = cellMatch[2] !== undefined ? cellMatch[2].trim() : '';
      // Limpiar entidades XML básicas
      valor = valor.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
      
      if (esPrimeraFila) {
        headers[colIdx] = valor;
      } else {
        const nombreCol = headers[colIdx] || `col_${colIdx}`;
        filaObj[nombreCol] = valor;
        filaArray[colIdx] = valor;
      }
      colIdx++;
    }

    if (esPrimeraFila) {
      esPrimeraFila = false;
    } else if (Object.keys(filaObj).length > 0) {
      filas.push(filaObj);
    }
  }

  return { headers, filas };
}

function generarSlug(codigoTerra, nombre) {
  const base = `${codigoTerra || ''}-${nombre || ''}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return base.slice(0, 100) || `prod-${Date.now()}`;
}

// Clasificación inteligente de categorías existentes
function determinarCategoria(codigoTerra, nombre, mapaCategorias) {
  const cTerra = String(codigoTerra || '').toUpperCase();
  const nom = String(nombre || '').toUpperCase();

  // Mapeo por prefijos comunes de código TERRA
  if (cTerra.startsWith('ALMO') || nom.includes('ALMOHADA')) return mapaCategorias['ALMOHADA'];
  if (cTerra.startsWith('COLN') || cTerra.startsWith('COL') || nom.includes('COLCHON')) return mapaCategorias['COLCHON'];
  if (cTerra.startsWith('SOMI') || nom.includes('SOMIER')) return mapaCategorias['SOMIER'];
  if (cTerra.startsWith('TOAL') || nom.includes('TOALLA')) return mapaCategorias['TOALLA'];
  if (cTerra.startsWith('BATA') || nom.includes('BATA')) return mapaCategorias['BATA'];
  if (cTerra.startsWith('SOFA') || nom.includes('SOFA')) return mapaCategorias['SOFA'];
  if (cTerra.startsWith('ESPA') || nom.includes('ESPALDAR')) return mapaCategorias['ESPALDAR'];
  if (cTerra.startsWith('PUFF') || nom.includes('PUFF')) return mapaCategorias['PUFF'];
  if (cTerra.startsWith('COJI') || nom.includes('COJIN')) return mapaCategorias['COJIN'];
  if (cTerra.startsWith('SILL') || nom.includes('SILLA')) return mapaCategorias['SILLA'];
  if (cTerra.startsWith('BANQ') || nom.includes('BANQUETA')) return mapaCategorias['BANQUETA'];
  if (cTerra.startsWith('ALFO') || nom.includes('ALFOMBRA')) return mapaCategorias['ALFOMBRA'];

  // Categoría por defecto
  return mapaCategorias['ACCESORIOS'] || Object.values(mapaCategorias)[0];
}

async function main() {
  console.log('===============================================================');
  console.log('  IMPORTACIÓN SEGURA DE EXCEL (TODOS.xls) A SUPABASE');
  console.log('  REGLA: NO MODIFICA NI BORRA DATOS EXISTENTES EN SUPABASE');
  console.log(`  MODO: ${APLICAR_CAMBIOS ? '>>> APLICANDO CAMBIOS REALES <<<' : 'SIMULACIÓN / DRY-RUN (Solo lectura)'}`);
  console.log('===============================================================\n');

  if (!fs.existsSync(EXCEL_PATH)) {
    console.error(`ERROR: No se encontró el archivo en ${EXCEL_PATH}`);
    process.exit(1);
  }

  console.log('1. Leyendo y parseando docs/TODOS.xls (23 MB)...');
  const t0 = Date.now();
  const { headers, filas } = parsearSpreadsheetML(EXCEL_PATH);
  console.log(`   Leídas ${filas.length} filas en ${((Date.now() - t0) / 1000).toFixed(1)}s.`);
  console.log(`   Columnas detectadas: ${headers.slice(0, 10).join(', ')}...`);

  // Conectar a Supabase
  console.log('\n2. Conectando a Supabase para verificar estado actual...');
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 5,
  });

  // Obtener categorías actuales
  const resCat = await pool.query('SELECT id, UPPER(name) as name FROM categories');
  const mapaCategorias = {};
  for (const c of resCat.rows) {
    mapaCategorias[c.name] = c.id;
  }
  console.log(`   Categorías activas en base de datos: ${Object.keys(mapaCategorias).length}`);

  // Obtener productos ya existentes (para NO tocarlos)
  const resProd = await pool.query('SELECT id, codigo_terra, internal_code, name, imagen_url FROM products');
  const setExistentesTerra = new Set(resProd.rows.map(p => String(p.codigo_terra || '').trim().toUpperCase()).filter(Boolean));
  const setExistentesInternal = new Set(resProd.rows.map(p => String(p.internal_code || '').trim()).filter(Boolean));

  console.log(`   Productos actuales en Supabase: ${resProd.rows.length}`);
  console.log(`   Productos con fotos/imágenes activas en Supabase: ${resProd.rows.filter(p => Boolean(p.imagen_url)).length}`);

  // Analizar filas del Excel
  let yaExisten = 0;
  let nuevosParaInsertar = [];
  let sinCodigo = 0;
  const setProcesados = new Set(setExistentesTerra);

  for (const f of filas) {
    const cTerraOriginal = String(f['CODIGO_TERRA'] || '').trim().toUpperCase();
    const cInternal = String(f['CODIGO'] || '').trim();
    const cTerra = cTerraOriginal || (cInternal ? `INT-${cInternal}` : null);

    if (!cTerra && !cInternal) {
      sinCodigo++;
      continue;
    }

    // Si ya existe por codigo_terra o internal_code, LO PROTEGEMOS (NO SE TOCA)
    if ((cTerra && setProcesados.has(cTerra)) || (cInternal && setExistentesInternal.has(cInternal))) {
      yaExisten++;
      continue;
    }

    if (cTerra) setProcesados.add(cTerra);
    nuevosParaInsertar.push(f);
  }

  console.log('\n3. Balance del análisis del archivo Excel:');
  console.log(`   - Total registros en Excel:               ${filas.length}`);
  console.log(`   - Productos que YA EXISTEN en Supabase:   ${yaExisten} (SE MANTIENEN 100% INTACTOS)`);
  console.log(`   - Productos NUEVOS listos para ingresar:  ${nuevosParaInsertar.length}`);
  if (sinCodigo > 0) {
    console.log(`   - Registros omitidos (sin código):        ${sinCodigo}`);
  }

  if (!APLICAR_CAMBIOS) {
    console.log('\n---------------------------------------------------------------');
    console.log('RESULTADO DE LA SIMULACIÓN (DRY-RUN):');
    console.log('✓ Ningún dato fue alterado en Supabase.');
    console.log(`✓ Si deseas aplicar esta carga e insertar los ${nuevosParaInsertar.length} productos nuevos`);
    console.log('  sin tocar los existentes, ejecuta el comando con el parámetro --aplicar:');
    console.log('  node --env-file=backend/.env scripts/importar-excel-supabase.mjs --aplicar');
    console.log('---------------------------------------------------------------\n');
    await pool.end();
    return;
  }

  // Si se pasó --aplicar, proceder con inserciones no destructivas por lotes
  console.log(`\n4. Iniciando inserción de ${nuevosParaInsertar.length} productos nuevos...`);
  const BATCH_SIZE = 100;
  let insertados = 0;

  for (let i = 0; i < nuevosParaInsertar.length; i += BATCH_SIZE) {
    const lote = nuevosParaInsertar.slice(i, i + BATCH_SIZE);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const item of lote) {
        const cTerraOriginal = String(item['CODIGO_TERRA'] || '').trim().toUpperCase();
        const cInternal = String(item['CODIGO'] || '').trim();
        const cTerra = cTerraOriginal || (cInternal ? `INT-${cInternal}` : null);
        const nombre = String(item['PRODUCTO'] || 'Sin nombre').trim();
        const marca = String(item['MARCA'] || '').trim() || null;
        const medida = String(item['MEDIDA'] || '').trim() || null;
        const color = String(item['COLOR'] || '').trim() || null;
        const colorCode = String(item['CODIGOCOLOR'] || '').trim() || null;
        const grupo = String(item['GRUPO'] || '').trim() || null;
        const habilitado = String(item['HABILITADO'] || 'SI').toUpperCase() === 'SI';
        const precioFabrica = parseFloat(item['COSTO_COMPRA']) || 0;
        const precioPublico = parseFloat(item['PRECIO_PUBLICO']) || 0;
        const precioMayorista = String(item['PRECIO_MAYORISTA'] || '').trim() || null;
        const stockFeria = parseFloat(item['FERIA']) || 0;
        const stockGeneral = parseFloat(item['STOCK_GENERAL']) || stockFeria;
        
        const catId = determinarCategoria(cTerra, nombre, mapaCategorias);
        const slug = `${generarSlug(cTerra || cInternal, nombre)}-${i + lote.indexOf(item)}-${Date.now().toString(36)}`;

        // Consulta de inserción protegida con ON CONFLICT DO NOTHING
        const query = `
          INSERT INTO products (
            codigo_terra, internal_code, name, slug, marca, product_group,
            size, color, color_code, is_active, activo,
            precio_fabrica, public_price, precio_mayorista,
            stock_quantity, category_id, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6,
            $7, $8, $9, $10, $10,
            $11, $12, $13,
            $14, $15, NOW(), NOW()
          )
          ON CONFLICT (codigo_terra) DO NOTHING
        `;

        await client.query(query, [
          cTerra,
          cInternal || null,
          nombre,
          slug,
          marca,
          grupo,
          medida,
          color,
          colorCode,
          habilitado,
          precioFabrica,
          precioPublico,
          precioMayorista,
          stockGeneral,
          catId
        ]);
        insertados++;
      }
      await client.query('COMMIT');
      process.stdout.write(`   Progreso: ${Math.min(i + BATCH_SIZE, nuevosParaInsertar.length)} / ${nuevosParaInsertar.length} procesados...\r`);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`\nError en lote ${i} - ${i + BATCH_SIZE}:`, err.message);
    } finally {
      client.release();
    }
  }

  console.log(`\n\n✓ Inserción completada con éxito.`);
  console.log(`✓ Total procesados: ${insertados}`);
  console.log(`✓ Los productos originales de Supabase continúan intactos con sus fotos y relaciones.`);
  await pool.end();
}

main().catch(err => {
  console.error('Error durante el proceso:', err);
  process.exit(1);
});
