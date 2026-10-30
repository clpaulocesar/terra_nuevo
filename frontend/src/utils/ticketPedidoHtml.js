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

function fila(etiqueta, valor, color = '#a6192e') {
  return `
    <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; margin: 10px 0; font-size: 15px; line-height: 1.45;">
      <span style="color: #475569; flex: 0 0 auto;">${etiqueta}</span>
      <b style="color: ${color}; min-width: 0; text-align: right; word-break: break-word;">${valor}</b>
    </div>`;
}

function etiquetaEntregaItem(tipoEntrega, esEnvio, tieneDireccion) {
  if (!esEnvio) {
    return '<span style="display: inline-block; margin-top: 4px; padding: 2px 7px; border: 1px solid #cbd5e1; border-radius: 4px; background: #f1f5f9; color: #475569; font-size: 12px; font-weight: 700;">🛍️ Llevado / Retiro en tienda</span>';
  }
  if (tipoEntrega === 'home_delivery' || (!tipoEntrega && tieneDireccion)) {
    return '<span style="display: inline-block; margin-top: 4px; padding: 2px 7px; border: 1px solid #fecdd3; border-radius: 4px; background: #fdeeee; color: #a6192e; font-size: 12px; font-weight: 700;">🚚 Envío a domicilio</span>';
  }
  return '<span style="display: inline-block; margin-top: 4px; padding: 2px 7px; border: 1px solid #ceead6; border-radius: 4px; background: #e6f4ea; color: #004230; font-size: 12px; font-weight: 700;">🛍️ Llevado en tienda</span>';
}

export function construirTicketPedidoHtml(pedido, cliente = {}, items = []) {
  const fechaBase = new Date(pedido.fecha || pedido.fecha_creacion || pedido.created_at || Date.now());
  const fecha = Number.isNaN(fechaBase.getTime())
    ? ''
    : new Intl.DateTimeFormat('es-BO', {
      dateStyle: 'long',
      timeStyle: 'short',
      timeZone: 'America/La_Paz',
    }).format(fechaBase);

  const nombreCliente = cliente?.nombre || pedido.cliente_nombre || (typeof pedido.cliente === 'string' ? pedido.cliente : '') || 'Compra como invitado';
  const telefonoCliente = cliente?.telefono || pedido.cliente_telefono || pedido.telefono || '';
  const nitCliente = cliente?.nit || pedido.cliente_nit || pedido.nit || '';
  const direccionEntrega = cliente?.direccion || pedido.direccion_entrega || '';
  const referenciaEntrega = cliente?.referencia || pedido.referencia_entrega || '';
  const zonaEnvio = pedido.zona_envio || pedido.delivery_zone_name || cliente?.zona || pedido.zona || '';
  const tarifaPendiente = Boolean(pedido.tarifa_envio_pendiente || pedido.delivery_fee_pending);

  const esEnvio = Boolean(
    direccionEntrega ||
    pedido.tipo_entrega === 'home_delivery' ||
    pedido.tipoEntrega === 'home_delivery' ||
    pedido.fulfillment_type === 'home_delivery' ||
    zonaEnvio ||
    (Array.isArray(pedido.items) && pedido.items.some((item) => (item.tipoEntrega || item.tipo_entrega || item.delivery_type) === 'home_delivery'))
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
  const estadoColor = anulado ? '#a6192e' : (cobrado ? '#146440' : '#9a6513');

  const itemsTicket = Array.isArray(items) && items.length
    ? items
    : (Array.isArray(pedido.items) ? pedido.items : []);

  const resumenEntrega = itemsTicket.reduce(
    (resumen, item) => {
      const tipoEntrega = item.tipoEntrega || item.tipo_entrega || item.delivery_type;
      const cantidad = Number(item.cantidad || item.quantity || 1);
      if (tipoEntrega === 'home_delivery') resumen.envio += cantidad;
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

  const filasItems = itemsTicket.map((item) => {
    const tipoEntrega = item.tipoEntrega || item.tipo_entrega || item.delivery_type;
    const cantidad = Number(item.cantidad || item.quantity || 1);
    const precio = Number(item.precioUnitario || item.precio || 0);
    const subtotal = Number(item.subtotal || cantidad * precio);
    const color = item.color?.nombre || item.color;
    return `
      <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding: 9px 0; border-bottom: 1px dotted #cbd5e1;">
        <div style="flex: 1; min-width: 0;">
          <div style="font-size: 15px; font-weight: 700; color: #0f172a; word-break: break-word;">${escapar(item.nombre || item.product_name || 'Producto')}</div>
          <div style="margin-top: 2px; color: #64748b; font-size: 13px;">${cantidad} × ${formatoMoneda(precio)}${color ? ` · ${escapar(color)}` : ''}</div>
          ${etiquetaEntregaItem(tipoEntrega, esEnvio, Boolean(direccionEntrega))}
        </div>
        <b style="flex: 0 0 auto; color: #0f172a; font-size: 15px; white-space: nowrap;">${formatoMoneda(subtotal)}</b>
      </div>`;
  }).join('') || '<div style="padding: 10px 0; color: #64748b; font-size: 15px;">Sin artículos registrados</div>';

  const codigoCabecera = pedido.numero
    ? `Pedido #${pedido.numero} · #${pedido.codigo || pedido.id}`
    : `#${pedido.codigo || pedido.id}`;
  const codigoVisible = `#${pedido.codigo || pedido.id}`;

  const avisoAnulado = anulado
    ? `
      <div style="margin: 14px 0; padding: 12px; border-radius: 8px; background: #a6192e; color: #ffffff; text-align: center;">
        <div style="font-size: 18px; font-weight: 800; letter-spacing: 2px;">PEDIDO ANULADO</div>
        <div style="margin-top: 4px; font-size: 13px;">Esta venta fue cancelada. No es válida para pago ni entrega.</div>
      </div>`
    : '';

  const envioHtml = esEnvio
    ? `
      <div style="border-top: 1px dashed #cbd5e1; margin-top: 12px; padding-top: 10px;">
        <div style="display: flex; justify-content: space-between; gap: 12px; margin-bottom: 5px; color: #475569; font-size: 14px;">
          <span>Subtotal artículos:</span>
          <b style="color: #0f172a;">${formatoMoneda(subtotalProductos)}</b>
        </div>
        <div style="display: flex; justify-content: space-between; gap: 12px; color: #a6192e; font-size: 14px; font-weight: 700;">
          <span>Tarifa de envío ${zonaEnvio ? `(${escapar(zonaEnvio)})` : ''}:</span>
          <b>${tarifaPendiente ? 'Por definir en caja' : (costoEnvio === 0 ? 'GRATIS (Bs 0.00)' : formatoMoneda(costoEnvio))}</b>
        </div>
      </div>`
    : '';

  const footerTexto = anulado
    ? 'Pedido anulado · sin valor como comprobante de pago.'
    : cobrado
      ? 'Conserva este comprobante como constancia de tu compra.'
      : `Conserva este código hasta finalizar tu compra.${esEnvio ? ' Presenta este comprobante para coordinar tu envío.' : ''}`;

  const html = `
    <div style="width: 100%; box-sizing: border-box; background: #ffffff; padding: 22px; border: 1px solid #e2e8f0; border-radius: 16px; color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <div style="display: flex; align-items: center; gap: 12px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 16px;">
        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#a6192e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex: 0 0 auto;">
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path>
          <path d="M3 6h18"></path>
          <path d="M16 10a4 4 0 0 1-8 0"></path>
        </svg>
        <div>
          <div style="font-size: 18px; font-weight: 800; letter-spacing: 0.02em;">TERRA AUTOSERVICIO</div>
          <div style="margin-top: 2px; color: #64748b; font-size: 14px;">Ticket de pago en caja</div>
        </div>
      </div>

      ${avisoAnulado}

      <div style="display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 12px; margin: 18px 0; padding: 14px; border-radius: 12px; background: #f1f5f9;">
        <div style="min-width: 0;">
          <div style="color: #64748b; font-size: 13px;">Código de pedido</div>
          <div style="margin-top: 4px; color: #a6192e; font-family: monospace; font-size: 20px; font-weight: 800; letter-spacing: 0.04em; word-break: break-word;">${escapar(codigoVisible)}</div>
          ${pedido.numero ? `<div style="margin-top: 4px; color: #64748b; font-size: 13px; font-weight: 700;">Pedido #${escapar(String(pedido.numero))}</div>` : ''}
          ${pedido.erp_cotizacion_numero ? `<div style="margin-top: 4px; color: #64748b; font-size: 13px; font-weight: 700;">Cotización TERRA Nº ${escapar(String(pedido.erp_cotizacion_numero))}</div>` : ''}
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#a6192e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex: 0 0 auto;">
          <rect width="5" height="5" x="3" y="3" rx="1"></rect>
          <rect width="5" height="5" x="16" y="3" rx="1"></rect>
          <rect width="5" height="5" x="3" y="16" rx="1"></rect>
          <path d="M21 16h-3a2 2 0 0 0-2 2v3"></path>
          <path d="M21 21v.01"></path>
          <path d="M12 7v3a2 2 0 0 1-2 2H7"></path>
          <path d="M3 12h.01"></path>
          <path d="M12 3h.01"></path>
          <path d="M12 16v.01"></path>
          <path d="M16 12h1"></path>
          <path d="M21 12v.01"></path>
          <path d="M12 21v-1"></path>
        </svg>
      </div>

      ${fila('Fecha y hora de emisión', escapar(fecha))}
      ${fila('Cliente', escapar(nombreCliente))}
      ${telefonoCliente ? fila('Teléfono', escapar(telefonoCliente)) : ''}
      ${nitCliente ? fila('NIT/CI', escapar(nitCliente)) : ''}
      ${fila('Modalidad', escapar(textoEntrega), esEnvio ? '#a6192e' : '#146440')}
      ${esEnvio && zonaEnvio ? fila('Zona de envío', escapar(zonaEnvio)) : ''}
      ${direccionEntrega ? fila('Dirección', escapar(direccionEntrega)) : ''}
      ${referenciaEntrega ? fila('Referencia', escapar(referenciaEntrega)) : ''}
      ${metodoPago ? fila('Medio de pago', escapar(metodoPago === 'qr' ? `QR Simple (Glosa: ${pedido.codigo || pedido.id})` : metodoPago.toUpperCase())) : ''}
      ${fila('Estado', estadoTexto, estadoColor)}

      <div style="margin: 18px 0; border-top: 1px dashed #cbd5e1; border-bottom: 1px dashed #cbd5e1; padding: 12px 0;">
        <div style="margin-bottom: 8px; color: #64748b; font-size: 12px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase;">Detalle de productos (${itemsTicket.length})</div>
        ${filasItems}
      </div>

      ${envioHtml}

      <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 16px; border-top: 2px solid #0f172a; padding-top: 14px; font-size: 18px; font-weight: 800;">
        <span>${anulado ? 'Total:' : (cobrado ? 'Total cobrado:' : 'Total a pagar:')}</span>
        <span style="color: #a6192e; font-size: 22px;">${formatoMoneda(totalPedido)}</span>
      </div>

      <div style="display: flex; align-items: center; gap: 10px; margin-top: 20px; padding: 12px; border-radius: 8px; background: #fff1f2; color: #a6192e; font-size: 14px; line-height: 1.4;">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex: 0 0 auto;">
          <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"></path>
          <path d="M14 8H8"></path>
          <path d="M16 12H8"></path>
          <path d="M13 16H8"></path>
        </svg>
        <span>${footerTexto}</span>
      </div>
    </div>`;

  return { html, codigo: codigoCabecera };
}
