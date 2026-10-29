import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, ChevronRight } from 'lucide-react';

const ENLACE_MIGA = 'text-terra-texto-suave no-underline';

// Botón "Volver al catálogo" y migas de pan. En teléfono las migas quedan en una
// línea: los separadores no se encogen y el nombre del producto se corta con "…".
export default function NavegacionDetalle({ nombre }) {
  const location = useLocation();
  return (
    <>
      <Link
        to="/catalogo"
        state={location.state}
        className="my-3 flex w-full items-center justify-center gap-1.75 rounded-terra-chico border border-terra-primario
          bg-terra-primario px-3.5 py-2.5 text-sm font-extrabold text-terra-sobre-primario no-underline transition-colors
          hover:border-terra-primario-oscuro hover:bg-terra-primario-oscuro focus-visible:outline-3
          focus-visible:outline-offset-3 focus-visible:outline-terra-primario/40 motion-reduce:transition-none sm:mt-4
          sm:mb-3.25 sm:inline-flex sm:w-auto contraste:bg-terra-superficie"
      >
        <ArrowLeft size={18} />
        Volver al catálogo
      </Link>
      <nav className="mb-5 flex items-center gap-1.5 text-terra-xs text-terra-texto-suave max-sm:whitespace-nowrap">
        <Link to="/" className={ENLACE_MIGA}>Inicio</Link>
        <ChevronRight size={14} className="shrink-0" />
        <Link to="/catalogo" state={location.state} className={ENLACE_MIGA}>Catálogo</Link>
        <ChevronRight size={14} className="shrink-0" />
        <span className="min-w-0 max-sm:truncate">{nombre}</span>
      </nav>
    </>
  );
}
