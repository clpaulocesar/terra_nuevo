import { createHash, randomUUID } from 'node:crypto';
import { pool } from '../config/database.js';
import { buscarCoincidenciasNombreProductoBD } from './productoModel.js';

let tablasListas;
export function asegurarTablasErpBD() {
  if (!tablasListas) tablasListas = Promise.all([
    pool.query(`CREATE TABLE IF NOT EXISTS product_barcodes (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE, barcode TEXT NOT NULL UNIQUE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`),
    pool.query(`CREATE TABLE IF NOT EXISTS erp_warehouse_stocks (product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE, warehouse_name TEXT NOT NULL, quantity INTEGER NOT NULL CHECK(quantity >= 0), synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), PRIMARY KEY(product_id, warehouse_name))`),
    pool.query(`CREATE TABLE IF NOT EXISTS erp_sync_runs (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), status TEXT NOT NULL CHECK(status IN ('running','completed','completed_with_errors','failed')), requested_by TEXT, requested_count INTEGER NOT NULL DEFAULT 0, processed_count INTEGER NOT NULL DEFAULT 0, failed_count INTEGER NOT NULL DEFAULT 0, details JSONB NOT NULL DEFAULT '[]'::jsonb, started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), finished_at TIMESTAMPTZ)`),
    pool.query(`CREATE TABLE IF NOT EXISTS erp_product_sync_state (product_id UUID PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE, erp_internal_code TEXT NOT NULL UNIQUE, source_hash TEXT NOT NULL, last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), last_image_sync_at TIMESTAMPTZ, last_error TEXT)`),
    pool.query(`CREATE TABLE IF NOT EXISTS erp_quotations (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), idempotency_key TEXT NOT NULL UNIQUE, status TEXT NOT NULL CHECK(status IN ('pending','completed','failed')), erp_number BIGINT UNIQUE, request_products JSONB NOT NULL, response JSONB, error_message TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), completed_at TIMESTAMPTZ)`),
  ]).catch((error) => { tablasListas = null; throw error; });
  return tablasListas;
}

async function categoriaId(conexion, nombre) {
  const limpio = String(nombre || 'Sin categoría').trim() || 'Sin categoría';
  const existente = await conexion.query('SELECT id FROM categories WHERE LOWER(name)=LOWER($1) LIMIT 1', [limpio]);
  if (existente.rowCount) return existente.rows[0].id;
  const slug = `${limpio.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${Date.now()}`;
  const creada = await conexion.query('INSERT INTO categories(name,slug,is_active) VALUES($1,$2,TRUE) RETURNING id', [limpio, slug]);
  return creada.rows[0].id;
}

export async function guardarProductoErpBD(producto, { imagenes = [] } = {}) {
  await asegurarTablasErpBD();
  const codigo = String(producto.codigo || '').trim();
  const codigoTerra = String(producto.codigoTerra || '').trim();
  if (!/^\d+$/.test(codigo) || !codigoTerra || !String(producto.nombre || '').trim()) throw new Error('El ERP devolvió un producto incompleto.');
  const conexion = await pool.connect();
  try {
    await conexion.query('BEGIN');
    const categoria = await categoriaId(conexion, producto.grupo);
    const existe = await conexion.query('SELECT id FROM products WHERE internal_code=$1 OR codigo_terra=$2 LIMIT 1 FOR UPDATE', [codigo, codigoTerra]);
    let productId;
    if (existe.rowCount) {
      productId = existe.rows[0].id;
      await conexion.query(`UPDATE products SET codigo_terra=$1, internal_code=$2, name=$3, size=$4, color=$5, marca=$6, product_group=$7, stock_quantity=$8, category_id=$9, updated_at=NOW() WHERE id=$10`, [codigoTerra, codigo, producto.nombre, producto.medida || null, producto.color || null, producto.marca || null, producto.grupo || null, Number(producto.stockTotal || 0), categoria, productId]);
    } else {
      const slug = `${codigoTerra.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;
      const creado = await conexion.query(`INSERT INTO products(name,slug,codigo_terra,internal_code,size,color,marca,product_group,stock_quantity,category_id,public_price,activo,is_active) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,0,TRUE,TRUE) RETURNING id`, [producto.nombre, slug, codigoTerra, codigo, producto.medida || null, producto.color || null, producto.marca || null, producto.grupo || null, Number(producto.stockTotal || 0), categoria]);
      productId = creado.rows[0].id;
    }
    await conexion.query('DELETE FROM product_barcodes WHERE product_id=$1', [productId]);
    for (const barra of [...new Set((producto.codigosBarras || []).map(String).filter(Boolean))]) await conexion.query('INSERT INTO product_barcodes(product_id,barcode) VALUES($1,$2)', [productId, barra]);
    await conexion.query('DELETE FROM erp_warehouse_stocks WHERE product_id=$1', [productId]);
    for (const almacen of producto.almacenes || []) await conexion.query('INSERT INTO erp_warehouse_stocks(product_id,warehouse_name,quantity) VALUES($1,$2,$3)', [productId, String(almacen.almacen || 'Sin almacén'), Math.max(0, Number(almacen.stock || 0))]);
    if (imagenes.length) {
      await conexion.query('UPDATE products SET imagen_url=$1,image_urls=$2,updated_at=NOW() WHERE id=$3', [imagenes[0], imagenes, productId]);
      await conexion.query('DELETE FROM product_images WHERE product_id=$1', [productId]);
      for (const [orden, imageUrl] of imagenes.entries()) await conexion.query('INSERT INTO product_images(product_id,image_url,alt_text,sort_order,is_primary) VALUES($1,$2,$3,$4,$5)', [productId, imageUrl, producto.nombre, orden, orden === 0]);
    }
    const hash = createHash('sha256').update(JSON.stringify(producto)).digest('hex');
    await conexion.query(`INSERT INTO erp_product_sync_state(product_id,erp_internal_code,source_hash,last_synced_at,last_image_sync_at,last_error) VALUES($1,$2,$3,NOW(),CASE WHEN $4 THEN NOW() ELSE NULL END,NULL) ON CONFLICT(product_id) DO UPDATE SET erp_internal_code=EXCLUDED.erp_internal_code,source_hash=EXCLUDED.source_hash,last_synced_at=NOW(),last_image_sync_at=CASE WHEN $4 THEN NOW() ELSE erp_product_sync_state.last_image_sync_at END,last_error=NULL`, [productId, codigo, hash, imagenes.length > 0]);
    await conexion.query('COMMIT');
    const coincidencias = await buscarCoincidenciasNombreProductoBD({
      nombre: producto.nombre,
      medida: producto.medida,
      color: producto.color,
      excluirId: productId,
    });
    return { id: productId, codigo, codigoTerra, coincidencias };
  } catch (error) { await conexion.query('ROLLBACK'); throw error; } finally { conexion.release(); }
}

export async function iniciarSincronizacionBD({ solicitante, cantidad }) { await asegurarTablasErpBD(); const { rows } = await pool.query('INSERT INTO erp_sync_runs(status,requested_by,requested_count) VALUES($1,$2,$3) RETURNING id', ['running', solicitante || null, cantidad]); return rows[0].id; }
export async function finalizarSincronizacionBD(id, detalles) { const fallidos = detalles.filter((item) => !item.ok).length; await pool.query('UPDATE erp_sync_runs SET status=$1,processed_count=$2,failed_count=$3,details=$4,finished_at=NOW() WHERE id=$5', [fallidos ? 'completed_with_errors' : 'completed', detalles.length - fallidos, fallidos, JSON.stringify(detalles), id]); }

export async function reservarCotizacionBD(clave, productos) { await asegurarTablasErpBD(); const existente = await pool.query('SELECT * FROM erp_quotations WHERE idempotency_key=$1', [clave]); if (existente.rowCount) return { nueva: false, cotizacion: existente.rows[0] }; const { rows } = await pool.query('INSERT INTO erp_quotations(idempotency_key,status,request_products) VALUES($1,$2,$3) RETURNING *', [clave, 'pending', JSON.stringify(productos)]); return { nueva: true, cotizacion: rows[0] }; }
export async function completarCotizacionBD(id, respuesta) { const { rows } = await pool.query('UPDATE erp_quotations SET status=$1,erp_number=$2,response=$3,completed_at=NOW() WHERE id=$4 RETURNING *', ['completed', respuesta.numero, JSON.stringify(respuesta), id]); return rows[0]; }
export async function fallarCotizacionBD(id, mensaje) { await pool.query('UPDATE erp_quotations SET status=$1,error_message=$2,completed_at=NOW() WHERE id=$3', ['failed', mensaje.slice(0, 1000), id]); }
