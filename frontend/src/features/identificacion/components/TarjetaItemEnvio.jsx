import { Package, Store, Truck } from 'lucide-react';
import { formatoMoneda } from '../../../utils/formatoMoneda.js';
import InsigniaEntrega from '../../compra/components/InsigniaEntrega.jsx';

// Producto del carrito que se toca para alternar entre envío a domicilio y retiro.
export default function TarjetaItemEnvio({ item, esEnvio, onAlternar }) {
  const modalidad = esEnvio ? 'marcado para envío a domicilio' : 'marcado para retiro en tienda';
  return (
    <button
      type="button"
      className={`flex min-h-14 w-full min-w-0 items-center gap-3 rounded-terra-boton borde-medio px-3.5 py-2.5
        text-left
        transition-[border-color,box-shadow,transform] duration-150 select-none active:scale-99
        motion-reduce:transition-none motion-reduce:active:scale-100 ${esEnvio
          ? 'border-terra-primario bg-terra-superficie shadow-terra-anillo-fino'
          : 'border-terra-borde-control bg-terra-superficie-2 opacity-90 hover:border-terra-borde-hover'}`}
      onClick={onAlternar}
      aria-label={`${item.nombre}, ${modalidad}. Tocar para cambiar.`}
    >
      <span
        className={`flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border
          border-terra-borde ${item.imagen_url
            ? 'bg-terra-fondo-imagen'
            : 'bg-terra-superficie-2 text-terra-texto-suave'}`}
      >
        {item.imagen_url
          ? <img
              src={item.imagen_url}
              alt=""
              className="size-full object-cover"
            />
          : <Package size={20} />}
      </span>
      <span className="min-w-0 flex-1">
        <strong className="block truncate text-terra-xs font-bold text-terra-texto">{item.nombre}</strong>
        <span className="mt-0.5 block text-terra-2xs text-terra-texto-suave">
          {item.cantidad} × {formatoMoneda(item.precio)}{item.color?.nombre ? ` · ${item.color.nombre}` : ''}
        </span>
      </span>
      <InsigniaEntrega envio={esEnvio}>
        {esEnvio ? <Truck size={13} /> : <Store size={13} />}
        {esEnvio ? 'Envío' : 'Retiro'}
      </InsigniaEntrega>
    </button>
  );
}
