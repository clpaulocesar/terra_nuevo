import test from 'node:test';
import assert from 'node:assert/strict';
import { paginasVisibles, usarPaginadorCompacto } from '../paginacion.js';

test('versión completa: página intermedia con saltos a ambos lados', () => {
  assert.deepEqual(paginasVisibles(5, 826), [1, 'gap-4', 4, 5, 6, 'gap-826', 826]);
});

test('versión completa: cerca de los extremos muestra las cuatro primeras o últimas', () => {
  assert.deepEqual(paginasVisibles(1, 826), [1, 2, 3, 4, 'gap-826', 826]);
  assert.deepEqual(paginasVisibles(826, 826), [1, 'gap-823', 823, 824, 825, 826]);
});

test('versión compacta: solo primera, actual y última', () => {
  assert.deepEqual(paginasVisibles(5, 826, { compacta: true }), [1, 'gap-5', 5, 'gap-826', 826]);
  assert.deepEqual(paginasVisibles(1, 826, { compacta: true }), [1, 'gap-826', 826]);
  assert.deepEqual(paginasVisibles(2, 826, { compacta: true }), [1, 2, 'gap-826', 826]);
  assert.deepEqual(paginasVisibles(826, 826, { compacta: true }), [1, 'gap-826', 826]);
});

test('con pocas páginas se muestran todas', () => {
  assert.deepEqual(paginasVisibles(2, 7), [1, 2, 3, 4, 5, 6, 7]);
  assert.deepEqual(paginasVisibles(2, 3, { compacta: true }), [1, 2, 3]);
  assert.deepEqual(paginasVisibles(1, 0), []);
});

test('el ancho elige la versión: teléfono compacta, desde 640 px completa', () => {
  assert.equal(usarPaginadorCompacto(360), true);
  assert.equal(usarPaginadorCompacto(412), true);
  assert.equal(usarPaginadorCompacto(639), true);
  assert.equal(usarPaginadorCompacto(640), false);
  assert.equal(usarPaginadorCompacto(768), false);
});

test('con texto al 150 % la versión compacta llega a la tablet de 768 px', () => {
  assert.equal(usarPaginadorCompacto(768, 24), true);
  assert.equal(usarPaginadorCompacto(1024, 24), false);
  assert.equal(usarPaginadorCompacto(360, 0), true);
});
