import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import IconoMaterial from '../../../components/ui/IconoMaterial.jsx';
import { formatoMoneda } from '../../../utils/formatoMoneda.js';

const MAXIMO_LINEAS = 4;

// Columna lateral del catálogo mayorista con las líneas del pedido en curso.
export default function ResumenPedidoMayorista({ items, cantidadTotal, subtotal, onQuitar }) {
  return (
    <aside
      className="overflow-hidden rounded-terra border border-terra-borde bg-terra-superficie text-terra-texto
        shadow-[0_10px_28px_rgba(61,35,37,0.08)] lg:sticky lg:top-22"
      aria-label="Resumen de pedido mayorista"
    >
      <header className="flex items-center gap-3 border-b border-terra-borde p-4">
        <span
          className="flex size-10 items-center justify-center rounded-terra-chico bg-terra-primario text-terra-sobre-primario"
        >
          <IconoMaterial nombre="shopping_cart" className="text-[1.3125rem]" />
        </span>
        <div>
          <h2 className="m-0 text-base">Pedido mayorista</h2>
          <p className="mt-0.75 mb-0 text-terra-2xs font-bold text-terra-texto-suave">
            {items.length} {items.length === 1 ? 'línea' : 'líneas'} · {cantidadTotal} unidades
          </p>
        </div>
      </header>
      {items.length ? (
        <>
          <div className="grid gap-2 p-3">
            {items.slice(0, MAXIMO_LINEAS).map((item) => (
              <LineaPedido key={item.lineaId} item={item} onQuitar={onQuitar} />
            ))}
          </div>
          {items.length > MAXIMO_LINEAS && (
            <p className="m-0 px-3 pb-3 text-terra-2xs text-terra-texto-suave">
              + {items.length - MAXIMO_LINEAS} productos más en el pedido
            </p>
          )}
          <div className="flex justify-between border-t border-terra-borde p-4">
            <span className="text-terra-xs text-terra-texto-suave">Subtotal mayorista</span>
            <strong className="text-[1.1rem] text-terra-primario">{formatoMoneda(subtotal)}</strong>
          </div>
          <Link
            className="mx-3 mb-3 flex items-center justify-center gap-1.5 rounded-terra-chico bg-terra-primario p-3.25
              contraste:bg-terra-superficie contraste:outline-2 contraste:outline-terra-primario
              text-terra-sm font-black text-terra-sobre-primario"
            to="/carrito"
          >
            Revisar pedido mayorista <ArrowRight size={17} />
          </Link>
        </>
      ) : (
        <div className="p-5 text-center text-terra-texto-suave">
          <IconoMaterial nombre="inventory_2" className="text-[1.75rem] text-terra-primario" />
          <p className="mt-1.75 mb-0 text-terra-xs leading-[1.45]">
            Agrega productos y cantidades para preparar tu pedido.
          </p>
        </div>
      )}
    </aside>
  );
}

function LineaPedido({ item, onQuitar }) {
  return (
    <article className="grid grid-cols-[1fr_auto] gap-x-1.75 gap-y-0.75 rounded-terra-chico bg-terra-superficie-2 p-3">
      <div>
        <strong className="block text-terra-xs leading-tight">{item.nombre}</strong>
        <small className="mt-1 block text-terra-2xs font-extrabold text-terra-ok">
          {item.cantidad} un. · {formatoMoneda(item.precio)} c/u
        </small>
      </div>
      <b className="text-terra-xs whitespace-nowrap">{formatoMoneda(item.cantidad * item.precio)}</b>
      <button
        type="button"
        className="col-start-2 bg-transparent p-0 text-right text-terra-2xs font-extrabold text-terra-alerta"
        onClick={() => onQuitar(item.lineaId)}
      >
        Eliminar
      </button>
    </article>
  );
}
