import { formatoMoneda } from './formatoMoneda.js';

export function descargarTicket(pedido, cliente = {}, items = []) {
  if (!pedido) return;

  const fecha = new Intl.DateTimeFormat('es-BO', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'America/La_Paz',
  }).format(new Date(pedido.fecha || Date.now()));

  const itemsHtml = (items.length > 0 ? items : (pedido.items || []))
    .map(
      (item) => `
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px dashed #e2e8f0;">
          <div style="font-weight: 600; color: #1e293b;">${item.nombre || item.product_name || 'Producto'}</div>
          <small style="color: #64748b;">${item.cantidad} × ${formatoMoneda(item.precio || item.precioUnitario || 0)}</small>
        </td>
        <td style="padding: 8px 0; text-align: right; border-bottom: 1px dashed #e2e8f0; vertical-align: bottom; font-weight: 700; color: #0f172a;">
          ${formatoMoneda(item.subtotal || (item.precio * item.cantidad) || 0)}
        </td>
      </tr>`
    )
    .join('');

  const contenido = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Ticket ${pedido.codigo} - TERRA Autoservicio</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 24px;
      background: #f8fafc;
      color: #0f172a;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    .ticket {
      width: 100%;
      max-width: 380px;
      background: #ffffff;
      padding: 28px;
      border-radius: 16px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04);
      border: 1px solid #e2e8f0;
    }
    .header {
      text-align: center;
      border-bottom: 2px dashed #a6192e;
      padding-bottom: 18px;
      margin-bottom: 20px;
    }
    .header h1 {
      margin: 0;
      color: #a6192e;
      font-size: 22px;
      font-weight: 800;
      letter-spacing: 1.5px;
    }
    .header p {
      margin: 4px 0 0;
      font-size: 13px;
      color: #64748b;
      font-weight: 500;
    }
    .code-box {
      background: #fff1f2;
      border: 2px dashed #a6192e;
      border-radius: 12px;
      padding: 16px;
      text-align: center;
      margin-bottom: 20px;
    }
    .code-box span {
      font-size: 11px;
      text-transform: uppercase;
      color: #8e1527;
      font-weight: 700;
      letter-spacing: 1.2px;
      display: block;
    }
    .code-box strong {
      font-size: 22px;
      color: #a6192e;
      letter-spacing: 2px;
      display: block;
      margin-top: 6px;
      font-family: monospace;
      word-break: break-all;
    }
    .info {
      font-size: 13px;
      margin-bottom: 20px;
      background: #f1f5f9;
      padding: 12px 14px;
      border-radius: 8px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
    }
    .info-row:last-child {
      margin-bottom: 0;
    }
    .info-row span {
      color: #64748b;
    }
    .info-row b {
      color: #1e293b;
    }
    .items {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      margin-bottom: 20px;
    }
    .items th {
      text-align: left;
      font-size: 11px;
      text-transform: uppercase;
      color: #94a3b8;
      padding-bottom: 8px;
      letter-spacing: 0.8px;
    }
    .total-box {
      border-top: 2px solid #0f172a;
      padding-top: 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 17px;
      font-weight: 800;
    }
    .total-box .monto {
      color: #a6192e;
      font-size: 20px;
    }
    .footer {
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
      margin-top: 24px;
      border-top: 1px dashed #e2e8f0;
      padding-top: 14px;
      line-height: 1.5;
    }
    .print-btn {
      display: block;
      width: 100%;
      margin-top: 20px;
      background: #a6192e;
      color: #ffffff;
      border: none;
      padding: 12px;
      font-size: 14px;
      font-weight: 700;
      border-radius: 8px;
      cursor: pointer;
    }
    @media print {
      body { background: #fff; padding: 0; }
      .ticket { box-shadow: none; border: none; max-width: 100%; }
      .print-btn { display: none; }
    }
  </style>
</head>
<body>
  <div class="ticket">
    <div class="header">
      <h1>TERRA AUTOSERVICIO</h1>
      <p>Ticket de Pago en Caja · Kiosco Digital</p>
    </div>

    <div class="code-box">
      <span>Código de Pago</span>
      <strong>${pedido.codigo || pedido.id}</strong>
    </div>

    <div class="info">
      <div class="info-row"><span>Fecha:</span> <b>${fecha}</b></div>
      <div class="info-row"><span>Cliente:</span> <b>${cliente?.nombre || 'Invitado'}</b></div>
      ${cliente?.telefono ? `<div class="info-row"><span>Teléfono:</span> <b>${cliente.telefono}</b></div>` : ''}
      <div class="info-row"><span>Estado:</span> <b>Pendiente de pago en caja</b></div>
    </div>

    <table class="items">
      <thead>
        <tr>
          <th>Detalle</th>
          <th style="text-align: right;">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <div class="total-box">
      <span>Total a pagar:</span>
      <span class="monto">${formatoMoneda(pedido.total)}</span>
    </div>

    <button class="print-btn" onclick="window.print()">Imprimir Ticket</button>

    <div class="footer">
      Presenta este código en caja para pagar y retirar tus productos.<br />
      ¡Gracias por tu compra en TERRA!
    </div>
  </div>
</body>
</html>`;

  const blob = new Blob([contenido], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ticket-${pedido.codigo || pedido.id}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
