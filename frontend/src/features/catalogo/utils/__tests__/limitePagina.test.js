import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { contarColumnas, limitePorColumnas, paginaConProducto } from '../limitePagina.js';

describe('contarColumnas', () => {
  it('cuenta las pistas de un grid-template-columns resuelto', () => {
    assert.equal(contarColumnas('328px'), 1);
    assert.equal(contarColumnas('268px 268px 268px'), 3);
    assert.equal(contarColumnas('  218.4px  218.4px 218.4px 218.4px 218.4px '), 5);
  });

  it('sin grilla devuelve 0', () => {
    assert.equal(contarColumnas('none'), 0);
    assert.equal(contarColumnas(''), 0);
    assert.equal(contarColumnas(undefined), 0);
  });
});

describe('limitePorColumnas', () => {
  it('es múltiplo de las columnas y cercano a 12–20 tarjetas', () => {
    const esperados = { 1: 12, 2: 12, 3: 15, 4: 16, 5: 15, 6: 18, 7: 14, 8: 16, 9: 18, 10: 20 };
    for (const [columnas, limite] of Object.entries(esperados)) {
      assert.equal(limitePorColumnas(Number(columnas)), limite, `${columnas} columnas`);
      assert.equal(limite % Number(columnas), 0);
    }
  });

  it('nunca baja de 12 tarjetas', () => {
    assert.equal(limitePorColumnas(11), 22);
    assert.equal(limitePorColumnas(12), 12);
  });

  it('nunca pasa de 200 (tope del backend)', () => {
    assert.equal(limitePorColumnas(150), 150);
    assert.equal(limitePorColumnas(250), 200);
  });

  it('un valor inválido cuenta como una columna', () => {
    assert.equal(limitePorColumnas(0), 12);
    assert.equal(limitePorColumnas(Number.NaN), 12);
    assert.equal(limitePorColumnas(undefined), 12);
  });
});

describe('paginaConProducto', () => {
  it('ubica el producto en la página nueva al cambiar el límite', () => {
    // Página 3 de 12 (productos 24–35); el primero visible es el 5.º de la página → índice 28.
    assert.equal(paginaConProducto(2 * 12 + 4, 15), 2);
    assert.equal(paginaConProducto(28, 16), 2);
    assert.equal(paginaConProducto(28, 12), 3);
  });

  it('los bordes de página caen en la página correcta', () => {
    assert.equal(paginaConProducto(0, 15), 1);
    assert.equal(paginaConProducto(14, 15), 1);
    assert.equal(paginaConProducto(15, 15), 2);
    assert.equal(paginaConProducto(-3, 15), 1);
  });
});
