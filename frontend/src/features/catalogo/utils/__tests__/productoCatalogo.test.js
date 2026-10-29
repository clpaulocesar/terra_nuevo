import test from 'node:test';
import assert from 'node:assert/strict';
import { coloresDeProducto, separarOfertasDeBusqueda } from '../productoCatalogo.js';

test('colores: acepta objetos, JSON y "Nombre|#hex"', () => {
  const producto = {
    colores: [
      { nombre: 'Rojo', valor: '#a6192e' },
      '{"nombre":"Gris","valor":"#cccccc"}',
      'Azul|#00f',
    ],
  };
  assert.deepEqual(coloresDeProducto(producto), [
    { nombre: 'Rojo', valor: '#a6192e' },
    { nombre: 'Gris', valor: '#cccccc' },
    { nombre: 'Azul', valor: '#00f' },
  ]);
});

test('colores: descarta valores sin hex y repetidos', () => {
  const producto = { colores: ['Rojo|rojo', { nombre: 'Rojo', valor: '#f00' }, { nombre: 'rojo', valor: '#f11' }] };
  assert.deepEqual(coloresDeProducto(producto), [{ nombre: 'Rojo', valor: '#f00' }]);
  assert.deepEqual(coloresDeProducto({}), []);
});

test('búsqueda: separa el pedido de ofertas del término', () => {
  assert.deepEqual(separarOfertasDeBusqueda('oferta de toallas'), { termino: 'toallas', ofertas: true });
  assert.deepEqual(separarOfertasDeBusqueda('Promociones en almohadas'), { termino: 'almohadas', ofertas: true });
  assert.deepEqual(separarOfertasDeBusqueda('toallas en oferta'), { termino: 'toallas', ofertas: true });
  assert.deepEqual(separarOfertasDeBusqueda('  colchón  '), { termino: 'colchón', ofertas: false });
});
