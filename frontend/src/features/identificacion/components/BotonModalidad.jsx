// Opción "retiro en tienda" o "envío a domicilio" (botón con rol radio).
export default function BotonModalidad({ icono: Icono, titulo, detalle, elegido, onElegir }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={elegido}
      onClick={onElegir}
      className={`flex min-h-13.5 items-center gap-2.5 rounded-terra-campo borde-medio px-4 py-3.5 text-left
        transition-[background-color,border-color,box-shadow] duration-150 motion-reduce:transition-none ${elegido
          ? 'border-terra-primario bg-terra-superficie shadow-terra-anillo-fino'
          : 'border-terra-borde bg-terra-superficie-2 hover:border-terra-borde-hover'}`}
    >
      <Icono
        size={20}
        aria-hidden="true"
        className={`shrink-0 ${elegido ? 'text-terra-acento' : 'text-terra-texto-suave'}`}
      />
      <div>
        <b className="block text-terra-sm font-extrabold text-terra-texto">{titulo}</b>
        <small className="mt-0.5 block text-xs text-terra-texto-suave">{detalle}</small>
      </div>
    </button>
  );
}
