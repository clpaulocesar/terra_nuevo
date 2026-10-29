import { Link } from 'react-router-dom';
import { Home, MessageCircle } from 'lucide-react';

const BOTON = `flex min-h-13.5 items-center justify-center gap-2 rounded-terra-boton px-5 text-base font-extrabold
  max-md:w-full`;

export default function AccionesPedido({ enlaceWhatsApp }) {
  return (
    <div className="mt-6 flex flex-wrap justify-center gap-3 max-md:flex-col print:hidden">
      {enlaceWhatsApp && (
        <a
          className={`${BOTON} bg-terra-whatsapp text-terra-whatsapp-texto hover:bg-terra-whatsapp-hover`}
          href={enlaceWhatsApp}
          target="_blank"
          rel="noreferrer"
        >
          <MessageCircle size={20} />
          Enviar ticket a WhatsApp TERRA
        </a>
      )}
      <Link
        to="/"
        className={`${BOTON} bg-terra-primario text-terra-sobre-primario hover:bg-terra-primario-oscuro`}
      >
        <Home size={20} />
        Nueva compra
      </Link>
      <Link
        to="/catalogo"
        className={`${BOTON} border border-terra-borde-control bg-terra-control-hover text-terra-texto
          hover:bg-terra-control`}
      >
        Seguir explorando
      </Link>
    </div>
  );
}
