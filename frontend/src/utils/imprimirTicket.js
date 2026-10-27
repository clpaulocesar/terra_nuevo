import { formatoMoneda } from './formatoMoneda.js';

function escapar(valor) {
  return String(valor ?? '').replace(/[&<>'"]/g, (caracter) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#039;',
    '"': '&quot;',
  })[caracter]);
}

/** Abre un ticket compacto y nativo para imprimir desde caja. */
export function imprimirTicketPedido(pedido, ventana = null) {
  const destino = ventana || window.open('', '_blank', 'width=430,height=760');
  if (!destino) {
    throw new Error('El navegador bloqueó la ventana de impresión. Permite las ventanas emergentes e intenta nuevamente.');
  }

  const cliente = typeof pedido.cliente === 'object' && pedido.cliente !== null
    ? pedido.cliente
    : {};

  const nombreCliente = cliente.nombre || pedido.cliente_nombre || (typeof pedido.cliente === 'string' ? pedido.cliente : '') || 'Compra como invitado';
  const telefonoCliente = cliente.telefono || pedido.cliente_telefono || pedido.telefono || '';
  const nitCliente = cliente.nit || pedido.cliente_nit || pedido.nit || '';
  const direccionEntrega = pedido.direccion_entrega || cliente.direccion;
  const referenciaEntrega = pedido.referencia_entrega || cliente.referencia;
  const zonaEnvio = pedido.zona_envio || pedido.delivery_zone_name || cliente.zona || pedido.zona || '';
  const tarifaPendiente = Boolean(pedido.tarifa_envio_pendiente || pedido.delivery_fee_pending);

  const esEnvio = Boolean(
    direccionEntrega ||
    pedido.tipo_entrega === 'home_delivery' ||
    pedido.tipoEntrega === 'home_delivery' ||
    pedido.fulfillment_type === 'home_delivery' ||
    zonaEnvio ||
    (Array.isArray(pedido.items) && pedido.items.some((i) => (i.tipoEntrega || i.tipo_entrega || i.delivery_type) === 'home_delivery'))
  );

  const costoEnvio = Number(
    pedido.costo_envio ??
    pedido.delivery_fee ??
    (pedido.delivery_fee_minor !== undefined ? Number(pedido.delivery_fee_minor) / 100 : null) ??
    0
  );

  const totalPedido = Number(pedido.total ?? (pedido.total_minor !== undefined ? Number(pedido.total_minor) / 100 : 0)) || 0;
  const subtotalProductos = Number(
    pedido.subtotal ??
    (pedido.subtotal_minor !== undefined ? Number(pedido.subtotal_minor) / 100 : null) ??
    (esEnvio && !tarifaPendiente ? Math.max(0, totalPedido - costoEnvio) : totalPedido)
  );

  const metodoPago = pedido.metodo_pago || pedido.metodo_pago_solicitado;
  const estadoClave = String(pedido.estado || '').toLowerCase();
  const cobrado = ['completed', 'paid', 'pagado', 'delivered', 'entregado', 'shipped', 'ready_for_pickup', 'out_for_delivery'].includes(estadoClave);
  const anulado = ['cancelled', 'cancelado'].includes(estadoClave);
  const estadoTexto = anulado ? 'Cancelado / Anulado' : (cobrado ? 'Cobrado en caja' : 'Pendiente de pago');

  const fecha = new Intl.DateTimeFormat('es-BO', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/La_Paz',
  }).format(new Date(pedido.fecha || Date.now()));

  const items = Array.isArray(pedido.items) ? pedido.items : [];
  const resumenEntrega = items.reduce(
    (resumen, item) => {
      const tipo = item.tipoEntrega || item.tipo_entrega || item.delivery_type;
      const cantidad = Number(item.cantidad || item.quantity || 1);
      if (tipo === 'home_delivery') resumen.envio += cantidad;
      else resumen.retiro += cantidad;
      return resumen;
    },
    { envio: 0, retiro: 0 }
  );
  const textoEntrega = resumenEntrega.envio && resumenEntrega.retiro
    ? `Modalidad mixta: ${resumenEntrega.envio} para envío y ${resumenEntrega.retiro} para retiro en tienda`
    : resumenEntrega.envio
      ? `Envío a domicilio: ${resumenEntrega.envio} producto(s)`
      : `Retiro en tienda: ${resumenEntrega.retiro} producto(s)`;

  const detalle = items.map((item) => {
    const tipo = item.tipoEntrega || item.tipo_entrega || item.delivery_type;
    const etiqueta = esEnvio
      ? (tipo === 'home_delivery' || (!tipo && direccionEntrega)
        ? '<br><span style="color:#a6192e;font-weight:bold;font-size:10px;">[🚚 ENVÍO A DOMICILIO]</span>'
        : '<br><span style="color:#004230;font-weight:bold;font-size:10px;">[🛍️ LLEVADO EN TIENDA]</span>')
      : '<br><span style="color:#555;font-weight:bold;font-size:10px;">[🛍️ LLEVADO / RETIRO EN TIENDA]</span>';
    const cant = Number(item.cantidad || item.quantity || 1);
    const precio = Number(item.precioUnitario || item.precio || 0);
    const sub = Number(item.subtotal || cant * precio);
    return `
      <tr>
        <td>
          <b>${escapar(item.nombre || item.product_name || 'Producto')}</b><br>
          <small>${cant} × ${formatoMoneda(precio)}</small>
          ${item.color?.nombre || item.color ? `<br><small style="color:#666;">Color: ${escapar(item.color?.nombre || item.color)}</small>` : ''}
          ${etiqueta}
        </td>
        <td>${formatoMoneda(sub)}</td>
      </tr>`;
  }).join('') || '<tr><td colspan="2">Sin artículos registrados</td></tr>';

  const codigoTicket = pedido.numero ? `Pedido #${pedido.numero} · ${pedido.codigo || pedido.id}` : (pedido.codigo || pedido.id);
  const avisoAnulado = anulado
    ? '<div class="anulado"><b>PEDIDO ANULADO</b><span>Esta venta fue cancelada. No es válida para pago ni entrega.</span></div>'
    : '';

  const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Ticket ${escapar(codigoTicket)}</title>
  <style>
    body { font: 13px Arial, sans-serif; color: #202020; margin: 0; padding: 20px; }
    main { max-width: 340px; margin: auto; }
    header { text-align: center; border-bottom: 2px dashed #a6192e; padding-bottom: 12px; }
    header img { max-width: 190px; }
    h1 { font-size: 15px; margin: 9px 0 0; }
    .code { background: #fff1f3; border: 1px dashed #a6192e; border-radius: 7px; color: #a6192e; font: bold 17px monospace; letter-spacing: 1px; margin: 15px 0; padding: 10px; text-align: center; }
    .meta { color: #4d5552; line-height: 1.6; margin: 10px 0; font-size: 12px; }
    table { border-collapse: collapse; width: 100%; margin-top: 15px; }
    td { border-bottom: 1px dashed #d6d6d6; padding: 9px 0; vertical-align: bottom; }
    td:last-child { text-align: right; font-weight: bold; }
    small { color: #65706b; }
    .total { display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; border-top: 2px solid #202020; margin-top: 14px; padding-top: 12px; }
    .total span:last-child { color: #a6192e; }
    footer { color: #68716d; font-size: 11px; margin-top: 25px; text-align: center; }
    .anulado { background: #a6192e; border-radius: 7px; color: #fff; margin: 14px 0 0; padding: 10px 12px; text-align: center; }
    .anulado b { display: block; font-size: 16px; letter-spacing: 2px; }
    .anulado span { display: block; font-size: 12px; margin-top: 4px; }
    .es-anulado .code, .es-anulado .total span:last-child { color: #68716d; text-decoration: line-through; }
    @media print { body { padding: 0; } button { display: none; } }
  </style>
</head>
<body class="${anulado ? 'es-anulado' : ''}">
  <main>
    <header>
      <img src="${window.location.origin}/logo-terra.png" alt="TERRA Autoservicio">
      <h1>${anulado ? 'Ticket de pedido anulado' : 'Ticket de pedido'}</h1>
    </header>
    ${avisoAnulado}
    <div class="code">${escapar(codigoTicket)}</div>
    <div class="meta">
      <b>Fecha:</b> ${escapar(fecha)}<br>
      <b>Cliente:</b> ${escapar(nombreCliente)}
      ${telefonoCliente ? `<br><b>Teléfono:</b> ${escapar(telefonoCliente)}` : ''}
      ${nitCliente ? `<br><b>NIT/CI:</b> ${escapar(nitCliente)}` : ''}
      <br><b>Entrega:</b> <span style="font-weight:bold;color:${esEnvio ? '#a6192e' : '#004230'};">${escapar(textoEntrega)}</span>
      ${esEnvio && zonaEnvio ? `<br><b>Zona de envío:</b> ${escapar(zonaEnvio)}` : ''}
      ${direccionEntrega ? `<br><b>Dirección:</b> ${escapar(direccionEntrega)}` : ''}
      ${referenciaEntrega ? `<br><b>Referencia:</b> ${escapar(referenciaEntrega)}` : ''}
      ${metodoPago ? `<br><b>Medio de pago:</b> ${escapar(metodoPago === 'qr' ? 'QR Simple' : metodoPago.toUpperCase())}` : ''}
      <br><b>Estado:</b> <span style="font-weight:bold;color:${anulado ? '#a6192e' : (cobrado ? '#006633' : '#b45309')};">${estadoTexto}</span>
    </div>
    <table>${detalle}</table>
    ${esEnvio ? `
    <div style="border-top:1px dashed #d6d6d6;margin-top:12px;padding-top:8px;font-size:12px;">
      <div style="display:flex;justify-content:space-between;margin-bottom:4px;color:#555;">
        <span>Subtotal artículos:</span>
        <span>${formatoMoneda(subtotalProductos)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:4px;color:#a6192e;font-weight:bold;">
        <span>Tarifa de envío ${zonaEnvio ? `(${escapar(zonaEnvio)})` : ''}:</span>
        <span>${tarifaPendiente ? 'Por definir en caja' : (costoEnvio === 0 ? 'GRATIS (Bs 0.00)' : formatoMoneda(costoEnvio))}</span>
      </div>
    </div>` : ''}
    <div class="total">
      <span>${anulado ? 'Total' : (cobrado ? 'Total cobrado' : 'Total a pagar')}</span>
      <span>${formatoMoneda(totalPedido)}</span>
    </div>
    <footer>${anulado ? 'Pedido anulado · sin valor como comprobante de pago.' : (esEnvio ? 'Presenta este comprobante para coordinar tu envío a domicilio.' : 'Gracias por comprar en TERRA Autoservicio.')}</footer>
  </main>
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 250);
    };
  </script>
</body>
</html>`;

  destino.document.write(html);
  destino.document.close();
}
