import { pool } from '../config/database.js';

const campos = `p.id, COALESCE(p.codigo_terra, p.internal_code, p.slug) AS sku,
  p.name AS nombre, p.description AS descripcion, COALESCE(c.name, p.product_group, 'Sin categoría') AS categoria,
  COALESCE(p.public_price, 0) AS precio, p.stock_quantity::integer AS stock,
  p.size AS medida, p.color AS detalle, p.imagen_url, COALESCE(p.activo, p.is_active, TRUE) AS activo`;

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
  const { rows } = await pool.query(
    `INSERT INTO products (name, slug, codigo_terra, description, public_price, stock_quantity, imagen_url, activo, is_active, internal_code, size, color)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$8,$3,$9,$10) RETURNING id`,
    [datos.nombre, `${baseSlug}-${Date.now()}`, codigo, datos.descripcion || null, Number(datos.precio || 0), Number(datos.stock ?? datos.showroom ?? 0), datos.imagen_url || null, datos.activo ?? true, datos.medida || null, datos.detalle || null]
  );
  return obtenerProductoBD(rows[0].id);
}

export async function actualizarProductoBD(id, datos) {
  const { rows } = await pool.query(
    `UPDATE products SET name=COALESCE($1,name), description=COALESCE($2,description), public_price=COALESCE($3,public_price), stock_quantity=COALESCE($4,stock_quantity), imagen_url=COALESCE($5,imagen_url), activo=COALESCE($6,activo), internal_code=COALESCE($7,internal_code), size=COALESCE($8,size), color=COALESCE($9,color), updated_at=NOW() WHERE id=$10 RETURNING id`,
    [datos.nombre, datos.descripcion, datos.precio, datos.stock ?? datos.showroom, datos.imagen_url, datos.activo, datos.sku, datos.medida, datos.detalle, id]
  );
  return rows[0] ? obtenerProductoBD(id) : null;
}

export async function actualizarStockBD(id, { showroom, bodega }) {
  const { rows } = await pool.query('UPDATE products SET stock_quantity=$1, updated_at=NOW() WHERE id=$2 RETURNING id', [Number(showroom ?? 0) + Number(bodega ?? 0), id]);
  return rows[0] ? obtenerProductoBD(id) : null;
}

export async function eliminarProductoBD(id) {
  const { rows } = await pool.query('UPDATE products SET activo=FALSE, updated_at=NOW() WHERE id=$1 RETURNING id', [id]);
  return rows[0] ? obtenerProductoBD(id) : null;
}
