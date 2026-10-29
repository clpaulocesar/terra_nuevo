import test from 'node:test';
import assert from 'node:assert/strict';
import { tipoEntregaItem } from '../tipoEntrega.js';

const item = { id: 10, lineaId: '10::rojo' };
const minorista = { quiereEnvio: true, esFlujoMayorista: false };

test('tipoEntregaItem: sin envío todo se retira en tienda', () => {
  const opciones = { quiereEnvio: false, esFlujoMayorista: true, itemsEnvio: ['10::rojo'] };
  assert.equal(tipoEntregaItem(item, opciones), 'store_pickup');
});

test('tipoEntregaItem: el mayorista con envío recibe todo en su dirección', () => {
  assert.equal(tipoEntregaItem(item, { quiereEnvio: true, esFlujoMayorista: true, itemsEnvio: [] }), 'home_delivery');
});

test('tipoEntregaItem: sin lista de productos marcados, todo va a domicilio', () => {
  assert.equal(tipoEntregaItem(item, minorista), 'home_delivery');
});

test('tipoEntregaItem reconoce la línea por lineaId, por id de producto o por prefijo', () => {
  assert.equal(tipoEntregaItem(item, { ...minorista, itemsEnvio: ['10::rojo'] }), 'home_delivery');
  assert.equal(tipoEntregaItem(item, { ...minorista, itemsEnvio: [10] }), 'home_delivery');
  assert.equal(tipoEntregaItem({ lineaId: '10::azul' }, { ...minorista, itemsEnvio: ['10'] }), 'home_delivery');
});

test('tipoEntregaItem: un producto no marcado se retira en tienda', () => {
  assert.equal(tipoEntregaItem(item, { ...minorista, itemsEnvio: ['11::sin-color'] }), 'store_pickup');
});
