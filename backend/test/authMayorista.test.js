// Login propio de mayoristas (§1 de "Eliminar toda dependencia de Supabase") y
// script de corrección de URLs. Necesita TEST_DATABASE_URL (Postgres LOCAL vacío).
import test, { before, after, beforeEach, describe } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { prepararBaseDePrueba, vaciarTablas, crearStaff, SALTAR_SIN_BD, TEST_DB } from './helpers/bdPrueba.js';

const RAIZ_BACKEND = path.resolve(import.meta.dirname, '..');

describe('autenticación de mayoristas', { skip: SALTAR_SIN_BD }, () => {
  let pool; let servidor; let base; let limiteIntentos;
  const ADMIN = { email: 'admin@prueba.local', password: 'ClaveAdmin-123456' };

  const api = async (metodo, ruta, { body, token } = {}) => {
    const respuesta = await fetch(`${base}${ruta}`, {
      method: metodo,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: respuesta.status, cuerpo: await respuesta.json().catch(() => null) };
  };
  const tokenAdmin = async () => {
    const r = await api('POST', '/api/admin/auth/login', { body: ADMIN });
    assert.equal(r.status, 200, JSON.stringify(r.cuerpo));
    return r.cuerpo.data.token;
  };

  before(async () => {
    process.env.CLIENTE_TOKEN_SECRET = 'secreto-de-prueba-para-mayoristas-0123456789';
    process.env.ADMIN_TOKEN_SECRET = 'secreto-de-prueba-para-el-panel-0123456789';
    process.env.TERRA_ERP_HABILITADO = 'false';
    pool = await prepararBaseDePrueba();
    const { default: app } = await import('../src/app.js');
    limiteIntentos = await import('../src/services/limiteIntentos.js');
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
    await crearStaff(pool, { ...ADMIN, rol: 'admin' });
  });

  const crearMayorista = async (email = 'mayorista@prueba.local', password = 'ClaveMayorista-1') => {
    const r = await api('POST', '/api/clientes/mayoristas', { token: await tokenAdmin(), body: { nombre: 'Distribuidora Prueba', email, password, telefono: '70000000', nit: '1234567' } });
    assert.equal(r.status, 201, JSON.stringify(r.cuerpo));
    return { clienteId: r.cuerpo.data.id, email, password };
  };

  test('1. login correcto da token; clave errónea 401; sexto intento 429', async () => {
    const { email, password } = await crearMayorista();
    const ok = await api('POST', '/api/clientes/auth/login', { body: { email, password } });
    assert.equal(ok.status, 200);
    assert.ok(ok.cuerpo.data.token.includes('.'));
    assert.equal(ok.cuerpo.data.rol, 'mayorista');
    assert.ok(ok.cuerpo.data.cliente_id);
    assert.ok(Number(ok.cuerpo.data.expira) > Date.now());
    const { rows } = await pool.query('SELECT password_hash, ultimo_login_at FROM users WHERE lower(email)=$1', [email]);
    assert.match(rows[0].password_hash, /^\$2[aby]\$/);
    assert.ok(rows[0].ultimo_login_at);

    for (let i = 0; i < 5; i += 1) assert.equal((await api('POST', '/api/clientes/auth/login', { body: { email, password: 'incorrecta' } })).status, 401);
    const bloqueado = await api('POST', '/api/clientes/auth/login', { body: { email, password } });
    assert.equal(bloqueado.status, 429);
  });

  test('2. mayorista inactivo o rol distinto -> 401', async () => {
    const { email, password } = await crearMayorista();
    await pool.query('UPDATE users SET is_active = FALSE WHERE lower(email)=$1', [email]);
    assert.equal((await api('POST', '/api/clientes/auth/login', { body: { email, password } })).status, 401);

    const { rows } = await pool.query('SELECT password_hash FROM users WHERE lower(email)=$1', [email]);
    await pool.query("INSERT INTO users (auth_user_id, name, email, role, is_active, password_hash) VALUES (gen_random_uuid(), 'Otro', 'otro@prueba.local', 'cliente', TRUE, $1)", [rows[0].password_hash]);
    assert.equal((await api('POST', '/api/clientes/auth/login', { body: { email: 'otro@prueba.local', password } })).status, 401);
  });

  test('3. rutas de la cuenta sin token o con token de staff -> 401', async () => {
    const staff = await tokenAdmin();
    for (const ruta of ['/api/clientes/sesion', '/api/clientes/mis-pedidos']) {
      assert.equal((await api('GET', ruta)).status, 401, ruta);
      assert.equal((await api('GET', ruta, { token: staff })).status, 401, ruta);
    }
    assert.equal((await api('PUT', '/api/clientes/perfil', { body: { nombre: 'X' } })).status, 401);
    assert.equal((await api('PUT', '/api/clientes/perfil', { token: staff, body: { nombre: 'X' } })).status, 401);

    const { email, password } = await crearMayorista();
    const token = (await api('POST', '/api/clientes/auth/login', { body: { email, password } })).cuerpo.data.token;
    const sesion = await api('GET', '/api/clientes/sesion', { token });
    assert.equal(sesion.status, 200);
    assert.equal(sesion.cuerpo.data.email, email);
    assert.equal((await api('GET', '/api/clientes/mis-pedidos', { token })).status, 200);
  });

  test('4. el pedido con token mayorista aplica precio B2B; sin token, precio público', async () => {
    const { rows: [producto] } = await pool.query(
      "INSERT INTO products (name, slug, codigo_terra, public_price, precio_mayorista, stock_quantity) VALUES ('Colchón', 'colchon', 'T-1', 100, '80', 10) RETURNING id"
    );
    const { email, password } = await crearMayorista();
    const token = (await api('POST', '/api/clientes/auth/login', { body: { email, password } })).cuerpo.data.token;
    const items = [{ productoId: producto.id, cantidad: 1 }];
    const b2b = await api('POST', '/api/pedidos', { token, body: { items, metodoPago: 'efectivo' } });
    assert.equal(b2b.status, 201, JSON.stringify(b2b.cuerpo));
    assert.equal(Number(b2b.cuerpo.data.total), 80);
    const publico = await api('POST', '/api/pedidos', { body: { items, metodoPago: 'efectivo' } });
    assert.equal(publico.status, 201);
    assert.equal(Number(publico.cuerpo.data.total), 100);
    assert.equal((await api('POST', '/api/pedidos', { token: 'basura.basura', body: { items, metodoPago: 'efectivo' } })).status, 403);

    // Cobro por HTTP (ERP desactivado): QR sin referencia -> 400; con referencia -> una fila en payments.
    const admin = await tokenAdmin();
    const sinRef = await api('PATCH', `/api/pedidos/${publico.cuerpo.data.id}/pago`, { token: admin, body: { metodoPago: 'qr' } });
    assert.equal(sinRef.status, 400);
    assert.equal((await pool.query('SELECT COUNT(*)::int AS n FROM payments')).rows[0].n, 0);
    const cobro = await api('PATCH', `/api/pedidos/${publico.cuerpo.data.id}/pago`, { token: admin, body: { metodoPago: 'qr', referencia: 'QR-123' } });
    assert.equal(cobro.status, 200, JSON.stringify(cobro.cuerpo));
    const { rows: filas } = await pool.query('SELECT provider, provider_transaction_id, status, amount_minor, registered_by FROM payments');
    assert.equal(filas.length, 1);
    assert.deepEqual({ ...filas[0], amount_minor: Number(filas[0].amount_minor) }, { provider: 'qr', provider_transaction_id: 'QR-123', status: 'approved', amount_minor: 10000, registered_by: filas[0].registered_by });
    assert.ok(filas[0].registered_by);
  });

  test('5. el alta crea customers + users en una transacción; el duplicado no deja nada', async () => {
    const { email } = await crearMayorista();
    const antes = (await pool.query('SELECT COUNT(*)::int AS n FROM customers')).rows[0].n;
    const duplicado = await api('POST', '/api/clientes/mayoristas', { token: await tokenAdmin(), body: { nombre: 'Otra', email, password: 'ClaveMayorista-2' } });
    assert.equal(duplicado.status, 409);
    assert.equal((await pool.query('SELECT COUNT(*)::int AS n FROM customers')).rows[0].n, antes);
    assert.equal((await pool.query('SELECT COUNT(*)::int AS n FROM users')).rows[0].n, 1);
  });

  test('asignar clave desde el admin permite entrar con la nueva; el vendedor no puede', async () => {
    const { clienteId, email } = await crearMayorista();
    const admin = await tokenAdmin();
    assert.equal((await api('PATCH', `/api/clientes/${clienteId}/clave`, { token: admin, body: { password: 'corta' } })).status, 400);
    assert.equal((await api('PATCH', `/api/clientes/${clienteId}/clave`, { token: admin, body: { password: 'NuevaClave-123' } })).status, 200);
    assert.equal((await api('POST', '/api/clientes/auth/login', { body: { email, password: 'NuevaClave-123' } })).status, 200);
    assert.equal((await api('POST', '/api/clientes/auth/login', { body: { email, password: 'ClaveMayorista-1' } })).status, 401);
  });

  test('8. el script de URLs no modifica nada en dry-run y corrige con --aplicar', async () => {
    const sucia = 'https://ejemplo.test/imagen.jpg\r\n';
    const { rows: [producto] } = await pool.query("INSERT INTO products (name, slug, codigo_terra, imagen_url) VALUES ('Sucio', 'sucio', 'T-9', $1) RETURNING id", [sucia]);
    const correr = (args) => spawnSync(process.execPath, ['scripts/corregir-urls-imagenes.mjs', ...args], {
      cwd: RAIZ_BACKEND, encoding: 'utf8', env: { ...process.env, DATABASE_URL: TEST_DB, DB_SSL: 'false' },
    });
    const seco = correr([]);
    assert.equal(seco.status, 0, seco.stderr);
    assert.match(seco.stdout, /URLs con saltos de línea o espacios en products.imagen_url: 1/);
    assert.equal((await pool.query('SELECT imagen_url FROM products WHERE id=$1', [producto.id])).rows[0].imagen_url, sucia);
    const aplicado = correr(['--aplicar']);
    assert.equal(aplicado.status, 0, aplicado.stderr);
    assert.equal((await pool.query('SELECT imagen_url FROM products WHERE id=$1', [producto.id])).rows[0].imagen_url, 'https://ejemplo.test/imagen.jpg');
  });
});
