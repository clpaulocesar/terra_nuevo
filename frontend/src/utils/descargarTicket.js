import { toJpeg } from 'html-to-image';
import { construirTicketPedidoHtml } from './ticketPedidoHtml.js';

// Genera el ticket del pedido como imagen JPG y lo descarga.
// Mantiene la misma firma que la versión HTML para no tocar a los llamadores.
export async function descargarTicket(pedido, cliente = {}, items = []) {
  if (!pedido || typeof document === 'undefined') return;

  const { html } = construirTicketPedidoHtml(pedido, cliente, items);

  // El nodo debe estar en el documento para que html-to-image calcule los estilos.
  const contenedor = document.createElement('div');
  contenedor.setAttribute('style', 'position: fixed; left: -10000px; top: 0; width: 440px;');
  contenedor.innerHTML = html;
  document.body.appendChild(contenedor);

  try {
    const dataUrl = await toJpeg(contenedor.firstElementChild, {
      quality: 0.95,
      pixelRatio: 2,
      backgroundColor: '#ffffff',
    });
    const enlace = document.createElement('a');
    enlace.download = `ticket-${pedido.codigo || pedido.id || Date.now()}.jpg`;
    enlace.href = dataUrl;
    enlace.click();
  } catch (error) {
    console.error('Error al generar la imagen del ticket:', error);
  } finally {
    document.body.removeChild(contenedor);
  }
}
