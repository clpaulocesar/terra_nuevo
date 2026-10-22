import { pool } from '../config/database.js';

function nombreValido(valor) {
  return String(valor ?? '').trim().replace(/\s+/g, ' ');
}

function slugificar(valor) {
  return String(valor ?? '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'categoria';
}

// La tabla `categories` tiene un trigger `set_updated_at` (BEFORE UPDATE) que hace
// NEW.updated_at := NOW(), pero no tenía la columna. Sin ella, cualquier UPDATE falla
// con "record new has no field updated_at". La creamos de forma perezosa e idempotente.
let updatedAtListo;
function asegurarUpdatedAt() {
  if (!updatedAtListo) {
    updatedAtListo = pool
      .query('ALTER TABLE categories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()')
      .catch((error) => { updatedAtListo = null; throw error; });
  }
  return updatedAtListo;
}

export async function crearCategoria(req, res, next) {
  try {
    const nombre = nombreValido(req.body?.nombre);
    if (!nombre) return res.status(400).json({ success: false, mensaje: 'El nombre de la categoría es obligatorio.' });
    await asegurarUpdatedAt();
    const { rows } = await pool.query(
      `INSERT INTO categories (name, slug, is_active) VALUES ($1, $2, TRUE) RETURNING id, name AS nombre, is_active AS activo`,
      [nombre, `${slugificar(nombre)}-${Date.now()}`]
    );
    return res.status(201).json({ success: true, data: rows[0] });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ success: false, mensaje: 'Ya existe una categoría con ese nombre.' });
    next(error);
  }
}

export async function actualizarCategoria(req, res, next) {
  try {
    const nombre = nombreValido(req.body?.nombre);
    if (!nombre) return res.status(400).json({ success: false, mensaje: 'El nombre de la categoría es obligatorio.' });
    await asegurarUpdatedAt();
    const { rows } = await pool.query(
      `UPDATE categories SET name = $1 WHERE id = $2 RETURNING id, name AS nombre, is_active AS activo`,
      [nombre, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ success: false, mensaje: 'Categoría no encontrada.' });
    return res.json({ success: true, data: rows[0] });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ success: false, mensaje: 'Ya existe una categoría con ese nombre.' });
    next(error);
  }
}

export async function eliminarCategoria(req, res, next) {
  try {
    const { rows: asociadas } = await pool.query('SELECT COUNT(*)::integer AS total FROM products WHERE category_id = $1', [req.params.id]);
    if (Number(asociadas[0]?.total || 0) > 0) return res.status(409).json({ success: false, mensaje: 'No puedes eliminar una categoría que tiene productos asociados.' });
    const { rowCount } = await pool.query('DELETE FROM categories WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ success: false, mensaje: 'Categoría no encontrada.' });
    return res.json({ success: true, data: { id: req.params.id } });
  } catch (error) { next(error); }
}

export async function listarCategorias(req, res, next) {
  try {
    const incluirVacias = ['1', 'true'].includes(String(req.query.todas ?? '').toLowerCase());
    const categoriasPermitidas = ['COLCHON', 'SOMIER', 'POLTRONA', 'SOFA CAMA', 'ALMOHADA', 'COJIN'];
    const placeholders = categoriasPermitidas.map((_, i) => `$${i + 1}`).join(', ');
    const resultado = await pool.query(`
      WITH ventas_categoria AS (
        SELECT c2.id AS categoria_id, SUM(COALESCE(oi.quantity, 0))::integer AS unidades
        FROM order_items oi
        JOIN products p2 ON LOWER(p2.name) = LOWER(oi.product_name)
        JOIN categories c2 ON c2.id = p2.category_id
        GROUP BY c2.id
      )
      SELECT c.id, c.name AS nombre, COUNT(p.id)::integer AS total, MIN(p.imagen_url) AS imagen_url,
             COALESCE(vc.unidades, 0)::integer AS ventas
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id AND COALESCE(p.activo, p.is_active, TRUE) = TRUE
      LEFT JOIN ventas_categoria vc ON vc.categoria_id = c.id
      WHERE c.is_active = TRUE ${incluirVacias ? '' : `AND UPPER(c.name) IN (${placeholders})`}
      GROUP BY c.id, c.name, vc.unidades
      ${incluirVacias ? '' : "HAVING COUNT(p.id) > 0 OR UPPER(c.name) = 'ALMOHADA'"}
      ORDER BY total DESC, c.name ASC
    `, incluirVacias ? [] : categoriasPermitidas);

    const categoriasConIcono = resultado.rows.map((row) => {
      const n = row.nombre.toLowerCase();
      let icon = 'category';
      let emoji = '📦';

      if (n.includes('colch')) { icon = 'bed'; emoji = '🛏️'; }
      else if (n.includes('somm') || n.includes('somier')) { icon = 'layers'; emoji = '🛋️'; }
      else if (n.includes('cama') || n.includes('dorm')) { icon = 'bedroom_parent'; emoji = '🛏️'; }
      else if (n.includes('almohad')) { icon = 'hotel'; emoji = '☁️'; }
      else if (n.includes('cojin')) { icon = 'chair'; emoji = '🛋️'; }
      else if (n.includes('ropa') || n.includes('saban') || n.includes('textil')) { icon = 'texture'; emoji = '🧺'; }
      else if (n.includes('mueble') || n.includes('living') || n.includes('sofa')) { icon = 'chair'; emoji = '🪑'; }
      else if (n.includes('espald') || n.includes('cabec') || n.includes('respald')) { icon = 'vertical_split'; emoji = '🖼️'; }
      else if (n.includes('recamier') || n.includes('banquet')) { icon = 'weekend'; emoji = '🛋️'; }
      else if (n.includes('promo')) { icon = 'star'; emoji = '⭐'; }

      return {
        id: row.id,
        nombre: row.nombre,
        total: row.total,
        ventas: Number(row.ventas || 0),
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

// Devuelve la tabla `categories` completa, sin filtros ni transformaciones.
// Endpoint sin protección por ahora.
export async function listarCategoriasCrudo(req, res, next) {
  try {
    const { rows } = await pool.query('SELECT * FROM categories ORDER BY name ASC');
    return res.json({ success: true, total: rows.length, data: rows });
  } catch (error) {
    next(error);
  }
}
