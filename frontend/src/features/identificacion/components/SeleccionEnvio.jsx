import { Check, PackageCheck } from 'lucide-react';
import { idLinea } from '../../carrito/utils/nombreLinea.js';
import TarjetaItemEnvio from './TarjetaItemEnvio.jsx';

// Qué productos del carrito van a domicilio y cuáles se retiran en el mostrador.
export default function SeleccionEnvio({ items, itemsEnvio, onAlternar, onMarcarTodos }) {
  return (
    <div className="mt-2 border-t border-dashed border-terra-borde pt-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <b className="flex items-center gap-1.5 text-terra-sm font-extrabold text-terra-texto">
            <PackageCheck
              size={17}
              aria-hidden="true"
              className="text-terra-acento"
            />
            ¿Qué productos deseas enviar a domicilio?
          </b>
          <small className="mt-0.5 block text-terra-xs text-terra-texto-suave">
            Tocá un producto para alternar entre envío a domicilio y retiro en tienda.
          </small>
        </div>
        <button
          type="button"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-terra-borde
            bg-terra-superficie px-3.5 py-2 text-terra-xs font-extrabold text-terra-acento transition-colors
            duration-150 hover:border-terra-primario hover:bg-terra-primario-claro motion-reduce:transition-none"
          onClick={onMarcarTodos}
        >
          <Check size={14} />
          Enviar todos
        </button>
      </div>

      <div
        className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,16.25rem),1fr))] gap-2.5"
        role="group"
        aria-label="Productos para envío o retiro"
      >
        {items.map((item) => {
          const id = String(idLinea(item));
          return (
            <TarjetaItemEnvio
              key={id}
              item={item}
              esEnvio={itemsEnvio.has(id)}
              onAlternar={() => onAlternar(id)}
            />
          );
        })}
      </div>

      <div
        className="mt-3 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 rounded-terra-chico border
          border-terra-borde bg-terra-superficie-2 px-3 py-2 text-terra-xs text-terra-texto-suave"
      >
        <span>
          🚚 <b className="text-terra-texto">{itemsEnvio.size}</b> para envío a domicilio
        </span>
        <span aria-hidden="true">·</span>
        <span>
          🛍️ <b className="text-terra-texto">{items.length - itemsEnvio.size}</b> para retiro en mostrador
        </span>
      </div>
    </div>
  );
}
