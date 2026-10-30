import { forwardRef, useEffect, useRef, useState } from 'react';
import IconoMaterial from './IconoMaterial.jsx';

const TECLA_BASE =
  'relative inline-flex items-center justify-center min-w-0 h-[clamp(2.85rem,7.3vw,3.9rem)] sm:h-[clamp(3.6rem,7vw,4.35rem)] rounded-lg bg-white dark:bg-terra-superficie-2 hover:bg-neutral-50 dark:hover:bg-terra-superficie-3 active:bg-[#dfe4e0] dark:active:bg-terra-superficie-3 active:scale-[0.97] text-neutral-800 dark:text-terra-texto border border-transparent dark:border-terra-borde text-[clamp(1.15rem,3vw,1.8rem)] font-normal cursor-pointer transition-all touch-manipulation select-none';

const TECLA_FUNCIONAL =
  'relative inline-flex items-center justify-center min-w-0 h-[clamp(2.85rem,7.3vw,3.9rem)] sm:h-[clamp(3.6rem,7vw,4.35rem)] rounded-lg bg-[#dcefe0] dark:bg-terra-primario/15 hover:bg-[#cde4d2] dark:hover:bg-terra-primario/25 active:scale-[0.97] text-[#20342a] dark:text-terra-primario-suave border border-transparent dark:border-terra-primario/30 text-base font-bold cursor-pointer transition-all touch-manipulation select-none';

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
  const retrasoBorradoRef = useRef(null);
  const intervaloBorradoRef = useRef(null);
  const retrasoVistaPreviaRef = useRef(null);

  const detenerBorradoContinuo = () => {
    clearTimeout(retrasoBorradoRef.current);
    clearInterval(intervaloBorradoRef.current);
    retrasoBorradoRef.current = null;
    intervaloBorradoRef.current = null;
  };

  const iniciarBorradoContinuo = () => {
    detenerBorradoContinuo();
    onBorrar?.();
    retrasoBorradoRef.current = setTimeout(() => {
      intervaloBorradoRef.current = setInterval(() => onBorrar?.(), 85);
    }, 350);
  };

  useEffect(() => () => {
    clearTimeout(retrasoBorradoRef.current);
    clearInterval(intervaloBorradoRef.current);
    clearTimeout(retrasoVistaPreviaRef.current);
  }, []);

  const mostrarVistaPrevia = (tecla) => {
    clearTimeout(retrasoVistaPreviaRef.current);
    setTeclaPresionada(tecla);
  };

  const ocultarVistaPrevia = () => {
    clearTimeout(retrasoVistaPreviaRef.current);
    retrasoVistaPreviaRef.current = setTimeout(() => setTeclaPresionada(null), 160);
  };

  const eventosVistaPrevia = (tecla) => ({
    onPointerDown: () => mostrarVistaPrevia(tecla),
    onPointerUp: ocultarVistaPrevia,
    onPointerCancel: ocultarVistaPrevia,
    onPointerLeave: ocultarVistaPrevia,
    onBlur: ocultarVistaPrevia,
  });

  const eventosBorrado = () => ({
    onPointerDown: (event) => {
      event.preventDefault();
      event.currentTarget.setPointerCapture?.(event.pointerId);
      mostrarVistaPrevia('borrar');
      iniciarBorradoContinuo();
    },
    onPointerUp: (event) => {
      if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      ocultarVistaPrevia();
      detenerBorradoContinuo();
    },
    onPointerCancel: (event) => {
      if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      ocultarVistaPrevia();
      detenerBorradoContinuo();
    },
    onBlur: () => {
      ocultarVistaPrevia();
      detenerBorradoContinuo();
    },
    onContextMenu: (event) => event.preventDefault(),
    onClick: (event) => {
      // Los clics generados por teclado no emiten pointerdown.
      if (event.detail === 0) onBorrar?.();
    },
  });

  const vistaPrevia = (tecla, etiqueta) =>
    teclaPresionada === tecla && (
      <span
        className="pointer-events-none absolute -top-[calc(100%+0.7rem)] left-1/2 -translate-x-1/2 z-10 flex items-center justify-center min-w-[clamp(4rem,9vw,5rem)] h-[clamp(4rem,9vw,5rem)] px-2 bg-white dark:bg-terra-superficie-3 text-neutral-900 dark:text-terra-texto border border-[#d7ddd9] dark:border-stone-700 rounded-[1rem_1rem_1.25rem_1.25rem] shadow-[0_7px_16px_rgba(31,43,36,0.16)] dark:shadow-[0_7px_16px_rgba(0,0,0,0.5)] text-[clamp(1.6rem,4vw,2.2rem)] font-medium whitespace-nowrap animate-terra-aparecer"
        aria-hidden="true"
      >
        {etiqueta}
        <span
          className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white dark:bg-terra-superficie-3 border-r border-b border-[#d7ddd9] dark:border-stone-700 rotate-45"
          aria-hidden="true"
        />
      </span>
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
    <div
      className="tt-board fixed bottom-0 left-0 right-0 z-120 p-2 sm:px-[clamp(1.25rem,5vw,3.625rem)] sm:py-3.5 bg-[#f1f3f4] dark:bg-terra-superficie border-t border-terra-borde shadow-[0_-10px_28px_rgba(27,28,28,0.12)] dark:shadow-[0_-10px_28px_rgba(0,0,0,0.5)] select-none touch-none"
      ref={ref}
      role="dialog"
      aria-label={esNumerico ? 'Teclado numérico' : 'Teclado'}
    >
      <div className="flex flex-col gap-1.5 sm:gap-2.5 max-w-[55rem] mx-auto w-full">
        <div className="flex items-center justify-between min-h-8 px-1">
          <button
            type="button"
            className={`inline-flex items-center justify-center w-8 h-8 rounded-full cursor-pointer transition-colors ${
              portapapelesAbierto
                ? 'bg-[#dbe7dc] dark:bg-terra-superficie-3 text-[#20342a] dark:text-terra-primario font-bold'
                : 'text-neutral-600 dark:text-terra-texto-suave hover:bg-neutral-200 dark:hover:bg-terra-superficie-3'
            }`}
            onClick={() => setPortapapelesAbierto((actual) => !actual)}
            aria-label="Abrir portapapeles"
            aria-expanded={portapapelesAbierto}
          >
            <IconoMaterial nombre="content_paste" className="text-xl" />
          </button>
          <span className="text-xs font-bold text-neutral-500 dark:text-terra-texto-suave">
            {esNumerico ? 'Números' : 'Español'}
          </span>
          <button
            type="button"
            className="inline-flex items-center justify-center w-8 h-8 rounded-full text-neutral-600 dark:text-terra-texto-suave hover:bg-neutral-200 dark:hover:bg-terra-superficie-3 cursor-pointer transition-colors"
            onClick={onCerrar}
            aria-label="Ocultar teclado"
          >
            <IconoMaterial nombre="keyboard_hide" className="text-xl" />
          </button>
        </div>

        {mostrarNumeros ? (
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5 justify-center max-w-[17rem] sm:max-w-[19rem] mx-auto w-full" aria-label="Números">
            {NUMEROS.map((numero) => (
              <button
                key={numero}
                type="button"
                onClick={() => onCaracter?.(numero)}
                className={`${TECLA_BASE} text-2xl ${numero === '0' ? 'col-start-2' : ''}`}
                {...eventosVistaPrevia(`numero-${numero}`)}
              >
                {numero}
                {vistaPrevia(`numero-${numero}`, numero)}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 sm:gap-2.5">
            {FILAS.slice(0, 2).map((fila, indice) => (
              <div key={indice} className="grid grid-cols-10 gap-1.5 sm:gap-2.5">
                {fila.map((letra, posicion) => (
                  <button
                    key={letra}
                    type="button"
                    onClick={() => insertarLetra(letra)}
                    className={TECLA_BASE}
                    {...eventosVistaPrevia(`letra-${letra}`)}
                  >
                    {indice === 0 && (
                      <small className="absolute top-0.5 right-1 sm:right-1.5 text-[0.56rem] font-bold text-neutral-400 dark:text-terra-texto-suave pointer-events-none">
                        {NUMEROS_SECUNDARIOS[posicion]}
                      </small>
                    )}
                    {mayusculas ? letra.toUpperCase() : letra}
                    {vistaPrevia(`letra-${letra}`, mayusculas ? letra.toUpperCase() : letra)}
                  </button>
                ))}
              </div>
            ))}
            <div className="grid grid-cols-[1.3fr_repeat(7,minmax(0,1fr))_1.3fr] gap-1.5 sm:gap-2.5">
              <button
                type="button"
                onClick={() => setMayusculas((actual) => !actual)}
                className={`${TECLA_FUNCIONAL} ${mayusculas ? '!bg-[#b8d8bf] dark:!bg-terra-primario dark:!text-white' : ''}`}
                aria-label="Mayúsculas"
                {...eventosVistaPrevia('mayusculas')}
              >
                <IconoMaterial nombre="keyboard_arrow_up" className="text-2xl" />
                {vistaPrevia('mayusculas', '↑')}
              </button>
              {FILAS[2].map((letra) => (
                <button
                  key={letra}
                  type="button"
                  onClick={() => insertarLetra(letra)}
                  className={TECLA_BASE}
                  {...eventosVistaPrevia(`letra-${letra}`)}
                >
                  {mayusculas ? letra.toUpperCase() : letra}
                  {vistaPrevia(`letra-${letra}`, mayusculas ? letra.toUpperCase() : letra)}
                </button>
              ))}
              <button
                type="button"
                className={TECLA_FUNCIONAL}
                aria-label="Borrar último carácter"
                {...eventosBorrado()}
              >
                <IconoMaterial nombre="backspace" className="text-2xl" />
                {vistaPrevia('borrar', '⌫')}
              </button>
            </div>
          </div>
        )}

        <div
          className={`grid gap-1.5 sm:gap-2.5 ${
            esNumerico
              ? 'grid-cols-[1fr_3.5rem] sm:grid-cols-[1fr_4rem]'
              : 'grid-cols-[3.5rem_1fr_3.5rem] sm:grid-cols-[4rem_1fr_4rem]'
          }`}
        >
          {!esNumerico && (
            <button
              type="button"
              onClick={() => setMostrarNumeros((actual) => !actual)}
              className={TECLA_FUNCIONAL}
              {...eventosVistaPrevia('modo')}
            >
              {mostrarNumeros ? 'ABC' : '?123'}
              {vistaPrevia('modo', mostrarNumeros ? 'ABC' : '?123')}
            </button>
          )}
          {mostrarNumeros && (
            <button
              type="button"
              className={TECLA_FUNCIONAL}
              aria-label="Borrar último carácter"
              {...eventosBorrado()}
            >
              <IconoMaterial nombre="backspace" className="text-2xl" />
              {vistaPrevia('borrar', '⌫')}
            </button>
          )}
          {!mostrarNumeros && (
            <button
              type="button"
              onClick={() => onCaracter?.(' ')}
              className={`${TECLA_BASE} text-terra-base font-normal`}
              {...eventosVistaPrevia('espacio')}
            >
              Español
              {vistaPrevia('espacio', 'Espacio')}
            </button>
          )}
          <button
            type="button"
            onClick={onCerrar}
            className="relative inline-flex items-center justify-center min-w-0 h-[clamp(2.85rem,7.3vw,3.9rem)] sm:h-[clamp(3.6rem,7vw,4.35rem)] rounded-lg bg-[#dcefe0] dark:bg-terra-primario hover:bg-[#cde4d2] dark:hover:bg-terra-primario-oscuro active:scale-[0.97] text-[#20342a] dark:text-white text-base font-bold cursor-pointer transition-all touch-manipulation select-none"
            aria-label="Listo"
            {...eventosVistaPrevia('listo')}
          >
            <IconoMaterial nombre="arrow_forward" className="text-2xl" />
            {vistaPrevia('listo', '→')}
          </button>
        </div>

        {portapapelesAbierto && (
          <div className="bg-white dark:bg-terra-superficie border border-terra-borde rounded-xl p-3 shadow-terra-sm">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={copiarCampo}
                className="flex-1 min-h-9 px-2.5 py-1.5 rounded-lg bg-neutral-100 dark:bg-terra-superficie-2 hover:bg-neutral-200 dark:hover:bg-terra-superficie-3 text-neutral-800 dark:text-terra-texto text-xs font-bold cursor-pointer transition-colors"
              >
                Copiar campo
              </button>
              <button
                type="button"
                onClick={pegarUltimo}
                className="flex-1 min-h-9 px-2.5 py-1.5 rounded-lg bg-neutral-100 dark:bg-terra-superficie-2 hover:bg-neutral-200 dark:hover:bg-terra-superficie-3 text-neutral-800 dark:text-terra-texto text-xs font-bold cursor-pointer transition-colors"
              >
                Pegar último
              </button>
            </div>
            {portapapeles.length > 0 ? (
              <div className="flex flex-wrap gap-2 mt-2" aria-label="Elementos copiados durante esta sesión">
                {portapapeles.map((valor) => (
                  <button
                    type="button"
                    key={valor}
                    onClick={() => insertarPortapapeles(valor)}
                    className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap min-h-9 px-2.5 py-1.5 rounded-lg bg-neutral-100 dark:bg-terra-superficie-2 hover:bg-neutral-200 dark:hover:bg-terra-superficie-3 text-neutral-800 dark:text-terra-texto text-xs font-bold cursor-pointer transition-colors"
                  >
                    {valor}
                  </button>
                ))}
              </div>
            ) : (
              <small className="block text-xs text-neutral-500 dark:text-terra-texto-suave mt-2 leading-relaxed">
                Los textos copiados se guardan temporalmente mientras el teclado está abierto.
              </small>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

export default TecladoTactil;
