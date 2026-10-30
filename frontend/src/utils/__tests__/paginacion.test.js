import test from 'node:test';
import assert from 'node:assert/strict';
import { completarUltimaPagina, paginasVisibles, usarPaginadorCompacto } from '../paginacion.js';

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

const productosDe = (desde, hasta) => Array.from({ length: hasta - desde }, (_, i) => ({ id: desde + i }));

test('última página incompleta: se completa con el final de la anterior', () => {
  // 103 productos de a 15: la página 7 tiene 13 (90–102); faltan 2 de la página 6 (88 y 89).
  const completa = completarUltimaPagina(productosDe(75, 90), productosDe(90, 103), 15);
  assert.deepEqual(completa.map((p) => p.id), [88, 89, ...productosDe(90, 103).map((p) => p.id)]);
});

test('última página ya completa: no cambia', () => {
  const ultima = productosDe(90, 105);
  assert.equal(completarUltimaPagina(productosDe(75, 90), ultima, 15), ultima);
});

test('sin ids repetidos aunque la anterior traiga alguno de la última', () => {
  const completa = completarUltimaPagina([...productosDe(75, 89), { id: 90 }], productosDe(90, 103), 15);
  assert.equal(new Set(completa.map((p) => p.id)).size, completa.length);
  assert.equal(completa.length, 15);
});
