import { Link, NavLink } from 'react-router-dom';
import { Home, Menu, Package, X } from 'lucide-react';
import BotonTutorial from '../../../tutorial/BotonTutorial.jsx';
import BotonTema from '../../../components/ui/BotonTema.jsx';
import BotonesVoz from '../../../components/accesibilidad/BotonesVoz.jsx';
import CuentaEncabezado from './CuentaEncabezado.jsx';
import EnlaceCarritoEncabezado from './EnlaceCarritoEncabezado.jsx';

const claseCatalogo = ({ isActive }) => `inline-flex flex-none items-center lg:flex-initial justify-start gap-2.25 rounded-terra-chico
  px-3.25 py-2.75 text-terra-md font-bold transition sm:min-h-10 sm:justify-center sm:gap-1.5 sm:rounded-terra-boton
  sm:px-2.25 sm:py-2 sm:text-terra-2xs lg:px-2.75 lg:py-2.25 lg:text-terra-sm xl:gap-1.75 xl:px-3.75
  ${isActive
    ? `bg-terra-primario text-terra-sobre-primario shadow-[0_2px_6px_rgba(166,25,46,0.2)]
      hover:bg-terra-primario-oscuro contraste:bg-terra-superficie contraste:outline-2
      contraste:outline-terra-primario`
    : 'text-terra-texto-control hover:bg-terra-control-hover hover:text-terra-acento'}`;

const claseInicio = ({ isActive }) => `flex h-11 w-full shrink-0 grow basis-full items-center justify-start gap-2 rounded-terra-chico
  border px-3 transition sm:size-8.5 sm:flex-none sm:justify-center sm:rounded-terra-boton sm:p-0 lg:size-10
  ${isActive
    ? `border-terra-primario bg-terra-primario text-terra-sobre-primario contraste:bg-terra-superficie
      contraste:outline-2 contraste:outline-terra-primario`
    : `border-terra-borde-control bg-terra-control text-terra-texto-control hover:bg-terra-control-hover
      hover:text-terra-acento`}`;

// Encabezado de la tienda. En teléfono (< 640 px) la navegación y las acciones se
// agrupan en un menú desplegable; desde 640 px van en la misma fila.
export default function EncabezadoCliente({
  menuAbierto, onAlternarMenu, onLogo, onTutorial, cuenta, cantidadCarrito,
}) {
  return (
    <header
      className="sticky top-0 z-50 flex min-h-15 items-center justify-between gap-1.5 border-b
        border-terra-borde-suave bg-terra-encabezado px-2 pt-[calc(var(--terra-encabezado-py)+env(safe-area-inset-top,0px))]
        pb-(--terra-encabezado-py) shadow-[0_2px_12px_rgba(166,25,46,0.05)] backdrop-blur-sm
        [--terra-encabezado-py:0.5rem] sm:gap-2 sm:px-3 lg:min-h-16 lg:px-4 lg:[--terra-encabezado-py:0.625rem] xl:px-6
        print:hidden"
    >
      {/* En teléfono el logo cede espacio con texto al 150 %; desde 640 px las acciones pasan a otra línea. */}
      <Link to="/" className="flex min-w-0 items-center sm:shrink-0" title="TERRA Autoservicio" onClick={onLogo}>
        <img
          src="/logo-terra.png"
          alt="TERRA Autoservicio"
          className="block h-11 w-auto max-w-full object-contain object-left sm:h-8.5 lg:h-10 dark:box-content dark:rounded-terra-chico
            dark:bg-terra-placa dark:px-2 dark:py-1"
        />
      </Link>

      <button
        type="button"
        className={`ml-auto inline-flex size-11 shrink-0 items-center justify-center rounded-terra-boton border transition
          sm:hidden ${menuAbierto
          ? 'border-terra-primario bg-terra-primario text-terra-sobre-primario dark:border-terra-oferta dark:bg-terra-oferta'
          : 'border-terra-borde-control bg-terra-control text-terra-texto-control hover:bg-terra-control-hover hover:text-terra-acento'}`}
        data-tour="menu-movil"
        aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
        aria-expanded={menuAbierto}
        aria-controls="terra-menu-movil"
        onClick={onAlternarMenu}
      >
        {menuAbierto ? <X size={20} /> : <Menu size={20} />}
      </button>

      <BotonTutorial onClick={onTutorial} movil />

      {/* menu-movil: gancho de BotonTema.css y accesibilidad.css (ajustes dentro del menú del teléfono). */}
      <div
        id="terra-menu-movil"
        className={`menu-movil absolute inset-x-0 top-full z-55 max-h-[calc(100vh-60px)] flex-col items-stretch gap-2.5
          overflow-y-auto border-b border-terra-borde-suave bg-terra-superficie px-4 pt-3.5 pb-4
          shadow-[0_14px_24px_rgba(0,0,0,0.12)] dark:shadow-[0_14px_24px_rgba(0,0,0,0.45)] sm:static sm:ml-auto sm:flex
          sm:min-w-0 sm:max-h-none sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-1.5 sm:overflow-visible
          sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none lg:gap-2 dark:sm:shadow-none ${menuAbierto ? 'flex' : 'hidden'}`}
      >
        <nav className="flex flex-col items-stretch gap-1.5 sm:flex-row sm:items-center sm:gap-1 xl:gap-2" aria-label="Navegación principal">
          <NavLink to="/catalogo" className={claseCatalogo}>
            <Package size={17} />
            <span className="sm:sr-only lg:not-sr-only">Catálogo de Productos</span>
          </NavLink>
        </nav>

        <div
          className="flex flex-row flex-wrap items-center gap-2 border-t border-terra-borde-suave pt-2.5 sm:contents"
        >
          <BotonesVoz />
          <BotonTema />
          <BotonTutorial onClick={onTutorial} />
          <CuentaEncabezado {...cuenta} />
          <EnlaceCarritoEncabezado cantidad={cantidadCarrito} />
          <NavLink to="/" end className={claseInicio} title="Inicio">
            <Home size={18} />
            <span className="sm:sr-only">Inicio</span>
          </NavLink>
        </div>
      </div>
    </header>
  );
}
