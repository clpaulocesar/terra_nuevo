import test from 'node:test';
import assert from 'node:assert/strict';
import { idLinea, nombreEnUnaLinea } from '../nombreLinea.js';

test('nombreEnUnaLinea une saltos de línea, tabulaciones y espacios repetidos', () => {
  assert.equal(nombreEnUnaLinea('  Colchón\nTerra\r\n\tKing   200 '), 'Colchón Terra King 200');
});

test('nombreEnUnaLinea devuelve texto vacío sin nombre', () => {
  assert.equal(nombreEnUnaLinea(null), '');
  assert.equal(nombreEnUnaLinea(undefined), '');
});

test('idLinea prefiere lineaId y si falta usa el id del producto', () => {
  assert.equal(idLinea({ id: 7, lineaId: '7::rojo' }), '7::rojo');
  assert.equal(idLinea({ id: 7 }), 7);
});
