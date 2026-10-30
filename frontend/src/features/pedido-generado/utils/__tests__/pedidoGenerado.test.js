import test from 'node:test';
import assert from 'node:assert/strict';
import { crearMensajeComprobante, formatoFechaPedido, tipoEntregaTicket } from '../ticketPedido.js';
import { formatoMoneda } from '../../../../utils/formatoMoneda.js';

test('formatoFechaPedido muestra la fecha en hora de La Paz', () => {
  assert.match(formatoFechaPedido('2026-10-29T14:30:00Z'), /29 de octubre de 2026.*10:30/);
});

test('formatoFechaPedido no falla con una fecha inválida', () => {
  assert.match(formatoFechaPedido('no es fecha'), /\d{4}/);
});

test('tipoEntregaTicket acepta los nombres del frontend y del backend', () => {
  assert.equal(tipoEntregaTicket({ tipoEntrega: 'home_delivery' }), 'home_delivery');
  assert.equal(tipoEntregaTicket({ tipo_entrega: 'store_pickup' }), 'store_pickup');
  assert.equal(tipoEntregaTicket({ delivery_type: 'home_delivery' }), 'home_delivery');
});

test('crearMensajeComprobante lista productos con color y modalidad cuando hay envío', () => {
  const texto = crearMensajeComprobante({
    pedido: {
      id: 5,
      codigo: 'TRR-5',
      total: 150,
      direccion_entrega: 'Av. Busch 12',
      referencia_entrega: 'Portón café',
    },
    cliente: { nombre: 'Ana', telefono: '77012345' },
    items: [
      { nombre: 'Almohada', cantidad: 2, color: { nombre: 'Gris' }, tipoEntrega: 'home_delivery' },
      { product_name: 'Lámpara', quantity: 1, delivery_type: 'store_pickup' },
    ],
  });
  assert.ok(texto.includes('Pedido: TRR-5'));
  assert.ok(texto.includes('WhatsApp del cliente: +591 77012345'));
  assert.ok(texto.includes('Envío: Av. Busch 12\nReferencia: Portón café'));
  assert.ok(texto.includes('• 2 × Almohada (Gris) [Envío a domicilio]'));
  assert.ok(texto.includes('• 1 × Lámpara [Retiro en tienda]'));
  assert.ok(texto.includes(`Total: ${formatoMoneda(150)}`));
});

test('crearMensajeComprobante sin envío ni productos usa los textos por defecto', () => {
  const texto = crearMensajeComprobante({ pedido: { id: 9, total: 0 }, cliente: null, items: [] });
  assert.ok(texto.includes('Pedido: 9'));
  assert.ok(texto.includes('Cliente: No registrado'));
  assert.ok(texto.includes('• Consulta el detalle del pedido'));
  assert.ok(!texto.includes('Envío:'));
});
