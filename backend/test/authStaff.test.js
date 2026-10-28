// Login del personal solo contra `staff_accounts` (sin credenciales del .env) y
// validación del token contra la base en cada petición. Necesita TEST_DATABASE_URL.
import test, { before, after, beforeEach, describe } from 'node:test';
import assert from 'node:assert/strict';
import { prepararBaseDePrueba, vaciarTablas, crearStaff, SALTAR_SIN_BD } from './helpers/bdPrueba.js';

describe('autenticación del personal', { skip: SALTAR_SIN_BD }, () => {
  let pool; let servidor; let base; let limiteIntentos; let authAdmin;
  const CLAVE = 'ClaveSegura-123456';

  const api = async (metodo, ruta, { body, token } = {}) => {
    const respuesta = await fetch(`${base}${ruta}`, {
      method: metodo,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: respuesta.status, cuerpo: await respuesta.json().catch(() => null) };
  };
  const login = (email, password = CLAVE) => api('POST', '/api/admin/auth/login', { body: { email, password } });

  before(async () => {
    process.env.CLIENTE_TOKEN_SECRET = 'secreto-de-prueba-para-mayoristas-0123456789';
    process.env.ADMIN_TOKEN_SECRET = 'secreto-de-prueba-para-el-panel-0123456789';
    // Credenciales en el entorno: ya no valen para entrar.
    process.env.ADMIN_EMAIL = 'env@prueba.local';
    process.env.ADMIN_PASSWORD = 'ClaveDelEntorno-123';
    process.env.TERRA_ERP_HABILITADO = 'false';
    pool = await prepararBaseDePrueba();
    const { default: app } = await import('../src/app.js');
    limiteIntentos = await import('../src/services/limiteIntentos.js');
    authAdmin = await import('../src/middlewares/authAdmin.js');
    await new Promise((resolve) => { servidor = app.listen(0, '127.0.0.1', resolve); });
    base = `http://127.0.0.1:${servidor.address().port}`;
  });
  after(async () => {
    await new Promise((resolve) => servidor?.close(resolve));
    await pool?.end();
  });
  beforeEach(async () => {
    await vaciarTablas(pool);
    limiteIntentos.reiniciarLimiteIntentos();
  });

  test('las credenciales ADMIN_EMAIL/ADMIN_PASSWORD del entorno dan 401', async () => {
    const r = await login(process.env.ADMIN_EMAIL, process.env.ADMIN_PASSWORD);
    assert.equal(r.status, 401);
    assert.equal(r.cuerpo.mensaje, 'Credenciales inválidas');
  });

  test('admin, vendedor y despacho entran con el rol de la base', async () => {
    for (const rol of ['admin', 'vendedor', 'despacho']) {
      await crearStaff(pool, { email: `${rol}@prueba.local`, password: CLAVE, rol });
      const r = await login(`${rol}@prueba.local`);
      assert.equal(r.status, 200, JSON.stringify(r.cuerpo));
      assert.equal(r.cuerpo.data.usuario.rol, rol);
      assert.ok(r.cuerpo.data.usuario.id);
      const yo = await api('GET', '/api/admin/auth/me', { token: r.cuerpo.data.token });
      assert.equal(yo.status, 200);
      assert.equal(yo.cuerpo.data.rol, rol);
      assert.equal(yo.cuerpo.data.email, `${rol}@prueba.local`);
    }
  });

  test('cuenta inactiva: 401 al entrar y 401 con un token vigente tras desactivarla', async () => {
    const cuenta = await crearStaff(pool, { email: 'vendedor@prueba.local', password: CLAVE, rol: 'vendedor' });
    const ok = await login('vendedor@prueba.local');
    assert.equal(ok.status, 200);
    const token = ok.cuerpo.data.token;
    assert.equal((await api('GET', '/api/admin/auth/me', { token })).status, 200);
    await pool.query('UPDATE staff_accounts SET is_active = FALSE WHERE id = $1', [cuenta.id]);
    assert.equal((await api('GET', '/api/admin/auth/me', { token })).status, 401);
    assert.equal((await login('vendedor@prueba.local')).status, 401);
  });

  test('si el rol cambia en la base, manda la base y no el token', async () => {
    const cuenta = await crearStaff(pool, { email: 'cambia@prueba.local', password: CLAVE, rol: 'admin' });
    const token = (await login('cambia@prueba.local')).cuerpo.data.token;
    assert.equal((await api('GET', '/api/personal', { token })).status, 200);
    await pool.query("UPDATE staff_accounts SET role = 'despacho' WHERE id = $1", [cuenta.id]);
    assert.equal((await api('GET', '/api/personal', { token })).status, 403);
    assert.equal((await api('GET', '/api/admin/auth/me', { token })).cuerpo.data.rol, 'despacho');
  });

  test('un token sin id (formato viejo del superadmin) da 401', async () => {
    const { createHmac } = await import('node:crypto');
    const payload = Buffer.from(JSON.stringify({ rol: 'admin', email: 'viejo@prueba.local', exp: Date.now() + 60000 })).toString('base64url');
    const firmaValida = createHmac('sha256', process.env.ADMIN_TOKEN_SECRET).update(payload).digest('base64url');
    assert.equal((await api('GET', '/api/admin/auth/me', { token: `${payload}.${firmaValida}` })).status, 401);
    assert.equal(authAdmin.verificarTokenAdmin(`${payload}.${firmaValida}`), null);
    assert.throws(() => authAdmin.crearTokenAdmin({ email: 'x', rol: 'admin' }), /id/);
  });

  test('usuario inexistente y clave incorrecta devuelven la misma respuesta', async () => {
    await crearStaff(pool, { email: 'existe@prueba.local', password: CLAVE });
    const inexistente = await login('noexiste@prueba.local', 'loquesea-12345');
    const incorrecta = await login('existe@prueba.local', 'incorrecta-12345');
    assert.equal(inexistente.status, 401);
    assert.equal(incorrecta.status, 401);
    assert.deepEqual(inexistente.cuerpo, incorrecta.cuerpo);
  });

  test('sexto intento fallido -> 429, aunque la clave sea correcta', async () => {
    await crearStaff(pool, { email: 'limite@prueba.local', password: CLAVE });
    for (let i = 0; i < 5; i += 1) assert.equal((await login('limite@prueba.local', 'mal-12345678')).status, 401);
    assert.equal((await login('limite@prueba.local', CLAVE)).status, 429);
  });

  test('mayorista inactivo con token vigente -> 401', async () => {
    await crearStaff(pool, { email: 'admin@prueba.local', password: CLAVE });
    const admin = (await login('admin@prueba.local')).cuerpo.data.token;
    const alta = await api('POST', '/api/clientes/mayoristas', { token: admin, body: { nombre: 'Mayorista', email: 'may@prueba.local', password: 'ClaveMayorista-1' } });
    assert.equal(alta.status, 201, JSON.stringify(alta.cuerpo));
    const token = (await api('POST', '/api/clientes/auth/login', { body: { email: 'may@prueba.local', password: 'ClaveMayorista-1' } })).cuerpo.data.token;
    assert.equal((await api('GET', '/api/clientes/sesion', { token })).status, 200);
    await pool.query("UPDATE users SET is_active = FALSE WHERE lower(email) = 'may@prueba.local'");
    assert.equal((await api('GET', '/api/clientes/sesion', { token })).status, 401);
  });
});
