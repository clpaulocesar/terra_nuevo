import { forwardRef, useState } from 'react';
import './TecladoTactil.css';

const FILAS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ñ'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
];

const NUMEROS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '+'];

const TecladoTactil = forwardRef(function TecladoTactil({
  onCaracter,
  onBorrar,
  onLimpiar,
  onCerrar,
}, ref) {
  const [mostrarNumeros, setMostrarNumeros] = useState(false);

  return (
    <div className="tt-board" ref={ref} role="dialog" aria-label="Teclado táctil TERRA">
      <div className="tt-board__header">
        <span className="tt-board__title">Teclado Táctil TERRA</span>
        <button type="button" onClick={onCerrar} className="tt-board__close">
          Cerrar teclado
        </button>
      </div>

      <div className="tt-board__letters">
        {FILAS.map((row, i) => (
          <div key={i} className="tt-board__row">
            {row.map((letra) => (
              <button
                key={letra}
                type="button"
                onClick={() => onCaracter?.(letra)}
                className="tt-key"
              >
                {letra}
              </button>
            ))}
            {i === 2 && (
              <button
                type="button"
                onClick={onBorrar}
                className="tt-key tt-key--danger"
                aria-label="Borrar"
              >
                <span className="material-symbols-outlined">backspace</span>
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="tt-board__row tt-board__row--actions">
        <button
          type="button"
          onClick={() => setMostrarNumeros((v) => !v)}
          className={`tt-key tt-key--mode ${mostrarNumeros ? 'is-active' : ''}`}
          aria-pressed={mostrarNumeros}
        >
          123
        </button>
        <button
          type="button"
          onClick={() => onCaracter?.(' ')}
          className="tt-key tt-key--space"
        >
          Espacio
        </button>
        <button type="button" onClick={onLimpiar} className="tt-key tt-key--clear">
          Limpiar
        </button>
      </div>

      {mostrarNumeros && (
        <div className="tt-board__row tt-board__row--numbers is-active">
          {NUMEROS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onCaracter?.(n)}
              className="tt-key tt-key--num"
            >
              {n}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

export default TecladoTactil;
