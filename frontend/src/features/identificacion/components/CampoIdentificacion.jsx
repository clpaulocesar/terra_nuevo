// Campo de texto de Identificación: etiqueta con ícono, marca de obligatorio u opcional,
// prefijo opcional (+591) y error de validación. El resto de props va al <input>.
export default function CampoIdentificacion({
  etiqueta,
  icono: Icono,
  marca,
  prefijo,
  error,
  activo,
  className = '',
  ...propsInput
}) {
  return (
    <label className={`block ${className}`}>
      <span className="flex items-center gap-1.5 text-terra-sm font-extrabold">
        {Icono && (
          <Icono
            size={18}
            aria-hidden="true"
            className="text-terra-texto-suave"
          />
        )}
        {etiqueta}
        {marca === 'obligatorio' && <b className="ml-auto text-terra-acento">*</b>}
        {marca === 'opcional' && (
          <em className="ml-auto text-terra-2xs font-semibold text-terra-texto-suave not-italic">Opcional</em>
        )}
      </span>
      <div
        className={`mt-1.75 flex items-stretch rounded-terra-campo borde-medio
          transition-[background-color,border-color,box-shadow] duration-150 motion-reduce:transition-none ${activo
            ? 'border-terra-primario bg-terra-superficie shadow-terra-anillo'
            : 'border-terra-borde bg-terra-superficie-2'}`}
      >
        {prefijo && (
          <i
            className="flex items-center rounded-l-terra-chico border-r border-terra-borde bg-terra-primario-claro px-3
              text-sm font-extrabold text-terra-acento not-italic"
          >
            {prefijo}
          </i>
        )}
        <input
          className="min-h-12.75 w-full border-0 bg-transparent px-3.5 py-2 text-base font-semibold text-terra-texto
            outline-none placeholder:text-terra-texto-tenue"
          {...propsInput}
        />
      </div>
      {error && <small className="mt-1.5 block text-terra-xs font-semibold text-terra-alerta">{error}</small>}
    </label>
  );
}
