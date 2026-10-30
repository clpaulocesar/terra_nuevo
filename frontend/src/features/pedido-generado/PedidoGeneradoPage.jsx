import { Navigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { WHATSAPP_COMPROBANTES } from '../../services/api.js';
import { crearMensajeComprobante } from './utils/ticketPedido.js';
import { usePedidoGenerado } from './hooks/usePedidoGenerado.js';
import TicketPedido from './components/TicketPedido.jsx';
import PasosSiguientes from './components/PasosSiguientes.jsx';
import AccionesPedido from './components/AccionesPedido.jsx';

// pedido-page: gancho de la fuente legible (accesibilidad.css). Al imprimir solo queda el ticket.
// Desde 768 px deja libre a cada lado el ancho de los flotantes y del botón de accesibilidad.
const PAGINA = `pedido-page m-auto max-w-230 text-center max-md:py-6
  md:max-w-[min(57.5rem,var(--container-terra-sin-flotantes))] print:max-w-none print:p-0`;

export default function PedidoGeneradoPage() {
  const { pedido, cliente, items, cargando, error } = usePedidoGenerado();

  if (cargando) {
    return (
      <section className={PAGINA}>
        <p>Cargando ticket...</p>
      </section>
    );
  }
  if (error) {
    return (
      <section className={PAGINA}>
        <h1>No se pudo abrir el ticket</h1>
        <p>{error}</p>
      </section>
    );
  }
  if (!pedido) return <Navigate to="/" replace />;

  const pagoQrPendiente = pedido.metodo_pago_solicitado === 'qr' && !pedido.metodo_pago;
  const mensaje = encodeURIComponent(crearMensajeComprobante({ pedido, cliente, items }));
  const enlaceWhatsApp = cliente?.whatsapp && WHATSAPP_COMPROBANTES
    ? `https://wa.me/${WHATSAPP_COMPROBANTES}?text=${mensaje}`
    : null;

  return (
    <section className={PAGINA}>
      <div
        className="flex items-center justify-center gap-2 text-terra-sm font-extrabold text-terra-acento uppercase
          print:hidden"
      >
        <CheckCircle2
          aria-hidden="true"
          className="size-7.5"
        />
        <span>Pedido generado correctamente</span>
      </div>
      <h1 className="my-3 text-[clamp(2.1rem,5vw,3.3rem)] print:hidden">¡Tu ticket está listo!</h1>
      <p className="mx-auto mt-0 mb-4 max-w-152 text-terra-texto-suave print:hidden">
        Presenta este código en caja para realizar el pago y coordinar la entrega o retiro.
      </p>
      {/* Ticket y pasos en dos columnas solo con 42 rem o más de ancho: a 768 px, o con el
          texto al 150 %, van en una columna. */}
      <div className="@container">
        <div className="grid grid-cols-1 gap-6 text-left @2xl:grid-cols-2 print:block">
          <TicketPedido
            pedido={pedido}
            cliente={cliente}
            items={items}
            pagoQrPendiente={pagoQrPendiente}
          />
          <PasosSiguientes
            total={pedido.total}
            pagoQrPendiente={pagoQrPendiente}
          />
        </div>
      </div>
      <AccionesPedido enlaceWhatsApp={enlaceWhatsApp} />
    </section>
  );
}
