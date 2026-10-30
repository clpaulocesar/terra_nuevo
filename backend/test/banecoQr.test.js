import test, { after, describe } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { obtenerConfiguracionBaneco, validarConfiguracionBaneco } from '../src/config/baneco.js';
import pagoQrRoutes from '../src/routes/pagoQrRoutes.js';
import { errorHandler, rutaNoEncontrada } from '../src/middlewares/errorHandler.js';
import { cifrarDatoBaneco, descifrarDatoBaneco } from '../src/services/banecoCrypto.js';
import {
  autenticarBaneco,
  cancelarQrBaneco,
  conciliarQrBaneco,
  consultarQrBaneco,
  generarQrBaneco,
} from '../src/services/banecoApiClient.js';
import { ErrorBanecoNoImplementado } from '../src/services/banecoErrores.js';

describe('preparación de integración QR Baneco', () => {
  let servidor;
  let base;

  after(async () => {
    await new Promise((resolve) => servidor?.close(resolve));
  });

  test('usa por defecto el ambiente de pruebas y no contiene secretos', () => {
    const config = obtenerConfiguracionBaneco({});

    assert.equal(config.ambiente, 'sandbox');
    assert.equal(config.url, 'https://apimktdesa.baneco.com.bo/ApiGateway');
    assert.equal(validarConfiguracionBaneco(config).valida, false);
    assert.equal(config.usuario, '');
    assert.equal(config.clave, '');
    assert.equal(config.llaveAes, '');
    assert.equal(config.cuentaAbono, '');
    assert.deepEqual(config.rutas, {
      autenticar: '/api/authentication/authenticate',
      generarQr: '/api/qrsimple/generateQR',
      consultarQr: '/api/qrsimple/v2/statusQR',
      cancelarQr: '/api/qrsimple/cancelQR',
      conciliarQr: '/api/qrsimple/v2/paidQR',
    });
  });

  test('deja puntos explícitos para implementar cifrado AES y llamadas Baneco', async () => {
    assert.throws(() => cifrarDatoBaneco('dato-prueba', 'llave-prueba'), ErrorBanecoNoImplementado);
    assert.throws(() => descifrarDatoBaneco('dato-cifrado-prueba', 'llave-prueba'), ErrorBanecoNoImplementado);

    for (const operacion of [
      () => autenticarBaneco({ config: {} }),
      () => generarQrBaneco({ config: {}, token: 'token', datos: {} }),
      () => consultarQrBaneco({ config: {}, token: 'token', qrId: 'QR-1' }),
      () => cancelarQrBaneco({ config: {}, token: 'token', qrId: 'QR-1' }),
      () => conciliarQrBaneco({ config: {}, token: 'token', fecha: '2026-10-30' }),
    ]) {
      await assert.rejects(operacion(), ErrorBanecoNoImplementado);
    }
  });

  test('valida configuración incompleta sin incluir secretos en errores', () => {
    const config = obtenerConfiguracionBaneco({
      BANECO_API_USER: 'usuario-prueba',
      BANECO_API_PASSWORD: 'clave-no-debe-aparecer',
      BANECO_AES_KEY: 'llave-no-debe-aparecer',
      BANECO_ACCOUNT_CREDIT: 'cuenta-prueba',
    });

    const resultado = validarConfiguracionBaneco(config);

    assert.equal(resultado.valida, true);
    assert.equal(resultado.errores.length, 0);
    assert.equal(JSON.stringify(resultado).includes('clave-no-debe-aparecer'), false);
    assert.equal(JSON.stringify(resultado).includes('llave-no-debe-aparecer'), false);
  });

  test('rechaza URL o ambiente fuera del sandbox documentado', () => {
    const config = obtenerConfiguracionBaneco({
      BANECO_ENVIRONMENT: 'production',
      BANECO_API_URL: 'https://baneco.example.com',
    });

    const resultado = validarConfiguracionBaneco(config);

    assert.equal(resultado.valida, false);
    assert.ok(resultado.errores.some((error) => error.includes('BANECO_ENVIRONMENT')));
    assert.ok(resultado.errores.some((error) => error.includes('BANECO_API_URL')));
  });

  test('valida los datos bancarios y límites de configuración', () => {
    const config = obtenerConfiguracionBaneco({
      BANECO_API_USER: 'usuario-prueba',
      BANECO_API_PASSWORD: 'clave-prueba',
      BANECO_AES_KEY: 'llave-prueba',
      BANECO_ACCOUNT_CREDIT: 'cuenta-prueba',
      BANECO_BRANCH_CODE: '123456',
      BANECO_TIMEOUT_MS: '500',
      BANECO_QR_VALIDITY_MINUTES: '0',
    });

    const resultado = validarConfiguracionBaneco(config);

    assert.equal(resultado.valida, false);
    assert.equal(resultado.errores.length, 3);
  });

  test('rechaza valores no numéricos en los límites en vez de reemplazarlos silenciosamente', () => {
    const config = obtenerConfiguracionBaneco({
      BANECO_TIMEOUT_MS: 'rápido',
      BANECO_QR_VALIDITY_MINUTES: 'pronto',
    });

    const resultado = validarConfiguracionBaneco(config);

    assert.equal(resultado.valida, false);
    assert.ok(resultado.errores.some((error) => error.includes('BANECO_TIMEOUT_MS')));
    assert.ok(resultado.errores.some((error) => error.includes('BANECO_QR_VALIDITY_MINUTES')));
  });

  test('rutas del QR validan entradas y nunca simulan éxito mientras falta la API', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/pagos', pagoQrRoutes);
    app.use(rutaNoEncontrada);
    app.use(errorHandler);
    await new Promise((resolve) => { servidor = app.listen(0, '127.0.0.1', resolve); });
    base = `http://127.0.0.1:${servidor.address().port}`;

    const invalido = await fetch(`${base}/api/pagos/qr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pedidoId: 'no-es-un-uuid' }),
    });
    assert.equal(invalido.status, 400);

    const generacion = await fetch(`${base}/api/pagos/qr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pedidoId: 'b6f3a5e8-59cc-4fb9-814a-c0fc13b26d66' }),
    });
    assert.equal(generacion.status, 501);
    assert.equal((await generacion.json()).codigo, 'baneco_no_implementado');

    const consulta = await fetch(`${base}/api/pagos/qr/QR-123`);
    assert.equal(consulta.status, 501);

    const consultaIdInvalido = await fetch(`${base}/api/pagos/qr/QR%3F123`);
    assert.equal(consultaIdInvalido.status, 400);

    const cancelacion = await fetch(`${base}/api/pagos/qr/QR-123`, { method: 'DELETE' });
    assert.equal(cancelacion.status, 501);
  });
});
