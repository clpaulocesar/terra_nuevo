import { pool } from '../config/database.js';

// El asistente consulta directamente la tabla `products` (con su categoría).
// No usamos la vista `public.v_productos_chat`: no existe en Supabase y no se crea.
// Expone `id` y `stock` para que el chatbot pueda armar pedidos (POST /api/asistente/pedidos).
export async function buscarProductosChatBD(termino = '') {
  const texto = String(termino || '').trim().slice(0, 120);
  const { rows } = await pool.query(
    `WITH base AS (
       SELECT
         p.id,
         p.name AS nombre,
         COALESCE(p.stock_quantity, 0)::int AS stock,
         COALESCE(c.name, p.product_group, 'General') AS categoria,
         p.marca,
         p.size AS medida,
         p.color,
         COALESCE(p.codigo_terra, p.internal_code, p.slug) AS sku,
         COALESCE(p.public_price, 0) AS precio_venta,
         p.description AS descripcion,
         p.imagen_url,
         TRIM(CONCAT_WS(' ', p.name, p.marca, p.product_group, c.name, p.color, p.size,
                        COALESCE(p.codigo_terra, p.internal_code))) AS palabras_clave,
         CONCAT_WS(' ', p.name, p.description, p.marca, p.product_group, c.name, p.color, p.size,
                   COALESCE(p.codigo_terra, p.internal_code), p.slug) AS busqueda
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE COALESCE(p.activo, p.is_active, TRUE) = TRUE
     ),
     filtrados AS (
       SELECT * FROM base
       WHERE COALESCE($1, '') <> ''
         AND translate(lower(busqueda), 'áéíóúüñ', 'aeiouun')
             ILIKE '%' || translate(lower($1), 'áéíóúüñ', 'aeiouun') || '%'
     )
     SELECT id, nombre, stock, categoria, marca, medida, color, sku, precio_venta, descripcion, imagen_url, palabras_clave
     FROM filtrados
     UNION ALL
     SELECT id, nombre, stock, categoria, marca, medida, color, sku, precio_venta, descripcion, imagen_url, palabras_clave
     FROM base
     WHERE NOT EXISTS (SELECT 1 FROM filtrados)
     ORDER BY precio_venta
     `,
    [texto]
  );
  return rows;
}

// Normaliza un texto para comparar "a lo bruto": minúsculas, sin acentos, sin
// signos y con las letras repetidas colapsadas ("Betty" -> "bety"), de modo que el
// término que manda la IA encuentre el producto aunque venga mal escrito.
export function normalizarTermino(texto = '') {
  return String(texto || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/(.)\1+/g, '$1')
    .trim();
}

// Instrucciones de uso/armado para el chatbot. Busca el término en nombre, SKU,
// marca, categoría, grupo y detalle del producto; sólo devuelve productos activos
// que tengan instrucciones cargadas. Cada palabra del término debe aparecer.
// Sin término devuelve todas las instrucciones disponibles.
export async function buscarInstruccionesChatBD(termino = '') {
  const texto = String(termino || '').trim().slice(0, 120);
  // Palabras de una sola letra (o números sueltos) encajan con cualquier producto
  // tras colapsar repetidas ("zzzz" -> "z"), así que se descartan. Si el término
  // sólo tenía de esas, no hay coincidencia posible.
  const palabras = normalizarTermino(texto).split(' ').filter((palabra) => palabra.length >= 2);
  if (texto && !palabras.length) return [];
  const { rows } = await pool.query(
    `WITH base AS (
       SELECT
         p.id,
         p.name AS producto,
         COALESCE(p.codigo_terra, p.internal_code, p.slug) AS sku,
         COALESCE(c.name, p.product_group, 'General') AS categoria,
         pi.intrucciones AS instrucciones,
         pi.detalle_completo,
         pi.colores,
         pi.videos_url,
         pi.imagenes_url,
         regexp_replace(
           regexp_replace(
             translate(lower(CONCAT_WS(' ', p.name, p.codigo_terra, p.internal_code, p.slug, p.marca,
                                       p.product_group, c.name, p.color, p.size, pi.detalle_completo)),
                       'áéíóúüñ', 'aeiouun'),
             '[^a-z0-9]+', ' ', 'g'),
           '(.)\\1+', '\\1', 'g') AS busqueda
       FROM product_instructions pi
       JOIN products p ON p.id = pi.product_id
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE COALESCE(p.activo, p.is_active, TRUE) = TRUE
         AND NULLIF(TRIM(pi.intrucciones), '') IS NOT NULL
     )
     SELECT id, producto, sku, categoria, instrucciones, detalle_completo, colores, videos_url, imagenes_url
     FROM base
     WHERE cardinality($1::text[]) = 0
        OR NOT EXISTS (
             SELECT 1 FROM unnest($1::text[]) AS palabra
             WHERE base.busqueda NOT LIKE '%' || palabra || '%'
           )
     ORDER BY producto`,
    [palabras]
  );
  return rows;
}
