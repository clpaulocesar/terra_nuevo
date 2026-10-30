import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

// Enlace con forma de píldora para volver al paso anterior.
export default function EnlaceVolver({ to, children }) {
  return (
    <Link
      to={to}
      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-terra-borde bg-terra-superficie px-4
        text-terra-xs font-extrabold text-terra-texto transition-colors duration-150 hover:border-terra-primario
        hover:bg-terra-primario hover:text-terra-sobre-primario motion-reduce:transition-none"
    >
      <ArrowLeft
        size={18}
        aria-hidden="true"
      />
      {children}
    </Link>
  );
}
