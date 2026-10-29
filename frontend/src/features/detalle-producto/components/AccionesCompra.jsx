import { Link } from 'react-router-dom';
import { Check, ShoppingCart } from 'lucide-react';

const BOTON = 'flex min-h-12 w-full items-center justify-center rounded-lg text-terra-sm font-extrabold no-underline';

// "Agregar al carrito" y "Comprar ahora" (agrega y va al carrito).
// product-buy__now: gancho de accesibilidad.css (en alto contraste se ve como botón).
export default function AccionesCompra({ disponible, agregado, onAgregar, onComprarAhora }) {
  return (
    <>
      <button
        className={`${BOTON} cursor-pointer gap-2 border-0 bg-terra-primario text-terra-sobre-primario
          enabled:hover:bg-terra-primario-oscuro disabled:cursor-not-allowed disabled:bg-terra-deshabilitado
          dark:disabled:text-terra-texto-suave`}
        disabled={!disponible}
        onClick={onAgregar}
        type="button"
      >
        {agregado ? <Check size={19} /> : <ShoppingCart size={19} />}
        {agregado ? 'Agregado al carrito' : 'Agregar al carrito'}
      </button>
      {disponible && (
        <Link
          className={`product-buy__now ${BOTON} mt-2.5 border-2 border-terra-texto text-terra-texto hover:bg-terra-texto
            hover:text-terra-superficie`}
          to="/carrito"
          onClick={onComprarAhora}
        >
          Comprar ahora
        </Link>
      )}
    </>
  );
}
