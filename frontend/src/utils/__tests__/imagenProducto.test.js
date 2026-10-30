import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { IMAGEN_PRODUCTO_FALLBACK, fuenteImagenProducto } from '../imagenProducto.js';

describe('fuenteImagenProducto', () => {
  it('usa la foto sin espacios alrededor', () => {
    assert.deepEqual(fuenteImagenProducto('  https://x/a.jpg \n', null), {
      url: 'https://x/a.jpg', src: 'https://x/a.jpg', reemplazo: false,
    });
  });

  it('sin URL muestra el logo directamente, sin intentar cargar nada', () => {
    for (const src of [null, undefined, '', '   ', 42]) {
      const fuente = fuenteImagenProducto(src, null);
      assert.equal(fuente.src, IMAGEN_PRODUCTO_FALLBACK);
      assert.equal(fuente.reemplazo, true);
    }
  });

  it('si esa URL ya falló muestra el logo', () => {
    const fuente = fuenteImagenProducto('https://x/rota.jpg', 'https://x/rota.jpg');
    assert.equal(fuente.src, IMAGEN_PRODUCTO_FALLBACK);
    assert.equal(fuente.reemplazo, true);
  });

  it('si cambia la foto después de un fallo, vuelve a intentar con la nueva', () => {
    const fuente = fuenteImagenProducto('https://x/otra.jpg', 'https://x/rota.jpg');
    assert.equal(fuente.src, 'https://x/otra.jpg');
    assert.equal(fuente.reemplazo, false);
  });
});
