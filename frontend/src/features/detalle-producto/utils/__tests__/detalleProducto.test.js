import test from 'node:test';
import assert from 'node:assert/strict';
import { coloresDeProducto, valorDeColor } from '../coloresProducto.js';
import { urlVideoEnBucle, videoIncrustado } from '../videoProducto.js';

test('valorDeColor acepta hex y nombres de la paleta, y descarta lo desconocido', () => {
  assert.equal(valorDeColor('#a6192e'), '#a6192e');
  assert.equal(valorDeColor('#FFF'), '#FFF');
  assert.equal(valorDeColor('grafito'), '#3a3f44');
  assert.equal(valorDeColor('Color inventado'), null);
  assert.equal(valorDeColor(''), null);
});

test('coloresDeProducto lee los cuatro formatos y no repite nombres', () => {
  const producto = {
    colores: [
      { nombre: 'Vino', valor: '#a6192e' },
      JSON.stringify({ nombre: 'Arena', valor: '#cbb894' }),
      'Grafito|#3a3f44',
      'vino|#000000',
    ],
    variantes: [{ color: 'Celeste' }, { color: 'Sin pintura' }],
  };
  assert.deepEqual(coloresDeProducto(producto), [
    { nombre: 'Vino', valor: '#a6192e' },
    { nombre: 'Arena', valor: '#cbb894' },
    { nombre: 'Grafito', valor: '#3a3f44' },
    { nombre: 'Celeste', valor: '#8fb8d8' },
  ]);
  assert.deepEqual(coloresDeProducto(null), []);
});

test('videoIncrustado reconoce las URL de YouTube', () => {
  assert.equal(videoIncrustado('https://www.youtube.com/watch?v=abc123XYZ'), 'https://www.youtube.com/embed/abc123XYZ');
  assert.equal(videoIncrustado('https://youtu.be/abc123XYZ'), 'https://www.youtube.com/embed/abc123XYZ');
  assert.equal(videoIncrustado('https://www.youtube.com/shorts/abc123XYZ'), 'https://www.youtube.com/embed/abc123XYZ');
  assert.equal(videoIncrustado('https://ejemplo.com/video.mp4'), null);
});

test('urlVideoEnBucle repite el video pasándolo como playlist', () => {
  assert.equal(
    urlVideoEnBucle('https://www.youtube.com/embed/abc123XYZ'),
    'https://www.youtube.com/embed/abc123XYZ?autoplay=1&mute=1&loop=1&playlist=abc123XYZ',
  );
  assert.equal(urlVideoEnBucle(null), null);
});
