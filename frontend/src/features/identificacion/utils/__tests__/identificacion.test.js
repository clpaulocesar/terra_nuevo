import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizarValorCampo } from '../camposIdentificacion.js';

test('normalizarValorCampo deja el nombre tal cual', () => {
  assert.equal(normalizarValorCampo('nombre', ' Carlos 2 '), ' Carlos 2 ');
});

test('normalizarValorCampo deja solo dígitos en el teléfono y corta a 8', () => {
  assert.equal(normalizarValorCampo('telefono', '770-123 45 99'), '77012345');
});

test('normalizarValorCampo quita el prefijo 591 pegado al teléfono', () => {
  assert.equal(normalizarValorCampo('telefono', '+591 77012345'), '77012345');
  assert.equal(normalizarValorCampo('telefono', '5917'), '5917');
});

test('normalizarValorCampo deja solo dígitos en el NIT y corta a 20', () => {
  assert.equal(normalizarValorCampo('nit', 'NIT 5123456'), '5123456');
  assert.equal(normalizarValorCampo('nit', '1'.repeat(25)).length, 20);
  assert.equal(normalizarValorCampo('nit', undefined), '');
});
