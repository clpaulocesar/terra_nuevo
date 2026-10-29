import { Check } from 'lucide-react';

// Una de las dos modalidades de entrega del mayorista (botón con rol radio).
export default function OpcionEntrega({ icono: Icono, titulo, detalle, elegida, disabled = false, onElegir }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={elegida}
      disabled={disabled}
      onClick={onElegir}
      className={`flex items-center gap-3 rounded-terra-campo borde-medio px-3.5 py-3 text-left text-terra-texto
        transition-[background-color,border-color,box-shadow] duration-150 enabled:hover:border-terra-borde-hover
        disabled:cursor-not-allowed disabled:opacity-55 motion-reduce:transition-none ${elegida
          ? 'border-terra-primario bg-terra-primario-claro shadow-terra-anillo-fino enabled:hover:border-terra-primario'
          : 'border-terra-borde-suave bg-terra-superficie-2'}`}
    >
      <span
        className={`inline-flex size-10.5 shrink-0 items-center justify-center rounded-terra-chico border ${elegida
          ? 'border-terra-primario bg-terra-primario text-terra-sobre-primario'
          : 'border-terra-borde-suave bg-terra-superficie text-terra-acento'}`}
      >
        <Icono size={21} />
      </span>
      <span className="grid min-w-0 gap-0.5">
        <b className="text-sm font-extrabold">{titulo}</b>
        <small className="text-terra-xs leading-snug text-terra-texto-suave">{detalle}</small>
      </span>
      <span
        aria-hidden="true"
        className={`ml-auto inline-flex size-5.5 shrink-0 items-center justify-center rounded-full borde-medio
          text-terra-sobre-primario ${elegida
            ? 'border-terra-primario bg-terra-primario'
            : 'border-terra-borde-control bg-terra-superficie'}`}
      >
        {elegida && <Check size={14} />}
      </span>
    </button>
  );
}
