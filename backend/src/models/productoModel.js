import { pool } from '../config/database.js';

export async function listarProductosBD({
  buscar = '',
  categoria = '',
  pagina = 1,
  limite = 100,
  soloActivos = false,
} = {}) {
  let sql = `
    SELECT id, sku, nombre, descripcion, categoria,
           precio, precio_original, descuento, promocion,
           stock, showroom, bodega, medida, firmeza, detalle,
           imagen_url, imagenes, activo
    FROM productos
    WHERE 1=1
  `;

  const valores = [];

  if (soloActivos) {
    sql += ` AND activo = TRUE`;
  }

  if (buscar) {
    valores.push(`%${buscar}%`);
    sql += `
      AND (
        nombre ILIKE $${valores.length}
        OR descripcion ILIKE $${valores.length}
        OR COALESCE(sku, '') ILIKE $${valores.length}
        OR COALESCE(detalle, '') ILIKE $${valores.length}
      )
    `;
  }

  if (categoria && categoria !== 'Todos') {
    if (categoria === 'Promociones') {
      sql += ` AND (promocion = TRUE OR (descuento IS NOT NULL AND descuento != ''))`;
    } else {
      valores.push(categoria);
      sql += ` AND LOWER(categoria) = LOWER($${valores.length})`;
    }
  }

  valores.push(limite);
  const posicionLimite = valores.length;

  valores.push((pagina - 1) * limite);
  const posicionOffset = valores.length;

  sql += `
    ORDER BY id ASC
    LIMIT $${posicionLimite}
    OFFSET $${posicionOffset}
  `;

  const resultado = await pool.query(sql, valores);
  return resultado.rows;
}

export async function obtenerProductoBD(id) {
  const resultado = await pool.query(
    `SELECT id, sku, nombre, descripcion, categoria,
            precio, precio_original, descuento, promocion,
            stock, showroom, bodega, medida, firmeza, detalle,
            imagen_url, imagenes, activo
     FROM productos
     WHERE id = $1`,
    [id]
  );

  return resultado.rows[0] || null;
}

export async function crearProductoBD(datos) {
  const {
    sku,
    nombre,
    descripcion,
    categoria,
    precio,
    precio_original = null,
    descuento = null,
    promocion = false,
    showroom = 0,
    bodega = 0,
    medida = null,
    firmeza = null,
    detalle = null,
    imagen_url = null,
    imagenes = [],
    activo = true,
  } = datos;

  const stock = Number(showroom || 0) + Number(bodega || 0);

  const resultado = await pool.query(
    `INSERT INTO productos
      (sku, nombre, descripcion, categoria, precio, precio_original, descuento, promocion,
       showroom, bodega, stock, medida, firmeza, detalle, imagen_url, imagenes, activo)
     VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
     RETURNING *`,
    [
      sku,
      nombre,
      descripcion,
      categoria,
      precio,
      precio_original,
      descuento,
      promocion,
      showroom,
      bodega,
      stock,
      medida,
      firmeza,
      detalle,
      imagen_url,
      imagenes,
      activo,
    ]
  );

  return resultado.rows[0];
}

export async function actualizarProductoBD(id, datos) {
  const {
    sku,
    nombre,
    descripcion,
    categoria,
    precio,
    precio_original = null,
    descuento = null,
    promocion = false,
    showroom,
    bodega,
    medida,
    firmeza,
    detalle,
    imagen_url,
    imagenes,
    activo = true,
  } = datos;

  const showroomNum = Number(showroom ?? 0);
  const bodegaNum = Number(bodega ?? 0);
  const stockCalc = showroomNum + bodegaNum;

  const resultado = await pool.query(
    `UPDATE productos SET
      sku = COALESCE($1, sku),
      nombre = COALESCE($2, nombre),
      descripcion = COALESCE($3, descripcion),
      categoria = COALESCE($4, categoria),
      precio = COALESCE($5, precio),
      precio_original = $6,
      descuento = $7,
      promocion = COALESCE($8, promocion),
      showroom = $9,
      bodega = $10,
      stock = $11,
      medida = COALESCE($12, medida),
      firmeza = COALESCE($13, firmeza),
      detalle = COALESCE($14, detalle),
      imagen_url = COALESCE($15, imagen_url),
      imagenes = COALESCE($16, imagenes),
      activo = COALESCE($17, activo)
     WHERE id = $18
     RETURNING *`,
    [
      sku,
      nombre,
      descripcion,
      categoria,
      precio,
      precio_original,
      descuento,
      promocion,
      showroomNum,
      bodegaNum,
      stockCalc,
      medida,
      firmeza,
      detalle,
      imagen_url,
      imagenes,
      activo,
      id,
    ]
  );

  return resultado.rows[0] || null;
}

export async function actualizarStockBD(id, { showroom, bodega }) {
  const showroomNum = Number(showroom ?? 0);
  const bodegaNum = Number(bodega ?? 0);
  const stock = showroomNum + bodegaNum;

  const resultado = await pool.query(
    `UPDATE productos
     SET showroom = $1, bodega = $2, stock = $3
     WHERE id = $4
     RETURNING *`,
    [showroomNum, bodegaNum, stock, id]
  );
  return resultado.rows[0] || null;
}

export async function eliminarProductoBD(id) {
  const resultado = await pool.query(
    `UPDATE productos SET activo = FALSE WHERE id = $1 RETURNING *`,
    [id]
  );
  return resultado.rows[0] || null;
}
