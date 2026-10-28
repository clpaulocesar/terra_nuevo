import { pool } from '../config/database.js';

// Precio que ve el cliente: si el producto está en oferta y tiene precio de
// oferta, manda ese; si no, el precio de lista (public_price).
const PRECIO_EFECTIVO = 'CASE WHEN COALESCE(p.en_oferta, FALSE) AND COALESCE(p.precio_oferta, 0) > 0 THEN p.precio_oferta ELSE COALESCE(p.public_price, 0) END';

const campos = `p.id, COALESCE(p.codigo_terra, p.internal_code, p.slug) AS sku, p.codigo_terra AS codigo_terra, p.internal_code AS codigo_interno, p.slug AS slug,
  p.name AS nombre, p.description AS descripcion, p.marca AS marca, COALESCE(c.name, p.product_group, 'Sin categoría') AS categoria,
  ${PRECIO_EFECTIVO} AS precio, COALESCE(p.public_price, 0) AS precio_lista, p.precio_oferta AS precio_oferta, p.precio_fabrica AS precio_fabrica,
  p.precio_mayorista AS precio_mayorista, p.stock_quantity::integer AS stock,
  p.size AS medida, p.color AS detalle, p.imagen_url, COALESCE(p.image_urls, CASE WHEN p.imagen_url IS NULL THEN ARRAY[]::text[] ELSE ARRAY[p.imagen_url] END) AS imagenes, p.video_url, p.colors AS colores, pi.imagenes_url AS instrucciones_imagenes, pi.intrucciones AS instrucciones, pi.detalle_completo AS instrucciones_detalle, pi.videos_url AS instrucciones_video, COALESCE(p.activo, p.is_active, TRUE) AS activo, COALESCE(p.en_oferta, FALSE) AS en_oferta,
  COALESCE((SELECT json_agg(json_build_object('minCantidad', w.minimum_quantity, 'precio', w.unit_price) ORDER BY w.minimum_quantity)
    FROM wholesale_price_tiers w WHERE w.product_id=p.id), '[]'::json) AS escalas_mayorista,
  COALESCE((SELECT json_agg(json_build_object(
    'id', s.id_sucursal,
    'nombre', s.nombre,
    'stock', ps.stock_disponible
  ) ORDER BY s.nombre ASC)
    FROM producto_sucursales ps
    JOIN sucursales s ON s.id_sucursal = ps.sucursal_id
    WHERE ps.product_id = p.id
      AND ps.activo = TRUE
      AND s.activo = TRUE), '[]'::json) AS sucursales`;

export async function buscarCoincidenciasNombreProductoBD({ nombre, medida = '', color = '', excluirId = null }) {
  const nombreLimpio = String(nombre || '').trim().replace(/\s+/g, ' ');
  if (!nombreLimpio) return [];
  const { rows } = await pool.query(
    `SELECT id, codigo_terra AS codigo, name AS nombre, COALESCE(size,'') AS medida, COALESCE(color,'') AS color,
            LOWER(REGEXP_REPLACE(BTRIM(name), '\\s+', ' ', 'g')) = LOWER($1) AND COALESCE(size,'') = $2 AND COALESCE(color,'') = $3 AS exacto
       FROM products
      WHERE ($4::uuid IS NULL OR id <> $4)
        AND (LOWER(REGEXP_REPLACE(BTRIM(name), '\\s+', ' ', 'g')) = LOWER($1)
          OR LOWER(name) LIKE LOWER($5))
      ORDER BY exacto DESC, name ASC
      LIMIT 10`,
    [nombreLimpio, String(medida || '').trim(), String(color || '').trim(), excluirId, `${nombreLimpio.slice(0, 28)}%`]
  );
  return rows;
}

let escalasReady;
export function asegurarEscalasMayoristasBD() {
  if (!escalasReady) {
    escalasReady = (async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS wholesale_price_tiers (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
          minimum_quantity INTEGER NOT NULL CHECK (minimum_quantity > 0),
          unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UNIQUE(product_id, minimum_quantity)
        )
      `);
      // Precios de fábrica/oferta y bandera de oferta (idempotente).
      await pool.query(`
        ALTER TABLE products
          ADD COLUMN IF NOT EXISTS precio_fabrica NUMERIC(12,2),
          ADD COLUMN IF NOT EXISTS precio_oferta NUMERIC(12,2),
          ADD COLUMN IF NOT EXISTS en_oferta BOOLEAN DEFAULT FALSE
      `);
    })().catch((error) => { escalasReady = null; throw error; });
  }
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

// Cada opción tiene su propio ORDER BY fijo: nunca se interpola texto del request.
// Se aceptan alias en kebab-case y snake_case para no romper clientes existentes.
// "recomendados" (y su alias "relevancia") pone primero los productos en oferta
// (products.en_oferta), también cuando se filtra por categoría. "ofertas" además
// limita el listado a esos productos (ver construirFiltros).
const ORDENES = {
  recomendados: 'COALESCE(p.en_oferta, FALSE) DESC, COALESCE(v.unidades, 0) DESC, COALESCE(p.stock_quantity, 0) DESC, p.name ASC, p.id ASC',
  relevancia: 'COALESCE(p.en_oferta, FALSE) DESC, COALESCE(v.unidades, 0) DESC, COALESCE(p.stock_quantity, 0) DESC, p.name ASC, p.id ASC',
  ofertas: 'COALESCE(v.unidades, 0) DESC, COALESCE(p.stock_quantity, 0) DESC, p.name ASC, p.id ASC',
  'mas-vendidos': 'COALESCE(v.unidades, 0) DESC, p.created_at DESC, p.id DESC',
  mas_vendidos: 'COALESCE(v.unidades, 0) DESC, p.created_at DESC, p.id DESC',
  nuevos: 'p.created_at DESC, p.id DESC',
  'precio-asc': `${PRECIO_EFECTIVO} ASC, p.name ASC, p.id ASC`,
  precio_asc: `${PRECIO_EFECTIVO} ASC, p.name ASC, p.id ASC`,
  'precio-desc': `${PRECIO_EFECTIVO} DESC, p.name ASC, p.id ASC`,
  precio_desc: `${PRECIO_EFECTIVO} DESC, p.name ASC, p.id ASC`,
  nombre: 'p.name ASC, p.id ASC',
};

export const ORDENES_PRODUCTOS = Object.keys(ORDENES);

const CTE_VENTAS = `WITH ventas AS (
  SELECT LOWER(product_name) AS nombre, SUM(COALESCE(quantity, 0))::integer AS unidades
  FROM order_items
  WHERE product_name IS NOT NULL
  GROUP BY LOWER(product_name)
)`;

// Comparación sin acentos ni mayúsculas en SQL.
const SIN_ACENTOS = (expr) => `translate(lower(${expr}), 'áéíóúüñ', 'aeiouun')`;

// Raíz de un término de búsqueda: minúsculas, sin acentos y sin la terminación de
// plural ("colchones" -> "colchon", "almohadas" -> "almohada", "sofás" -> "sofa").
// Sólo se recorta cuando el término es largo, para no romper códigos cortos.
export function raizDeBusqueda(termino) {
  const base = String(termino || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const palabras = base.split(/\s+/).filter(Boolean).map((palabra) => {
    if (palabra.length > 5 && palabra.endsWith('es')) return palabra.slice(0, -2);
    if (palabra.length > 4 && palabra.endsWith('s')) return palabra.slice(0, -1);
    return palabra;
  });
  return palabras.join(' ');
}

function construirFiltros({ buscar = '', categoria = '', soloActivos = false, soloPromos = false, soloOfertas = false, conStock = false, precioMin = null, precioMax = null } = {}) {
  const valores = [];
  const condiciones = [];
  if (soloActivos) condiciones.push('COALESCE(p.activo, p.is_active, TRUE) = TRUE');
  if (buscar) {
    // La búsqueda compara sin acentos y también contra la categoría del producto, con
    // la raíz del término para tolerar singular/plural: "colchón", "colchon" y
    // "colchones" encuentran todo lo que está en la categoría COLCHON.
    const raiz = raizDeBusqueda(buscar);
    valores.push(`%${raiz}%`);
    const n = valores.length;
    condiciones.push(`(${SIN_ACENTOS('p.name')} ILIKE $${n}
      OR ${SIN_ACENTOS("COALESCE(p.codigo_terra, p.internal_code, '')")} ILIKE $${n}
      OR ${SIN_ACENTOS("COALESCE(p.description, '')")} ILIKE $${n}
      OR ${SIN_ACENTOS("COALESCE(c.name, '')")} ILIKE $${n}
      OR ${SIN_ACENTOS("COALESCE(p.product_group, '')")} ILIKE $${n})`);
  }
  const categoriaLimpia = String(categoria || '').trim();
  if (categoriaLimpia && !['todos', 'todas'].includes(categoriaLimpia.toLowerCase())) { valores.push(categoriaLimpia); condiciones.push(`LOWER(COALESCE(c.name, p.product_group, '')) = LOWER($${valores.length})`); }
  if (soloPromos) condiciones.push(EXISTE_PROMOCION);
  if (soloOfertas) condiciones.push('COALESCE(p.en_oferta, FALSE) = TRUE');
  if (conStock) condiciones.push('COALESCE(p.stock_quantity, 0) > 0');
  if (Number.isFinite(precioMin)) { valores.push(precioMin); condiciones.push(`${PRECIO_EFECTIVO} >= $${valores.length}`); }
  if (Number.isFinite(precioMax)) { valores.push(precioMax); condiciones.push(`${PRECIO_EFECTIVO} <= $${valores.length}`); }
  return { valores, condiciones };
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
  soloOfertas = false,
  conStock = false,
  precioMin = null,
  precioMax = null,
  orden = 'recomendados',
} = {}) {
  await asegurarEscalasMayoristasBD();
  const { valores, condiciones } = construirFiltros({ buscar, categoria, soloActivos, soloPromos, soloOfertas: soloOfertas || orden === 'ofertas', conStock, precioMin, precioMax });
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

// Precio opcional: '' / null / undefined / no numérico -> NULL en la base.
function precioOpcional(valor) {
  if (valor === undefined || valor === null || valor === '') return null;
  const numero = Number(valor);
  return Number.isFinite(numero) && numero >= 0 ? numero : null;
}

// Guarda las instrucciones de armado/uso del producto en `product_instructions`
// (una fila por producto). Si todos los campos vienen vacíos, borra la fila para
// que el chatbot no devuelva instrucciones en blanco. `undefined` = no tocar.
function textoONulo(valor) {
  const texto = String(valor ?? '').trim();
  return texto ? texto : null;
}
export async function guardarInstruccionesProductoBD(productoId, instrucciones) {
  if (!instrucciones || typeof instrucciones !== 'object') return;
  const fila = {
    intrucciones: textoONulo(instrucciones.texto ?? instrucciones.instrucciones),
    detalle_completo: textoONulo(instrucciones.detalle),
    videos_url: textoONulo(instrucciones.video_url),
    imagenes_url: textoONulo(instrucciones.imagenes_url),
  };
  const vacia = Object.values(fila).every((valor) => valor === null);
  if (vacia) {
    await pool.query('DELETE FROM product_instructions WHERE product_id = $1', [productoId]);
    return;
  }
  const { rowCount } = await pool.query(
    `UPDATE product_instructions
     SET intrucciones = $2, detalle_completo = $3, videos_url = $4, imagenes_url = $5
     WHERE product_id = $1`,
    [productoId, fila.intrucciones, fila.detalle_completo, fila.videos_url, fila.imagenes_url]
  );
  if (!rowCount) {
    await pool.query(
      `INSERT INTO product_instructions (product_id, intrucciones, detalle_completo, videos_url, imagenes_url)
       VALUES ($1, $2, $3, $4, $5)`,
      [productoId, fila.intrucciones, fila.detalle_completo, fila.videos_url, fila.imagenes_url]
    );
  }
}

// `product_images` (tabla preexistente) registra cada imagen nueva de la galería además
// de `products.imagen_url` e `image_urls`, que es lo que lee el frontend.
let imagenesReady;
export function asegurarTablaImagenesBD() {
  if (!imagenesReady) {
    imagenesReady = (async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS product_images (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
          image_url TEXT NOT NULL,
          alt_text TEXT,
          sort_order INTEGER NOT NULL DEFAULT 0,
          is_primary BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      await pool.query('CREATE INDEX IF NOT EXISTS product_images_product_order_idx ON product_images (product_id, sort_order)');
    })().catch((error) => { imagenesReady = null; throw error; });
  }
  return imagenesReady;
}

// Es aditivo: nunca borra ni modifica filas existentes. Hay filas heredadas (imágenes
// de Cloudinary y en base64) que no están en `image_urls` y no existen en otro lado.
export async function registrarImagenesProductoBD(productoId, imagenes, conexion = pool) {
  await asegurarTablaImagenesBD();
  const lista = [...new Set((Array.isArray(imagenes) ? imagenes : []).map((u) => String(u || '').trim()).filter(Boolean))];
  if (!lista.length) return;
  const { rows: [estado] } = await conexion.query(
    `SELECT COALESCE(MAX(sort_order) + 1, 0) AS siguiente,
            COALESCE(BOOL_OR(is_primary), FALSE) AS hay_principal,
            COALESCE(ARRAY_AGG(image_url) FILTER (WHERE image_url = ANY($2::text[])), '{}') AS existentes
       FROM product_images
      WHERE product_id = $1`,
    [productoId, lista]
  );
  const existentes = new Set(estado.existentes);
  let orden = Number(estado.siguiente);
  let hayPrincipal = estado.hay_principal;
  for (const url of lista) {
    if (existentes.has(url)) continue;
    await conexion.query(
      'INSERT INTO product_images (product_id, image_url, sort_order, is_primary) VALUES ($1, $2, $3, $4)',
      [productoId, url, orden, !hayPrincipal]
    );
    orden += 1;
    hayPrincipal = true;
  }
}

export async function crearProductoBD(datos) {
  await asegurarEscalasMayoristasBD();
  const baseSlug = String(datos.nombre || 'producto').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  // Dos códigos distintos: `sku` -> codigo_terra (código Terra) y
  // `codigoInterno` -> internal_code. Si no mandan el interno, repite el Terra.
  const codigo = String(datos.sku || `TRR-${Date.now()}`).trim();
  const codigoInterno = String(datos.codigoInterno || codigo).trim();
  const { rows } = await pool.query(
    `INSERT INTO products (name, slug, codigo_terra, description, public_price, precio_mayorista, stock_quantity, imagen_url, image_urls, video_url, colors, activo, is_active, internal_code, size, color, category_id, precio_fabrica, precio_oferta, en_oferta)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$12,$16,$13,$14,(SELECT id FROM categories WHERE LOWER(name)=LOWER($15) AND is_active=TRUE LIMIT 1),$17,$18,$19) RETURNING id`,
    [datos.nombre, `${baseSlug}-${Date.now()}`, codigo, datos.descripcion || null, Number(datos.precio || 0), datos.precioMayorista ?? null, Number(datos.stock ?? datos.showroom ?? 0), datos.imagen_url || null, Array.isArray(datos.imagenes) ? datos.imagenes : [], datos.video_url || null, Array.isArray(datos.colores) ? datos.colores : [], datos.activo ?? true, datos.medida || null, datos.detalle || null, datos.categoria, codigoInterno, precioOpcional(datos.precioFabrica), precioOpcional(datos.precioOferta), Boolean(datos.enOferta)]
  );
  await reemplazarEscalasMayoristas(rows[0].id, datos.escalasMayorista || []);
  await guardarInstruccionesProductoBD(rows[0].id, datos.instrucciones);
  if (Array.isArray(datos.imagenes)) await registrarImagenesProductoBD(rows[0].id, datos.imagenes);
  return obtenerProductoBD(rows[0].id);
}


export async function actualizarProductoBD(id, datos) {
  await asegurarEscalasMayoristasBD();

  const idStr = String(id || '').trim();

  const { rows } = await pool.query(
    `UPDATE products
     SET name = COALESCE($1, name),
         description = COALESCE($2, description),
         public_price = COALESCE($3, public_price),
         stock_quantity = COALESCE($4, stock_quantity),
         imagen_url = COALESCE($5, imagen_url),
         image_urls = COALESCE($6, image_urls),
         activo = COALESCE($7, activo),
         is_active = COALESCE($7, is_active),
         codigo_terra = COALESCE($8, codigo_terra),
         size = COALESCE($9, size),
         color = COALESCE($10, color),
         video_url = COALESCE($11, video_url),
         colors = COALESCE($12, colors),
         precio_mayorista = COALESCE($13, precio_mayorista),
         category_id = COALESCE(
           (
             SELECT id
             FROM categories
             WHERE LOWER(name) = LOWER($14)
               AND is_active = TRUE
             LIMIT 1
           ),
           category_id
         ),
         internal_code = COALESCE($16, internal_code),
         precio_fabrica = COALESCE($17, precio_fabrica),
         precio_oferta = COALESCE($18, precio_oferta),
         en_oferta = COALESCE($19, en_oferta),
         marca = COALESCE($20, marca),
         updated_at = NOW()
     WHERE id::text = $15
        OR slug = $15
         OR COALESCE(codigo_terra, internal_code) = $15
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
      datos.precioMayorista !== undefined
        ? datos.precioMayorista
        : null,
      datos.categoria ?? null,
      idStr,
      datos.codigoInterno ?? null,
      precioOpcional(datos.precioFabrica),
      precioOpcional(datos.precioOferta),
      datos.enOferta === undefined || datos.enOferta === null
        ? null
        : Boolean(datos.enOferta),
      datos.marca ?? null,
    ]
  );

  if (rows[0] && Array.isArray(datos.escalasMayorista)) {
    await reemplazarEscalasMayoristas(
      rows[0].id,
      datos.escalasMayorista
    );
  }

  if (rows[0]) {
    await guardarInstruccionesProductoBD(
      rows[0].id,
      datos.instrucciones
    );
    if (Array.isArray(datos.imagenes)) await registrarImagenesProductoBD(rows[0].id, datos.imagenes);
  }

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


export async function actualizarStockBD(id, { showroom, agregar } = {}) {
  const idStr = String(id || '').trim();
  // { agregar: n } suma al stock actual en la misma sentencia (ingreso de almacén);
  // { showroom: n } fija el valor, como hace el ajuste manual del admin.
  const incremental = agregar !== undefined && agregar !== null;
  const { rows } = await pool.query(
    `UPDATE products
     SET stock_quantity = ${incremental ? 'COALESCE(stock_quantity, 0) + $1' : '$1'}, updated_at=NOW()
     WHERE id::text = $2 OR slug = $2 OR COALESCE(codigo_terra, internal_code) = $2
     RETURNING id`,
    [Number(incremental ? agregar : (showroom ?? 0)), idStr]
  );
  return rows[0] ? obtenerProductoBD(rows[0].id) : null;
}

// ---- Espejo del ERP de TERRA ----
// El ERP es la fuente de verdad de precio público, stock y datos maestros. Lo que
// es propio de este sistema (oferta, precio mayorista, escalas, imágenes,
// descripción, categoría, slug) NO se toca. El código interno y el stock por
// almacén van a `erp_product_sync_state` y `erp_warehouse_stocks` (erpModel.js).
// `conexion` permite correr dentro de la transacción del pedido.
function textoErp(valor) {
  const texto = String(valor ?? '').trim();
  return texto || null;
}

// `stockVenta` es el stock del almacén de venta (ALMACEN CENTRAL), ya calculado por
// el servicio: `stock_quantity` nunca se llena con `stockTotal`.
export async function reescribirProductoDesdeErpBD(productoId, erp, stockVenta, conexion = pool) {
  const precio = Number(erp?.precioPublico);
  const stock = Math.max(0, Math.floor(Number(stockVenta) || 0));
  const { rows } = await conexion.query(
    `UPDATE products
        SET public_price = CASE WHEN $2::numeric IS NULL THEN public_price ELSE $2::numeric END,
            stock_quantity = $3,
            name = COALESCE($4, name),
            size = COALESCE($5, size),
            color = COALESCE($6, color),
            marca = COALESCE($7, marca),
            codigo_terra = COALESCE($8, codigo_terra),
            updated_at = NOW()
      WHERE id = $1
      RETURNING id, public_price, stock_quantity`,
    [
      productoId,
      Number.isFinite(precio) && precio >= 0 ? precio : null,
      stock,
      textoErp(erp?.nombre),
      textoErp(erp?.medida),
      textoErp(erp?.color),
      textoErp(erp?.marca),
      textoErp(erp?.codigoTerra),
    ]
  );
  return rows[0] || null;
}

// 404 en el ERP: el producto no existe o no está habilitado. Se deja sin stock y oculto.
export async function marcarProductoNoEncontradoErpBD(productoId, conexion = pool) {
  const { rows } = await conexion.query(
    `UPDATE products
        SET stock_quantity = 0, activo = FALSE, is_active = FALSE, updated_at = NOW()
      WHERE id = $1
      RETURNING id`,
    [productoId]
  );
  return rows[0] || null;
}

// Descuenta stock local tras el 201 de la cotización (nunca por debajo de 0).
export async function descontarStockBD(productoId, cantidad, conexion = pool) {
  await conexion.query(
    `UPDATE products
        SET stock_quantity = GREATEST(COALESCE(stock_quantity, 0) - $2, 0), updated_at = NOW()
      WHERE id = $1`,
    [productoId, Math.max(0, Math.floor(Number(cantidad) || 0))]
  );
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
