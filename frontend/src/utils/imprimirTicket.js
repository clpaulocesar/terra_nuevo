import { construirTicketPedidoHtml } from './ticketPedidoHtml.js';

/** Abre un ticket con el mismo diseño del cliente, listo para imprimir desde caja. */
export function imprimirTicketPedido(pedido, ventana = null) {
  const destino = ventana || window.open('', '_blank', 'width=430,height=760');
  if (!destino) {
    throw new Error('El navegador bloqueó la ventana de impresión. Permite las ventanas emergentes e intenta nuevamente.');
  }

  const cliente = typeof pedido.cliente === 'object' && pedido.cliente !== null
    ? pedido.cliente
    : {};
  const { html: ticketHtml, codigo } = construirTicketPedidoHtml(pedido, cliente, pedido.items);

  const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Ticket ${codigo}</title>
  <style>
    @page { margin: 6mm; }
    body { margin: 0; padding: 16px; background: #ffffff; color: #0f172a; font: 15px Arial, sans-serif; }
    main { width: 100%; max-width: 380px; margin: 0 auto; }
    @media print {
      body { padding: 0; }
      main { max-width: 80mm; }
    }
  </style>
</head>
<body>
  <main>${ticketHtml}</main>
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
