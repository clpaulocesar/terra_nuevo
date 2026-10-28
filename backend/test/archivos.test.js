// Subida de imágenes de producto al copyparty propio (servidor HTTP falso, nunca el real)
// y migración de imágenes desde Supabase. Necesita TEST_DATABASE_URL.
import test, { before, after, beforeEach, describe } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { prepararBaseDePrueba, vaciarTablas, crearStaff, SALTAR_SIN_BD, TEST_DB } from './helpers/bdPrueba.js';

const RAIZ_BACKEND = path.resolve(import.meta.dirname, '..');
const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]), Buffer.alloc(64, 1)]);
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(64, 2)]);
const PDF = Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.alloc(64, 3)]);

// ---- copyparty falso ----
const copyparty = { modo: 'ok', recibidos: [], archivos: new Map(), base: '' };
const servidorFalso = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const trozos = [];
  req.on('data', (t) => trozos.push(t));
  req.on('end', () => {
    const cuerpo = Buffer.concat(trozos);
    if (req.method === 'PUT') {
      copyparty.recibidos.push({ ruta: url.pathname, query: url.search, pw: req.headers.pw ?? null, tipo: req.headers['content-type'], bytes: cuerpo.length });
      if (copyparty.modo === '401') { res.writeHead(401); return res.end('nope'); }
      if (copyparty.modo === '500') { res.writeHead(500); return res.end('boom'); }
      if (copyparty.modo === 'timeout') return; // nunca responde
      copyparty.archivos.set(url.pathname, cuerpo);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ filesz: cuerpo.length, fileurl: `${copyparty.base}${url.pathname}`, sha512: 'abc' }));
    }
    if (req.method === 'GET') {
      const archivo = copyparty.archivos.get(url.pathname);
      if (!archivo) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'Content-Type': 'application/octet-stream' });
      return res.end(archivo);
    }
    res.writeHead(405);
    res.end();
  });
});

describe('imágenes de producto en copyparty', { skip: SALTAR_SIN_BD }, () => {
  let pool; let servidor; let base;
  const ADMIN = { email: 'admin@prueba.local', password: 'ClaveAdmin-123456' };

  const api = async (metodo, ruta, { body, token, form } = {}) => {
    const respuesta = await fetch(`${base}${ruta}`, {
      method: metodo,
      headers: { ...(form ? {} : { 'Content-Type': 'application/json' }), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: form || (body === undefined ? undefined : JSON.stringify(body)),
    });
    return { status: respuesta.status, cuerpo: await respuesta.json().catch(() => null) };
  };
  const login = async (email, password) => (await api('POST', '/api/admin/auth/login', { body: { email, password } })).cuerpo.data.token;
  const formulario = (archivos, extra = {}) => {
    const f = new FormData();
    for (const { buffer, nombre, tipo } of archivos) f.append('archivos', new Blob([buffer], { type: tipo }), nombre);
    for (const [k, v] of Object.entries(extra)) f.append(k, v);
    return f;
  };

  before(async () => {
    await new Promise((resolve) => servidorFalso.listen(0, '127.0.0.1', resolve));
    copyparty.base = `http://127.0.0.1:${servidorFalso.address().port}`;
    process.env.COPYPARTY_URL = copyparty.base;
    process.env.COPYPARTY_CARPETA_PRODUCTOS = 'imagens';
    process.env.COPYPARTY_PASSWORD = '';
    process.env.COPYPARTY_TIMEOUT_MS = '500';
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
    await new Promise((resolve) => servidorFalso.close(resolve));
    await pool?.end();
  });
  beforeEach(async () => {
    await vaciarTablas(pool);
    await pool.query("DO $$ BEGIN IF to_regclass('public.product_images') IS NOT NULL THEN TRUNCATE product_images; END IF; END $$");
    copyparty.modo = 'ok';
    copyparty.recibidos = [];
    copyparty.archivos.clear();
    process.env.COPYPARTY_PASSWORD = '';
    await crearStaff(pool, { ...ADMIN, rol: 'admin' });
  });

  test('subida OK: PUT a la carpeta con nombre {codigo}_{ts}_{n}.{ext}, sin PW cuando no hay clave', async () => {
    const token = await login(ADMIN.email, ADMIN.password);
    const r = await api('POST', '/api/archivos/productos', { token, form: formulario([{ buffer: JPEG, nombre: 'foto con ñ.JPG', tipo: 'image/jpeg' }, { buffer: PNG, nombre: 'otra.png', tipo: 'image/png' }], { codigoTerra: 'COLN 00579' }) });
    assert.equal(r.status, 201, JSON.stringify(r.cuerpo));
    assert.equal(r.cuerpo.data.urls.length, 2);
    assert.match(r.cuerpo.data.urls[0], new RegExp(`^${copyparty.base}/imagens/COLN00579_\\d{14}_1\\.jpg$`));
    assert.match(r.cuerpo.data.urls[1], new RegExp(`^${copyparty.base}/imagens/COLN00579_\\d{14}_2\\.png$`));
    assert.equal(copyparty.recibidos.length, 2);
    assert.equal(copyparty.recibidos[0].pw, null);
    assert.equal(copyparty.recibidos[0].query, '?j');
    assert.equal(copyparty.recibidos[0].tipo, 'image/jpeg');
    assert.equal(copyparty.recibidos[0].bytes, JPEG.length);
  });

  test('con COPYPARTY_PASSWORD se envía la cabecera PW; sin codigoTerra se usa el id del producto', async () => {
    process.env.COPYPARTY_PASSWORD = 'clave-copyparty';
    const token = await login(ADMIN.email, ADMIN.password);
    const productoId = '11111111-2222-4333-8444-555555555555';
    const r = await api('POST', '/api/archivos/productos', { token, form: formulario([{ buffer: JPEG, nombre: 'a.jpg', tipo: 'image/jpeg' }], { productoId }) });
    assert.equal(r.status, 201);
    assert.equal(copyparty.recibidos[0].pw, 'clave-copyparty');
    assert.match(r.cuerpo.data.urls[0], /\/imagens\/11111111-2222-4333-8444-555555555555_\d{14}_1\.jpg$/);
  });

  test('tipo inválido -> 400; PDF disfrazado de .jpg -> 400; > 5 MB -> 413; nada llega a copyparty', async () => {
    const token = await login(ADMIN.email, ADMIN.password);
    assert.equal((await api('POST', '/api/archivos/productos', { token, form: formulario([{ buffer: Buffer.from('hola mundo, esto es texto plano'), nombre: 'nota.txt', tipo: 'text/plain' }]) })).status, 400);
    assert.equal((await api('POST', '/api/archivos/productos', { token, form: formulario([{ buffer: PDF, nombre: 'factura.jpg', tipo: 'image/jpeg' }]) })).status, 400);
    assert.equal((await api('POST', '/api/archivos/productos', { token, form: formulario([{ buffer: Buffer.concat([JPEG, Buffer.alloc(5 * 1024 * 1024)]), nombre: 'grande.jpg', tipo: 'image/jpeg' }]) })).status, 413);
    assert.equal((await api('POST', '/api/archivos/productos', { token, form: formulario([]) })).status, 400);
    assert.equal(copyparty.recibidos.length, 0);
  });

  test('copyparty caído, 401 o sin respuesta -> error claro y nada guardado', async () => {
    const token = await login(ADMIN.email, ADMIN.password);
    copyparty.modo = '500';
    let r = await api('POST', '/api/archivos/productos', { token, form: formulario([{ buffer: JPEG, nombre: 'a.jpg', tipo: 'image/jpeg' }]) });
    assert.equal(r.status, 503);
    assert.equal(r.cuerpo.codigo, 'almacenamiento_no_disponible');
    copyparty.modo = '401';
    r = await api('POST', '/api/archivos/productos', { token, form: formulario([{ buffer: JPEG, nombre: 'a.jpg', tipo: 'image/jpeg' }]) });
    assert.equal(r.status, 502);
    assert.match(r.cuerpo.mensaje, /COPYPARTY_PASSWORD/);
    copyparty.modo = 'timeout';
    r = await api('POST', '/api/archivos/productos', { token, form: formulario([{ buffer: JPEG, nombre: 'a.jpg', tipo: 'image/jpeg' }]) });
    assert.equal(r.status, 503);
    assert.equal((await pool.query('SELECT COUNT(*)::int AS n FROM product_images')).rows[0].n, 0);
  });

  test('sin token -> 401; vendedor -> 403', async () => {
    assert.equal((await api('POST', '/api/archivos/productos', { form: formulario([{ buffer: JPEG, nombre: 'a.jpg', tipo: 'image/jpeg' }]) })).status, 401);
    await crearStaff(pool, { email: 'vendedor@prueba.local', password: ADMIN.password, rol: 'vendedor' });
    const vendedor = await login('vendedor@prueba.local', ADMIN.password);
    assert.equal((await api('POST', '/api/archivos/productos', { token: vendedor, form: formulario([{ buffer: JPEG, nombre: 'a.jpg', tipo: 'image/jpeg' }]) })).status, 403);
    assert.equal(copyparty.recibidos.length, 0);
  });

  test('guardar un producto registra sus imágenes nuevas en product_images sin borrar las existentes', async () => {
    const token = await login(ADMIN.email, ADMIN.password);
    const urls = [`${copyparty.base}/imagens/X_1.jpg`, `${copyparty.base}/imagens/X_2.jpg`, `${copyparty.base}/imagens/X_3.jpg`];
    const creado = await api('POST', '/api/productos', { token, body: { nombre: 'Colchón Prueba', categoria: 'Colchones', precio: 100, sku: 'T-1', imagen_url: urls[0], imagenes: urls.slice(0, 2) } });
    assert.equal(creado.status, 201, JSON.stringify(creado.cuerpo));
    const productoId = creado.cuerpo.data.id;
    const filas = async () => (await pool.query('SELECT image_url, sort_order, is_primary FROM product_images WHERE product_id = $1 ORDER BY sort_order', [productoId])).rows;
    assert.deepEqual(await filas(), [{ image_url: urls[0], sort_order: 0, is_primary: true }, { image_url: urls[1], sort_order: 1, is_primary: false }]);

    // Fila heredada que no está en la galería (como las imágenes en base64 de producción).
    await pool.query("INSERT INTO product_images (product_id, image_url, sort_order, is_primary) VALUES ($1, 'data:image/jpeg;base64,AAAA', 5, FALSE)", [productoId]);
    const editado = await api('PUT', `/api/productos/${productoId}`, { token, body: { imagen_url: urls[1], imagenes: [urls[1], urls[2]] } });
    assert.equal(editado.status, 200);
    assert.deepEqual(await filas(), [
      { image_url: urls[0], sort_order: 0, is_primary: true },
      { image_url: urls[1], sort_order: 1, is_primary: false },
      { image_url: 'data:image/jpeg;base64,AAAA', sort_order: 5, is_primary: false },
      { image_url: urls[2], sort_order: 6, is_primary: false },
    ]);
  });

  test('migración: el dry-run no sube ni escribe; --aplicar sube, respalda en CSV y reemplaza las URLs', async () => {
    // "Origen" simulado en el mismo servidor falso (patrón /origen/ en vez de supabase.co).
    copyparty.archivos.set('/origen/a.jpg', JPEG);
    copyparty.archivos.set('/origen/b.png', PNG);
    const sucia = `${copyparty.base}/origen/a.jpg\r\n`;
    const dobleBarra = `${copyparty.base}//origen/b.png`;
    const { rows: [producto] } = await pool.query(
      "INSERT INTO products (name, slug, codigo_terra, imagen_url, image_urls) VALUES ('Migrable', 'migrable', 'T-7', $1, $2) RETURNING id",
      [sucia, [sucia, dobleBarra, 'https://res.cloudinary.com/x/ajena.jpg']]
    );
    const { rows: [conGaleriaNula] } = await pool.query(
      "INSERT INTO products (name, slug, codigo_terra, imagen_url, image_urls) VALUES ('Sin galería', 'sin-galeria', 'T-8', $1, NULL) RETURNING id",
      [dobleBarra]
    );
    // product_images: una fila con la URL de origen (se reemplaza) y una heredada ajena (no se toca).
    const { rows: [filaOrigen] } = await pool.query(
      'INSERT INTO product_images (product_id, image_url, sort_order, is_primary) VALUES ($1, $2, 0, TRUE) RETURNING id', [producto.id, dobleBarra]
    );
    const { rows: [filaHeredada] } = await pool.query(
      "INSERT INTO product_images (product_id, image_url, sort_order, is_primary) VALUES ($1, 'data:image/jpeg;base64,BBBB', 1, FALSE) RETURNING id", [producto.id]
    );
    // El script corre en otro proceso pero descarga y sube contra el servidor falso de ESTE
    // proceso: hay que esperar sin bloquear el bucle de eventos (nada de spawnSync).
    const correr = (args) => new Promise((resolve) => {
      const hijo = spawn(process.execPath, ['scripts/migrar-imagenes-supabase.mjs', ...args], {
        cwd: RAIZ_BACKEND, env: { ...process.env, DATABASE_URL: TEST_DB, DB_SSL: 'false', MIGRACION_PATRON_ORIGEN: '/origen/' },
      });
      let stdout = ''; let stderr = '';
      hijo.stdout.on('data', (d) => { stdout += d; });
      hijo.stderr.on('data', (d) => { stderr += d; });
      hijo.on('close', (status) => resolve({ status, stdout, stderr }));
    });
    const leerFilasImagenes = async () => (await pool.query('SELECT id, image_url FROM product_images ORDER BY sort_order')).rows;
    const seco = await correr([]);
    assert.equal(seco.status, 0, seco.stdout + seco.stderr);
    assert.match(seco.stdout, /Listas para migrar: 3/);
    assert.match(seco.stdout, /Filas de product_images que se actualizarían: 1/);
    assert.equal(copyparty.recibidos.length, 0);
    const antes = (await pool.query('SELECT imagen_url, image_urls FROM products WHERE id=$1', [producto.id])).rows[0];
    assert.equal(antes.imagen_url, sucia);
    assert.equal((await leerFilasImagenes())[0].image_url, dobleBarra);

    const aplicado = await correr(['--aplicar']);
    assert.equal(aplicado.status, 0, aplicado.stdout + aplicado.stderr);
    assert.match(aplicado.stdout, /Migradas: 3/);
    assert.equal(copyparty.recibidos.length, 3);
    const despues = (await pool.query('SELECT imagen_url, image_urls FROM products WHERE id=$1', [producto.id])).rows[0];
    assert.match(despues.imagen_url, new RegExp(`^${copyparty.base}/imagens/T-7_\\d{14}_1\\.jpg$`));
    assert.equal(despues.image_urls[0], despues.imagen_url);
    assert.match(despues.image_urls[1], /\/imagens\/T-7_\d{14}_2\.png$/);
    assert.equal(despues.image_urls[2], 'https://res.cloudinary.com/x/ajena.jpg');
    const otro = (await pool.query('SELECT imagen_url, image_urls FROM products WHERE id=$1', [conGaleriaNula.id])).rows[0];
    assert.match(otro.imagen_url, /\/imagens\/T-8_\d{14}_1\.png$/);
    assert.equal(otro.image_urls, null);

    // product_images: misma cantidad de filas; la de origen apunta a la URL nueva y la heredada sigue igual.
    const filas = await leerFilasImagenes();
    assert.equal(filas.length, 2);
    assert.deepEqual(filas.find((f) => f.id === filaOrigen.id).image_url, despues.image_urls[1]);
    assert.equal(filas.find((f) => f.id === filaHeredada.id).image_url, 'data:image/jpeg;base64,BBBB');

    const respaldo = aplicado.stdout.match(/Respaldo escrito en (.+\.csv)/)?.[1]?.trim();
    assert.ok(respaldo && fs.existsSync(respaldo), 'debe existir el CSV de respaldo');
    const contenido = fs.readFileSync(respaldo, 'utf8');
    assert.match(contenido, /"products","[^"]+","T-7"/);
    assert.match(contenido, /"product_images","[^"]+","T-7"/);
    fs.unlinkSync(respaldo);
  });
});
