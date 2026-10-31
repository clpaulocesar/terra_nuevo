import { useLayoutEffect, useRef } from 'react';
import { contarColumnas } from '../utils/limitePagina.js';

// Rotar la tablet o arrastrar el borde de la ventana dispara muchos cambios de tamaño:
// se mide cuando pasan 200 ms sin cambios, así no se piden páginas intermedias.
const ESPERA_MS = 200;

const columnasDe = (grilla) => contarColumnas(getComputedStyle(grilla).gridTemplateColumns);

// Primera tarjeta que se ve (con al menos la mitad a la vista). Si ya se pasó toda la
// grilla (se ve el paginador), la última.
function primeraTarjetaVisible(grilla) {
  const tarjetas = [...grilla.children];
  const visible = tarjetas.find((tarjeta) => {
    const caja = tarjeta.getBoundingClientRect();
    return caja.top + caja.height / 2 > 0;
  });
  return visible || tarjetas.at(-1) || null;
}

// Columnas reales de la grilla: las que resolvió el navegador para su auto-fill
// (grid-template-columns), no estimadas por el ancho de la pantalla, porque también
// dependen del texto al 150 % y de la columna del resumen mayorista.
// Llama a `alCambiar(columnas, indiceVisible)` al montar (antes de pintar, para que el
// primer pedido ya use el límite correcto) y después solo si la cantidad cambió.
// `indiceVisible` es la posición en la página de la primera tarjeta que se veía ANTES del
// cambio: al medir, las tarjetas ya se reacomodaron a las columnas nuevas y en esa misma
// altura de scroll se ve otra. Por eso se recuerda la tarjeta al hacer scroll, solo mientras
// las columnas siguen siendo las conocidas.
export function useColumnasGrilla(ref, alCambiar) {
  const alCambiarRef = useRef(alCambiar);
  useLayoutEffect(() => {
    alCambiarRef.current = alCambiar;
  });

  useLayoutEffect(() => {
    const grilla = ref.current;
    if (!grilla) return undefined;
    let ultimas = 0;
    let ancla = null;
    let temporizador;
    let cuadro = 0;

    const medir = () => {
      // Sin grilla resuelta (por ejemplo en jsdom) se trata como una columna.
      const columnas = columnasDe(grilla) || 1;
      if (columnas === ultimas) return;
      const indice = ancla ? [...grilla.children].indexOf(ancla) : -1;
      const tarjeta = primeraTarjetaVisible(grilla);
      const indiceVisible = indice >= 0 ? indice : Math.max(0, [...grilla.children].indexOf(tarjeta));
      ultimas = columnas;
      ancla = null;
      alCambiarRef.current(columnas, indiceVisible);
    };
    const recordarAncla = () => {
      cancelAnimationFrame(cuadro);
      cuadro = requestAnimationFrame(() => {
        if (columnasDe(grilla) === ultimas) ancla = primeraTarjetaVisible(grilla);
      });
    };

    medir();
    const observador = new ResizeObserver(() => {
      clearTimeout(temporizador);
      temporizador = setTimeout(medir, ESPERA_MS);
    });
    observador.observe(grilla);
    window.addEventListener('scroll', recordarAncla, { passive: true });
    return () => {
      observador.disconnect();
      window.removeEventListener('scroll', recordarAncla);
      clearTimeout(temporizador);
      cancelAnimationFrame(cuadro);
    };
  }, [ref]);
}
