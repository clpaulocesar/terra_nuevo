import { toJpeg } from 'html-to-image';
import { formatoMoneda } from './formatoMoneda.js';

// Genera el ticket del pedido como imagen JPG y lo descarga.
// Mantiene la misma firma que la versión HTML para no tocar a los llamadores.
export async function descargarTicket(pedido, cliente = {}, items = []) {
  if (!pedido || typeof document === 'undefined') return;

  const fecha = new Intl.DateTimeFormat('es-BO', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'America/La_Paz',
  }).format(new Date(pedido.fecha || Date.now()));

  const filas = (items.length > 0 ? items : (pedido.items || []))
    .map(
      (item) => `
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px dashed #e2e8f0;">
          <div style="font-weight: 600; color: #1e293b;">${item.nombre || item.product_name || 'Producto'}</div>
          <div style="color: #64748b; font-size: 12px;">${item.cantidad} × ${formatoMoneda(item.precio || item.precioUnitario || 0)}</div>
        </td>
        <td style="padding: 8px 0; text-align: right; border-bottom: 1px dashed #e2e8f0; vertical-align: bottom; font-weight: 700; color: #0f172a;">
          ${formatoMoneda(item.subtotal || (item.precio * item.cantidad) || 0)}
        </td>
      </tr>`
    )
    .join('');

  const ticketHtml = `
  <div style="width: 380px; background: #ffffff; padding: 28px; border-radius: 16px; border: 1px solid #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a;">
    <div style="text-align: center; border-bottom: 2px dashed #a6192e; padding-bottom: 18px; margin-bottom: 20px;">
      <img src="/logo-terra.png" alt="TERRA Autoservicio" style="width: 240px; max-width: 100%; height: auto; display: block; margin: 0 auto;" />
      <div style="margin: 8px 0 0; font-size: 13px; color: #64748b; font-weight: 500;">Ticket de Pago en Caja · Kiosco Digital</div>
    </div>

    <div style="background: #fff1f2; border: 2px dashed #a6192e; border-radius: 12px; padding: 16px; text-align: center; margin-bottom: 20px;">
      <div style="font-size: 11px; text-transform: uppercase; color: #8e1527; font-weight: 700; letter-spacing: 1.2px;">Código de Pago</div>
      <div style="font-size: 22px; color: #a6192e; letter-spacing: 2px; margin-top: 6px; font-family: monospace; word-break: break-all;">${pedido.codigo || pedido.id}</div>
    </div>

    <div style="font-size: 13px; margin-bottom: 20px; background: #f1f5f9; padding: 12px 14px; border-radius: 8px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 6px;"><span style="color: #64748b;">Fecha:</span> <b style="color: #1e293b;">${fecha}</b></div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 6px;"><span style="color: #64748b;">Cliente:</span> <b style="color: #1e293b;">${cliente?.nombre || 'Invitado'}</b></div>
      ${cliente?.telefono ? `<div style="display: flex; justify-content: space-between; margin-bottom: 6px;"><span style="color: #64748b;">Teléfono:</span> <b style="color: #1e293b;">${cliente.telefono}</b></div>` : ''}
      <div style="display: flex; justify-content: space-between;"><span style="color: #64748b;">Estado:</span> <b style="color: #1e293b;">Pendiente de pago en caja</b></div>
    </div>

    <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 20px;">
      <thead>
        <tr>
          <th style="text-align: left; font-size: 11px; text-transform: uppercase; color: #94a3b8; padding-bottom: 8px; letter-spacing: 0.8px;">Detalle</th>
          <th style="text-align: right; font-size: 11px; text-transform: uppercase; color: #94a3b8; padding-bottom: 8px; letter-spacing: 0.8px;">Subtotal</th>
        </tr>
      </thead>
      <tbody>${filas}</tbody>
    </table>

    <div style="border-top: 2px solid #0f172a; padding-top: 14px; display: flex; justify-content: space-between; align-items: center; font-size: 17px; font-weight: 800;">
      <span>Total a pagar:</span>
      <span style="color: #a6192e; font-size: 20px;">${formatoMoneda(pedido.total)}</span>
    </div>

    <div style="text-align: center; font-size: 11px; color: #94a3b8; margin-top: 24px; border-top: 1px dashed #e2e8f0; padding-top: 14px; line-height: 1.5;">
      Presenta este código en caja para pagar y retirar tus productos.<br />
      ¡Gracias por tu compra en TERRA!
    </div>
  </div>`;

  // El nodo debe estar en el documento para que html-to-image calcule los estilos.
  const contenedor = document.createElement('div');
  contenedor.setAttribute('style', 'position: fixed; left: -10000px; top: 0;');
  contenedor.innerHTML = ticketHtml;
  document.body.appendChild(contenedor);

  try {
    const dataUrl = await toJpeg(contenedor.firstElementChild, {
      quality: 0.92,
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      skipFonts: true,
    });
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `ticket-${pedido.codigo || pedido.id}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (err) {
    console.error('No se pudo generar el ticket en JPG:', err);
  } finally {
    document.body.removeChild(contenedor);
  }
}
