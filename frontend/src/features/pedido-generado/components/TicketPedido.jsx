import { QrCode, ReceiptText, ShoppingBag } from 'lucide-react';
import { formatoMoneda } from '../../../utils/formatoMoneda.js';
import { formatoFechaPedido } from '../utils/ticketPedido.js';
import FilaTicket from './FilaTicket.jsx';
import ItemsTicket from './ItemsTicket.jsx';

// Ticket para pagar en caja. Es lo único que se imprime de la página (variantes print:).
// pedido-ticket: gancho del alto contraste (accesibilidad.css).
export default function TicketPedido({ pedido, cliente, items, pagoQrPendiente }) {
  const fecha = formatoFechaPedido(pedido.fecha || pedido.fecha_creacion || pedido.created_at);
  const tarifa = pedido.tarifa_envio_pendiente
    ? 'Por definir en caja'
    : `${pedido.zona_envio} · ${formatoMoneda(pedido.costo_envio)}`;
  return (
    <article
      className="pedido-ticket min-w-0 rounded-terra-modal bg-terra-superficie p-4 shadow-terra-tarjeta sm:p-6
        print:mx-auto print:max-w-105 print:rounded-none print:border print:border-terra-borde-control
        print:shadow-none"
    >
      <header className="flex items-center gap-2.5 border-b border-dashed border-terra-borde-control pb-4">
        <ShoppingBag
          size={25}
          aria-hidden="true"
          className="shrink-0 text-terra-acento"
        />
        <div>
          <b>TERRA AUTOSERVICIO</b>
          <span className="mt-0.5 block text-terra-xs text-terra-texto-suave">Ticket de pago en caja</span>
        </div>
      </header>
      <div
        className="my-4 grid grid-cols-[minmax(0,1fr)_auto] items-center rounded-terra-boton bg-terra-control-hover p-4"
      >
        <span className="text-terra-xs text-terra-texto-suave">Código de pedido</span>
        <strong className="row-start-2 text-terra-xl tracking-wide text-terra-acento">{pedido.codigo}</strong>
        {pedido.erp_cotizacion_numero && (
          <small className="wrap-anywhere">Cotización TERRA Nº {pedido.erp_cotizacion_numero}</small>
        )}
        <QrCode
          size={100}
          aria-hidden="true"
          className="col-start-2 row-span-2 row-start-1 text-terra-acento max-xs:size-16"
        />
      </div>
      <FilaTicket etiqueta="Fecha y hora de emisión">{fecha}</FilaTicket>
      {cliente?.nit && <FilaTicket etiqueta="NIT">{cliente.nit}</FilaTicket>}
      {pedido.direccion_entrega && <FilaTicket etiqueta="Envío">{pedido.direccion_entrega}</FilaTicket>}
      {pedido.direccion_entrega && pedido.referencia_entrega && (
        <FilaTicket etiqueta="Referencia">{pedido.referencia_entrega}</FilaTicket>
      )}
      {pedido.zona_envio && <FilaTicket etiqueta="Tarifa de envío">{tarifa}</FilaTicket>}
      <FilaTicket etiqueta="Estado">
        {pagoQrPendiente ? 'Pendiente de confirmación QR' : 'Pendiente de pago'}
      </FilaTicket>
      {items.length > 0 && (
        <ItemsTicket
          items={items}
          conEnvio={Boolean(pedido.direccion_entrega)}
        />
      )}
      <FilaTicket etiqueta="Total a pagar">{formatoMoneda(pedido.total)}</FilaTicket>
      <footer
        className="mt-5 flex items-center gap-1.5 rounded-terra-chico bg-terra-primario-claro p-3 text-terra-xs
          text-terra-acento"
      >
        <ReceiptText
          size={18}
          aria-hidden="true"
          className="shrink-0"
        />
        Conserva este código hasta finalizar tu compra.
      </footer>
    </article>
  );
}
