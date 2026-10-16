import { pool } from '../config/database.js';

// El asistente consulta directamente la tabla `products` (con su categoría).
// No usamos la vista `public.v_productos_chat`: no existe en Supabase y no se crea.
// El payload no expone `id` ni `stock`: al cliente no le interesan cuando consulta.
export async function buscarProductosChatBD(termino = '') {
  const texto = String(termino || '').trim().slice(0, 120);
  const { rows } = await pool.query(
    `WITH base AS (
       SELECT
         p.name AS nombre,
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
     SELECT nombre, categoria, marca, medida, color, sku, precio_venta, descripcion, imagen_url, palabras_clave
     FROM filtrados
     UNION ALL
     SELECT nombre, categoria, marca, medida, color, sku, precio_venta, descripcion, imagen_url, palabras_clave
     FROM base
     WHERE NOT EXISTS (SELECT 1 FROM filtrados)
     ORDER BY precio_venta
     LIMIT 8`,
    [texto]
  );
  return rows;
}
