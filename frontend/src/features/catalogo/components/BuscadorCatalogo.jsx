import { forwardRef } from 'react';
import IconoMaterial from '../../../components/ui/IconoMaterial.jsx';

// Campo de búsqueda del catálogo. En pantallas táctiles es de solo lectura y abre
// el teclado en pantalla (onAbrirTeclado).
const BuscadorCatalogo = forwardRef(function BuscadorCatalogo(
  { valor, esTactil, onCambiar, onAbrirTeclado },
  ref,
) {
  return (
    <div
      data-tour="buscador"
      className="relative flex min-h-11.5 flex-1 items-center rounded-terra-boton borde-medio border-terra-borde
        bg-terra-superficie px-2.5 shadow-[0_2px_6px_rgba(0,0,0,0.04)] transition-[border-color,box-shadow]
        focus-within:border-terra-primario focus-within:shadow-terra-anillo
        sm:min-h-14 sm:rounded-terra-campo sm:border sm:bg-terra-superficie-2 sm:px-3.5 sm:shadow-none
        sm:focus-within:shadow-terra-anillo dark:sm:bg-terra-superficie"
    >
      <IconoMaterial nombre="search" className="mr-2 text-2xl text-terra-texto-suave sm:mr-0" />
      <input
        ref={ref}
        className="min-h-11 min-w-0 flex-1 truncate border-none bg-transparent text-terra-md font-semibold
          leading-[1.2] text-terra-texto outline-none placeholder:text-terra-texto-tenue placeholder:opacity-100
          sm:text-base sm:leading-normal"
        id="kiosk-search"
        placeholder="Buscar colchones, sommiers, camas…"
        type="text"
        value={valor}
        inputMode={esTactil ? 'none' : 'text'}
        onClick={onAbrirTeclado}
        onFocus={onAbrirTeclado}
        onChange={(e) => onCambiar(e.target.value)}
      />
      {valor && (
        <button
          aria-label="Borrar búsqueda"
          className="inline-flex size-10 flex-none items-center justify-center rounded-[11px] bg-terra-control-hover
            text-terra-texto-suave transition duration-400 hover:bg-terra-primario hover:text-terra-sobre-primario
            active:scale-96 sm:rounded-terra-chico sm:bg-terra-superficie dark:text-terra-texto
            dark:sm:bg-terra-control-hover"
          id="clear-search-btn"
          onClick={() => onCambiar('')}
          type="button"
        >
          <IconoMaterial nombre="close" className="text-2xl" />
        </button>
      )}
    </div>
  );
});

export default BuscadorCatalogo;
