import { pool } from '../config/database.js';

const campos = `p.id, COALESCE(p.codigo_terra, p.internal_code, p.slug) AS sku, p.slug AS slug,
  p.name AS nombre, p.description AS descripcion, COALESCE(c.name, p.product_group, 'Sin categoría') AS categoria,
  COALESCE(p.public_price, 0) AS precio, p.precio_mayorista AS precio_mayorista, p.stock_quantity::integer AS stock,
  p.size AS medida, p.color AS detalle, p.imagen_url, COALESCE(p.image_urls, CASE WHEN p.imagen_url IS NULL THEN ARRAY[]::text[] ELSE ARRAY[p.imagen_url] END) AS imagenes, p.video_url, p.colors AS colores, pi.imagenes_url AS instrucciones_imagenes, COALESCE(p.activo, p.is_active, TRUE) AS activo,
  COALESCE((SELECT json_agg(json_build_object('minCantidad', w.minimum_quantity, 'precio', w.unit_price) ORDER BY w.minimum_quantity)
    FROM wholesale_price_tiers w WHERE w.product_id=p.id), '[]'::json) AS escalas_mayorista`;

let escalasReady;
export function asegurarEscalasMayoristasBD() {
  if (!escalasReady) escalasReady = pool.query(`
    CREATE TABLE IF NOT EXISTS wholesale_price_tiers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      minimum_quantity INTEGER NOT NULL CHECK (minimum_quantity > 0),
      unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(product_id, minimum_quantity)
    )
  `);
  return escalasReady;
}

async function reemplazarEscalasMayoristas(productoId, escalas = []) {
  if (!Array.isArray(escalas)) return;
  await asegurarEscalasMayoristasBD();
  const conexion = await pool.connect();
  try {
    await conexion.query('BEGIN');
    await conexion.query('DELETE FROM wholesale_price_tiers WHERE product_id=$1', [productoId]);
    for (const escala of escalas) {
      await conexion.query('INSERT INTO wholesale_price_tiers (product_id, minimum_quantity, unit_price) VALUES ($1,$2,$3)', [productoId, escala.minCantidad, escala.precio]);
    }
    await conexion.query('COMMIT');
  } catch (error) {
    await conexion.query('ROLLBACK');
    throw error;
  } finally { conexion.release(); }
}

const EXISTE_PROMOCION = `EXISTS (
  SELECT 1 FROM promotion_products pp
  JOIN promotions pr ON pr.id = pp.promotion_id
  WHERE pp.product_id = p.id
    AND COALESCE(pr.is_active, TRUE) = TRUE
    AND (pr.starts_at IS NULL OR pr.starts_at <= NOW())
    AND (pr.ends_at IS NULL OR pr.ends_at >= NOW())
)`;

// Productos permitidos (hardcoded por requerimiento)
const PRODUCTOS_PERMITIDOS = [
  'Somier Diamante 2 PLZ',
  'Chester 2 PLZ',
  'Brillante 1.5 PLZ',
  'Betty',
  'Sahara',
  'Niky',
  'Cristal',
  'Honor',
  'Diamante',
  'Wert',
  'Bugatti',
  'Kit lary',
  'Lila'
];

// Cada opción tiene su propio ORDER BY fijo: nunca se interpola texto del request.
// Se aceptan alias en kebab-case y snake_case para no romper clientes existentes.
const ORDENES = {
  recomendados: 'COALESCE(v.unidades, 0) DESC, COALESCE(p.stock_quantity, 0) DESC, p.name ASC, p.id ASC',
  relevancia: 'COALESCE(v.unidades, 0) DESC, COALESCE(p.stock_quantity, 0) DESC, p.name ASC, p.id ASC',
  'mas-vendidos': 'COALESCE(v.unidades, 0) DESC, p.created_at DESC, p.id DESC',
  mas_vendidos: 'COALESCE(v.unidades, 0) DESC, p.created_at DESC, p.id DESC',
  nuevos: 'p.created_at DESC, p.id DESC',
  'precio-asc': 'COALESCE(p.public_price, 0) ASC, p.name ASC, p.id ASC',
  precio_asc: 'COALESCE(p.public_price, 0) ASC, p.name ASC, p.id ASC',
  'precio-desc': 'COALESCE(p.public_price, 0) DESC, p.name ASC, p.id ASC',
  precio_desc: 'COALESCE(p.public_price, 0) DESC, p.name ASC, p.id ASC',
  nombre: 'p.name ASC, p.id ASC',
};

export const ORDENES_PRODUCTOS = Object.keys(ORDENES);

const CTE_VENTAS = `WITH ventas AS (
  SELECT LOWER(product_name) AS nombre, SUM(COALESCE(quantity, 0))::integer AS unidades
  FROM order_items
  WHERE product_name IS NOT NULL
  GROUP BY LOWER(product_name)
)`;

function construirFiltros({ buscar = '', categoria = '', soloActivos = false, soloPromos = false, conStock = false, precioMin = null, precioMax = null } = {}) {
  const valores = [];
  const condiciones = [];
  if (soloActivos) condiciones.push('COALESCE(p.activo, p.is_active, TRUE) = TRUE');
  if (buscar) { valores.push(`%${buscar}%`); condiciones.push(`(p.name ILIKE $${valores.length} OR COALESCE(p.codigo_terra, p.internal_code, '') ILIKE $${valores.length} OR COALESCE(p.description, '') ILIKE $${valores.length})`); }
  const categoriaLimpia = String(categoria || '').trim();
  if (categoriaLimpia && !['todos', 'todas'].includes(categoriaLimpia.toLowerCase())) { valores.push(categoriaLimpia); condiciones.push(`LOWER(COALESCE(c.name, p.product_group, '')) = LOWER($${valores.length})`); }
  if (soloPromos) condiciones.push(EXISTE_PROMOCION);
  if (conStock) condiciones.push('COALESCE(p.stock_quantity, 0) > 0');
  // Filtro hardcoded: solo estos productos
  const placeholders = PRODUCTOS_PERMITIDOS.map((_, i) => `$${valores.length + 1 + i}`).join(', ');
  PRODUCTOS_PERMITIDOS.forEach(n => valores.push(n));
  condiciones.push(`p.name IN (${placeholders})`);
  if (Number.isFinite(precioMin)) { valores.push(precioMin); condiciones.push(`COALESCE(p.public_price, 0) >= $${valores.length}`); }
  if (Number.isFinite(precioMax)) { valores.push(precioMax); condiciones.push(`COALESCE(p.public_price, 0) <= $${valores.length}`); }
  return { valores, condiciones };
}

// Devuelve una página de productos y el total de filas que cumplen el filtro.
// Filtros y orden viven aquí para que la paginación del frontend sea exacta.
export async function listarProductosBD({
  buscar = '',
  categoria = '',
  pagina = 1,
  limite = 100,
  soloActivos = false,
  soloPromos = false,
  conStock = false,
  precioMin = null,
  precioMax = null,
  orden = 'recomendados',
} = {}) {
  await asegurarEscalasMayoristasBD();
  const { valores, condiciones } = construirFiltros({ buscar, categoria, soloActivos, soloPromos, conStock, precioMin, precioMax });
  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
  const orderBy = ORDENES[orden] || ORDENES.recomendados;
  const valoresFiltro = [...valores];
  valores.push(limite, (pagina - 1) * limite);
  const { rows } = await pool.query(
    `${CTE_VENTAS}
     SELECT ${campos}, COUNT(*) OVER()::integer AS total_filas
     FROM products p
     LEFT JOIN categories c ON c.id=p.category_id
     LEFT JOIN product_instructions pi ON pi.product_id=p.id
     LEFT JOIN ventas v ON v.nombre = LOWER(p.name)
     ${where}
     ORDER BY ${orderBy}
     LIMIT $${valores.length - 1} OFFSET $${valores.length}`,
    valores
  );
  let total = rows[0]?.total_filas;
  if (total === undefined) {
    // Página vacía (más allá del final): el total se obtiene aparte.
    const { rows: conteo } = await pool.query(
      `SELECT COUNT(*)::integer AS total FROM products p LEFT JOIN categories c ON c.id=p.category_id ${where}`,
      valoresFiltro
    );
    total = conteo[0]?.total ?? 0;
  }
  const productos = rows.map(({ total_filas: _omitido, ...resto }) => resto);
  return { productos, total };
}

// Listado paginado del catálogo con filtros y ordenamiento reales en base de datos.
// Devuelve { productos, total } para que el frontend pueda paginar sobre +2.500 referencias.
export async function listarProductosPaginadoBD({
  buscar = '',
  categoria = '',
  pagina = 1,
  limite = 18,
  soloActivos = false,
  soloPromos = false,
  conStock = false,
  precioMin = null,
  precioMax = null,
  orden = 'recomendados',
} = {}) {
  await asegurarEscalasMayoristasBD();
  const { valores, condiciones } = construirFiltros({ buscar, categoria, soloActivos, soloPromos, conStock, precioMin, precioMax });
  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
  const orderBy = ORDENES[orden] || ORDENES.recomendados;

  const consulta = await pool.query(
    `${CTE_VENTAS}
     SELECT ${campos},
       COALESCE(v.unidades, 0) AS ventas,
       ${EXISTE_PROMOCION} AS promocion
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     LEFT JOIN product_instructions pi ON pi.product_id = p.id
     LEFT JOIN ventas v ON v.nombre = LOWER(p.name)
     ${where}
     ORDER BY ${orderBy}
     LIMIT $${valores.length + 1} OFFSET $${valores.length + 2}`,
    [...valores, limite, (pagina - 1) * limite]
  );

  const totalConsulta = await pool.query(
    `SELECT COUNT(DISTINCT p.id) AS total
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     ${where}`,
    valores
  );

  return { productos: consulta.rows, total: Number(totalConsulta.rows[0]?.total || 0) };
}

export async function obtenerProductoBD(id) {
  await asegurarEscalasMayoristasBD();
  const idStr = String(id || '').trim();
  const { rows } = await pool.query(
    `SELECT ${campos} 
     FROM products p 
     LEFT JOIN categories c ON c.id=p.category_id 
     LEFT JOIN product_instructions pi ON pi.product_id=p.id
     WHERE p.id::text = $1 
        OR p.slug = $1 
        OR COALESCE(p.codigo_terra, p.internal_code) = $1
     LIMIT 1`,
    [idStr]
  );
  return rows[0] || null;
}

export async function crearProductoBD(datos) {
  await asegurarEscalasMayoristasBD();
  const baseSlug = String(datos.nombre || 'producto').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const codigo = String(datos.sku || `TRR-${Date.now()}`).trim();
  const { rows } = await pool.query(
    `INSERT INTO products (name, slug, codigo_terra, description, public_price, precio_mayorista, stock_quantity, imagen_url, image_urls, video_url, colors, activo, is_active, internal_code, size, color, category_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$12,$3,$13,$14,(SELECT id FROM categories WHERE LOWER(name)=LOWER($15) AND is_active=TRUE LIMIT 1)) RETURNING id`,
    [datos.nombre, `${baseSlug}-${Date.now()}`, codigo, datos.descripcion || null, Number(datos.precio || 0), datos.precioMayorista ?? null, Number(datos.stock ?? datos.showroom ?? 0), datos.imagen_url || null, Array.isArray(datos.imagenes) ? datos.imagenes : [], datos.video_url || null, Array.isArray(datos.colores) ? datos.colores : [], datos.activo ?? true, datos.medida || null, datos.detalle || null, datos.categoria]
  );
  await reemplazarEscalasMayoristas(rows[0].id, datos.escalasMayorista || []);
  return obtenerProductoBD(rows[0].id);
}

export async function actualizarProductoBD(id, datos) {
  await asegurarEscalasMayoristasBD();
  const idStr = String(id || '').trim();
  const { rows } = await pool.query(
    `UPDATE products 
     SET name=COALESCE($1,name), description=COALESCE($2,description), public_price=COALESCE($3,public_price), stock_quantity=COALESCE($4,stock_quantity), imagen_url=COALESCE($5,imagen_url), image_urls=COALESCE($6,image_urls), activo=COALESCE($7,activo), is_active=COALESCE($7,is_active), internal_code=COALESCE($8,internal_code), codigo_terra=COALESCE($8,codigo_terra), size=COALESCE($9,size), color=COALESCE($10,color), video_url=COALESCE($11,video_url), colors=COALESCE($12,colors), precio_mayorista=COALESCE($13,precio_mayorista), category_id=COALESCE((SELECT id FROM categories WHERE LOWER(name)=LOWER($14) AND is_active=TRUE LIMIT 1),category_id), updated_at=NOW()
     WHERE id::text = $15 OR slug = $15 OR COALESCE(codigo_terra, internal_code) = $15
     RETURNING id`,
    [
      datos.nombre ?? null,
      datos.descripcion ?? null,
      datos.precio ?? null,
      (datos.stock ?? datos.showroom) ?? null,
      datos.imagen_url ?? null,
      Array.isArray(datos.imagenes) ? datos.imagenes : null,
      datos.activo !== undefined ? Boolean(datos.activo) : null,
      datos.sku ?? null,
      datos.medida ?? null,
      datos.detalle ?? null,
      datos.video_url !== undefined ? datos.video_url : null,
      Array.isArray(datos.colores) ? datos.colores : null,
      datos.precioMayorista !== undefined ? datos.precioMayorista : null,
      datos.categoria ?? null,
      idStr
    ]
  );
  if (rows[0] && Array.isArray(datos.escalasMayorista)) await reemplazarEscalasMayoristas(rows[0].id, datos.escalasMayorista);
  return rows[0] ? obtenerProductoBD(rows[0].id) : null;
}

export async function cambiarVisibilidadProductoBD(id, activo) {
  await asegurarEscalasMayoristasBD();
  const idStr = String(id || '').trim();
  const valor = Boolean(activo);
  const { rows } = await pool.query(
    `UPDATE products
     SET activo = $1, is_active = $1, updated_at = NOW()
     WHERE id::text = $2 OR slug = $2 OR COALESCE(codigo_terra, internal_code) = $2
     RETURNING id`,
    [valor, idStr]
  );
  return rows[0] ? obtenerProductoBD(rows[0].id) : null;
}


export async function actualizarStockBD(id, { showroom }) {
  const idStr = String(id || '').trim();
  const { rows } = await pool.query(
    `UPDATE products 
     SET stock_quantity=$1, updated_at=NOW() 
     WHERE id::text = $2 OR slug = $2 OR COALESCE(codigo_terra, internal_code) = $2 
     RETURNING id`,
    [Number(showroom ?? 0), idStr]
  );
  return rows[0] ? obtenerProductoBD(rows[0].id) : null;
}

export async function eliminarProductoBD(id) {
  const idStr = String(id || '').trim();
  const conexion = await pool.connect();
  try {
    await conexion.query('BEGIN');
    const objetivo = await conexion.query(
      `SELECT id FROM products
       WHERE id::text = $1 OR slug = $1 OR COALESCE(codigo_terra, internal_code) = $1
       LIMIT 1`,
      [idStr]
    );
    if (!objetivo.rowCount) {
      await conexion.query('ROLLBACK');
      return null;
    }
    const productoId = objetivo.rows[0].id;

    // inventory y cart_items referencian a las variantes con ON DELETE RESTRICT:
    // hay que liberarlos antes de poder borrar el producto.
    await conexion.query(
      `DELETE FROM inventory WHERE product_variant_id IN (SELECT id FROM product_variants WHERE product_id = $1)`,
      [productoId]
    );
    await conexion.query(
      `DELETE FROM cart_items WHERE product_variant_id IN (SELECT id FROM product_variants WHERE product_id = $1)`,
      [productoId]
    );

    // Borrado real. Borra en cascada variantes, imágenes, instrucciones y promociones.
    // Los order_items quedan con product_variant_id = NULL pero conservan nombre/sku/precio:
    // el historial de ventas no se pierde.
    await conexion.query('DELETE FROM products WHERE id = $1', [productoId]);

    await conexion.query('COMMIT');
    return { id: productoId };
  } catch (error) {
    await conexion.query('ROLLBACK');
    throw error;
  } finally {
    conexion.release();
  }
}
