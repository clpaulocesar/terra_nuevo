import test from 'node:test';
import assert from 'node:assert/strict';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cifrarDatoBaneco, descifrarDatoBaneco } from '../src/services/banecoCrypto.js';

const directorioBackend = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(directorioBackend, '.env.baneco.test'), quiet: true });

const camposVector = [
  process.env.BANECO_AES_TEST_KEY,
  process.env.BANECO_AES_TEST_PLAIN,
  process.env.BANECO_AES_TEST_CIPHER,
];
const cantidadCamposVector = camposVector.filter((valor) => valor !== undefined && valor !== '').length;
const vectorCompleto = cantidadCamposVector === camposVector.length;

test('el vector AES de Baneco debe configurarse completo o dejarse vacío', () => {
  assert.ok(
    cantidadCamposVector === 0 || vectorCompleto,
    'Configura BANECO_AES_TEST_KEY, BANECO_AES_TEST_PLAIN y BANECO_AES_TEST_CIPHER juntos.',
  );
});

test('el cifrado coincide con el vector oficial de pruebas de Baneco', {
  skip: vectorCompleto ? false : 'Falta un vector oficial AES de Baneco en backend/.env.baneco.test.',
}, () => {
  const cifrado = cifrarDatoBaneco(process.env.BANECO_AES_TEST_PLAIN, process.env.BANECO_AES_TEST_KEY);
  assert.equal(cifrado, process.env.BANECO_AES_TEST_CIPHER);
});

test('el descifrado recupera el texto del vector oficial de Baneco', {
  skip: vectorCompleto ? false : 'Falta un vector oficial AES de Baneco en backend/.env.baneco.test.',
}, () => {
  const descifrado = descifrarDatoBaneco(process.env.BANECO_AES_TEST_CIPHER, process.env.BANECO_AES_TEST_KEY);
  assert.equal(descifrado, process.env.BANECO_AES_TEST_PLAIN);
});
