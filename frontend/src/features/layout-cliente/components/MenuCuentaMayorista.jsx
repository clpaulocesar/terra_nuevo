import { Link } from 'react-router-dom';
import { BookOpen, ContactRound, FileText, Home, LogOut, MessageCircle, ReceiptText } from 'lucide-react';

const ENLACE = 'flex items-center gap-2.5 rounded-terra-chico px-2.5 py-2.75 text-xs font-bold';
// Colores de cada tipo de enlace (uno solo por enlace, para que no se pisen).
const NORMAL = `${ENLACE} text-terra-texto-control hover:bg-terra-superficie-2 hover:text-terra-acento
  [&_svg]:text-terra-texto-suave`;
const ACTUAL = `${ENLACE} border border-terra-primario-suave bg-terra-primario-claro text-terra-acento`;
const SOPORTE = `${ENLACE} text-terra-texto-control hover:bg-terra-ok-fondo hover:text-terra-ok [&_svg]:text-terra-ok`;
const INACTIVO = `${ENLACE} cursor-not-allowed bg-transparent text-left text-terra-texto-control opacity-60
  [&_svg]:text-terra-texto-suave`;

// Menú de la cuenta mayorista: resumen de la cuenta, accesos y cierre de sesión.
// En el menú del teléfono queda dentro del flujo, a todo el ancho.
export default function MenuCuentaMayorista({ sesion, iniciales, enlaceAsesor, onElegir, onCerrarSesion }) {
  return (
    <section
      className="static mt-2 flex w-full min-w-0 flex-col overflow-hidden rounded-terra border border-terra-borde-suave
        bg-terra-superficie text-terra-texto sm:absolute sm:top-12.5 sm:right-0 sm:z-50 sm:mt-0 sm:w-auto
        sm:min-w-[330px] sm:shadow-[0_16px_35px_rgba(0,0,0,0.14)]"
      role="menu"
    >
      <div className="flex items-start gap-3 border-b border-terra-borde-suave bg-terra-superficie-2 p-4">
        <i
          className="inline-flex size-12 flex-none items-center justify-center rounded-full bg-terra-primario text-base
            font-black text-terra-sobre-primario not-italic"
        >
          {iniciales}
        </i>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between gap-1.5">
            <strong className="text-terra-sm text-terra-texto">{sesion?.nombre || 'Cliente mayorista'}</strong>
            <b
              className="rounded-full border border-terra-oro-texto/40 bg-terra-oro-fondo px-1.75 py-0.75 text-terra-3xs
                whitespace-nowrap text-terra-oro-texto"
            >
              Nivel Oro
            </b>
          </div>
          <small
            className="mt-1.5 inline-flex w-max items-center gap-1 rounded border border-terra-primario-suave
              bg-terra-primario-claro px-1.5 py-0.75 text-terra-3xs font-extrabold text-terra-acento uppercase"
          >
            Cuenta mayorista autorizada
          </small>
          <span className="mt-0.75 truncate text-terra-2xs leading-snug text-terra-texto-suave">{sesion?.email}</span>
          <span className="mt-0.75 truncate text-terra-2xs leading-snug text-terra-texto-suave">
            NIT/CI: {sesion?.nit || 'Pendiente de registro'}
          </span>
        </div>
      </div>
      <nav className="grid gap-0.5 px-2 pt-0.5 pb-2.25" aria-label="Opciones de cuenta mayorista">
        <Link
          className={ACTUAL}
          to="/mi-cuenta"
          onClick={onElegir}
        >
          <Home size={16} /> Mi panel mayorista<i className="ml-auto size-1.75 rounded-full bg-terra-primario" />
        </Link>
        <Link className={NORMAL} to="/catalogo" onClick={onElegir}>
          <BookOpen size={16} /> Catálogo mayorista con precios B2B
        </Link>
        <Link className={NORMAL} to="/mi-cuenta/pedidos" onClick={onElegir}>
          <ReceiptText size={16} /> Mis pedidos
        </Link>
        <button
          type="button"
          className={INACTIVO}
          title="Disponible próximamente"
        >
          <FileText size={16} /> Mis cotizaciones y licitaciones
        </button>
        <Link className={NORMAL} to="/mi-cuenta/perfil" onClick={onElegir}>
          <ContactRound size={16} /> Mi perfil y datos de facturación
        </Link>
        <a
          className={SOPORTE}
          href={enlaceAsesor}
          target="_blank"
          rel="noreferrer"
        >
          <MessageCircle size={16} /> Soporte por WhatsApp
          <i
            className="ml-auto rounded-full bg-terra-ok-fondo px-1.5 py-1 text-terra-3xs font-extrabold whitespace-nowrap
              text-terra-ok not-italic"
          >
            Asesor en línea
          </i>
        </a>
      </nav>
      <div className="border-t border-terra-borde-suave bg-terra-superficie-2 p-2">
        <button
          type="button"
          className="flex w-full items-center justify-center gap-1.75 rounded-lg bg-transparent p-2.25 text-[0.74rem]
            font-bold text-terra-acento hover:bg-terra-primario-claro"
          onClick={onCerrarSesion}
        >
          <LogOut size={16} /> Cerrar sesión
        </button>
      </div>
    </section>
  );
}
