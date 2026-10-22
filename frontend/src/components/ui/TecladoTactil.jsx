import { forwardRef, useState } from 'react';
import './TecladoTactil.css';

const FILAS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ñ'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
];

const NUMEROS_SECUNDARIOS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
const NUMEROS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
const MAXIMO_PORTAPAPELES = 5;

const TecladoTactil = forwardRef(function TecladoTactil({
  onCaracter,
  onBorrar,
  onCerrar,
  onPegar,
  valorActual = '',
  modo = 'texto',
}, ref) {
  const esNumerico = modo === 'numerico';
  const [mostrarNumeros, setMostrarNumeros] = useState(esNumerico);
  const [mayusculas, setMayusculas] = useState(false);
  const [portapapelesAbierto, setPortapapelesAbierto] = useState(false);
  const [portapapeles, setPortapapeles] = useState([]);
  const [teclaPresionada, setTeclaPresionada] = useState(null);

  const eventosVistaPrevia = (tecla) => ({
    onPointerDown: () => setTeclaPresionada(tecla),
    onPointerUp: () => setTeclaPresionada(null),
    onPointerCancel: () => setTeclaPresionada(null),
    onPointerLeave: () => setTeclaPresionada(null),
    onBlur: () => setTeclaPresionada(null),
  });

  const vistaPrevia = (tecla, etiqueta) => teclaPresionada === tecla && (
    <span className="tt-key__preview" aria-hidden="true">{etiqueta}</span>
  );

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

  const insertarLetra = (letra) => {
    onCaracter?.(mayusculas ? letra.toUpperCase() : letra);
    if (mayusculas) setMayusculas(false);
  };

  const insertarPortapapeles = (valor) => {
    if (!valor) return;
    onPegar?.(valor);
    setPortapapelesAbierto(false);
  };

  return (
    <div className="tt-board" ref={ref} role="dialog" aria-label={esNumerico ? 'Teclado numérico' : 'Teclado'}>
      <div className="tt-board__content">
        <div className="tt-toolbar">
          <button
            type="button"
            className={`tt-toolbar__button ${portapapelesAbierto ? 'is-active' : ''}`}
            onClick={() => setPortapapelesAbierto((actual) => !actual)}
            aria-label="Abrir portapapeles"
            aria-expanded={portapapelesAbierto}
          >
            <span className="material-symbols-outlined">content_paste</span>
          </button>
          <span className="tt-toolbar__hint">{esNumerico ? 'Números' : 'Español'}</span>
          <button type="button" className="tt-toolbar__button" onClick={onCerrar} aria-label="Ocultar teclado">
            <span className="material-symbols-outlined">keyboard_hide</span>
          </button>
        </div>

        {mostrarNumeros ? (
          <div className="tt-keypad" aria-label="Números">
            {NUMEROS.map((numero) => (
              <button key={numero} type="button" onClick={() => onCaracter?.(numero)} className={`tt-key tt-key--number ${numero === '0' ? 'tt-key--zero' : ''}`} {...eventosVistaPrevia(`numero-${numero}`)}>
                {numero}
                {vistaPrevia(`numero-${numero}`, numero)}
              </button>
            ))}
          </div>
        ) : (
          <div className="tt-board__letters">
            {FILAS.slice(0, 2).map((fila, indice) => (
              <div key={indice} className="tt-board__row">
                {fila.map((letra, posicion) => (
                  <button key={letra} type="button" onClick={() => insertarLetra(letra)} className="tt-key" {...eventosVistaPrevia(`letra-${letra}`)}>
                    {indice === 0 && <small>{NUMEROS_SECUNDARIOS[posicion]}</small>}
                    {mayusculas ? letra.toUpperCase() : letra}
                    {vistaPrevia(`letra-${letra}`, mayusculas ? letra.toUpperCase() : letra)}
                  </button>
                ))}
              </div>
            ))}
            <div className="tt-board__row tt-board__row--third">
              <button type="button" onClick={() => setMayusculas((actual) => !actual)} className={`tt-key tt-key--shift ${mayusculas ? 'is-active' : ''}`} aria-label="Mayúsculas" {...eventosVistaPrevia('mayusculas')}>
                <span className="material-symbols-outlined">keyboard_arrow_up</span>
                {vistaPrevia('mayusculas', '↑')}
              </button>
              {FILAS[2].map((letra) => <button key={letra} type="button" onClick={() => insertarLetra(letra)} className="tt-key" {...eventosVistaPrevia(`letra-${letra}`)}>{mayusculas ? letra.toUpperCase() : letra}{vistaPrevia(`letra-${letra}`, mayusculas ? letra.toUpperCase() : letra)}</button>)}
              <button type="button" onClick={onBorrar} className="tt-key tt-key--backspace" aria-label="Borrar último carácter" {...eventosVistaPrevia('borrar')}>
                <span className="material-symbols-outlined">backspace</span>
                {vistaPrevia('borrar', '⌫')}
              </button>
            </div>
          </div>
        )}

        <div className={`tt-board__row tt-board__row--bottom ${esNumerico ? 'is-numeric' : ''}`}>
          {!esNumerico && <button type="button" onClick={() => setMostrarNumeros((actual) => !actual)} className="tt-key tt-key--mode" {...eventosVistaPrevia('modo')}>{mostrarNumeros ? 'ABC' : '?123'}{vistaPrevia('modo', mostrarNumeros ? 'ABC' : '?123')}</button>}
          {mostrarNumeros && <button type="button" onClick={onBorrar} className="tt-key tt-key--backspace" aria-label="Borrar último carácter" {...eventosVistaPrevia('borrar')}><span className="material-symbols-outlined">backspace</span>{vistaPrevia('borrar', '⌫')}</button>}
          {!mostrarNumeros && <button type="button" onClick={() => onCaracter?.(' ')} className="tt-key tt-key--space" {...eventosVistaPrevia('espacio')}>Español{vistaPrevia('espacio', 'Espacio')}</button>}
          <button type="button" onClick={onCerrar} className="tt-key tt-key--done" aria-label="Listo" {...eventosVistaPrevia('listo')}>
            <span className="material-symbols-outlined">arrow_forward</span>
            {vistaPrevia('listo', '→')}
          </button>
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
    </div>
  );
});

export default TecladoTactil;
