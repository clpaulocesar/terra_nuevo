import { formatoMoneda } from './formatoMoneda.js';

function escapar(valor) {
  return String(valor ?? '').replace(/[&<>'"]/g, (caracter) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' })[caracter]);
}

/** Abre un ticket compacto y nativo para imprimir desde caja. */
export function imprimirTicketPedido(pedido, ventana = null) {
  const destino = ventana || window.open('', '_blank', 'width=430,height=760');
  if (!destino) throw new Error('El navegador bloqueó la ventana de impresión. Permite las ventanas emergentes e intenta nuevamente.');

  const cliente = pedido.cliente || {};
  const fecha = new Intl.DateTimeFormat('es-BO', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/La_Paz' }).format(new Date(pedido.fecha || Date.now()));
  const detalle = (Array.isArray(pedido.items) ? pedido.items : []).map((item) => `
    <tr><td><b>${escapar(item.nombre || 'Producto')}</b><br><small>${Number(item.cantidad || 0)} × ${formatoMoneda(item.precioUnitario || item.precio || 0)}</small></td><td>${formatoMoneda(item.subtotal || Number(item.cantidad || 0) * Number(item.precioUnitario || item.precio || 0))}</td></tr>`).join('') || '<tr><td colspan="2">Sin artículos registrados</td></tr>';

  destino.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Ticket ${escapar(pedido.codigo || pedido.id)}</title><style>body{font:13px Arial,sans-serif;color:#202020;margin:0;padding:20px}main{max-width:340px;margin:auto}header{text-align:center;border-bottom:2px dashed #a6192e;padding-bottom:12px}header img{max-width:190px}h1{font-size:15px;margin:9px 0 0}.code{background:#fff1f3;border:1px dashed #a6192e;border-radius:7px;color:#a6192e;font:bold 17px monospace;letter-spacing:1px;margin:15px 0;padding:10px;text-align:center}.meta{color:#4d5552;line-height:1.6;margin:10px 0}table{border-collapse:collapse;width:100%;margin-top:15px}td{border-bottom:1px dashed #d6d6d6;padding:9px 0;vertical-align:bottom}td:last-child{text-align:right;font-weight:bold}small{color:#65706b}.total{display:flex;justify-content:space-between;font-size:18px;font-weight:bold;border-top:2px solid #202020;margin-top:14px;padding-top:12px}.total span:last-child{color:#a6192e}footer{color:#68716d;font-size:11px;margin-top:25px;text-align:center}@media print{body{padding:0}button{display:none}}</style></head><body><main><header><img src="${window.location.origin}/logo-terra.png" alt="TERRA Autoservicio"><h1>Ticket de pedido</h1></header><div class="code">${escapar(pedido.codigo || pedido.id)}</div><div class="meta"><b>Fecha:</b> ${escapar(fecha)}<br><b>Cliente:</b> ${escapar(cliente.nombre || pedido.cliente_nombre || pedido.cliente || 'Compra como invitado')}${cliente.telefono ? `<br><b>Teléfono:</b> ${escapar(cliente.telefono)}` : ''}${cliente.nit ? `<br><b>NIT:</b> ${escapar(cliente.nit)}` : ''}</div><table>${detalle}</table><div class="total"><span>Total</span><span>${formatoMoneda(pedido.total)}</span></div><footer>Gracias por comprar en TERRA Autoservicio.</footer></main><script>window.onload=()=>setTimeout(()=>window.print(),250)<\/script></body></html>`);
  destino.document.close();
}
