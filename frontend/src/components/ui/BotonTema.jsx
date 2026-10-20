import { Moon, Sun } from 'lucide-react';
import { useTema } from '../../context/TemaContext.jsx';
import './BotonTema.css';

// Botón día / noche. Muestra el ícono del modo al que se cambiará al pulsarlo.
export default function BotonTema({ className = '', conTexto = false }) {
  const { esOscuro, alternarTema } = useTema();
  const etiqueta = esOscuro ? 'Cambiar a modo día' : 'Cambiar a modo noche';
  return (
    <button
      type="button"
      className={`terra-theme-btn ${esOscuro ? 'terra-theme-btn--oscuro' : ''} ${className}`.trim()}
      onClick={alternarTema}
      aria-label={etiqueta}
      title={etiqueta}
      aria-pressed={esOscuro}
    >
      <span className="terra-theme-btn__icon" aria-hidden="true">
        {esOscuro ? <Sun size={18} /> : <Moon size={18} />}
      </span>
      {conTexto && <span className="terra-theme-btn__label">{esOscuro ? 'Modo día' : 'Modo noche'}</span>}
    </button>
  );
}
