import { useEffect, useRef, useState } from 'react';

const CONSULTA_TACTIL = '(pointer: coarse)';

// En pantallas táctiles (tablet del kiosco) los campos abren el teclado propio en vez del
// del sistema. Tocar fuera del teclado y de los campos lo cierra.
export function useTecladoTactil() {
  const [esTactil, setEsTactil] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(CONSULTA_TACTIL).matches
  );
  const [tecladoAbierto, setTecladoAbierto] = useState(false);
  const [campoActivo, setCampoActivo] = useState(null);
  const tecladoRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const consulta = window.matchMedia(CONSULTA_TACTIL);
    const actualizar = (e) => setEsTactil(e.matches);
    consulta.addEventListener('change', actualizar);
    return () => consulta.removeEventListener('change', actualizar);
  }, []);

  useEffect(() => {
    const alTocarFuera = (event) => {
      if (!tecladoAbierto || !esTactil) return;
      if (!tecladoRef.current || tecladoRef.current.contains(event.target) || event.target.closest('input')) return;
      setTecladoAbierto(false);
      setCampoActivo(null);
    };
    document.addEventListener('mousedown', alTocarFuera);
    return () => document.removeEventListener('mousedown', alTocarFuera);
  }, [tecladoAbierto, esTactil]);

  const abrirTeclado = (campo) => {
    setCampoActivo(campo);
    if (esTactil) setTecladoAbierto(true);
  };

  const cerrarTeclado = () => {
    setTecladoAbierto(false);
    setCampoActivo(null);
  };

  return {
    esTactil,
    tecladoVisible: esTactil && tecladoAbierto,
    campoActivo,
    tecladoRef,
    abrirTeclado,
    cerrarTeclado,
  };
}
