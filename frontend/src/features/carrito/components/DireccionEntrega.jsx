import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';

// Dirección del perfil mayorista a la que se envía el pedido.
export default function DireccionEntrega({ direccion, referencia }) {
  return (
    <div
      className="mt-3 flex flex-wrap items-start gap-3 rounded-terra-campo border border-terra-ok-borde
        bg-terra-ok-fondo/60 px-4 py-3 sm:flex-nowrap"
    >
      <MapPin
        size={20}
        aria-hidden="true"
        className="mt-0.5 shrink-0 text-terra-ok"
      />
      <div className="grid min-w-0 gap-0.5">
        <b className="text-terra-2xs font-extrabold tracking-wider text-terra-ok uppercase">Se envía a</b>
        <strong className="text-terra-md wrap-anywhere text-terra-texto">{direccion}</strong>
        {referencia && <small className="text-terra-xs text-terra-texto-suave">Referencia: {referencia}</small>}
      </div>
      <Link
        to="/mi-cuenta"
        className="ml-7 shrink-0 text-terra-xs font-extrabold whitespace-nowrap text-terra-acento hover:underline
          sm:ml-auto"
      >
        Cambiar dirección
      </Link>
    </div>
  );
}
