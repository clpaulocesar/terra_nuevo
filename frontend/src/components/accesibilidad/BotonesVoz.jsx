import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { CircleHelp, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { useAccesibilidad } from '../../context/AccesibilidadContext.jsx';
import { useNavegacion } from '../../navegacion/NavegacionContext.jsx';
import { destinosDisponibles } from '../../navegacion/registroNavegacion.js';
import { useModoAccesibleOpcional } from '../../accesibilidad/ModoAccesibleContext.jsx';
import './accesibilidad.css';

const RETRASO_HOVER_MS = 300;
const TOQUE_LARGO_MS = 500;
const MAX_ITEMS = 10;

// Comandos que no dependen de la pantalla.
const COMANDOS_FIJOS = [
  { nombre: 'Buscar un producto', ejemplo: 'buscar colchón' },
  { nombre: 'Agregar al carrito', ejemplo: 'agregar confort lya' },
  { nombre: 'Leer la página', ejemplo: 'leer página' },
  { nombre: 'Silencio', ejemplo: 'silencio' },
];

// Botones de la cabecera: lectura por voz (altavoz) y comandos de voz (micrófono).
// El micrófono muestra un panel con los comandos disponibles en la pantalla actual:
// hover/foco en escritorio, toque largo o el botón "?" en pantallas táctiles.
export default function BotonesVoz({ className = '' }) {
  const { soportaVoz, soportaReconocimiento, vozActiva, escuchando, alternarVoz, escuchar } = useAccesibilidad();
  const { contextoActual } = useNavegacion();
  const modoAccesible = useModoAccesibleOpcional();
  const [panelAbierto, setPanelAbierto] = useState(false);
  const [panelFijo, setPanelFijo] = useState(false); // abierto con "?" o toque largo: no se cierra al quitar el mouse
  const idPanel = useId();
  const contenedorRef = useRef(null);
  const temporizadorHoverRef = useRef(null);
  const temporizadorToqueRef = useRef(null);
  const toqueLargoRef = useRef(false);

  // Comandos de la pantalla y rol actuales (igual criterio que la ayuda hablada).
  const comandos = useMemo(() => {
    if (!panelAbierto && !escuchando) return [];
    const ctx = contextoActual();
    return destinosDisponibles(ctx)
      // La pantalla actual no se ofrece, y los accesos del backoffice no se anuncian en
      // el kiosco (siguen disponibles por voz y en la ayuda hablada).
      .filter((d) => !(d.ruta && d.ruta.split('?')[0] === ctx.ruta && !d.ruta.includes('?')))
      .filter((d) => d.clave !== 'loginAdmin' && d.clave !== 'loginVendedor')
      .slice(0, MAX_ITEMS)
      .map((d) => ({ nombre: d.nombre, ejemplo: d.alias[0] }));
  }, [panelAbierto, escuchando, contextoActual]);

  const sugerenciasEscucha = useMemo(() => {
    const base = comandos.length ? comandos : COMANDOS_FIJOS;
    return base.slice(0, 3).map((c) => c.ejemplo);
  }, [comandos]);

  const limpiarHover = () => { window.clearTimeout(temporizadorHoverRef.current); temporizadorHoverRef.current = null; };
  const abrirConRetraso = () => {
    if (panelFijo) return;
    limpiarHover();
    temporizadorHoverRef.current = window.setTimeout(() => setPanelAbierto(true), RETRASO_HOVER_MS);
  };
  const cerrarPorHover = () => {
    limpiarHover();
    if (!panelFijo) setPanelAbierto(false);
  };
  const cerrar = useCallback(() => { limpiarHover(); setPanelAbierto(false); setPanelFijo(false); }, []);
  const alternarFijo = () => {
    limpiarHover();
    if (panelAbierto && panelFijo) { cerrar(); return; }
    setPanelFijo(true);
    setPanelAbierto(true);
  };

  // Toque largo sobre el micrófono abre el panel; el toque corto sigue escuchando.
  const alIniciarToque = () => {
    toqueLargoRef.current = false;
    window.clearTimeout(temporizadorToqueRef.current);
    temporizadorToqueRef.current = window.setTimeout(() => {
      toqueLargoRef.current = true;
      setPanelFijo(true);
      setPanelAbierto(true);
    }, TOQUE_LARGO_MS);
  };
  const alTerminarToque = () => window.clearTimeout(temporizadorToqueRef.current);
  const alTocarMicrofono = (evento) => {
    if (toqueLargoRef.current) { toqueLargoRef.current = false; evento.preventDefault(); return; }
    cerrar();
    escuchar();
  };

  // Escape y toque/clic fuera cierran el panel.
  useEffect(() => {
    if (!panelAbierto) return undefined;
    const alTeclear = (e) => { if (e.key === 'Escape') cerrar(); };
    const alPulsarFuera = (e) => { if (contenedorRef.current && !contenedorRef.current.contains(e.target)) cerrar(); };
    document.addEventListener('keydown', alTeclear);
    document.addEventListener('pointerdown', alPulsarFuera);
    return () => {
      document.removeEventListener('keydown', alTeclear);
      document.removeEventListener('pointerdown', alPulsarFuera);
    };
  }, [panelAbierto, cerrar]);

  useEffect(() => () => { limpiarHover(); window.clearTimeout(temporizadorToqueRef.current); }, []);

  // Modo accesible con "Navegación por voz": cada activación muestra el panel de comandos.
  const solicitudPanel = modoAccesible?.solicitudPanelVoz || 0;
  const navegacionVozActiva = Boolean(modoAccesible?.estado?.activo && modoAccesible?.estado?.navegacionVoz);
  useEffect(() => {
    if (!solicitudPanel || !navegacionVozActiva) return undefined;
    const t = window.setTimeout(() => { setPanelFijo(true); setPanelAbierto(true); }, 0);
    return () => window.clearTimeout(t);
  }, [solicitudPanel, navegacionVozActiva]);

  if (!soportaVoz && !soportaReconocimiento) return null;
  const mostrarPanel = soportaReconocimiento && (escuchando || panelAbierto);

  return (
    <div className={`terra-voz ${className}`.trim()} role="group" aria-label="Accesibilidad por voz" ref={contenedorRef}>
      {soportaVoz && (
        <button
          type="button"
          className={`terra-theme-btn terra-voz__btn ${vozActiva ? 'terra-theme-btn--on' : ''}`}
          onClick={alternarVoz}
          aria-pressed={vozActiva}
          aria-label={vozActiva ? 'Desactivar lectura por voz' : 'Activar lectura por voz'}
          title={vozActiva ? 'Desactivar lectura por voz' : 'Activar lectura por voz'}
        >
          {vozActiva ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
      )}
      {soportaReconocimiento && (
        <div className="terra-voz__mic" onMouseEnter={abrirConRetraso} onMouseLeave={cerrarPorHover}>
          <button
            type="button"
            className={`terra-theme-btn terra-voz__btn ${escuchando ? 'terra-theme-btn--on terra-voz__btn--escuchando' : ''}`}
            onClick={alTocarMicrofono}
            onFocus={abrirConRetraso}
            onBlur={cerrarPorHover}
            onTouchStart={alIniciarToque}
            onTouchEnd={alTerminarToque}
            onTouchCancel={alTerminarToque}
            onContextMenu={(e) => e.preventDefault()}
            aria-pressed={escuchando}
            aria-describedby={mostrarPanel ? idPanel : undefined}
            aria-label={escuchando ? 'Dejar de escuchar' : 'Decir un comando de voz'}
          >
            {escuchando ? <Mic size={18} /> : <MicOff size={18} />}
          </button>
          <button
            type="button"
            className={`terra-voz__ayuda ${panelAbierto && panelFijo ? 'is-on' : ''}`}
            onClick={alternarFijo}
            aria-expanded={panelAbierto}
            aria-label="Ver qué comandos de voz puedo decir"
            title="¿Qué puedo decir?"
          >
            <CircleHelp size={14} />
          </button>

          {mostrarPanel && (
            <div className="terra-voz__panel" role="tooltip" id={idPanel} data-sin-lectura="true">
              <span className="terra-voz__panel-flecha" aria-hidden="true" />
              {escuchando ? (
                <>
                  <b className="terra-voz__panel-titulo terra-voz__panel-titulo--escuchando"><Mic size={14} /> Te escucho…</b>
                  <p className="terra-voz__panel-texto">Decí por ejemplo: {sugerenciasEscucha.map((s, i) => <em key={s}>{i > 0 ? ', ' : ''}«{s}»</em>)}</p>
                </>
              ) : (
                <>
                  <b className="terra-voz__panel-titulo">Podés decir…</b>
                  <ul className="terra-voz__lista">
                    {comandos.map((c) => (
                      <li key={c.ejemplo}><span>{c.nombre}</span><em>«{c.ejemplo}»</em></li>
                    ))}
                    {COMANDOS_FIJOS.map((c) => (
                      <li key={c.ejemplo} className="terra-voz__lista-fijo"><span>{c.nombre}</span><em>«{c.ejemplo}»</em></li>
                    ))}
                  </ul>
                  <small className="terra-voz__panel-pie">Decí <strong>ayuda</strong> para escuchar todos.</small>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
