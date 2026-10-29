import IconoMaterial from '../../../components/ui/IconoMaterial.jsx';

const OPCIONES = [
  { id: 'recomendados', label: 'Recomendados' },
  { id: 'ofertas', label: 'En oferta' },
  { id: 'precio-asc', label: 'Precio menor a mayor' },
  { id: 'precio-desc', label: 'Precio mayor a menor' },
  { id: 'nombre', label: 'Nombre A-Z' },
];

// Botón "Orden: …" con su lista desplegable.
export default function MenuOrden({ orden, nombreOrden, abierto, onAlternar, onElegir }) {
  return (
    <div className="relative inline-block" data-tour="ordenar">
      <button
        className="inline-flex min-h-11.5 w-full items-center justify-center gap-1.5 rounded-terra-boton bg-terra-primario
          px-3.5 py-1 text-terra-md font-black leading-terra-boton text-terra-sobre-primario shadow-terra-sm transition
          duration-400 hover:bg-terra-primario-oscuro active:scale-96 sm:min-h-11 sm:w-auto sm:justify-start sm:px-4
          sm:hover:bg-terra-primario"
        id="sort-menu-btn"
        type="button"
        onClick={onAlternar}
      >
        <IconoMaterial nombre="swap_vert" className="text-2xl" />
        <span>
          Orden: <strong className="font-black">{nombreOrden}</strong>
        </span>
        <IconoMaterial nombre={abierto ? 'expand_less' : 'expand_more'} className="text-2xl" />
      </button>

      {abierto && (
        <div
          className="absolute top-[110%] right-0 z-50 w-[210px] animate-terra-aparecer rounded-terra-campo border
            border-terra-borde bg-terra-superficie p-1.5 text-terra-texto shadow-terra motion-reduce:animate-none"
        >
          {OPCIONES.map((opcion) => (
            <OpcionOrden
              key={opcion.id}
              etiqueta={opcion.label}
              activa={orden === opcion.id}
              onClick={() => onElegir(opcion.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// terra-dropdown-item: gancho de accesibilidad.css (botones grandes y contraste).
function OpcionOrden({ etiqueta, activa, onClick }) {
  const estado = activa
    ? 'terra-dropdown-item--active bg-terra-primario-suave text-terra-primario-oscuro dark:text-terra-acento'
    : 'bg-transparent text-terra-texto';
  return (
    <button
      type="button"
      className={`terra-dropdown-item flex w-full items-center justify-between rounded-terra-chico px-3.5 py-2.5
        text-left text-terra-md font-black shadow-terra-sm transition duration-400 hover:bg-terra-primario-oscuro
        hover:text-terra-sobre-primario active:scale-96 dark:shadow-none ${estado}`}
      onClick={onClick}
    >
      <span>{etiqueta}</span>
      {activa && <IconoMaterial nombre="done" className="text-2xl text-terra-primario-oscuro dark:text-terra-acento" />}
    </button>
  );
}
