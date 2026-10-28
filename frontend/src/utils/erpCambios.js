import { formatoMoneda } from './formatoMoneda.js';

// Texto para la caja de cada ajuste que hizo la verificación contra el ERP de TERRA.
// `cambio` = { nombre, tipo: 'sin_stock' | 'cantidad_reducida' | 'precio_actualizado', antes, despues }.
export function describirCambioErp(cambio = {}) {
  const nombre = String(cambio.nombre || 'Producto');
  if (cambio.tipo === 'sin_stock') return `${nombre}: sin stock en TERRA, se quitó del pedido.`;
  if (cambio.tipo === 'cantidad_reducida') return `${nombre}: cantidad reducida de ${cambio.antes} a ${cambio.despues} por stock disponible.`;
  if (cambio.tipo === 'precio_actualizado') return `${nombre}: precio actualizado de ${formatoMoneda(cambio.antes)} a ${formatoMoneda(cambio.despues)}.`;
  if (cambio.tipo === 'sin_codigo') return `${nombre}: no tiene código TERRA; completalo en Productos para poder cobrar.`;
  return `${nombre}: ${String(cambio.tipo || 'ajustado')}.`;
}

// Etiqueta corta del estado ERP de un pedido para listados y badges.
export function etiquetaEstadoErp(pedido = {}) {
  const estado = String(pedido.erp_estado || '');
  if (estado === 'ok') return pedido.erp_cotizacion_numero ? `ERP ✓ Nº ${pedido.erp_cotizacion_numero}` : 'ERP ✓';
  if (estado === 'verificar') return 'Verificar ERP';
  if (estado === 'rechazado') return 'Rechazado por ERP';
  if (estado === 'enviando') return 'Cobrando en ERP…';
  return '';
}
