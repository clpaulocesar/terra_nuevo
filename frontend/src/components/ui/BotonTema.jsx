import { Contrast, Moon, Sun } from 'lucide-react';
import { useTema } from '../../context/TemaContext.jsx';

// Botón día / noche. Muestra el ícono del modo al que se cambiará al pulsarlo.
// `icono="contraste"` usa el símbolo de medio círculo del portal del cliente.
export default function BotonTema({ className = '', conTexto = false, icono = 'tema' }) {
  const { esOscuro, alternarTema } = useTema();
  const etiqueta = esOscuro ? 'Cambiar a modo día' : 'Cambiar a modo noche';
  const Icono = icono === 'contraste' ? Contrast : esOscuro ? Sun : Moon;

  return (
    <button
      type="button"
      className={`group terra-theme-btn ${esOscuro ? 'terra-theme-btn--oscuro' : ''} inline-flex items-center justify-center gap-1.5 h-10 border border-terra-borde-control rounded-full bg-terra-control text-terra-texto-control font-bold text-terra-sm cursor-pointer transition-all duration-200 hover:bg-terra-control-hover hover:text-terra-primario active:scale-95 ${
        conTexto ? 'px-3 min-w-[2.5rem]' : 'w-10 min-w-10 px-0'
      } ${className}`.trim()}
      onClick={alternarTema}
      aria-label={etiqueta}
      title={etiqueta}
      aria-pressed={esOscuro}
    >
      <span
        className="terra-theme-btn__icon inline-flex shrink-0 transition-transform duration-300 group-hover:rotate-[20deg] motion-reduce:transform-none"
        aria-hidden="true"
      >
        <Icono size={18} />
      </span>
      {conTexto && (
        <span className="terra-theme-btn__label text-terra-sm font-bold truncate">
          {esOscuro ? 'Modo día' : 'Modo noche'}
        </span>
      )}
    </button>
  );
}
