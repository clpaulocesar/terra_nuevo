import { pool } from '../config/database.js';

export async function listarCategorias(req, res, next) {
  try {
    const resultado = await pool.query(`
      SELECT c.id, c.name AS nombre, COUNT(p.id)::integer AS total, MIN(p.imagen_url) AS imagen_url
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id AND COALESCE(p.activo, p.is_active, TRUE) = TRUE
      WHERE c.is_active = TRUE
      GROUP BY c.id, c.name
      ORDER BY total DESC, c.name ASC
    `);

    const categoriasConIcono = resultado.rows.map((row) => {
      const n = row.nombre.toLowerCase();
      let icon = 'category';
      let emoji = '📦';

      if (n.includes('colch')) { icon = 'bed'; emoji = '🛏️'; }
      else if (n.includes('somm') || n.includes('somier')) { icon = 'layers'; emoji = '🛋️'; }
      else if (n.includes('cama') || n.includes('dorm')) { icon = 'bedroom_parent'; emoji = '🛏️'; }
      else if (n.includes('almohad')) { icon = 'hotel'; emoji = '☁️'; }
      else if (n.includes('ropa') || n.includes('saban') || n.includes('textil')) { icon = 'texture'; emoji = '🧺'; }
      else if (n.includes('mueble') || n.includes('living') || n.includes('sofa')) { icon = 'chair'; emoji = '🪑'; }
      else if (n.includes('espald') || n.includes('cabec') || n.includes('respald')) { icon = 'vertical_split'; emoji = '🖼️'; }
      else if (n.includes('recamier') || n.includes('banquet')) { icon = 'weekend'; emoji = '🛋️'; }
      else if (n.includes('promo')) { icon = 'star'; emoji = '⭐'; }

      return {
        id: row.id,
        nombre: row.nombre,
        total: row.total,
        icon,
        emoji,
        imagen_url: row.imagen_url,
      };
    });

    return res.json({
      success: true,
      data: categoriasConIcono,
    });
  } catch (error) {
    next(error);
  }
}
