import { CircleMinus, CirclePlus } from 'lucide-react';

const BOTON = `grid size-9.5 cursor-pointer place-items-center border-0 bg-terra-superficie text-terra-texto-control
  disabled:cursor-not-allowed disabled:opacity-35 dark:bg-terra-superficie-2`;

export default function SelectorCantidad({ cantidad, maximo, onDisminuir, onAumentar }) {
  return (
    <div className="my-5 flex items-center gap-3">
      <b className="text-terra-xs">Cantidad:</b>
      <div className="flex overflow-hidden rounded-md border border-terra-borde-control">
        <button
          type="button"
          className={BOTON}
          aria-label="Disminuir"
          disabled={cantidad <= 1}
          onClick={onDisminuir}
        >
          <CircleMinus size={19} />
        </button>
        <span className="flex w-10.5 items-center justify-center border-x border-terra-borde-suave text-terra-xs font-extrabold">
          {cantidad}
        </span>
        <button
          type="button"
          className={BOTON}
          aria-label="Aumentar"
          disabled={cantidad >= maximo}
          onClick={onAumentar}
        >
          <CirclePlus size={19} />
        </button>
      </div>
    </div>
  );
}
