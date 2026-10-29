import { Check, ExternalLink, ShoppingCart } from 'lucide-react';
import { formatoMoneda } from '../../../utils/formatoMoneda.js';

// Pie del escáner: unidades y total del carrito, "Ver detalle" y "Confirmar compra".
export default function ResumenEscaneoQr({ unidades, productos, total, ultimoProductoId, onConfirmar }) {
  return (
    <div
      className="mt-3 flex flex-wrap items-stretch justify-between gap-3 rounded-terra-boton border border-terra-borde
        bg-terra-superficie-2 p-3 sm:items-center"
    >
      <div className="grid gap-0.75">
        <b className="flex items-center gap-1.5 text-terra-sm text-terra-texto">
          <ShoppingCart size={16} /> {unidades} {unidades === 1 ? 'unidad' : 'unidades'}
        </b>
        <small className="text-terra-2xs text-terra-texto-suave">
          {productos} {productos === 1 ? 'producto' : 'productos'} · {formatoMoneda(total)}
        </small>
      </div>
      <div className="flex w-full flex-wrap items-stretch justify-end gap-2 sm:w-auto sm:items-center">
        {ultimoProductoId && (
          <a
            className="inline-flex w-full items-center justify-center gap-1.5 text-terra-sm font-extrabold text-terra-acento
              sm:w-auto"
            href={`/detalle-qr.html?id=${encodeURIComponent(ultimoProductoId)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink size={16} /> Ver detalle
          </a>
        )}
        <button
          type="button"
          className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-terra-chico bg-terra-primario
            px-3.5 text-terra-sm font-black text-terra-sobre-primario transition duration-200 enabled:hover:bg-terra-primario-oscuro
            enabled:active:scale-96 disabled:cursor-not-allowed disabled:bg-terra-deshabilitado sm:w-auto"
          onClick={onConfirmar}
          disabled={!unidades}
        >
          <Check size={17} /> Confirmar compra
        </button>
      </div>
    </div>
  );
}
