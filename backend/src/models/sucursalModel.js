import { pool } from '../config/database.js';

export async function listarSucursalesConDisponibilidadBD() {
  const { rows } = await pool.query(`
    SELECT
      s.id_sucursal AS id,
      s.nombre,
      s.direccion,
      s.activo,
      COUNT(ps.product_id)::integer AS productos_asignados,
      COALESCE(SUM(ps.stock_disponible), 0)::numeric AS stock_disponible
    FROM sucursales s
    LEFT JOIN producto_sucursales ps
      ON ps.sucursal_id = s.id_sucursal
      AND ps.activo = TRUE
    WHERE s.activo = TRUE
    GROUP BY s.id_sucursal, s.nombre, s.direccion, s.activo
    ORDER BY s.nombre ASC
  `);

  return rows;
}
