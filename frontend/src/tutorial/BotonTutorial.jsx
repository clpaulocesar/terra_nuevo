import { CircleHelp } from 'lucide-react';

export default function BotonTutorial({ onClick, movil = false }) {
  const clasesBase =
    'items-center justify-center gap-2 h-10 px-3.5 rounded-full border border-terra-borde bg-terra-superficie hover:bg-terra-primario-suave hover:border-terra-primario text-terra-texto hover:text-terra-primario text-terra-xs font-bold whitespace-nowrap cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-terra-primario/50 focus-visible:outline-offset-2';

  const clasesVisibilidad = movil
    ? 'inline-flex sm:hidden ml-1.5 max-[399px]:w-10 max-[399px]:px-0 max-[399px]:[&>span]:hidden'
    : 'hidden sm:inline-flex';

  return (
    <button
      type="button"
      className={`${clasesVisibilidad} ${clasesBase}`.trim()}
      data-tour="tutorial"
      onClick={onClick}
      aria-label="Abrir tutorial de uso de la web"
    >
      <CircleHelp size={18} className="text-terra-primario shrink-0" aria-hidden="true" />
      <span>Tutorial</span>
    </button>
  );
}
