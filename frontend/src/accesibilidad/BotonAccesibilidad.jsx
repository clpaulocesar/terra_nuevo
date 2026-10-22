import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Accessibility, RotateCcw, X } from 'lucide-react';
import { OPCIONES, TAMANOS_TEXTO, useModoAccesible } from './ModoAccesibleContext.jsx';

// Botón flotante ♿ (abajo a la izquierda, lejos del chat y del micrófono) con el
// panel del modo accesible: interruptor maestro, opciones individuales, tamaño de
// texto, restablecer y cerrar. Atajo: Alt + A. Esc cierra y devuelve el foco al botón.

const SELECTOR_ENFOCABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function BotonAccesibilidad() {
  const { estado, soportaLectura, activar, desactivar, cambiarOpcion, restablecer } = useModoAccesible();
  const [abierto, setAbierto] = useState(false);
  const botonRef = useRef(null);
  const panelRef = useRef(null);
  const idPanel = useId();
  const idTitulo = `${idPanel}-titulo`;

  const cerrar = useCallback(() => {
    setAbierto(false);
    window.setTimeout(() => botonRef.current?.focus(), 0);
  }, []);

  // Alt + A abre o cierra el panel desde cualquier pantalla.
  useEffect(() => {
    const alTeclear = (e) => {
      if (e.altKey && !e.ctrlKey && !e.metaKey && String(e.key).toLowerCase() === 'a') {
        e.preventDefault();
        setAbierto((previo) => { if (previo) window.setTimeout(() => botonRef.current?.focus(), 0); return !previo; });
      }
    };
    document.addEventListener('keydown', alTeclear);
    return () => document.removeEventListener('keydown', alTeclear);
  }, []);

  // Con el panel abierto: foco atrapado dentro, Esc cierra, clic fuera cierra.
  useEffect(() => {
    if (!abierto) return undefined;
    const panel = panelRef.current;
    const primero = panel?.querySelector(SELECTOR_ENFOCABLE);
    primero?.focus();
    const alTeclear = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); cerrar(); return; }
      if (e.key !== 'Tab' || !panel) return;
      const enfocables = Array.from(panel.querySelectorAll(SELECTOR_ENFOCABLE));
      if (!enfocables.length) return;
      const inicio = enfocables[0];
      const fin = enfocables[enfocables.length - 1];
      if (e.shiftKey && document.activeElement === inicio) { e.preventDefault(); fin.focus(); }
      else if (!e.shiftKey && document.activeElement === fin) { e.preventDefault(); inicio.focus(); }
    };
    const alPulsarFuera = (e) => {
      if (panel && !panel.contains(e.target) && !botonRef.current?.contains(e.target)) cerrar();
    };
    document.addEventListener('keydown', alTeclear);
    document.addEventListener('pointerdown', alPulsarFuera);
    return () => {
      document.removeEventListener('keydown', alTeclear);
      document.removeEventListener('pointerdown', alPulsarFuera);
    };
  }, [abierto, cerrar]);

  const opcionesVisibles = OPCIONES.filter((o) => soportaLectura || o.clave !== 'leerEnVoz');

  return (
    <div className="a11y-flotante">
      <button
        ref={botonRef}
        type="button"
        className={`a11y-boton ${estado.activo ? 'is-on' : ''}`}
        onClick={() => setAbierto((previo) => !previo)}
        aria-label={`Modo accesible${estado.activo ? ', activado' : ''}`}
        aria-expanded={abierto}
        aria-controls={idPanel}
        title="Modo accesible (Alt + A)"
      >
        <Accessibility size={28} aria-hidden="true" />
        {estado.activo && <span className="a11y-boton__punto" aria-hidden="true" />}
      </button>

      {abierto && (
        <div ref={panelRef} id={idPanel} className="a11y-panel" role="dialog" aria-modal="true" aria-labelledby={idTitulo}>
          <header className="a11y-panel__cabecera">
            <h2 id={idTitulo}>Accesibilidad</h2>
            <button type="button" className="a11y-panel__cerrar" onClick={cerrar} aria-label="Cerrar panel de accesibilidad"><X size={20} aria-hidden="true" /></button>
          </header>

          <button
            type="button"
            className={`a11y-maestro ${estado.activo ? 'is-on' : ''}`}
            role="switch"
            aria-checked={estado.activo}
            onClick={() => (estado.activo ? desactivar() : activar())}
          >
            <span className="a11y-maestro__caja" aria-hidden="true">{estado.activo ? '☑' : '☐'}</span>
            <span className="a11y-maestro__texto">
              <b>Activar modo accesible</b>
              <small>Texto grande, alto contraste, botones grandes, lectura en voz alta y más.</small>
            </span>
          </button>

          <div className="a11y-tamano" role="group" aria-label="Tamaño del texto">
            <span className="a11y-tamano__etiqueta">Tamaño del texto</span>
            <div className="a11y-tamano__botones">
              {TAMANOS_TEXTO.map((tamano, i) => (
                <button
                  key={tamano}
                  type="button"
                  className={`a11y-tamano__btn ${estado.activo && estado.textoGrande === tamano ? 'is-on' : ''}`}
                  aria-pressed={estado.activo && estado.textoGrande === tamano}
                  aria-label={`Texto al ${tamano} por ciento`}
                  onClick={() => { if (!estado.activo) activar(); cambiarOpcion('textoGrande', tamano); }}
                >
                  {['A', 'A+', 'A++'][i]}
                </button>
              ))}
            </div>
          </div>

          <ul className="a11y-opciones">
            {opcionesVisibles.map((opcion) => {
              const encendida = estado.activo && Boolean(estado[opcion.clave]);
              return (
                <li key={opcion.clave}>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={encendida}
                    className={`a11y-opcion ${encendida ? 'is-on' : ''}`}
                    onClick={() => { if (!estado.activo) activar(); cambiarOpcion(opcion.clave, !encendida); }}
                  >
                    <span className="a11y-opcion__interruptor" aria-hidden="true"><i /></span>
                    <span className="a11y-opcion__texto"><b>{opcion.etiqueta}</b><small>{opcion.ayuda}</small></span>
                  </button>
                </li>
              );
            })}
          </ul>

          <footer className="a11y-panel__pie">
            <button type="button" className="a11y-panel__restablecer" onClick={() => { restablecer(); cerrar(); }}><RotateCcw size={16} aria-hidden="true" /> Restablecer</button>
            <button type="button" className="a11y-panel__listo" onClick={cerrar}>Cerrar</button>
          </footer>
          <p className="a11y-panel__atajo">Atajo de teclado: <kbd>Alt</kbd> + <kbd>A</kbd></p>
        </div>
      )}
    </div>
  );
}
