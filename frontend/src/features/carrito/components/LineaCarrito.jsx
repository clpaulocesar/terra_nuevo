import { Trash2 } from 'lucide-react';
import ImagenProducto from '../../../components/ui/ImagenProducto.jsx';
import { formatoMoneda } from '../../../utils/formatoMoneda.js';
import { nombreEnUnaLinea } from '../utils/nombreLinea.js';
import ControlCantidad from './ControlCantidad.jsx';

// La línea se acomoda al ancho de la lista (@container en ListaArticulos y en el cuerpo del
// carrito flotante): angosta, el total y quitar pasan a una fila debajo de los datos. En el
// cajón el corte es 18 rem: a 360 px con texto normal (19.75 rem) entra en una fila y con el
// texto al 150 % pasa a dos.
const ARTICULO = {
  compacta: `flex gap-2.75 rounded-terra-campo border border-terra-borde-suave bg-terra-superficie p-2.5
    @max-2xs:grid @max-2xs:grid-cols-[3rem_minmax(0,1fr)] @max-2xs:items-start @max-2xs:gap-2`,
  pagina: `grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-center gap-2.75 rounded-terra-campo border
    border-terra-borde bg-terra-superficie-2 p-2.75 @sm:grid-cols-[4.5rem_minmax(0,1fr)_auto] @sm:gap-4 @sm:p-3
    @max-xs:grid-cols-[3.125rem_minmax(0,1fr)] @max-xs:items-start @max-xs:gap-2 @max-xs:p-2.5`,
};
const FOTO = {
  compacta: 'size-13.5 @max-2xs:row-span-2 @max-2xs:size-12',
  pagina: 'size-14 @sm:size-18 @max-xs:row-span-2 @max-xs:size-12.5',
};
const LATERAL = {
  compacta: `flex flex-col items-end justify-between @max-2xs:col-start-2 @max-2xs:flex-row
    @max-2xs:items-center`,
  pagina: `flex min-w-max flex-col items-end @max-xs:col-start-2 @max-xs:w-full @max-xs:flex-row
    @max-xs:items-center @max-xs:justify-between`,
};

export default function LineaCarrito({ item, compacta = false, onCambiarCantidad, onQuitar }) {
  const variante = compacta ? 'compacta' : 'pagina';
  const nombre = nombreEnUnaLinea(item.nombre);
  return (
    <article className={ARTICULO[variante]}>
      <div
        className={`flex shrink-0 items-center justify-center overflow-hidden rounded-terra-chico bg-terra-fondo-imagen
          ${FOTO[variante]}`}
      >
        <ImagenProducto
          src={item.imagen_url}
          alt={nombre}
          className="size-full object-cover data-reemplazo:object-contain data-reemplazo:p-1"
        />
      </div>
      <div className="min-w-0 flex-1">
        <b
          className={`block text-terra-sm ${compacta
            ? 'truncate @max-2xs:line-clamp-2 @max-2xs:whitespace-normal'
            : ''}`}
        >
          {nombre}
        </b>
        {item.color && (
          <small className="flex items-center gap-1.5 text-terra-xs font-semibold text-terra-texto-suave">
            <i
              className="size-3 shrink-0 rounded-full border border-terra-borde-control"
              style={{ backgroundColor: item.color.valor }}
            />
            {item.color.nombre}
          </small>
        )}
        <span className="mr-2 text-xs text-terra-texto-suave">{formatoMoneda(item.precio)} c/u</span>
        <ControlCantidad
          cantidad={item.cantidad}
          maximo={item.stock}
          compacta={compacta}
          onCambiar={onCambiarCantidad}
        />
      </div>
      <div className={LATERAL[variante]}>
        <strong className="text-terra-sm">{formatoMoneda(item.precio * item.cantidad)}</strong>
        <button
          type="button"
          className={`inline-flex items-center justify-center rounded-full text-terra-acento transition-colors
            duration-150 hover:bg-terra-primario-claro motion-reduce:transition-none
            ${compacta ? 'size-terra-toque' : 'size-11'}`}
          onClick={onQuitar}
          aria-label={`Quitar ${nombre}`}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </article>
  );
}
