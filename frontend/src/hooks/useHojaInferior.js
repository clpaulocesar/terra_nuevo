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
  const hojaRef = useRef(null);

  // El alto cerrado depende del ancho y del tamaño del texto (al 150 % el total puede ocupar
  // dos líneas): se mide para que la hoja no corte el botón y para que el pie y los
  // flotantes reserven exactamente ese alto (--terra-hoja-alto en index.css).
  useEffect(() => {
    const hoja = hojaRef.current;
    if (abierta || !hoja || typeof ResizeObserver === 'undefined') return undefined;
    const raiz = document.documentElement;
    // scrollHeight no incluye el borde superior, que sí cuenta en el alto máximo.
    const medir = () => {
      const borde = hoja.offsetHeight - hoja.clientHeight;
      raiz.style.setProperty('--terra-hoja-alto', `${hoja.scrollHeight + borde}px`);
    };
    // Se observan los hijos: la hoja tiene el alto limitado y no cambia aunque crezca su contenido.
    const observador = new ResizeObserver(medir);
    [...hoja.children].forEach((hijo) => observador.observe(hijo));
    medir();
    return () => observador.disconnect();
  }, [abierta]);

  useEffect(() => () => document.documentElement.style.removeProperty('--terra-hoja-alto'), []);

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

  return { abierta, alternar, cerrar, asaRef, hojaRef, iniciarArrastre, terminarArrastre };
}
