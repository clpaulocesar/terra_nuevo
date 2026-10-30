import { QrCode } from 'lucide-react';
import { formatoMoneda } from '../../../utils/formatoMoneda.js';

export default function PagoQr({ total, className = '' }) {
  return (
    <div
      className={`mt-3 mb-4 rounded-terra-campo border border-terra-borde bg-terra-superficie-2 p-4 text-center
        ${className}`}
    >
      <div className="mb-2.5 flex items-center justify-center gap-1.5 text-terra-xs font-extrabold text-terra-acento">
        <QrCode size={18} aria-hidden="true" />
        <span>Pago con QR</span>
      </div>
      <div
        className="mx-auto mb-2.5 flex min-h-40 max-w-49 flex-col items-center justify-center gap-2 rounded-terra-boton
          border border-dashed border-terra-borde bg-terra-superficie p-4 text-terra-texto-suave"
        role="status"
        aria-live="polite"
      >
        <QrCode size={36} aria-hidden="true" />
        <span className="text-terra-xs font-bold">QR dinámico pendiente de integración</span>
      </div>
      <div
        className="mb-2 flex flex-wrap items-center justify-between gap-x-2 rounded-lg border
          border-terra-primario/20 bg-terra-primario-claro px-3 py-2"
      >
        <span className="text-terra-xs font-bold text-terra-acento">Total del pedido:</span>
        <strong className="text-terra-xl font-black whitespace-nowrap text-terra-acento">{formatoMoneda(total)}</strong>
      </div>
      <p className="m-0 text-left text-terra-xs leading-snug text-terra-texto-suave">
        Presenta tu pedido en caja para consultar los medios de pago disponibles. No realices pagos con códigos QR
        estáticos desde esta pantalla.
      </p>
    </div>
  );
}
