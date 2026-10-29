import { Minus, Plus, ScanLine, Trash2 } from 'lucide-react';
import { formatoMoneda } from '../../../utils/formatoMoneda.js';

const BOTON_CANTIDAD = `inline-flex size-8.5 items-center justify-center rounded-lg bg-terra-superficie text-terra-primario
  hover:bg-terra-primario-suave disabled:cursor-not-allowed disabled:bg-transparent disabled:text-terra-texto-tenue
  dark:bg-terra-control-hover dark:text-terra-acento`;

// Producto recién leído: nombre, precio, cantidad y "Escanear otro".
export default function ProductoEscaneadoQr({ item, onCambiarCantidad, onEscanearOtro }) {
  return (
    <div
      className="mt-1 flex flex-wrap items-center gap-3 rounded-terra-boton border border-terra-primario
        bg-terra-superficie p-3 shadow-[0_0_0_3px_rgba(166,25,46,0.08)] dark:border-terra-oferta
        dark:shadow-[0_0_0_3px_rgba(224,48,74,0.15)]"
    >
      <div className="grid min-w-0 flex-[1_1_140px] gap-0.5">
        <b className="truncate text-terra-md text-terra-texto">{item.nombre}</b>
        <small className="text-terra-2xs text-terra-texto-suave">
          {formatoMoneda(item.precio)} c/u · {item.stock} disponibles
        </small>
      </div>
      <div
        className="inline-flex items-center gap-1.5 rounded-terra-chico border border-terra-borde bg-terra-superficie-2 p-0.75"
        aria-label={`Cantidad de ${item.nombre}`}
      >
        <button
          type="button"
          className={BOTON_CANTIDAD}
          aria-label="Quitar una unidad"
          onClick={() => onCambiarCantidad(item.id, item.cantidad - 1)}
        >
          {item.cantidad <= 1 ? <Trash2 size={16} /> : <Minus size={16} />}
        </button>
        <strong className="min-w-7 text-center text-base text-terra-texto">{item.cantidad}</strong>
        <button
          type="button"
          className={BOTON_CANTIDAD}
          aria-label="Agregar una unidad"
          disabled={item.cantidad >= item.stock}
          onClick={() => onCambiarCantidad(item.id, item.cantidad + 1)}
        >
          <Plus size={16} />
        </button>
      </div>
      <button
        type="button"
        className="inline-flex h-10 items-center gap-1.5 rounded-terra-chico border-2 border-terra-primario
          bg-terra-superficie px-3.5 text-terra-sm font-black text-terra-primario hover:bg-terra-primario
          hover:text-terra-sobre-primario dark:border-terra-oferta dark:bg-terra-superficie-2 dark:text-terra-acento
          dark:hover:bg-terra-oferta dark:hover:text-terra-sobre-primario"
        onClick={onEscanearOtro}
      >
        <ScanLine size={16} /> Escanear otro
      </button>
    </div>
  );
}
