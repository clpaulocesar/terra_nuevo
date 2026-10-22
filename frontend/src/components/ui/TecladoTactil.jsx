import { forwardRef, useState } from 'react';
import './TecladoTactil.css';

const FILAS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ñ'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
];

const NUMEROS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
const MAXIMO_PORTAPAPELES = 5;

const TecladoTactil = forwardRef(function TecladoTactil({
  onCaracter,
  onBorrar,
  onLimpiar,
  onCerrar,
  onPegar,
  valorActual = '',
  modo = 'texto',
}, ref) {
  const esNumerico = modo === 'numerico';
  const [mostrarNumeros, setMostrarNumeros] = useState(esNumerico);
  const [portapapelesAbierto, setPortapapelesAbierto] = useState(false);
  const [portapapeles, setPortapapeles] = useState([]);

  const guardarEnPortapapeles = (texto) => {
    const valor = String(texto || '').trim().slice(0, 120);
    if (!valor) return '';
    setPortapapeles((actual) => [valor, ...actual.filter((item) => item !== valor)].slice(0, MAXIMO_PORTAPAPELES));
    return valor;
  };

  const copiarCampo = async () => {
    const valor = guardarEnPortapapeles(valorActual);
    if (!valor || !navigator.clipboard?.writeText) return;
    try {
      await navigator.clipboard.writeText(valor);
    } catch {
      // El historial temporal sigue disponible si el navegador bloquea el portapapeles.
    }
  };

  const pegarUltimo = async () => {
    let valor = '';
    if (navigator.clipboard?.readText) {
      try {
        valor = await navigator.clipboard.readText();
      } catch {
        // Algunos navegadores solo permiten leer el portapapeles tras una autorización explícita.
      }
    }
    valor = guardarEnPortapapeles(valor) || portapapeles[0] || '';
    if (valor) onPegar?.(valor);
  };

  const insertarPortapapeles = (valor) => {
    if (!valor) return;
    onPegar?.(valor);
    setPortapapelesAbierto(false);
  };

  return (
    <div className="tt-board" ref={ref} role="dialog" aria-label={esNumerico ? 'Teclado numérico TERRA' : 'Teclado táctil TERRA'}>
      <div className="tt-board__header">
        <span className="tt-board__title">{esNumerico ? 'Teclado numérico' : 'Teclado táctil TERRA'}</span>
        <button type="button" onClick={onCerrar} className="tt-board__close">Cerrar teclado</button>
      </div>

      {mostrarNumeros ? (
        <div className="tt-board__keypad" aria-label="Números">
          {NUMEROS.map((numero) => (
            <button key={numero} type="button" onClick={() => onCaracter?.(numero)} className="tt-key tt-key--num">
              {numero}
            </button>
          ))}
        </div>
      ) : (
        <div className="tt-board__letters">
          {FILAS.map((fila, indice) => (
            <div key={indice} className="tt-board__row">
              {fila.map((letra) => (
                <button key={letra} type="button" onClick={() => onCaracter?.(letra)} className="tt-key">
                  {letra}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}

      <div className="tt-board__row tt-board__row--actions">
        {!esNumerico && (
          <button
            type="button"
            onClick={() => setMostrarNumeros((actual) => !actual)}
            className={`tt-key tt-key--mode ${mostrarNumeros ? 'is-active' : ''}`}
            aria-pressed={mostrarNumeros}
          >
            {mostrarNumeros ? 'ABC' : '123'}
          </button>
        )}
        {!mostrarNumeros && <button type="button" onClick={() => onCaracter?.(' ')} className="tt-key tt-key--space">Espacio</button>}
        <button type="button" onClick={() => setPortapapelesAbierto((actual) => !actual)} className="tt-key tt-key--clipboard" aria-expanded={portapapelesAbierto}>
          Portapapeles
        </button>
        <button type="button" onClick={onBorrar} className="tt-key tt-key--danger" aria-label="Borrar último carácter">
          <span className="material-symbols-outlined">backspace</span>
        </button>
        <button type="button" onClick={onLimpiar} className="tt-key tt-key--clear">Limpiar</button>
      </div>

      {portapapelesAbierto && (
        <div className="tt-clipboard">
          <div className="tt-clipboard__actions">
            <button type="button" onClick={copiarCampo}>Copiar campo</button>
            <button type="button" onClick={pegarUltimo}>Pegar último</button>
          </div>
          {portapapeles.length > 0 ? (
            <div className="tt-clipboard__history" aria-label="Elementos copiados durante esta sesión">
              {portapapeles.map((valor) => <button type="button" key={valor} onClick={() => insertarPortapapeles(valor)}>{valor}</button>)}
            </div>
          ) : <small>Los textos copiados se guardan temporalmente mientras el teclado está abierto.</small>}
        </div>
      )}
    </div>
  );
});

export default TecladoTactil;
