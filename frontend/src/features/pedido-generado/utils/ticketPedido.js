import { formatoMoneda } from '../../../utils/formatoMoneda.js';

// Fecha y hora del pedido en La Paz. Una fecha inválida o ausente muestra la actual.
export function formatoFechaPedido(fecha) {
  const valor = new Date(fecha || Date.now());
  return new Intl.DateTimeFormat('es-BO', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'America/La_Paz',
  }).format(Number.isNaN(valor.getTime()) ? new Date() : valor);
}

// Los ítems llegan del estado de Confirmación (nombre, cantidad, tipoEntrega) o del
// backend (product_name, quantity, delivery_type).
export function tipoEntregaTicket(item) {
  return item.tipoEntrega || item.tipo_entrega || item.delivery_type;
}

// Texto que el cliente manda por WhatsApp a TERRA para pedir el comprobante.
export function crearMensajeComprobante({ pedido, cliente, items }) {
  const tieneEnvio = Boolean(pedido.direccion_entrega);
  const lineas = (items || []).map((item) => {
    const nombre = item.nombre || item.product_name || 'Producto';
    const cantidad = item.cantidad || item.quantity || 1;
    const color = item.color?.nombre || item.color;
    const modalidad = tieneEnvio
      ? (tipoEntregaTicket(item) === 'home_delivery' ? ' [Envío a domicilio]' : ' [Retiro en tienda]')
      : '';
    return `• ${cantidad} × ${nombre}${color ? ` (${color})` : ''}${modalidad}`;
  });
  const envio = pedido.direccion_entrega
    ? [
      `Envío: ${pedido.direccion_entrega}`,
      ...(pedido.referencia_entrega ? [`Referencia: ${pedido.referencia_entrega}`] : []),
    ]
    : [];

  return [
    'SOLICITUD DE COMPROBANTE — TERRA',
    `Pedido: ${pedido.codigo || pedido.id}`,
    `Cliente: ${cliente?.nombre || 'No registrado'}`,
    `WhatsApp del cliente: +591 ${cliente?.telefono || 'No registrado'}`,
    ...envio,
    '',
    'Productos:',
    ...(lineas.length ? lineas : ['• Consulta el detalle del pedido']),
    '',
    `Total: ${formatoMoneda(pedido.total)}`,
    'Por favor, envíen el comprobante a este cliente.',
  ].join('\n');
}
