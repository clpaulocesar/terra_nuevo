import { ChevronDown, UserRound } from 'lucide-react';
import MenuCuentaMayorista from './MenuCuentaMayorista.jsx';

// Botón de cuenta del encabezado: "Iniciar sesión" o, con sesión mayorista, el
// nombre con su menú.
export default function CuentaEncabezado({
  sesion, esMayorista, iniciales, enlaceAsesor, menuAbierto, loginAbierto, onBoton, onElegir, onCerrarSesion,
}) {
  return (
    <div className="relative flex w-full shrink-0 grow basis-full flex-col sm:block sm:w-auto sm:flex-none">
      <button
        type="button"
        className={`inline-flex h-11 w-full items-center justify-start rounded-full border border-terra-borde-control
          bg-terra-superficie text-terra-xs font-bold whitespace-nowrap text-terra-texto-control
          hover:border-terra-primario/30 hover:bg-terra-superficie-2 hover:text-terra-acento focus-visible:outline-3
          focus-visible:outline-offset-2 focus-visible:outline-terra-primario/33 dark:bg-terra-control
          dark:hover:bg-terra-control-hover sm:h-10.5 sm:w-auto sm:justify-center
          ${esMayorista ? 'gap-1.75 py-1.25 pr-2.5 pl-1.5' : 'gap-1.75 px-3.5'}`}
        data-tour="iniciar-sesion"
        aria-haspopup={esMayorista ? 'menu' : 'dialog'}
        aria-expanded={esMayorista ? menuAbierto : loginAbierto}
        onClick={onBoton}
      >
        {esMayorista ? (
          <i
            className="inline-flex size-7 items-center justify-center rounded-full border border-terra-primario-suave
              bg-terra-primario-claro text-[0.67rem] font-black text-terra-acento not-italic"
          >
            {iniciales}
          </i>
        ) : (
          <UserRound size={19} />
        )}
        <span className={esMayorista ? 'max-sm:max-w-19.5 max-sm:truncate' : ''}>
          {esMayorista ? (sesion?.nombre || 'Mayorista') : 'Iniciar sesión'}
        </span>
        {esMayorista && (
          <ChevronDown
            size={15}
            className={`text-terra-texto-suave transition-transform duration-180 ${menuAbierto ? 'rotate-180' : ''}`}
          />
        )}
      </button>
      {esMayorista && menuAbierto && (
        <MenuCuentaMayorista
          sesion={sesion}
          iniciales={iniciales}
          enlaceAsesor={enlaceAsesor}
          onElegir={onElegir}
          onCerrarSesion={onCerrarSesion}
        />
      )}
    </div>
  );
}
