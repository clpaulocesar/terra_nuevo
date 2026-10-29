import IconoMaterial from '../../../components/ui/IconoMaterial.jsx';
import { paginasVisibles } from '../../../utils/paginacion.js';

// terra-paginador__btn: gancho de accesibilidad.css (foco visible).
// Medidas en px (no crecen con el texto): así la fila entra en un teléfono aun con texto al 150 %.
const BOTON = `terra-paginador__btn inline-flex min-h-terra-toque min-w-terra-toque items-center justify-center gap-1
  rounded-terra-boton borde-medio px-[10px] text-terra-md font-black transition duration-250 enabled:hover:border-terra-primario
  enabled:hover:bg-terra-primario enabled:hover:text-terra-sobre-primario enabled:active:scale-96
  disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none dark:shadow-none`;
const REPOSO = 'border-terra-borde bg-terra-superficie text-terra-texto shadow-terra-control';
const ACTIVO = 'border-terra-primario bg-terra-primario text-terra-sobre-primario shadow-terra-sm';

// Paginador del catálogo en una sola fila: "‹ 1 … 4 5 6 … 826 ›" o, si es angosto,
// la versión compacta "‹ 1 … 5 … 826 ›".
export default function PaginadorCatalogo({ pagina, ultimaPagina, tieneSiguiente, compacto, onIr }) {
  return (
    <nav
      className="mx-auto mt-6 mb-2 flex flex-nowrap items-center justify-center gap-terra-hueco border-t border-terra-borde pt-5"
      aria-label="Paginación del catálogo"
    >
      <button
        type="button"
        className={`${BOTON} ${REPOSO} sm:px-[16px]`}
        onClick={() => onIr(pagina - 1)}
        disabled={pagina <= 1}
        aria-label="Página anterior"
      >
        <IconoMaterial nombre="chevron_left" className="text-xl" />
        <span className="hidden sm:inline">Anterior</span>
      </button>

      <div className="flex items-center gap-terra-hueco">
        {paginasVisibles(pagina, ultimaPagina, { compacta: compacto }).map((item) =>
          typeof item === 'string' ? (
            <span
              key={item}
              aria-hidden="true"
              className="min-w-[16px] text-center font-black tracking-widest text-terra-texto-suave sm:min-w-[24px]"
            >
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              className={`${BOTON} ${item === pagina ? ACTIVO : REPOSO}`}
              onClick={() => onIr(item)}
              aria-current={item === pagina ? 'page' : undefined}
              aria-label={`Página ${item}`}
            >
              {item}
            </button>
          ),
        )}
      </div>

      <button
        type="button"
        className={`${BOTON} ${REPOSO} sm:px-[16px]`}
        onClick={() => onIr(pagina + 1)}
        disabled={!tieneSiguiente}
        aria-label="Página siguiente"
      >
        <span className="hidden sm:inline">Siguiente</span>
        <IconoMaterial nombre="chevron_right" className="text-xl" />
      </button>
    </nav>
  );
}
