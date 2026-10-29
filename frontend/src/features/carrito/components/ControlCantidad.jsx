import { Minus, Plus } from 'lucide-react';

// Botones − / + de una línea del carrito: zona de toque de 44 px. En el carrito flotante
// (compacta) es fija (terra-toque) para que la línea entre en 360 px con el texto al 150 %.
export default function ControlCantidad({ cantidad, maximo, compacta, onCambiar }) {
  const boton = `inline-flex items-center justify-center rounded-full text-terra-texto transition-colors duration-150
    hover:bg-terra-primario-claro hover:text-terra-acento disabled:cursor-not-allowed disabled:opacity-35
    disabled:hover:bg-transparent motion-reduce:transition-none ${compacta ? 'size-terra-toque' : 'size-11'}`;
  return (
    <div className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-terra-borde-suave px-0.5">
      <button
        type="button"
        className={boton}
        onClick={() => onCambiar(cantidad - 1)}
        aria-label="Quitar uno"
      >
        <Minus size={14} />
      </button>
      <b className="min-w-4 text-center text-terra-sm">{cantidad}</b>
      <button
        type="button"
        className={boton}
        onClick={() => onCambiar(cantidad + 1)}
        disabled={cantidad >= maximo}
        aria-label="Agregar uno"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
