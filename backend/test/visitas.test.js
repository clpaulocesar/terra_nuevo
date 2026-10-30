import test, { after, before, beforeEach, describe } from 'node:test';
import assert from 'node:assert/strict';
import { prepararBaseDePrueba, SALTAR_SIN_BD, crearStaff } from './helpers/bdPrueba.js';

describe('analítica de visitas públicas', { skip: SALTAR_SIN_BD }, () => {
  let pool;
  let servidor;
  let base;
  let tokenAdmin;

  const solicitar = async (ruta, opciones = {}) => {
    const respuesta = await fetch(`${base}${ruta}`, opciones);
    return { status: respuesta.status, cuerpo: await respuesta.json() };
  };

  before(async () => {
    process.env.ADMIN_TOKEN_SECRET = 'secreto-de-prueba-para-el-panel-0123456789';
    process.env.CLIENTE_TOKEN_SECRET = 'secreto-de-prueba-para-mayoristas-0123456789';
    process.env.TERRA_ERP_HABILITADO = 'false';
    pool = await prepararBaseDePrueba();
    const { asegurarTablaVisitasBD } = await import('../src/models/visitaModel.js');
    await asegurarTablaVisitasBD();
    const { default: app } = await import('../src/app.js');
    await new Promise((resolve) => { servidor = app.listen(0, '127.0.0.1', resolve); });
    base = `http://127.0.0.1:${servidor.address().port}`;
  });

  after(async () => {
    await new Promise((resolve) => servidor?.close(resolve));
    await pool?.end();
  });

  beforeEach(async () => {
    await pool.query('TRUNCATE public_page_views RESTART IDENTITY');
    await pool.query('TRUNCATE staff_accounts RESTART IDENTITY CASCADE');
    const personal = await crearStaff(pool, { email: 'admin-visitas@test.local' });
    const { crearTokenAdmin } = await import('../src/middlewares/authAdmin.js');
    tokenAdmin = crearTokenAdmin({ id: personal.id, email: personal.email, nombre: 'Admin', rol: 'admin' });
  });

  test('registra una vista pública con identificador aleatorio y página permitida', async () => {
    const respuesta = await solicitar('/api/visitas/publica', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: 'b6f3a5e8-59cc-4fb9-814a-c0fc13b26d66', pagePath: '/catalogo' }),
    });

    assert.equal(respuesta.status, 201);
    const { rows } = await pool.query('SELECT session_id, page_path FROM public_page_views');
    assert.equal(rows.length, 1);
    assert.equal(rows[0].page_path, '/catalogo');
  });

  test('rechaza identificadores o rutas no permitidos', async () => {
    const respuesta = await solicitar('/api/visitas/publica', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: 'no-es-uuid', pagePath: '/catalogo?correo=privado' }),
    });

    assert.equal(respuesta.status, 400);
    const { rows } = await pool.query('SELECT id FROM public_page_views');
    assert.equal(rows.length, 0);
  });

  test('exige administrador para leer y agrega visitas por día y página', async () => {
    const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/La_Paz' });
    const sessionId = 'b6f3a5e8-59cc-4fb9-814a-c0fc13b26d66';
    await pool.query(
      `INSERT INTO public_page_views (session_id, page_path) VALUES
        ($1, '/catalogo'), ($1, '/carrito'),
        ('a6f3a5e8-59cc-4fb9-814a-c0fc13b26d66', '/catalogo')`,
      [sessionId]
    );

    const sinToken = await solicitar(`/api/visitas/analitica?desde=${hoy}&hasta=${hoy}`);
    assert.equal(sinToken.status, 401);

    const respuesta = await solicitar(`/api/visitas/analitica?desde=${hoy}&hasta=${hoy}`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    assert.equal(respuesta.status, 200);
    assert.equal(respuesta.cuerpo.data.totalVistas, 3);
    assert.equal(respuesta.cuerpo.data.sesionesUnicas, 2);
    assert.equal(respuesta.cuerpo.data.porDia[0].vistas, 3);
    assert.equal(respuesta.cuerpo.data.paginas[0].pagina, '/catalogo');
  });
});
