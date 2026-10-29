// El catálogo del kiosco pide ?stock=true: sin productos con stock 0 en el listado ni en
// los conteos de categorías. Sin el parámetro (admin, ficha) se ve todo.
// Necesita TEST_DATABASE_URL (Postgres LOCAL vacío).
import test, { before, after, beforeEach, describe } from 'node:test';
import assert from 'node:assert/strict';
import { prepararBaseDePrueba, vaciarTablas, SALTAR_SIN_BD } from './helpers/bdPrueba.js';

describe('catálogo sin productos con stock 0', { skip: SALTAR_SIN_BD }, () => {
  let pool; let servidor; let base;

  const obtener = async (ruta) => {
    const respuesta = await fetch(`${base}${ruta}`);
    return { status: respuesta.status, cuerpo: await respuesta.json() };
  };
  const nombres = (cuerpo) => cuerpo.data.map((p) => p.nombre ?? p.name).sort();

  before(async () => {
    process.env.CLIENTE_TOKEN_SECRET = 'secreto-de-prueba-para-mayoristas-0123456789';
    process.env.ADMIN_TOKEN_SECRET = 'secreto-de-prueba-para-el-panel-0123456789';
    process.env.TERRA_ERP_HABILITADO = 'false';
    pool = await prepararBaseDePrueba();
    const { default: app } = await import('../src/app.js');
    await new Promise((resolve) => { servidor = app.listen(0, '127.0.0.1', resolve); });
    base = `http://127.0.0.1:${servidor.address().port}`;
  });
  after(async () => {
    await new Promise((resolve) => servidor?.close(resolve));
    await pool?.end();
  });
  beforeEach(async () => {
    await vaciarTablas(pool);
    await pool.query('TRUNCATE categories');
    const { rows: [colchones] } = await pool.query("INSERT INTO categories (name, slug) VALUES ('Colchones', 'colchones') RETURNING id");
    const { rows: [almohadas] } = await pool.query("INSERT INTO categories (name, slug) VALUES ('Almohadas', 'almohadas') RETURNING id");
    await pool.query(
      `INSERT INTO products (name, slug, codigo_terra, public_price, stock_quantity, category_id) VALUES
        ('Colchón con stock', 'colchon-con-stock', 'T-1', 100, 5, $1),
        ('Colchón agotado', 'colchon-agotado', 'T-2', 100, 0, $1),
        ('Colchón sin dato de stock', 'colchon-sin-dato', 'T-3', 100, NULL, $1),
        ('Almohada agotada', 'almohada-agotada', 'T-4', 50, 0, $2)`,
      [colchones.id, almohadas.id]
    );
  });

  test('1. con ?stock=true el listado y el total excluyen stock 0 y sin dato', async () => {
    const r = await obtener('/api/productos?stock=true');
    assert.equal(r.status, 200);
    assert.deepEqual(nombres(r.cuerpo), ['Colchón con stock']);
    assert.equal(r.cuerpo.paginacion.total, 1);
  });

  test('2. sin el parámetro se listan todos los activos (ficha, relacionados)', async () => {
    const r = await obtener('/api/productos');
    assert.equal(r.status, 200);
    assert.equal(r.cuerpo.paginacion.total, 4);
  });

  test('3. "Solo con stock" de Ventas directas (todos + stock) vuelve a filtrar', async () => {
    const r = await obtener('/api/productos?todos=true&stock=true');
    assert.deepEqual(nombres(r.cuerpo), ['Colchón con stock']);
  });

  test('4. categorías con ?stock=true: cuentan solo con stock y ocultan las vacías', async () => {
    const conStock = await obtener('/api/categorias?stock=true');
    assert.deepEqual(conStock.cuerpo.data.map((c) => [c.nombre, c.total]), [['Colchones', 1]]);
    const todas = await obtener('/api/categorias');
    assert.deepEqual(todas.cuerpo.data.map((c) => [c.nombre, c.total]), [['Colchones', 3], ['Almohadas', 1]]);
  });
});
