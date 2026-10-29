import { NavLink } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';

const CLASE = `inline-flex w-full shrink-0 grow basis-full items-center justify-start gap-1.75 rounded-terra-boton border
  border-terra-borde-control bg-terra-control px-3.75 py-2.25 text-terra-sm font-bold transition sm:w-auto sm:flex-none
  sm:border-0 sm:bg-transparent sm:px-2.25 sm:py-2 sm:text-terra-2xs lg:px-3.75 lg:py-2.25 lg:text-terra-sm
  dark:sm:bg-terra-control`;

// Enlace "Carrito" del encabezado, con la cantidad de unidades.
export default function EnlaceCarritoEncabezado({ cantidad }) {
  return (
    <NavLink to="/carrito" className={CLASE} data-tour="carrito">
      {({ isActive }) => (
        <>
          <ShoppingCart size={18} />
          <span>Carrito</span>
          {cantidad > 0 && (
            <b
              className={`ml-0.75 rounded-full px-2 py-0.5 text-terra-2xs ${isActive
                ? 'bg-terra-aviso-fondo text-terra-aviso-texto'
                : 'bg-terra-primario text-terra-sobre-primario'}`}
            >
              {cantidad}
            </b>
          )}
        </>
      )}
    </NavLink>
  );
}
