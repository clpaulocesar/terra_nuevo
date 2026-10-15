import { pool } from '../config/database.js';

const campos = `p.id, COALESCE(p.codigo_terra, p.internal_code, p.slug) AS sku,
  p.name AS nombre, p.description AS descripcion, COALESCE(c.name, p.product_group, 'Sin categoría') AS categoria,
  COALESCE(p.public_price, 0) AS precio, p.stock_quantity::integer AS stock,
  p.size AS medida, p.color AS detalle, p.imagen_url, p.video_url, COALESCE(p.activo, p.is_active, TRUE) AS activo,
  COALESCE(
    (SELECT json_agg(pi.image_url ORDER BY pi.sort_order, pi.created_at) FROM product_images pi WHERE pi.product_id = p.id),
    CASE WHEN p.imagen_url IS NOT NULL THEN json_build_array(p.imagen_url) ELSE '[]'::json END
  ) AS imagenes`;

// Busca la categoría por nombre o la crea si no existe.
async function resolverCategoriaId(nombre) {
  const n = String(nombre || '').trim();
  if (!n) return null;
  const existente = await pool.query('SELECT id FROM categories WHERE LOWER(name) = LOWER($1) LIMIT 1', [n]);
  if (existente.rowCount) return existente.rows[0].id;
  const slug = n.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `cat-${Date.now()}`;
  try {
    const ins = await pool.query('INSERT INTO categories (name, slug) VALUES ($1, $2) RETURNING id', [n, slug]);
    return ins.rows[0].id;
  } catch {
    const re = await pool.query('SELECT id FROM categories WHERE slug = $1 LIMIT 1', [slug]);
    return re.rowCount ? re.rows[0].id : null;
  }
}

// Reemplaza la galería del producto en product_images.
async function guardarImagenes(productoId, lista) {
  await pool.query('DELETE FROM product_images WHERE product_id = $1', [productoId]);
  const urls = (Array.isArray(lista) ? lista : []).filter(Boolean);
  for (let i = 0; i < urls.length; i += 1) {
    await pool.query(
      'INSERT INTO product_images (product_id, image_url, sort_order, is_primary) VALUES ($1, $2, $3, $4)',
      [productoId, urls[i], i, i === 0]
    );
  }
}

export async function listarProductosBD({ buscar = '', categoria = '', pagina = 1, limite = 100, soloActivos = false } = {}) {
  const valores = [];
  const condiciones = [];
  if (soloActivos) condiciones.push('COALESCE(p.activo, p.is_active, TRUE) = TRUE');
  if (buscar) { valores.push(`%${buscar}%`); condiciones.push(`(p.name ILIKE $${valores.length} OR COALESCE(p.codigo_terra, p.internal_code, '') ILIKE $${valores.length})`); }
  if (categoria && categoria !== 'Todos') { valores.push(categoria); condiciones.push(`LOWER(COALESCE(c.name, p.product_group, '')) = LOWER($${valores.length})`); }
  valores.push(limite, (pagina - 1) * limite);
  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
  const { rows } = await pool.query(`SELECT ${campos} FROM products p LEFT JOIN categories c ON c.id=p.category_id ${where} ORDER BY p.created_at DESC LIMIT $${valores.length - 1} OFFSET $${valores.length}`, valores);
  return rows;
}

export async function obtenerProductoBD(id) {
  const { rows } = await pool.query(`SELECT ${campos} FROM products p LEFT JOIN categories c ON c.id=p.category_id WHERE p.id=$1`, [id]);
  return rows[0] || null;
}

export async function crearProductoBD(datos) {
  const baseSlug = String(datos.nombre || 'producto').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const codigo = String(datos.sku || `TRR-${Date.now()}`).trim();
  const categoriaId = await resolverCategoriaId(datos.categoria);
  const imagenes = Array.isArray(datos.imagenes) ? datos.imagenes.filter(Boolean) : [];
  const { rows } = await pool.query(
    `INSERT INTO products (name, slug, codigo_terra, description, public_price, stock_quantity, imagen_url, video_url, activo, is_active, internal_code, size, color, category_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$9,$3,$10,$11,$12) RETURNING id`,
    [datos.nombre, `${baseSlug}-${Date.now()}`, codigo, datos.descripcion || null, Number(datos.precio || 0), Number(datos.stock ?? datos.showroom ?? 0), imagenes[0] || datos.imagen_url || null, datos.video_url || null, datos.activo ?? true, datos.medida || null, datos.detalle || null, categoriaId]
  );
  await guardarImagenes(rows[0].id, imagenes.length ? imagenes : (datos.imagen_url ? [datos.imagen_url] : []));
  return obtenerProductoBD(rows[0].id);
}

export async function actualizarProductoBD(id, datos) {
  const categoriaId = (typeof datos.categoria === 'string' && datos.categoria.trim() ? await resolverCategoriaId(datos.categoria) : null) ?? null;
  const cambiaVideo = 'video_url' in datos;
  const { rows } = await pool.query(
    `UPDATE products SET name=COALESCE($1,name), description=COALESCE($2,description), public_price=COALESCE($3,public_price), stock_quantity=COALESCE($4,stock_quantity), imagen_url=COALESCE($5,imagen_url), video_url=CASE WHEN $6 THEN $7 ELSE video_url END, activo=COALESCE($8,activo), internal_code=COALESCE($9,internal_code), size=COALESCE($10,size), color=COALESCE($11,color), category_id=COALESCE($12,category_id), updated_at=NOW() WHERE id=$13 RETURNING id`,
    [datos.nombre, datos.descripcion, datos.precio, datos.stock ?? datos.showroom, datos.imagen_url, cambiaVideo, datos.video_url || null, datos.activo, datos.sku, datos.medida, datos.detalle, categoriaId, id]
  );
  if (!rows[0]) return null;
  if (Array.isArray(datos.imagenes)) {
    await guardarImagenes(id, datos.imagenes);
    if (!datos.imagenes.length) await pool.query('UPDATE products SET imagen_url = NULL WHERE id = $1', [id]);
  }
  return obtenerProductoBD(id);
}

export async function actualizarStockBD(id, { showroom, bodega }) {
  const { rows } = await pool.query('UPDATE products SET stock_quantity=$1, updated_at=NOW() WHERE id=$2 RETURNING id', [Number(showroom ?? 0) + Number(bodega ?? 0), id]);
  return rows[0] ? obtenerProductoBD(id) : null;
}

export async function eliminarProductoBD(id) {
  const { rows } = await pool.query('UPDATE products SET activo=FALSE, updated_at=NOW() WHERE id=$1 RETURNING id', [id]);
  return rows[0] ? obtenerProductoBD(id) : null;
}
