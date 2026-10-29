import { formatoMoneda } from '../../../utils/formatoMoneda.js';

const FILA = 'm-0 flex items-center justify-between gap-4 py-1.5';

function FilaDetalle({ etiqueta, valor, className }) {
  return (
    <p className={`${FILA} ${className}`}>
      <span className="text-sm font-semibold text-terra-texto-suave">{etiqueta}</span>
      <b className="font-extrabold whitespace-nowrap">{valor}</b>
    </p>
  );
}

// Caja de subtotal, envío opcional y total (Carrito y Confirmación). Con la hoja
// inferior cerrada (teléfono) solo queda la fila del total, sin caja.
export default function TotalesCompra({ subtotal, envio, total, hojaCerrada }) {
  const ocultoCerrada = hojaCerrada ? 'con-resumen-fijo:hidden' : '';
  const cajaCerrada = hojaCerrada
    ? 'con-resumen-fijo:border-0 con-resumen-fijo:bg-transparent con-resumen-fijo:p-0'
    : '';
  return (
    <div className={`rounded-terra-campo border border-terra-borde bg-terra-superficie-2 px-4 py-3.5 ${cajaCerrada}`}>
      <FilaDetalle
        etiqueta="Subtotal de artículos"
        valor={formatoMoneda(subtotal)}
        className={ocultoCerrada}
      />
      {envio && (
        <FilaDetalle
          etiqueta={envio.etiqueta}
          valor={envio.valor}
          className={ocultoCerrada}
        />
      )}
      <hr className={`my-3 border-t border-terra-borde ${ocultoCerrada}`} />
      <p className={FILA}>
        <span className="text-terra-md font-extrabold text-terra-acento">Total a pagar en caja</span>
        <b className="text-2xl font-black tracking-terra-titulo whitespace-nowrap text-terra-acento">
          {formatoMoneda(total)}
        </b>
      </p>
    </div>
  );
}
