import { Maximize2, QrCode, ZoomIn } from 'lucide-react';
import { formatoMoneda } from '../../../utils/formatoMoneda.js';

// Código QR de pago con el monto a transferir. Tocarlo abre el QR en pantalla completa.
export default function PagoQr({ total, onAmpliar, className = '' }) {
  const alPulsarTecla = (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    onAmpliar();
  };
  return (
    <div
      className={`mt-3 mb-4 rounded-terra-campo border border-terra-borde bg-terra-superficie-2 p-4 text-center
        ${className}`}
    >
      <div className="mb-2.5 flex items-center justify-center gap-1.5 text-terra-xs font-extrabold text-terra-acento">
        <QrCode
          size={18}
          aria-hidden="true"
        />
        <span>QR Simple Interoperable</span>
      </div>
      <div
        className="relative mx-auto mb-2.5 inline-block cursor-pointer rounded-terra-boton borde-medio
          border-terra-borde bg-terra-fondo-imagen p-2.5 shadow-terra-control transition-[transform,border-color]
          duration-150
          hover:-translate-y-0.5 hover:border-terra-primario motion-reduce:transition-none
          motion-reduce:hover:translate-y-0"
        role="button"
        tabIndex={0}
        onClick={onAmpliar}
        onKeyDown={alPulsarTecla}
        title="Tocar para ampliar código QR"
        aria-label="Tocar para ampliar código QR en pantalla completa"
      >
        <img
          src="/images/QRPAGO.jpeg"
          alt="Código QR Oficial de Pago TERRA - Tocar para ampliar"
          className="block h-auto w-full max-w-49 rounded-lg"
        />
        <span
          className="pointer-events-none absolute bottom-3.5 left-1/2 inline-flex -translate-x-1/2 items-center gap-1
            rounded-full bg-terra-telon px-2.5 py-1 text-terra-2xs font-extrabold whitespace-nowrap
            text-terra-sobre-primario"
        >
          <ZoomIn size={13} />
          Tocar para ampliar
        </span>
      </div>
      <div
        className="mb-2 flex flex-wrap items-center justify-between gap-x-2 rounded-lg border
          border-terra-primario/20 bg-terra-primario-claro px-3 py-2"
      >
        <span className="text-terra-xs font-bold text-terra-acento">Total a transferir:</span>
        <strong className="text-terra-xl font-black whitespace-nowrap text-terra-acento">{formatoMoneda(total)}</strong>
      </div>
      <button
        type="button"
        className="mb-2.5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-terra-chico borde-medio
          border-terra-primario bg-terra-superficie px-3.5 py-2 text-terra-sm font-extrabold text-terra-acento
          transition-colors duration-150 hover:bg-terra-primario hover:text-terra-sobre-primario
          motion-reduce:transition-none"
        onClick={onAmpliar}
      >
        <Maximize2 size={16} />
        Ampliar QR para escanear
      </button>
      <p className="m-0 text-left text-xs leading-snug text-terra-texto-suave">
        Escanea desde cualquier banca móvil (BCP, Unión, BNB, Mercantil, Bisa, GanaMóvil, etc.) y confirma para
        generar tu ticket de retiro.
      </p>
    </div>
  );
}
