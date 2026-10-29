import IconoMaterial from '../../../components/ui/IconoMaterial.jsx';

// Aviso a página completa cuando el catálogo no se pudo cargar o no hay resultados.
export default function EstadoCatalogo({ icono, titulo, texto, accion, onAccion }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-12 text-center sm:py-16">
      <IconoMaterial
        nombre={icono}
        className="mb-3.5 text-[3.5rem] text-terra-texto-tenue dark:text-terra-borde-hover sm:mb-4 sm:text-[4rem]"
      />
      <h3 className="m-0 mb-1.5 text-xl font-black text-terra-texto sm:mb-2 sm:text-[1.4rem]">{titulo}</h3>
      <p className="m-0 mb-4.5 max-w-75 text-terra-md text-terra-texto-suave sm:mb-5 sm:max-w-105 sm:text-base">
        {texto}
      </p>
      <button
        type="button"
        className="min-h-11.5 w-full rounded-terra-boton bg-terra-primario px-5 text-terra-md font-black
          text-terra-sobre-primario shadow-terra-sm transition duration-400 hover:bg-terra-primario-oscuro
          active:scale-96 sm:w-auto"
        onClick={onAccion}
      >
        {accion}
      </button>
    </div>
  );
}
