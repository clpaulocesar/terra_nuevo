import { formatoMoneda } from './formatoMoneda.js';

/**
 * Imprime un ticket térmico de 80mm/58mm para venta directa en mostrador.
 * Se ejecuta automáticamente al completar "Cobrar y registrar venta" o
 * manualmente al presionar "Reimprimir ticket".
 */
export function imprimirTicketVenta({ venta, cliente, items = [], metodoPago = 'efectivo', vendedor = null }) {
  if (typeof window === 'undefined') return;

  const fechaFormateada = new Intl.DateTimeFormat('es-BO', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/La_Paz',
  }).format(new Date(venta?.fecha || Date.now()));

  const codigo = venta?.numero ? `Pedido #${venta.numero} · ${venta?.codigo || venta?.id}` : (venta?.codigo || (venta?.id ? `#${venta.id}` : 'VENTA-DIRECTA'));
  const nombreCliente = cliente?.nombre || 'Venta en mostrador (Cliente final)';
  const nitCliente = cliente?.nit || '';
  const telCliente = cliente?.telefono || '';
  const nombreVendedor = vendedor?.nombre || 'Vendedor Showroom';
  const total = Number(venta?.total || 0);

  const direccionEntrega = venta?.direccion_entrega || cliente?.direccion || '';
  const zonaEnvio = venta?.zona_envio || venta?.delivery_zone_name || cliente?.zona || '';
  const esEnvio = Boolean(
    direccionEntrega ||
    zonaEnvio ||
    venta?.tipo_entrega === 'home_delivery' ||
    venta?.fulfillment_type === 'home_delivery' ||
    items.some((i) => (i.tipoEntrega || i.tipo_entrega || i.delivery_type) === 'home_delivery')
  );

  const costoEnvio = Number(
    venta?.costo_envio ??
    venta?.delivery_fee ??
    (venta?.delivery_fee_minor !== undefined ? Number(venta?.delivery_fee_minor) / 100 : null) ??
    0
  );
  const tarifaPendiente = Boolean(venta?.tarifa_envio_pendiente || venta?.delivery_fee_pending);
  const subtotalProductos = Number(
    venta?.subtotal ??
    (venta?.subtotal_minor !== undefined ? Number(venta?.subtotal_minor) / 100 : null) ??
    (esEnvio && !tarifaPendiente ? Math.max(0, total - costoEnvio) : total)
  );

  const metodoTexto = {
    efectivo: 'Efectivo',
    qr: 'QR Simple',
    tarjeta: 'Tarjeta Débito/Crédito',
  }[String(metodoPago).toLowerCase()] || metodoPago;

  const filas = items
    .map((item) => {
      const cant = item.cantidad || 1;
      const pu = Number(item.precioUnitario ?? item.precio ?? 0);
      const sub = Number(item.subtotal ?? (pu * cant));
      const tipo = item.tipoEntrega || item.tipo_entrega || item.delivery_type;
      const etiqueta = esEnvio
        ? (tipo === 'home_delivery' || (!tipo && direccionEntrega)
          ? '<small style="color:#a6192e;font-weight:700;display:block;">[🚚 Envío a domicilio]</small>'
          : '<small style="color:#004230;font-weight:700;display:block;">[🛍️ Llevado en mano]</small>')
        : '';

      return `
      <tr>
        <td class="col-cant">${cant}x</td>
        <td class="col-desc">
          <div class="prod-nombre">${item.nombre || 'Producto'}</div>
          ${item.sku ? `<small class="prod-sku">SKU: ${item.sku}</small>` : ''}
          ${item.medida ? `<small class="prod-sku">${item.medida}</small>` : ''}
          ${etiqueta}
        </td>
        <td class="col-pu">${formatoMoneda(pu)}</td>
        <td class="col-sub">${formatoMoneda(sub)}</td>
      </tr>`;
    })
    .join('');

  const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Ticket ${codigo} - TERRA Autoservicio</title>
  <style>
    @page {
      size: 80mm auto;
      margin: 3mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Courier New", monospace;
      color: #000;
      background: #fff;
      width: 74mm;
      margin: 0 auto;
      padding: 4px;
      font-size: 11px;
      line-height: 1.35;
    }
    .ticket-header {
      text-align: center;
      margin-bottom: 8px;
    }
    .ticket-logo {
      font-size: 16px;
      font-weight: 900;
      letter-spacing: 1px;
      color: #a6192e;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .ticket-sub {
      font-size: 9px;
      color: #333;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .ticket-branch {
      font-size: 10px;
      color: #555;
      margin-top: 3px;
    }
    .divider {
      border-top: 1px dashed #444;
      margin: 6px 0;
    }
    .divider-double {
      border-top: 2px solid #000;
      margin: 6px 0;
    }
    .ticket-info {
      font-size: 10.5px;
      margin-bottom: 6px;
    }
    .ticket-info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 2px;
    }
    .ticket-info-row span {
      color: #444;
    }
    .ticket-info-row strong {
      font-weight: 700;
      text-align: right;
    }
    .badge-paid {
      display: block;
      text-align: center;
      width: 100%;
      background: #000;
      color: #fff;
      font-weight: 800;
      font-size: 11px;
      letter-spacing: 1px;
      padding: 3px 0;
      margin: 6px 0;
      text-transform: uppercase;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 6px 0;
      font-size: 10.5px;
    }
    th {
      border-bottom: 1px dashed #000;
      padding: 4px 1px;
      text-align: left;
      font-size: 9.5px;
      text-transform: uppercase;
    }
    td {
      padding: 4px 1px;
      vertical-align: top;
      border-bottom: 0.5px dotted #ccc;
    }
    .col-cant { width: 14%; font-weight: 700; }
    .col-desc { width: 46%; }
    .col-pu { width: 20%; text-align: right; color: #555; }
    .col-sub { width: 20%; text-align: right; font-weight: 700; }
    .prod-nombre { font-weight: 600; color: #000; word-break: break-word; }
    .prod-sku { font-size: 9px; color: #666; display: block; }
    .total-section {
      margin-top: 4px;
      font-size: 11px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      padding: 3px 0;
    }
    .total-row.big {
      font-size: 14px;
      font-weight: 900;
      border-top: 1px solid #000;
      border-bottom: 1px solid #000;
      margin: 4px 0;
      padding: 6px 0;
    }
    .ticket-footer {
      text-align: center;
      font-size: 9.5px;
      color: #444;
      margin-top: 8px;
      padding-top: 6px;
    }
    .ticket-footer strong {
      display: block;
      margin-bottom: 2px;
      font-size: 10.5px;
    }
    @media print {
      body {
        width: 100%;
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="ticket-header">
    <div class="ticket-logo">TERRA AUTOSERVICIO</div>
    <div class="ticket-sub">Colchones & Muebles · Logramos tu descanso</div>
    <div class="ticket-branch">Sucursal Equipetrol Showroom · Santa Cruz</div>
  </div>

  <div class="badge-paid">COMPROBANTE DE VENTA</div>

  <div class="ticket-info">
    <div class="ticket-info-row">
      <span>N° Ticket:</span>
      <strong>${codigo}</strong>
      ${venta?.erp_cotizacion_numero ? `<small>Cotización TERRA Nº ${String(venta.erp_cotizacion_numero)}</small>` : ''}
    </div>
    <div class="ticket-info-row">
      <span>Fecha / Hora:</span>
      <strong>${fechaFormateada}</strong>
    </div>
    <div class="ticket-info-row">
      <span>Atendido por:</span>
      <strong>${nombreVendedor}</strong>
    </div>
    <div class="divider"></div>
    <div class="ticket-info-row">
      <span>Cliente:</span>
      <strong>${nombreCliente}</strong>
    </div>
    ${nitCliente ? `<div class="ticket-info-row"><span>NIT/CI:</span><strong>${nitCliente}</strong></div>` : ''}
    ${telCliente ? `<div class="ticket-info-row"><span>Teléfono:</span><strong>${telCliente}</strong></div>` : ''}
    <div class="ticket-info-row">
      <span>Forma de pago:</span>
      <strong>${metodoTexto}</strong>
    </div>
    <div class="ticket-info-row">
      <span>Modalidad:</span>
      <strong>${esEnvio ? '🚚 Envío a domicilio' : '🛍️ Retiro en tienda'}</strong>
    </div>
    ${esEnvio && zonaEnvio ? `<div class="ticket-info-row"><span>Zona de envío:</span><strong>${zonaEnvio}</strong></div>` : ''}
    ${direccionEntrega ? `<div class="ticket-info-row"><span>Dirección:</span><strong>${direccionEntrega}</strong></div>` : ''}
  </div>

  <div class="divider-double"></div>

  <table>
    <thead>
      <tr>
        <th class="col-cant">Cant</th>
        <th class="col-desc">Descripción</th>
        <th class="col-pu">P.Unit</th>
        <th class="col-sub">Total</th>
      </tr>
    </thead>
    <tbody>
      ${filas}
    </tbody>
  </table>

  <div class="total-section">
    ${esEnvio ? `
    <div class="total-row">
      <span>Subtotal artículos:</span>
      <span>${formatoMoneda(subtotalProductos)}</span>
    </div>
    <div class="total-row" style="color: #a6192e; font-weight: 700;">
      <span>Tarifa de envío ${zonaEnvio ? `(${zonaEnvio})` : ''}:</span>
      <span>${tarifaPendiente ? 'Por definir en caja' : (costoEnvio === 0 ? 'GRATIS (Bs 0.00)' : formatoMoneda(costoEnvio))}</span>
    </div>
    ` : ''}
    <div class="total-row big">
      <span>TOTAL PAGADO:</span>
      <span>${formatoMoneda(total)}</span>
    </div>
    <div class="total-row">
      <span>Método de cobro:</span>
      <span>${metodoTexto} (Confirmado)</span>
    </div>
    <div class="total-row">
      <span>Artículos:</span>
      <span>${items.reduce((s, i) => s + (Number(i.cantidad) || 0), 0)} unidad(es)</span>
    </div>
  </div>

  <div class="divider"></div>

  <div class="ticket-footer">
    <strong>¡Gracias por tu compra!</strong>
    <p>Conserva este ticket como constancia de retiro o entrega.</p>
    <p>Sucursal Equipetrol · TERRA Autoservicio</p>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.focus();
        window.print();
      }, 250);
    };
  </script>
</body>
</html>`;

  // Ventana emergente para disparar el diálogo de impresión
  const ventana = window.open('', '_blank', 'width=380,height=600');
  if (ventana) {
    ventana.document.open();
    ventana.document.write(html);
    ventana.document.close();
  } else {
    // Si el navegador bloquea popups, usar iframe oculto en el documento
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
    iframe.contentWindow.document.open();
    iframe.contentWindow.document.write(html);
    iframe.contentWindow.document.close();
    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => {
        if (iframe.parentNode) document.body.removeChild(iframe);
      }, 2000);
    }, 300);
  }
}
