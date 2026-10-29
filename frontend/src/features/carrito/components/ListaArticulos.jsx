import { TARJETA_COMPRA, TITULO_SECCION } from '../../compra/estilosCompra.js';
import { idLinea } from '../utils/nombreLinea.js';
import LineaCarrito from './LineaCarrito.jsx';

// @container: cada línea acomoda sus columnas según el ancho de esta tarjeta, que con
// el texto al 150 % (rem más grande) pasa antes a la versión angosta.
export default function ListaArticulos({ items, cantidadTotal, onCambiarCantidad, onQuitar, onVaciar }) {
  return (
    <div className={`${TARJETA_COMPRA} @container p-4 sm:p-5`}>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className={TITULO_SECCION}>Detalle de artículos ({cantidadTotal})</h2>
        <button
          type="button"
          className="rounded-full border-0 bg-terra-primario-claro px-3.5 py-2 text-terra-xs font-extrabold
            whitespace-nowrap text-terra-acento transition-colors duration-150 hover:bg-terra-primario
            hover:text-terra-sobre-primario motion-reduce:transition-none"
          onClick={onVaciar}
        >
          Vaciar carrito
        </button>
      </div>
      {items.map((item) => (
        <LineaCarrito
          key={idLinea(item)}
          item={item}
          onCambiarCantidad={(cantidad) => onCambiarCantidad(idLinea(item), cantidad)}
          onQuitar={() => onQuitar(idLinea(item))}
        />
      ))}
    </div>
  );
}
