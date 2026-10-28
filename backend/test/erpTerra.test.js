// Pruebas de la integración con el ERP de TERRA.
//  - Cliente HTTPS (token, reintento, errores tipados, cotización): corren siempre
//    contra un servidor HTTPS falso con el certificado de test/fixtures.
//  - Verificación y cobro (modelos + servicio): necesitan TEST_DATABASE_URL hacia un
//    Postgres LOCAL vacío. Sin esa variable se saltan. Nunca apuntar a producción.
import test, { before, after, beforeEach, describe } from 'node:test';
import assert from 'node:assert/strict';
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { prepararBaseDePrueba, vaciarTablas, SALTAR_SIN_BD } from './helpers/bdPrueba.js';

const FIXTURES = path.join(import.meta.dirname, 'fixtures');
const CERT = path.join(FIXTURES, 'erp-test.crt');
const KEY = path.join(FIXTURES, 'erp-test.key');

// ---- Servidor ERP falso ----
const erp = {
  productos: {},            // codigo -> producto
  credencialesInvalidas: false,
  bloqueado: false,
  tokenVencidoPendiente: false,
  consultasCaidas: false,
  cotizacion: 'ok',         // ok | 422 | 500 | timeout
  registro: { tokens: 0, consultas: [], cotizaciones: [] },
};

function reiniciarErp() {
  erp.productos = {};
  erp.credencialesInvalidas = false;
  erp.bloqueado = false;
  erp.tokenVencidoPendiente = false;
  erp.consultasCaidas = false;
  erp.cotizacion = 'ok';
  erp.registro = { tokens: 0, consultas: [], cotizaciones: [] };
}

function responder(res, status, cuerpo) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(cuerpo === undefined ? '' : JSON.stringify(cuerpo));
}

function leerCuerpo(req) {
  return new Promise((resolve) => {
    const trozos = [];
    req.on('data', (t) => trozos.push(t));
    req.on('end', () => { try { resolve(JSON.parse(Buffer.concat(trozos).toString('utf8') || 'null')); } catch { resolve(null); } });
  });
}

const servidor = https.createServer({ key: fs.readFileSync(KEY), cert: fs.readFileSync(CERT) }, async (req, res) => {
  const url = new URL(req.url, 'https://localhost');
  if (req.method === 'POST' && url.pathname === '/api/auth/token') {
    erp.registro.tokens += 1;
    if (erp.bloqueado) return responder(res, 429, { error: { codigo: 'demasiados_intentos', mensaje: 'Bloqueado' } });
    if (erp.credencialesInvalidas) return responder(res, 401, { error: { codigo: 'credenciales_invalidas', mensaje: 'Credenciales inválidas' } });
    return responder(res, 200, { token: `tok-${erp.registro.tokens}`, expiraEnSegundos: 28800 });
  }
  const auth = String(req.headers.authorization || '');
  if (!auth.startsWith('Bearer tok-')) return responder(res, 401, { error: { codigo: 'token_requerido', mensaje: 'Falta token' } });
  if (erp.tokenVencidoPendiente) {
    erp.tokenVencidoPendiente = false;
    return responder(res, 401, { error: { codigo: 'token_vencido', mensaje: 'Token vencido' } });
  }
  const m = url.pathname.match(/^\/api\/productos\/terra\/(.+)$/);
  if (req.method === 'GET' && m) {
    const codigoTerra = decodeURIComponent(m[1]);
    erp.registro.consultas.push(codigoTerra);
    if (erp.consultasCaidas) return responder(res, 500, { error: { codigo: 'error_interno', mensaje: 'Caído' } });
    const producto = Object.values(erp.productos).find((p) => p.codigoTerra === codigoTerra);
    return producto ? responder(res, 200, producto) : responder(res, 404, { error: { codigo: 'producto_no_encontrado', mensaje: 'No existe' } });
  }
  if (req.method === 'POST' && url.pathname === '/api/cotizaciones') {
    const body = await leerCuerpo(req);
    erp.registro.cotizaciones.push(body);
    if (erp.cotizacion === 'timeout') return setTimeout(() => responder(res, 201, { numero: 1, fecha: new Date().toISOString(), productos: [], total: 0 }), 1500);
    if (erp.cotizacion === '500') return responder(res, 500, { error: { codigo: 'error_interno', mensaje: 'Caído' } });
    if (erp.cotizacion === '422') return responder(res, 422, { error: { codigo: 'productos_invalidos', mensaje: 'Stock insuficiente', detalles: [{ codigo: body?.productos?.[0]?.codigo, mensaje: 'Sin stock en ALMACEN CENTRAL' }] } });
    const numero = 1000 + erp.registro.cotizaciones.length;
    const productos = (body?.productos || []).map((p) => ({ codigo: p.codigo, cantidad: p.cantidad, precioUnitario: Number(erp.productos[p.codigo]?.precioPublico || 0) }));
    return responder(res, 201, { numero, fecha: new Date().toISOString(), productos, total: productos.reduce((s, p) => s + p.cantidad * p.precioUnitario, 0) });
  }
  return responder(res, 404, { error: { codigo: 'ruta_no_encontrada', mensaje: 'Ruta no encontrada' } });
});

let erpTerra;
before(async () => {
  await new Promise((resolve) => servidor.listen(0, '127.0.0.1', resolve));
  const { port } = servidor.address();
  process.env.TERRA_ERP_HABILITADO = 'true';
  process.env.TERRA_ERP_URL = `https://localhost:${port}`;
  process.env.TERRA_ERP_API_USER = 'prueba';
  process.env.TERRA_ERP_API_PASSWORD = 'secreto';
  process.env.TERRA_ERP_CA_CERT_PATH = CERT;
  process.env.TERRA_ERP_TIMEOUT_MS = '400';
  process.env.TERRA_ERP_TIMEOUT_CONSULTA_MS = '2000';
  process.env.TERRA_ERP_CONCURRENCIA = '3';
  erpTerra = await import('../src/services/erpTerra.js');
});
after(() => new Promise((resolve) => servidor.close(resolve)));
beforeEach(() => { reiniciarErp(); erpTerra.invalidarTokenErp(); });

// El nombre del almacén viene con espacios sobrantes a propósito: el ERP real lo hace.
// `stockTotal` es mayor que el stock de CENTRAL para detectar si alguien lo usa por error.
const producto = (codigo, extra = {}) => ({
  codigo, codigoTerra: `T-${codigo}`, codigosBarras: [], nombre: `Producto ${codigo}`, medida: '2 plazas', color: 'Gris',
  codigoColor: 'G', grupo: 'COLCHON', marca: 'TERRA', precioPublico: 100,
  almacenes: [{ almacen: ' ALMACEN CENTRAL', stock: 10 }, { almacen: ' ALMACEN ALEMANA', stock: 50 }], stockTotal: 60, ...extra,
});

describe('cliente ERP', () => {
  test('el token se pide una sola vez y se reutiliza', async () => {
    erp.productos['2'] = producto('2');
    await erpTerra.consultarPorCodigoTerra('T-2');
    await erpTerra.consultarPorCodigoTerra('T-2');
    assert.equal(erp.registro.tokens, 1);
    assert.equal(erp.registro.consultas.length, 2);
  });

  test('token_vencido: renueva el token y reintenta una vez', async () => {
    erp.productos['2'] = producto('2');
    await erpTerra.consultarPorCodigoTerra('T-2');
    erp.tokenVencidoPendiente = true;
    const resultado = await erpTerra.consultarPorCodigoTerra('T-2');
    assert.equal(resultado.codigo, '2');
    assert.equal(erp.registro.tokens, 2);
  });

  test('credenciales_invalidas: no reintenta y devuelve tipo auth', async () => {
    erp.credencialesInvalidas = true;
    await assert.rejects(() => erpTerra.consultarPorCodigoTerra('T-2'), (error) => error instanceof erpTerra.ErrorErp && error.tipo === 'auth' && error.codigo === 'credenciales_invalidas');
    assert.equal(erp.registro.tokens, 1);
  });

  test('429 devuelve tipo bloqueado', async () => {
    erp.bloqueado = true;
    await assert.rejects(() => erpTerra.consultarPorCodigoTerra('T-2'), (error) => error.tipo === 'bloqueado');
  });

  test('producto inexistente devuelve null; el código Terra viaja codificado en la URL', async () => {
    erp.productos['7'] = producto('7', { codigoTerra: 'T 7/ñ' });
    assert.equal((await erpTerra.consultarPorCodigoTerra('T 7/ñ')).codigo, '7');
    assert.equal(await erpTerra.consultarPorCodigoTerra('T-nope'), null);
    assert.equal(await erpTerra.consultarPorCodigoTerra(''), null);
  });

  test('cotización 201 -> ok con número', async () => {
    erp.productos['2'] = producto('2');
    const r = await erpTerra.crearCotizacion([{ codigo: '2', cantidad: 3 }]);
    assert.equal(r.ok, true);
    assert.equal(r.numero, 1001);
    assert.deepEqual(erp.registro.cotizaciones[0], { productos: [{ codigo: '2', cantidad: 3 }] });
  });

  test('cotización 422 -> rechazado con detalles; 500 y timeout -> desconocido', async () => {
    erp.cotizacion = '422';
    const rechazo = await erpTerra.crearCotizacion([{ codigo: '2', cantidad: 1 }]);
    assert.equal(rechazo.ok, false);
    assert.equal(rechazo.tipo, 'rechazado');
    assert.equal(rechazo.detalles[0].codigo, '2');
    erp.cotizacion = '500';
    assert.equal((await erpTerra.crearCotizacion([{ codigo: '2', cantidad: 1 }])).tipo, 'desconocido');
    erp.cotizacion = 'timeout';
    const t = await erpTerra.crearCotizacion([{ codigo: '2', cantidad: 1 }]);
    assert.equal(t.tipo, 'desconocido');
    assert.equal(t.codigo, 'timeout');
  });

  test('ítems inválidos no llegan al ERP', async () => {
    const r = await erpTerra.crearCotizacion([{ codigo: '2', cantidad: 0 }]);
    assert.equal(r.tipo, 'config');
    assert.equal(erp.registro.cotizaciones.length, 0);
  });

  test('stockAlmacenVenta usa solo ALMACEN CENTRAL, tolera espacios y nunca el total', () => {
    const p = producto('1', { stockTotal: 12, almacenes: [{ almacen: ' almacen  central ', stock: 4 }, { almacen: 'NORTE', stock: 8 }] });
    assert.equal(erpTerra.stockAlmacenVenta(p), 4);
    assert.equal(erpTerra.stockAlmacenVenta(p, 'ALMACEN CENTRAL'), 4);
    assert.equal(erpTerra.stockAlmacenVenta(p, 'NORTE'), 8);
    assert.equal(erpTerra.stockAlmacenVenta(p, 'SUR'), 0);
    assert.equal(erpTerra.stockAlmacenVenta(producto('1', { almacenes: [], stockTotal: 99 })), 0);
    assert.equal(erpTerra.stockAlmacenVenta(null), 0);
  });
});

// ---- Verificación y cobro contra Postgres local ----
describe('verificación y cobro con ERP', { skip: SALTAR_SIN_BD }, () => {
  let pool; let pedidoModel; let productoModel; let erpModel; let verificacion;

  before(async () => {
    pool = await prepararBaseDePrueba();
    pedidoModel = await import('../src/models/pedidoModel.js');
    productoModel = await import('../src/models/productoModel.js');
    erpModel = await import('../src/models/erpModel.js');
    verificacion = await import('../src/services/verificacionErp.js');
  });
  after(async () => { await pool?.end(); });
  beforeEach(async () => { await vaciarTablas(pool); });

  async function crearProductoLocal({ nombre = 'Colchón', precio = 90, stock = 5, codigoTerra = 'T-2', enOferta = false, precioOferta = null } = {}) {
    await productoModel.asegurarEscalasMayoristasBD();
    const { rows } = await pool.query(
      `INSERT INTO products (name, slug, codigo_terra, internal_code, public_price, stock_quantity, en_oferta, precio_oferta)
       VALUES ($1, $2, $3, $3, $4, $5, $6, $7) RETURNING id`,
      [nombre, `${nombre.toLowerCase()}-${Date.now()}-${Math.random()}`, codigoTerra, precio, stock, enOferta, precioOferta]
    );
    return rows[0].id;
  }
  const leerProducto = async (id) => (await pool.query('SELECT public_price, stock_quantity, activo FROM products WHERE id=$1', [id])).rows[0];
  const leerSync = async (id) => (await pool.query('SELECT erp_internal_code, source_hash, last_synced_at, last_error FROM erp_product_sync_state WHERE product_id=$1', [id])).rows[0] || null;
  const leerStocks = async (id) => (await pool.query('SELECT warehouse_name, quantity FROM erp_warehouse_stocks WHERE product_id=$1 ORDER BY warehouse_name', [id])).rows;
  const leerPedido = async (id) => (await pool.query('SELECT status, erp_estado, erp_cotizacion_numero, total_minor FROM orders WHERE id=$1', [id])).rows[0];
  const intentos = (id) => erpModel.listarIntentosCotizacionBD(id);

  test('1. precio distinto en ERP: reescribe public_price y actualiza el ítem', async () => {
    const id = await crearProductoLocal({ precio: 90 });
    erp.productos['2'] = producto('2', { precioPublico: 120 });
    const pedido = await pedidoModel.crearPedidoBD(null, [{ productoId: id, cantidad: 2 }], {});
    const r = await verificacion.verificarPedidoConErp(pedido.id);
    assert.equal(r.hayCambios, true);
    assert.deepEqual(r.cambios.map((c) => c.tipo), ['precio_actualizado']);
    assert.equal(Number((await leerProducto(id)).public_price), 120);
    assert.equal(Number(r.pedido.items[0].precioUnitario), 120);
    assert.equal(Number(r.pedido.total), 240);
    const sync = await leerSync(id);
    assert.equal(sync.erp_internal_code, '2');
    assert.equal(sync.last_error, null);
    assert.ok(sync.last_synced_at);
  });

  test('2. oferta local: se cobra precio_oferta pero public_price igual se reescribe', async () => {
    const id = await crearProductoLocal({ precio: 90, enOferta: true, precioOferta: 70 });
    erp.productos['2'] = producto('2', { precioPublico: 120 });
    const pedido = await pedidoModel.crearPedidoBD(null, [{ productoId: id, cantidad: 1 }], {});
    const r = await verificacion.verificarPedidoConErp(pedido.id);
    assert.equal(r.hayCambios, false);
    assert.equal(Number(r.pedido.items[0].precioUnitario), 70);
    assert.equal(Number((await leerProducto(id)).public_price), 120);
  });

  test('3. stock ERP menor: reduce la cantidad, reescribe stock_quantity y guarda los almacenes', async () => {
    const id = await crearProductoLocal({ precio: 100, stock: 5 });
    erp.productos['2'] = producto('2', { precioPublico: 100, almacenes: [{ almacen: ' ALMACEN CENTRAL', stock: 3 }, { almacen: 'ALMACEN ALEMANA ', stock: 7 }], stockTotal: 10 });
    const pedido = await pedidoModel.crearPedidoBD(null, [{ productoId: id, cantidad: 5 }], {});
    const r = await verificacion.verificarPedidoConErp(pedido.id);
    assert.deepEqual(r.cambios.map((c) => [c.tipo, c.antes, c.despues]), [['cantidad_reducida', 5, 3]]);
    assert.equal(Number(r.pedido.items[0].cantidad), 3);
    assert.equal(Number((await leerProducto(id)).stock_quantity), 3);
    assert.deepEqual(await leerStocks(id), [{ warehouse_name: 'ALMACEN ALEMANA', quantity: 7 }, { warehouse_name: 'ALMACEN CENTRAL', quantity: 3 }]);
  });

  test('4. 404 en ERP: quita el ítem, desactiva el producto y anota el error', async () => {
    const id = await crearProductoLocal({ precio: 100 });
    const pedido = await pedidoModel.crearPedidoBD(null, [{ productoId: id, cantidad: 1 }], {});
    const r = await verificacion.verificarPedidoConErp(pedido.id);
    assert.equal(r.hayCambios, true);
    assert.equal(r.cambios[0].tipo, 'sin_stock');
    assert.equal(r.pedido.items.length, 0);
    const p = await leerProducto(id);
    assert.equal(p.activo, false);
    assert.equal(Number(p.stock_quantity), 0);
    // Sin código interno no hay fila en erp_product_sync_state (erp_internal_code es NOT NULL).
    assert.equal(await leerSync(id), null);
    assert.deepEqual(await leerStocks(id), []);
  });

  test('5. ERP caído: 503 y nada se modifica', async () => {
    const id = await crearProductoLocal({ precio: 90 });
    erp.productos['2'] = producto('2', { precioPublico: 120 });
    erp.consultasCaidas = true;
    const pedido = await pedidoModel.crearPedidoBD(null, [{ productoId: id, cantidad: 1 }], {});
    await assert.rejects(() => verificacion.verificarPedidoConErp(pedido.id), (e) => e.statusCode === 503);
    assert.equal(Number((await leerProducto(id)).public_price), 90);
    assert.equal(Number((await leerPedido(pedido.id)).total_minor), 9000);
    assert.equal(await leerSync(id), null);
  });

  test('6. cobro con cambios: 409 pedido_ajustado sin cotización; el segundo cobro cierra', async () => {
    const id = await crearProductoLocal({ precio: 90 });
    erp.productos['2'] = producto('2', { precioPublico: 120 });
    const pedido = await pedidoModel.crearPedidoBD(null, [{ productoId: id, cantidad: 1 }], {});
    await assert.rejects(() => verificacion.confirmarPagoConErp(pedido.id, { metodoPago: 'efectivo' }), (e) => e.statusCode === 409 && e.extra.codigo === 'pedido_ajustado' && e.extra.cambios.length === 1);
    assert.equal(erp.registro.cotizaciones.length, 0);
    assert.equal((await intentos(pedido.id)).length, 0);
    assert.equal((await leerPedido(pedido.id)).erp_estado, null);
    const { pedido: cobrado } = await verificacion.confirmarPagoConErp(pedido.id, { metodoPago: 'efectivo' });
    assert.equal(cobrado.estado, 'completed');
    assert.equal(erp.registro.cotizaciones.length, 1);
    const filas = await intentos(pedido.id);
    assert.equal(filas.length, 1);
    assert.equal(filas[0].status, 'ok');
    assert.equal(filas[0].idempotency_key, `${pedido.id}:1`);
  });

  test('7. cobro OK: completed, número guardado, intento ok y stock descontado una vez', async () => {
    const id = await crearProductoLocal({ precio: 100, stock: 10 });
    erp.productos['2'] = producto('2', { precioPublico: 100 });
    const pedido = await pedidoModel.crearPedidoBD(null, [{ productoId: id, cantidad: 3 }], {});
    const { pedido: cobrado, cotizacion } = await verificacion.confirmarPagoConErp(pedido.id, { metodoPago: 'tarjeta' });
    assert.equal(cobrado.estado, 'completed');
    assert.equal(cobrado.erp_estado, 'ok');
    assert.equal(Number(cobrado.erp_cotizacion_numero), 1001);
    assert.equal(cotizacion.numero, 1001);
    assert.equal(Number((await leerProducto(id)).stock_quantity), 7);
    assert.deepEqual(erp.registro.cotizaciones, [{ productos: [{ codigo: '2', cantidad: 3 }] }]);
    const [intento] = await intentos(pedido.id);
    assert.equal(intento.status, 'ok');
    assert.equal(Number(intento.erp_number), 1001);
    assert.deepEqual(intento.request_products, [{ codigo: '2', cantidad: 3 }]);
    assert.equal(intento.response.numero, 1001);
    assert.ok(intento.completed_at);
    await assert.rejects(() => verificacion.confirmarPagoConErp(pedido.id, { metodoPago: 'tarjeta' }), (e) => e.statusCode === 409);
    assert.equal(Number((await leerProducto(id)).stock_quantity), 7);
  });

  test('8. 422 en cotización: intento rechazado, pedido editable y stock intacto', async () => {
    const id = await crearProductoLocal({ precio: 100, stock: 10 });
    erp.productos['2'] = producto('2', { precioPublico: 100 });
    erp.cotizacion = '422';
    const pedido = await pedidoModel.crearPedidoBD(null, [{ productoId: id, cantidad: 1 }], {});
    await assert.rejects(() => verificacion.confirmarPagoConErp(pedido.id, { metodoPago: 'efectivo' }), (e) => e.statusCode === 409 && e.extra.codigo === 'cotizacion_rechazada' && e.extra.detalles[0].productoId === id);
    const fila = await leerPedido(pedido.id);
    assert.equal(fila.status, 'pending');
    assert.equal(fila.erp_estado, 'rechazado');
    assert.equal(Number((await leerProducto(id)).stock_quantity), 10);
    const [intento] = await intentos(pedido.id);
    assert.equal(intento.status, 'rechazado');
    assert.match(intento.error_message, /Stock insuficiente/);
    const editado = await pedidoModel.actualizarItemsPedidoBD(pedido.id, [{ productoId: id, cantidad: 2 }]);
    assert.equal(Number(editado.items[0].cantidad), 2);
  });

  test('9. timeout en cotización: queda en verificar, sin segundo POST; la conciliación manual cierra el mismo intento', async () => {
    const id = await crearProductoLocal({ precio: 100, stock: 10 });
    erp.productos['2'] = producto('2', { precioPublico: 100 });
    erp.cotizacion = 'timeout';
    const pedido = await pedidoModel.crearPedidoBD(null, [{ productoId: id, cantidad: 1 }], {});
    await assert.rejects(() => verificacion.confirmarPagoConErp(pedido.id, { metodoPago: 'efectivo' }), (e) => e.statusCode === 502 && e.extra.codigo === 'erp_resultado_desconocido');
    assert.equal((await leerPedido(pedido.id)).erp_estado, 'verificar');
    assert.equal((await intentos(pedido.id))[0].status, 'verificar');
    await assert.rejects(() => verificacion.confirmarPagoConErp(pedido.id, { metodoPago: 'efectivo' }), (e) => e.extra.codigo === 'pedido_en_proceso');
    await assert.rejects(() => pedidoModel.actualizarItemsPedidoBD(pedido.id, [{ productoId: id, cantidad: 2 }]), (e) => e.statusCode === 409);
    assert.equal(erp.registro.cotizaciones.length, 1);
    const cerrado = await verificacion.confirmarCotizacionManual(pedido.id, { numero: 555, metodoPago: 'efectivo', registradoPor: 'admin@prueba' });
    assert.equal(cerrado.estado, 'completed');
    assert.equal(Number(cerrado.erp_cotizacion_numero), 555);
    assert.equal(Number((await leerProducto(id)).stock_quantity), 9);
    const filas = await intentos(pedido.id);
    assert.equal(filas.length, 1);
    assert.equal(filas[0].status, 'ok');
    assert.equal(Number(filas[0].erp_number), 555);
    assert.equal(filas[0].response.manual, true);
  });

  test('10. dos cobros en paralelo: una sola cotización y un solo intento', async () => {
    const id = await crearProductoLocal({ precio: 100, stock: 10 });
    erp.productos['2'] = producto('2', { precioPublico: 100 });
    const pedido = await pedidoModel.crearPedidoBD(null, [{ productoId: id, cantidad: 1 }], {});
    const resultados = await Promise.allSettled([
      verificacion.confirmarPagoConErp(pedido.id, { metodoPago: 'efectivo' }),
      verificacion.confirmarPagoConErp(pedido.id, { metodoPago: 'efectivo' }),
    ]);
    assert.equal(resultados.filter((r) => r.status === 'fulfilled').length, 1);
    assert.equal(resultados.filter((r) => r.status === 'rejected' && r.reason.extra?.codigo === 'pedido_en_proceso').length, 1);
    assert.equal(erp.registro.cotizaciones.length, 1);
    assert.equal((await intentos(pedido.id)).length, 1);
    assert.equal(Number((await leerProducto(id)).stock_quantity), 9);
  });

  test('12. la verificación guarda erp_internal_code desde /terra/{codigoTerra} y la cotización lo usa', async () => {
    const id = await crearProductoLocal({ precio: 100, codigoTerra: 'T-2' });
    erp.productos['2'] = producto('2', { precioPublico: 100 });
    const pedido = await pedidoModel.crearPedidoBD(null, [{ productoId: id, cantidad: 1 }], {});
    const r = await verificacion.verificarPedidoConErp(pedido.id);
    assert.equal(r.hayCambios, false);
    assert.deepEqual(erp.registro.consultas, ['T-2']);
    assert.equal((await leerSync(id)).erp_internal_code, '2');
    assert.equal(r.pedido.items[0].erp_codigo, '2');
    await verificacion.confirmarPagoConErp(pedido.id, { metodoPago: 'efectivo' });
    assert.deepEqual(erp.registro.cotizaciones, [{ productos: [{ codigo: '2', cantidad: 1 }] }]);
    // Un pedido nuevo del mismo producto ya nace con el código interno en el ítem.
    const otro = await pedidoModel.crearPedidoBD(null, [{ productoId: id, cantidad: 1 }], {});
    assert.equal(otro.items[0].erpCodigo, '2');
  });

  test('13. solo cuenta ALMACEN CENTRAL: CENTRAL=2 y ALEMANA=10 reduce a 2; sin CENTRAL elimina', async () => {
    const id = await crearProductoLocal({ precio: 100, stock: 20 });
    erp.productos['2'] = producto('2', { precioPublico: 100, stockTotal: 12, almacenes: [{ almacen: ' ALMACEN CENTRAL ', stock: 2 }, { almacen: 'ALMACEN ALEMANA', stock: 10 }] });
    const pedido = await pedidoModel.crearPedidoBD(null, [{ productoId: id, cantidad: 5 }], {});
    const r = await verificacion.verificarPedidoConErp(pedido.id);
    assert.deepEqual(r.cambios.map((c) => [c.tipo, c.antes, c.despues]), [['cantidad_reducida', 5, 2]]);
    assert.equal(Number((await leerProducto(id)).stock_quantity), 2);

    const id2 = await crearProductoLocal({ nombre: 'Almohada', precio: 50, stock: 20, codigoTerra: 'T-3' });
    erp.productos['3'] = producto('3', { precioPublico: 50, stockTotal: 10, almacenes: [{ almacen: 'ALMACEN ALEMANA', stock: 10 }] });
    const pedido2 = await pedidoModel.crearPedidoBD(null, [{ productoId: id2, cantidad: 1 }], {});
    const r2 = await verificacion.verificarPedidoConErp(pedido2.id);
    assert.equal(r2.cambios[0].tipo, 'sin_stock');
    assert.equal(r2.pedido.items.length, 0);
    assert.equal(Number((await leerProducto(id2)).stock_quantity), 0);
    assert.deepEqual(await leerStocks(id2), [{ warehouse_name: 'ALMACEN ALEMANA', quantity: 10 }]);
  });

  test('14. producto sin codigo_terra: cobro bloqueado y cero llamadas al ERP', async () => {
    const id = await crearProductoLocal({ precio: 100, codigoTerra: null });
    const pedido = await pedidoModel.crearPedidoBD(null, [{ productoId: id, cantidad: 1 }], {});
    const r = await verificacion.verificarPedidoConErp(pedido.id);
    assert.equal(r.bloqueado, true);
    assert.equal(r.cambios[0].tipo, 'sin_codigo');
    assert.equal(r.pedido.items.length, 1);
    await assert.rejects(() => verificacion.confirmarPagoConErp(pedido.id, { metodoPago: 'efectivo' }), (e) => e.statusCode === 409 && e.extra.codigo === 'pedido_bloqueado');
    assert.equal(erp.registro.consultas.length, 0);
    assert.equal(erp.registro.cotizaciones.length, 0);
    assert.equal((await intentos(pedido.id)).length, 0);
    assert.equal((await leerPedido(pedido.id)).erp_estado, null);
  });

  test('15. editar y verificar varias veces no cotiza; solo el cobro final hace un POST', async () => {
    const id = await crearProductoLocal({ precio: 100, stock: 10 });
    erp.productos['2'] = producto('2', { precioPublico: 100 });
    const pedido = await pedidoModel.crearPedidoBD(null, [{ productoId: id, cantidad: 1 }], {});
    await verificacion.verificarPedidoConErp(pedido.id);
    await pedidoModel.actualizarItemsPedidoBD(pedido.id, [{ productoId: id, cantidad: 3 }]);
    await verificacion.verificarPedidoConErp(pedido.id);
    await pedidoModel.actualizarItemsPedidoBD(pedido.id, [{ productoId: id, cantidad: 2 }]);
    const r = await verificacion.verificarPedidoConErp(pedido.id);
    assert.equal(Number(r.pedido.items[0].cantidad), 2);
    assert.equal(erp.registro.cotizaciones.length, 0);
    assert.equal((await intentos(pedido.id)).length, 0);
    assert.equal(erp.registro.consultas.length, 3);
    await verificacion.confirmarPagoConErp(pedido.id, { metodoPago: 'efectivo' });
    assert.deepEqual(erp.registro.cotizaciones, [{ productos: [{ codigo: '2', cantidad: 2 }] }]);
    assert.equal(Number((await leerProducto(id)).stock_quantity), 8);
  });

  test('liberar un pedido en verificar cierra el intento como rechazado y permite cobrar de nuevo', async () => {
    const id = await crearProductoLocal({ precio: 100, stock: 10 });
    erp.productos['2'] = producto('2', { precioPublico: 100 });
    erp.cotizacion = '500';
    const pedido = await pedidoModel.crearPedidoBD(null, [{ productoId: id, cantidad: 1 }], {});
    await assert.rejects(() => verificacion.confirmarPagoConErp(pedido.id, { metodoPago: 'efectivo' }));
    await verificacion.liberarPedidoVerificar(pedido.id, { registradoPor: 'admin@prueba' });
    assert.equal((await leerPedido(pedido.id)).erp_estado, 'rechazado');
    assert.equal((await intentos(pedido.id))[0].status, 'rechazado');
    erp.cotizacion = 'ok';
    const { pedido: cobrado } = await verificacion.confirmarPagoConErp(pedido.id, { metodoPago: 'efectivo' });
    assert.equal(cobrado.estado, 'completed');
    const filas = await intentos(pedido.id);
    assert.deepEqual(filas.map((f) => [f.idempotency_key, f.status]), [[`${pedido.id}:1`, 'rechazado'], [`${pedido.id}:2`, 'ok']]);
  });
});
