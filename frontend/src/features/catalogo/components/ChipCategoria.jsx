import IconoMaterial from '../../../components/ui/IconoMaterial.jsx';

const DEGRADADO_OFERTA = 'bg-linear-135 from-terra-primario to-terra-oferta text-terra-sobre-primario';

// Colores de cada variante del chip; "activo" pisa los de reposo.
const VARIANTES = {
  normal: {
    reposo: 'bg-terra-superficie-2 text-terra-texto',
    activo: 'bg-terra-primario text-terra-sobre-primario',
  },
  selector: {
    reposo: `bg-terra-superficie-2 pr-2.5 text-terra-texto sm:borde-medio sm:border-terra-borde sm:bg-terra-superficie
      dark:sm:bg-terra-superficie-2`,
    activo: 'bg-terra-primario pr-2.5 text-terra-sobre-primario sm:borde-medio sm:border-terra-primario',
  },
  mas: {
    reposo: `bg-terra-superficie-2 text-terra-texto sm:borde-medio sm:border-dashed sm:border-terra-borde
      sm:bg-terra-superficie sm:text-terra-texto-suave sm:hover:border-solid dark:sm:bg-terra-superficie-2
      dark:sm:text-terra-texto`,
    activo: '',
  },
  ofertas: {
    reposo: 'border border-terra-primario/25 bg-terra-primario-claro text-terra-acento dark:border-terra-borde-hover',
    activo: `border border-transparent ${DEGRADADO_OFERTA}`,
  },
};

// Chip del riel de categorías (también "Ofertas", el selector y "+N más").
// terra-cat y terra-cat--active son ganchos de accesibilidad.css (foco, contraste).
export default function ChipCategoria({ icono, etiqueta, activo = false, variante = 'normal', flecha, punto, ...resto }) {
  const colores = VARIANTES[variante];
  const esOfertas = variante === 'ofertas';
  const estado = activo ? `terra-cat--active shadow-terra-chip-activo ${colores.activo}` : `shadow-terra-chip ${colores.reposo}`;
  const hover = esOfertas
    ? 'hover:border-transparent hover:bg-linear-135 hover:from-terra-primario hover:to-terra-oferta hover:text-terra-sobre-primario'
    : 'hover:bg-terra-primario hover:text-terra-sobre-primario';
  const colorIcono = !esOfertas ? '' : activo ? 'text-terra-destello' : 'text-terra-alerta group-hover/chip:text-terra-destello';
  return (
    <button
      type="button"
      className={`terra-cat group/chip inline-flex h-10.5 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-terra-sm
        font-extrabold whitespace-nowrap transition duration-400 active:scale-96 dark:shadow-none sm:h-11 sm:px-4
        sm:text-terra-md ${hover} ${estado}`}
      {...resto}
    >
      <IconoMaterial nombre={icono} className={`text-2xl ${colorIcono}`} />
      <span className="font-extrabold">{etiqueta}</span>
      {punto && <span className="ml-1 size-1.5 rounded-full bg-terra-sobre-primario" />}
      {flecha && <IconoMaterial nombre={flecha} className="ml-0.5 text-2xl" />}
    </button>
  );
}
