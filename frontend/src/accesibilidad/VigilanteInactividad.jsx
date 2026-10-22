import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAccesibilidad } from '../context/AccesibilidadContext.jsx';
import { useModoAccesible } from './ModoAccesibleContext.jsx';

// Kiosco (tablet compartida): si el modo accesible está activo y nadie toca la pantalla
// durante un rato, se avisa 30 s antes (con botón "Seguir aquí") y luego el modo se
// restablece para que el siguiente cliente empiece con la pantalla normal.
// Sólo actúa en la zona pública; en Admin y Vendedor el modo se recuerda por usuario.
// Con "Más tiempo" activo, la espera se duplica.

const ESPERA_BASE_MS = 5 * 60 * 1000;
const AVISO_PREVIO_MS = 30 * 1000;
const EVENTOS = ['pointerdown', 'keydown', 'touchstart', 'scroll'];

export default function VigilanteInactividad() {
  const { estado, desactivar } = useModoAccesible();
  const { anunciar } = useAccesibilidad();
  const location = useLocation();
  const [avisando, setAvisando] = useState(false);
  const temporizadorAvisoRef = useRef(null);
  const temporizadorFinRef = useRef(null);
  const botonSeguirRef = useRef(null);
  useEffect(() => { if (avisando) botonSeguirRef.current?.focus(); }, [avisando]);

  const zonaPublica = !/^\/(admin|vendedor)(\/|$)/.test(location.pathname);
  const vigilar = estado.activo && zonaPublica;

  useEffect(() => {
    if (!vigilar) { setAvisando(false); return undefined; }
    const espera = ESPERA_BASE_MS * (estado.masTiempo ? 2 : 1);

    const limpiar = () => {
      window.clearTimeout(temporizadorAvisoRef.current);
      window.clearTimeout(temporizadorFinRef.current);
    };
    const programar = () => {
      limpiar();
      setAvisando(false);
      temporizadorAvisoRef.current = window.setTimeout(() => {
        setAvisando(true);
        anunciar('La pantalla volverá al modo normal en 30 segundos por inactividad. Tocá "Seguir aquí" para continuar.', { forzar: true });
        temporizadorFinRef.current = window.setTimeout(() => {
          setAvisando(false);
          desactivar();
        }, AVISO_PREVIO_MS);
      }, espera - AVISO_PREVIO_MS);
    };
    const alInteractuar = () => programar();
    programar();
    EVENTOS.forEach((evento) => document.addEventListener(evento, alInteractuar, { passive: true }));
    return () => {
      limpiar();
      EVENTOS.forEach((evento) => document.removeEventListener(evento, alInteractuar));
    };
  }, [vigilar, estado.masTiempo, anunciar, desactivar]);

  if (!avisando) return null;
  return (
    <div className="a11y-aviso-inactividad" role="alertdialog" aria-live="assertive" aria-labelledby="a11y-inactividad-titulo">
      <p id="a11y-inactividad-titulo">¿Seguís ahí? La pantalla volverá al modo normal en 30 segundos.</p>
      <button type="button" ref={botonSeguirRef} onClick={() => setAvisando(false)}>Seguir aquí</button>
    </div>
  );
}
