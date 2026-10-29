import { useEffect, useRef, useState } from 'react';

// Distancia mínima (px) que hay que arrastrar el asa para abrir o cerrar la hoja.
const UMBRAL_ARRASTRE = 30;

// Estado de una hoja inferior que se abre tocando el asa o arrastrándola hacia arriba y
// se cierra arrastrándola hacia abajo, con su botón "Cerrar", tocando fuera o con Esc.
// Al cerrarse el foco vuelve al asa, que es el control que la abrió.
export function useHojaInferior() {
  const [abierta, setAbierta] = useState(false);
  const inicioArrastre = useRef(null);
  const asaRef = useRef(null);

  const cerrar = () => {
    setAbierta(false);
    asaRef.current?.focus();
  };

  const alternar = () => setAbierta((actual) => !actual);

  useEffect(() => {
    if (!abierta) return undefined;
    const alPulsarTecla = (event) => {
      if (event.key !== 'Escape') return;
      setAbierta(false);
      asaRef.current?.focus();
    };
    document.addEventListener('keydown', alPulsarTecla);
    return () => document.removeEventListener('keydown', alPulsarTecla);
  }, [abierta]);

  const iniciarArrastre = (event) => {
    inicioArrastre.current = event.touches[0]?.clientY ?? null;
  };

  const terminarArrastre = (event) => {
    if (inicioArrastre.current === null) return;
    const final = event.changedTouches[0]?.clientY ?? inicioArrastre.current;
    const desplazamiento = final - inicioArrastre.current;
    if (desplazamiento < -UMBRAL_ARRASTRE) setAbierta(true);
    if (desplazamiento > UMBRAL_ARRASTRE) setAbierta(false);
    inicioArrastre.current = null;
  };

  return { abierta, alternar, cerrar, asaRef, iniciarArrastre, terminarArrastre };
}
