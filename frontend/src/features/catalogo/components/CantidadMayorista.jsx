// Selector de cantidad de la tarjeta mayorista (− cantidad +).
export default function CantidadMayorista({ nombre, cantidad, maximo, onCambiar }) {
  const boton = `h-full w-10 bg-terra-superficie text-[1.2rem] font-black text-terra-primario
    disabled:text-terra-texto-tenue dark:bg-terra-superficie-2 dark:text-terra-texto`;
  return (
    <div
      className="flex h-10 items-center justify-between overflow-hidden rounded-terra-chico border border-terra-borde"
      aria-label={`Cantidad de ${nombre}`}
    >
      <button
        type="button"
        className={boton}
        aria-label="Disminuir cantidad"
        disabled={cantidad <= 1}
        onClick={() => onCambiar(Math.max(1, cantidad - 1))}
      >
        −
      </button>
      <strong className="min-w-7.5 text-center text-terra-md">{cantidad}</strong>
      <button
        type="button"
        className={boton}
        aria-label="Aumentar cantidad"
        disabled={cantidad >= maximo}
        onClick={() => onCambiar(Math.min(maximo, cantidad + 1))}
      >
        +
      </button>
    </div>
  );
}
