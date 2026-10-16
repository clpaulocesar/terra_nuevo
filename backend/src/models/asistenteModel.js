import { pool } from '../config/database.js';

export async function buscarProductosChatBD(termino = '') {
  const texto = String(termino || '').trim().slice(0, 120);
  const { rows } = await pool.query(
    `WITH filtrados AS (
       SELECT * FROM public.v_productos_chat
       WHERE COALESCE($1, '') <> ''
         AND (nombre ILIKE '%' || $1 || '%'
           OR categoria ILIKE '%' || $1 || '%'
           OR palabras_clave ILIKE '%' || $1 || '%'
           OR medida ILIKE '%' || $1 || '%')
     )
     SELECT * FROM filtrados
     UNION ALL
     SELECT * FROM public.v_productos_chat
     WHERE NOT EXISTS (SELECT 1 FROM filtrados)
     ORDER BY precio_venta
     LIMIT 8`,
    [texto]
  );
  return rows;
}
