import { Clock3 } from 'lucide-react';
import { formatoMoneda } from '../../../utils/formatoMoneda.js';
import PasoSiguiente from './PasoSiguiente.jsx';

// "¿Qué sigue?" después de generar el ticket. pedido-steps: gancho del alto contraste.
export default function PasosSiguientes({ total, pagoQrPendiente }) {
  return (
    <aside
      className="pedido-steps rounded-terra-modal bg-terra-superficie p-4 shadow-terra-tarjeta sm:p-6 print:hidden"
    >
      <h2 className="mt-0">¿Qué sigue?</h2>
      <PasoSiguiente
        numero={1}
        titulo="Acercate a caja"
      >
        Muestra el código de tu pedido al personal en mostrador.
      </PasoSiguiente>
      <PasoSiguiente
        numero={2}
        titulo={pagoQrPendiente ? 'Pago con QR Simple' : 'Realiza el pago'}
      >
        {pagoQrPendiente
          ? `Muestra tu comprobante de transferencia por ${formatoMoneda(total)} en caja.`
          : 'Puedes pagar con efectivo, QR Simple o tarjeta en caja.'}
      </PasoSiguiente>
      <PasoSiguiente
        numero={3}
        titulo="Coordina tu entrega"
      >
        Retira en tienda o consulta opciones de despacho.
      </PasoSiguiente>
      <div
        className="flex items-center gap-2 rounded-terra-chico bg-terra-control-hover p-3 text-terra-xs
          text-terra-texto-control"
      >
        <Clock3
          size={19}
          aria-hidden="true"
          className="shrink-0 text-terra-acento"
        />
        Tu ticket tiene validez limitada. Consulta en caja.
      </div>
    </aside>
  );
}
