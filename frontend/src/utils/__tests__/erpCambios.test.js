import test from 'node:test';
import assert from 'node:assert/strict';
import { describirCambioErp, etiquetaEstadoErp } from '../erpCambios.js';

test('describe los tres tipos de ajuste del ERP', () => {
  assert.match(describirCambioErp({ nombre: 'Colchón', tipo: 'sin_stock' }), /sin stock/i);
  assert.match(describirCambioErp({ nombre: 'Colchón', tipo: 'cantidad_reducida', antes: 3, despues: 1 }), /de 3 a 1/);
  assert.match(describirCambioErp({ nombre: 'Colchón', tipo: 'precio_actualizado', antes: 100, despues: 90 }), /precio actualizado/i);
  assert.match(describirCambioErp({ nombre: 'Colchón', tipo: 'sin_codigo' }), /código TERRA/i);
});

test('un tipo desconocido no rompe el texto', () => {
  assert.equal(describirCambioErp({ nombre: 'X', tipo: 'otro' }), 'X: otro.');
  assert.equal(describirCambioErp(), 'Producto: ajustado.');
});

test('etiqueta del estado ERP', () => {
  assert.equal(etiquetaEstadoErp({ erp_estado: 'ok', erp_cotizacion_numero: 12 }), 'ERP ✓ Nº 12');
  assert.equal(etiquetaEstadoErp({ erp_estado: 'verificar' }), 'Verificar ERP');
  assert.equal(etiquetaEstadoErp({ erp_estado: null }), '');
});
